import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  walletAddress: string;
  tier: 'Legionnaire' | 'Centurion' | 'Praetor';
  caesarPoints: number;
  balance: string;
}

interface Token {
  id: string;
  symbol: string;
  name: string;
  price: string;
  priceChange24h: string;
  marketCap: string;
  contractAddress: string;
}

interface Snipe {
  id: string;
  tokenId: string;
  amount: string;
  status: 'pending' | 'successful' | 'failed';
  timestamp: Date;
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
      user: {
        walletAddress: '3xK7...aB9c',
        tier: 'Centurion',
        caesarPoints: 12450,
        balance: '245.67'
      },
      isWalletConnected: true,
      selectedToken: null,
      activeSnipes: [],
      aiTradingEnabled: false,
      tokens: [],
      recentActivity: [
        {
          id: '1',
          type: 'buy',
          token: 'BONK',
          amount: '0.5 SOL',
          timestamp: new Date(Date.now() - 2 * 60 * 1000),
        },
        {
          id: '2',
          type: 'deploy',
          token: 'MYTOKEN',
          launchpad: 'Pump.fun',
          timestamp: new Date(Date.now() - 15 * 60 * 1000),
        },
        {
          id: '3',
          type: 'sell',
          token: 'PEPE',
          amount: '1.2 SOL',
          timestamp: new Date(Date.now() - 60 * 60 * 1000),
        },
      ],
      
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
    }),
    {
      name: 'caesarbot-storage',
      partialize: (state) => ({
        user: state.user,
        aiTradingEnabled: state.aiTradingEnabled,
        sidebarCollapsed: state.sidebarCollapsed,
        theme: state.theme,
        notifications: state.notifications,
      }),
    }
  )
);
