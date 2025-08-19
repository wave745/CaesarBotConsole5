import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { heliusAPI, supabaseService, birdeyeAPI, jupiterAPI } from '@/lib/api';

interface User {
  walletAddress: string;
  tier: 'Legionnaire' | 'Centurion' | 'Praetor' | 'Caesar';
  caesarPoints: number;
  balance: number;
  tokenAccounts: TokenAccount[];
  isConnected: boolean;
}

interface TokenAccount {
  address: string;
  mint: string;
  amount: number;
  decimals: number;
  symbol?: string;
  name?: string;
  uiAmount?: number;
  price?: number;
  value?: number;
}

interface Token {
  id: string;
  symbol: string;
  name: string;
  price: number;
  priceChange24h: number;
  marketCap: number;
  contractAddress: string;
  volume24h?: number;
  liquidity?: number;
  holders?: number;
  createdAt?: number;
  image?: string;
  description?: string;
}

interface Snipe {
  id: string;
  tokenId: string;
  amount: number;
  status: 'pending' | 'successful' | 'failed';
  timestamp: Date;
  targetPrice?: number;
  actualPrice?: number;
  slippage?: number;
  gasUsed?: number;
  profitLoss?: number;
}

interface AppState {
  // UI State
  sidebarCollapsed: boolean;
  currentPage: string;
  theme: 'dark' | 'light';
  notifications: {
    trading: boolean;
    airdrops: boolean;
    rewards: boolean;
    system: boolean;
  };
  
  // User State
  user: User | null;
  isWalletConnected: boolean;
  
  // Trading State
  selectedToken: Token | null;
  activeSnipes: Snipe[];
  aiTradingEnabled: boolean;
  
  // Data
  tokens: Token[];
  recentActivity: any[];
  portfolio: {
    totalValue: number;
    change24h: number;
    tokens: TokenAccount[];
  };
  marketData: {
    trendingTokens: Token[];
    recentTransactions: any[];
    leaderboard: any[];
  };
  isLoading: boolean;
  errors: Record<string, string>;
  
  // Actions
  setSidebarCollapsed: (collapsed: boolean) => void;
  setCurrentPage: (page: string) => void;
  setTheme: (theme: 'dark' | 'light') => void;
  setNotifications: (notifications: Partial<AppState['notifications']>) => void;
  setUser: (user: User | null) => void;
  setWalletConnected: (connected: boolean) => void;
  setSelectedToken: (token: Token | null) => void;
  setAiTradingEnabled: (enabled: boolean) => void;
  addSnipe: (snipe: Snipe) => void;
  updateSnipe: (id: string, updates: Partial<Snipe>) => void;
  setTokens: (tokens: Token[]) => void;
  addActivity: (activity: any) => void;
  
  // Real Data Actions
  connectWallet: (walletAddress: string) => Promise<void>;
  refreshPortfolio: () => Promise<void>;
  loadMarketData: () => Promise<void>;
  executeSnipe: (tokenAddress: string, amount: number) => Promise<void>;
  setLoading: (key: string, loading: boolean) => void;
  setError: (key: string, error: string | null) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial State
      sidebarCollapsed: false,
      currentPage: 'dashboard',
      theme: 'dark',
      notifications: {
        trading: true,
        airdrops: true,
        rewards: true,
        system: true,
      },
      user: null,
      isWalletConnected: false,
      selectedToken: null,
      activeSnipes: [],
      aiTradingEnabled: false,
      tokens: [],
      portfolio: {
        totalValue: 0,
        change24h: 0,
        tokens: [],
      },
      marketData: {
        trendingTokens: [],
        recentTransactions: [],
        leaderboard: [],
      },
      isLoading: false,
      errors: {},
      recentActivity: [],
      
      // Actions
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      setCurrentPage: (page) => set({ currentPage: page }),
      setTheme: (theme) => set({ theme }),
      setNotifications: (notifications) => set((state) => ({
        notifications: { ...state.notifications, ...notifications }
      })),
      setUser: (user) => set({ user }),
      setWalletConnected: (connected) => set({ isWalletConnected: connected }),
      setSelectedToken: (token) => set({ selectedToken: token }),
      setAiTradingEnabled: (enabled) => set({ aiTradingEnabled: enabled }),
      addSnipe: (snipe) => set((state) => ({
        activeSnipes: [...state.activeSnipes, snipe]
      })),
      updateSnipe: (id, updates) => set((state) => ({
        activeSnipes: state.activeSnipes.map(snipe => 
          snipe.id === id ? { ...snipe, ...updates } : snipe
        )
      })),
      setTokens: (tokens) => set({ tokens }),
      addActivity: (activity) => set((state) => ({
        recentActivity: [activity, ...state.recentActivity].slice(0, 10)
      })),
      
      // Real Data Actions
      connectWallet: async (walletAddress: string) => {
        try {
          set({ isLoading: true });
          
          // Get balance and token accounts
          const [balanceRes, tokenAccountsRes, userStatsRes] = await Promise.all([
            heliusAPI.getNativeBalance(walletAddress),
            heliusAPI.getTokenAccounts(walletAddress),
            supabaseService.getUserStats(walletAddress)
          ]);
          
          if (!balanceRes.success || !tokenAccountsRes.success) {
            throw new Error('Failed to fetch wallet data');
          }
          
          const user: User = {
            walletAddress,
            balance: balanceRes.data || 0,
            tokenAccounts: tokenAccountsRes.data || [],
            tier: userStatsRes.data?.tier || 'Legionnaire',
            caesarPoints: userStatsRes.data?.caesar_points || 0,
            isConnected: true,
          };
          
          set({ 
            user, 
            isWalletConnected: true,
            isLoading: false,
            errors: { ...get().errors, wallet: null }
          });
          
          // Load additional data
          get().refreshPortfolio();
          
        } catch (error: any) {
          set({ 
            isLoading: false,
            errors: { ...get().errors, wallet: error.message }
          });
        }
      },
      
      refreshPortfolio: async () => {
        const { user } = get();
        if (!user?.walletAddress) return;
        
        try {
          set({ isLoading: true });
          
          // Get token prices for portfolio tokens
          const tokenMints = user.tokenAccounts.map(acc => acc.mint);
          if (tokenMints.length === 0) {
            set({ isLoading: false });
            return;
          }
          
          const pricesRes = await birdeyeAPI.getMultipleTokenPrices(tokenMints);
          
          if (pricesRes.success && pricesRes.data) {
            const updatedTokens = user.tokenAccounts.map(token => ({
              ...token,
              price: pricesRes.data[token.mint]?.value || 0,
              value: (token.amount || 0) * (pricesRes.data[token.mint]?.value || 0),
            }));
            
            const totalValue = updatedTokens.reduce((sum, token) => sum + (token.value || 0), 0);
            
            set((state) => ({
              portfolio: {
                totalValue,
                change24h: 0, // Calculate from price changes
                tokens: updatedTokens,
              },
              isLoading: false,
              errors: { ...state.errors, portfolio: null }
            }));
          }
          
        } catch (error: any) {
          set((state) => ({ 
            isLoading: false,
            errors: { ...state.errors, portfolio: error.message }
          }));
        }
      },
      
      loadMarketData: async () => {
        try {
          set({ isLoading: true });
          
          const [trendingRes, leaderboardRes] = await Promise.all([
            birdeyeAPI.getTrendingTokens(),
            supabaseService.getLeaderboard()
          ]);
          
          const marketData = {
            trendingTokens: trendingRes.success ? trendingRes.data.map((token: any) => ({
              id: token.address,
              symbol: token.symbol,
              name: token.name,
              price: token.price,
              priceChange24h: token.priceChange24h || 0,
              marketCap: token.marketCap || 0,
              contractAddress: token.address,
              volume24h: token.volume24h || 0,
            })) : [],
            recentTransactions: [],
            leaderboard: leaderboardRes.success ? leaderboardRes.data : [],
          };
          
          set({ 
            marketData,
            isLoading: false,
            errors: { ...get().errors, market: null }
          });
          
        } catch (error: any) {
          set((state) => ({ 
            isLoading: false,
            errors: { ...state.errors, market: error.message }
          }));
        }
      },
      
      executeSnipe: async (tokenAddress: string, amount: number) => {
        try {
          const snipeId = Date.now().toString();
          const snipe: Snipe = {
            id: snipeId,
            tokenId: tokenAddress,
            amount,
            status: 'pending',
            timestamp: new Date(),
          };
          
          get().addSnipe(snipe);
          
          // Get quote from Jupiter
          const quoteRes = await jupiterAPI.getQuote({
            inputMint: 'So11111111111111111111111111111111111111112', // SOL
            outputMint: tokenAddress,
            amount: amount * 1e9, // Convert SOL to lamports
          });
          
          if (quoteRes.success) {
            get().updateSnipe(snipeId, { 
              status: 'successful',
              actualPrice: parseFloat(quoteRes.data.outAmount) / parseFloat(quoteRes.data.inAmount)
            });
          } else {
            get().updateSnipe(snipeId, { status: 'failed' });
          }
          
        } catch (error: any) {
          console.error('Snipe execution failed:', error);
        }
      },
      
      setLoading: (key: string, loading: boolean) => {
        set((state) => ({ 
          isLoading: loading,
          errors: loading ? { ...state.errors, [key]: null } : state.errors
        }));
      },
      
      setError: (key: string, error: string | null) => {
        set((state) => ({ 
          errors: { ...state.errors, [key]: error }
        }));
      },
    }),
    {
      name: 'caesarbot-storage',
      partialize: (state) => ({
        user: state.user,
        aiTradingEnabled: state.aiTradingEnabled,
        sidebarCollapsed: state.sidebarCollapsed,
        theme: state.theme,
        notifications: state.notifications,
        isWalletConnected: state.isWalletConnected,
      }),
    }
  )
);
