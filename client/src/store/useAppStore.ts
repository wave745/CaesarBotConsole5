import { create } from 'zustand';
import { persist } from 'zustand/middleware';
// Temporarily disable API imports until configuration is complete
// import { heliusAPI, supabaseService, birdeyeAPI, jupiterAPI } from '@/lib/api';

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
      
      // Real Data Actions (temporarily disabled)
      connectWallet: async (walletAddress: string) => {
        try {
          set({ isLoading: true });
          
          // Mock user data for now
          const user: User = {
            walletAddress,
            balance: 10.5,
            tokenAccounts: [],
            tier: 'Legionnaire',
            caesarPoints: 1250,
            isConnected: true,
          };
          
          set({ 
            user, 
            isWalletConnected: true,
            isLoading: false,
            errors: { ...get().errors, wallet: null }
          });
          
        } catch (error: any) {
          set({ 
            isLoading: false,
            errors: { ...get().errors, wallet: error.message }
          });
        }
      },
      
      refreshPortfolio: async () => {
        // Mock implementation
        const { user } = get();
        if (!user?.walletAddress) return;
        
        set((state) => ({
          portfolio: {
            totalValue: 2450.75,
            change24h: 12.5,
            tokens: [],
          },
          isLoading: false,
          errors: { ...state.errors, portfolio: null }
        }));
      },
      
      loadMarketData: async () => {
        // Mock implementation
        const marketData = {
          trendingTokens: [],
          recentTransactions: [],
          leaderboard: [],
        };
        
        set({ 
          marketData,
          isLoading: false,
          errors: { ...get().errors, market: null }
        });
      },
      
      executeSnipe: async (tokenAddress: string, amount: number) => {
        // Mock implementation
        const snipeId = Date.now().toString();
        const snipe: Snipe = {
          id: snipeId,
          tokenId: tokenAddress,
          amount,
          status: 'pending',
          timestamp: new Date(),
        };
        
        get().addSnipe(snipe);
        
        // Simulate success after delay
        setTimeout(() => {
          get().updateSnipe(snipeId, { 
            status: 'successful',
            actualPrice: Math.random() * 0.01
          });
        }, 2000);
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
