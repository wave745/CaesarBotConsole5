import { useQuery } from '@tanstack/react-query';
import { useWallet } from '@solana/wallet-adapter-react';
import { heliusAPI, birdeyeAPI, jupiterAPI } from '@/lib/api';

export interface TokenBalance {
  mint: string;
  symbol: string;
  name: string;
  balance: number;
  decimals: number;
  price?: number;
  value?: number;
}

export interface PortfolioData {
  totalValue: number;
  solBalance: number;
  tokenHoldings: TokenBalance[];
  change24h: number;
}

export const useWalletData = () => {
  const { publicKey, connected } = useWallet();

  const { data: portfolio, isLoading: portfolioLoading } = useQuery({
    queryKey: ['wallet-portfolio', publicKey?.toString()],
    queryFn: async (): Promise<PortfolioData> => {
      if (!publicKey || !connected) {
        throw new Error('Wallet not connected');
      }

      try {
        // Get SOL balance
        const solBalance = await heliusAPI.getSolBalance(publicKey.toString());
        
        // Get token balances
        const tokenBalances = await heliusAPI.getTokenBalances(publicKey.toString());
        
        // Get token prices from Birdeye
        const tokensWithPrices = await Promise.all(
          tokenBalances.map(async (token) => {
                         try {
               const priceData = await birdeyeAPI.getTokenPrice(token.mint);
               return {
                 ...token,
                 price: priceData?.data?.value || 0,
                 value: (token.balance / Math.pow(10, token.decimals)) * (priceData?.data?.value || 0)
               };
             } catch (error) {
               console.warn(`Failed to get price for ${token.mint}:`, error);
               return {
                 ...token,
                 price: 0,
                 value: 0
               };
             }
          })
        );

        const totalValue = solBalance + tokensWithPrices.reduce((sum, token) => sum + (token.value || 0), 0);

        return {
          totalValue,
          solBalance,
          tokenHoldings: tokensWithPrices,
          change24h: 0, // TODO: Calculate 24h change
        };
      } catch (error) {
        console.error('Failed to fetch portfolio data:', error);
        throw error;
      }
    },
    enabled: !!publicKey && connected,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  return {
    portfolio,
    isLoading: portfolioLoading,
    isConnected: connected,
    publicKey,
  };
};

export const useTokenPrice = (tokenMint: string) => {
  return useQuery({
    queryKey: ['token-price', tokenMint],
    queryFn: () => birdeyeAPI.getTokenPrice(tokenMint),
    enabled: !!tokenMint,
    refetchInterval: 10000, // Refetch every 10 seconds
  });
};

export const useTokenChart = (tokenMint: string, timeframe: string = '1D') => {
  return useQuery({
    queryKey: ['token-chart', tokenMint, timeframe],
    queryFn: () => birdeyeAPI.getTokenChart(tokenMint, timeframe),
    enabled: !!tokenMint,
    refetchInterval: 60000, // Refetch every minute
  });
};
