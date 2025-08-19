import { useEffect, useCallback } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { heliusAPI, birdeyeAPI, supabaseService, jupiterAPI, pumpFunAPI } from '@/lib/api';
import { useAppStore } from '@/store/useAppStore';

// Wallet data hook
export function useWalletData(walletAddress?: string) {
  return useQuery({
    queryKey: ['walletData', walletAddress],
    queryFn: async () => {
      if (!walletAddress) throw new Error('Wallet address required');
      
      const [balanceRes, tokenAccountsRes] = await Promise.all([
        heliusAPI.getNativeBalance(walletAddress),
        heliusAPI.getTokenAccounts(walletAddress),
      ]);
      
      if (!balanceRes.success) throw new Error(balanceRes.error?.message);
      if (!tokenAccountsRes.success) throw new Error(tokenAccountsRes.error?.message);
      
      return {
        balance: balanceRes.data,
        tokenAccounts: tokenAccountsRes.data,
      };
    },
    enabled: !!walletAddress,
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

// Portfolio data hook
export function usePortfolio(tokenAccounts?: any[]) {
  return useQuery({
    queryKey: ['portfolio', tokenAccounts?.map(t => t.mint)],
    queryFn: async () => {
      if (!tokenAccounts?.length) return { tokens: [], totalValue: 0, change24h: 0 };
      
      const mints = tokenAccounts.map(acc => acc.mint);
      const pricesRes = await birdeyeAPI.getMultipleTokenPrices(mints);
      
      if (!pricesRes.success) throw new Error(pricesRes.error?.message);
      
      const tokens = tokenAccounts.map(token => ({
        ...token,
        price: pricesRes.data?.[token.mint]?.value || 0,
        value: (token.amount || 0) * (pricesRes.data?.[token.mint]?.value || 0),
        priceChange24h: pricesRes.data?.[token.mint]?.priceChange24hPercent || 0,
      }));
      
      const totalValue = tokens.reduce((sum, token) => sum + (token.value || 0), 0);
      const change24h = tokens.reduce((sum, token) => 
        sum + ((token.value || 0) * (token.priceChange24h || 0) / 100), 0
      );
      
      return { tokens, totalValue, change24h };
    },
    enabled: !!tokenAccounts?.length,
    refetchInterval: 60000, // Refresh every minute
  });
}

// Market data hook
export function useMarketData() {
  return useQuery({
    queryKey: ['marketData'],
    queryFn: async () => {
      const [trendingRes, recentTokensRes] = await Promise.all([
        birdeyeAPI.getTrendingTokens(),
        pumpFunAPI.getRecentTokens(20),
      ]);
      
      const trending = trendingRes.success ? trendingRes.data : [];
      const recent = recentTokensRes.success ? recentTokensRes.data : [];
      
      return {
        trending: trending.slice(0, 10),
        recent: recent.slice(0, 10),
        timestamp: Date.now(),
      };
    },
    refetchInterval: 120000, // Refresh every 2 minutes
  });
}

// Token price hook
export function useTokenPrice(tokenAddress?: string) {
  return useQuery({
    queryKey: ['tokenPrice', tokenAddress],
    queryFn: async () => {
      if (!tokenAddress) throw new Error('Token address required');
      
      const priceRes = await birdeyeAPI.getTokenPrice(tokenAddress);
      if (!priceRes.success) throw new Error(priceRes.error?.message);
      
      return priceRes.data;
    },
    enabled: !!tokenAddress,
    refetchInterval: 30000,
  });
}

// Transaction history hook
export function useTransactionHistory(walletAddress?: string) {
  return useQuery({
    queryKey: ['transactions', walletAddress],
    queryFn: async () => {
      if (!walletAddress) throw new Error('Wallet address required');
      
      const txRes = await heliusAPI.getTransactionHistory(walletAddress, 50);
      if (!txRes.success) throw new Error(txRes.error?.message);
      
      return txRes.data;
    },
    enabled: !!walletAddress,
    refetchInterval: 60000,
  });
}

// Leaderboard hook
export function useLeaderboard() {
  return useQuery({
    queryKey: ['leaderboard'],
    queryFn: async () => {
      const leaderboardRes = await supabaseService.getLeaderboard(100);
      if (!leaderboardRes.success) throw new Error(leaderboardRes.error?.message);
      
      return leaderboardRes.data;
    },
    refetchInterval: 180000, // Refresh every 3 minutes
  });
}

// User stats hook
export function useUserStats(walletAddress?: string) {
  return useQuery({
    queryKey: ['userStats', walletAddress],
    queryFn: async () => {
      if (!walletAddress) throw new Error('Wallet address required');
      
      const statsRes = await supabaseService.getUserStats(walletAddress);
      if (!statsRes.success) throw new Error(statsRes.error?.message);
      
      return statsRes.data;
    },
    enabled: !!walletAddress,
    refetchInterval: 120000,
  });
}

// Mutations for write operations
export function useTradeToken() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      inputMint, 
      outputMint, 
      amount, 
      slippage = 50 
    }: {
      inputMint: string;
      outputMint: string;
      amount: number;
      slippage?: number;
    }) => {
      const quoteRes = await jupiterAPI.getQuote({
        inputMint,
        outputMint,
        amount,
        slippageBps: slippage,
      });
      
      if (!quoteRes.success) throw new Error(quoteRes.error?.message);
      return quoteRes.data;
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['walletData'] });
      queryClient.invalidateQueries({ queryKey: ['portfolio'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
}

// Auto-refresh hook for critical data
export function useAutoRefresh() {
  const { user } = useAppStore();
  const queryClient = useQueryClient();
  
  const refreshCriticalData = useCallback(() => {
    if (user?.walletAddress) {
      queryClient.invalidateQueries({ queryKey: ['walletData'] });
      queryClient.invalidateQueries({ queryKey: ['portfolio'] });
      queryClient.invalidateQueries({ queryKey: ['marketData'] });
    }
  }, [user?.walletAddress, queryClient]);
  
  useEffect(() => {
    // Refresh data when browser tab becomes visible
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        refreshCriticalData();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [refreshCriticalData]);
  
  return { refreshCriticalData };
}