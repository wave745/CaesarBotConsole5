import { type User, type InsertUser, type Token, type InsertToken, type Snipe, type InsertSnipe, type Deployment, type InsertDeployment, type Wallet, type InsertWallet } from "@shared/schema";
import { randomUUID } from "crypto";

interface TokenScanFilters {
  search: string;
  launchpad: string;
  minMarketCap: number;
  maxMarketCap: number;
  minVolume: number;
  minRating: number;
  showHoneypots: boolean;
  requireLpLock: boolean;
  sortBy: string;
  sortOrder: string;
}

interface TokenScan {
  id: string;
  symbol: string;
  name: string;
  contractAddress: string;
  price: string;
  marketCap: string;
  volume24h: string;
  priceChange24h: string;
  liquidity: string;
  holders: number;
  age: string;
  launchpad: string;
  caesarRating: number;
  riskLevel: 'low' | 'medium' | 'high';
  isHoneypot: boolean;
  hasLpLock: boolean;
  mintDisabled: boolean;
  creatorScore: number;
}

interface Mission {
  id: string;
  title: string;
  description: string;
  reward: number;
  progress: number;
  target: number;
  type: 'daily' | 'weekly' | 'achievement';
  completed: boolean;
  icon: string;
}

interface LeaderboardEntry {
  rank: number;
  walletAddress: string;
  tier: string;
  points: number;
  trades: number;
  deployments: number;
}

interface Airdrop {
  id: string;
  tokenSymbol: string;
  tokenName: string;
  amount: string;
  value: string;
  claimable: boolean;
  expires: string;
  requirements: string[];
}

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Token operations
  getTokens(): Promise<Token[]>;
  createToken(token: InsertToken): Promise<Token>;
  scanTokens(filters: TokenScanFilters): Promise<TokenScan[]>;
  
  // Snipe operations
  getSnipes(): Promise<Snipe[]>;
  createSnipe(snipe: InsertSnipe & { userId: string }): Promise<Snipe>;
  
  // Deployment operations
  getDeployments(): Promise<Deployment[]>;
  createDeployment(deployment: InsertDeployment & { userId: string }): Promise<Deployment>;
  
  // Wallet operations
  getWallets(): Promise<Wallet[]>;
  createWallet(wallet: InsertWallet & { userId: string }): Promise<Wallet>;
  
  // Rewards operations
  getUserMissions(): Promise<Mission[]>;
  getLeaderboard(): Promise<LeaderboardEntry[]>;
  getAirdrops(): Promise<Airdrop[]>;
  
  // System operations
  getSystemStatus(): Promise<any>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private tokens: Map<string, Token>;
  private snipes: Map<string, Snipe>;
  private deployments: Map<string, Deployment>;
  private wallets: Map<string, Wallet>;

  constructor() {
    this.users = new Map();
    this.tokens = new Map();
    this.snipes = new Map();
    this.deployments = new Map();
    this.wallets = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.walletAddress === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser,
      tier: insertUser.tier || "Legionnaire",
      id,
      caesarPoints: 0,
      createdAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  async getTokens(): Promise<Token[]> {
    return Array.from(this.tokens.values());
  }

  async createToken(insertToken: InsertToken): Promise<Token> {
    const id = randomUUID();
    const token: Token = {
      ...insertToken,
      launchpad: insertToken.launchpad || null,
      id,
      price: null,
      marketCap: null,
      volume24h: null,
      priceChange24h: null,
      createdAt: new Date()
    };
    this.tokens.set(id, token);
    return token;
  }

  async scanTokens(filters: TokenScanFilters): Promise<TokenScan[]> {
    // In a real implementation, this would connect to Solana blockchain APIs
    // and scan actual token data from pump.fun, etc.
    
    // Return empty array to avoid mocking data
    return [];
  }

  async getSnipes(): Promise<Snipe[]> {
    return Array.from(this.snipes.values());
  }

  async createSnipe(insertSnipe: InsertSnipe & { userId: string }): Promise<Snipe> {
    const id = randomUUID();
    const snipe: Snipe = {
      ...insertSnipe,
      id,
      status: "pending",
      txHash: null,
      createdAt: new Date()
    };
    this.snipes.set(id, snipe);
    return snipe;
  }

  async getDeployments(): Promise<Deployment[]> {
    return Array.from(this.deployments.values());
  }

  async createDeployment(insertDeployment: InsertDeployment & { userId: string }): Promise<Deployment> {
    const id = randomUUID();
    const deployment: Deployment = {
      ...insertDeployment,
      metadata: insertDeployment.metadata || null,
      id,
      status: "pending",
      txHash: null,
      createdAt: new Date()
    };
    this.deployments.set(id, deployment);
    return deployment;
  }

  async getWallets(): Promise<Wallet[]> {
    return Array.from(this.wallets.values());
  }

  async createWallet(insertWallet: InsertWallet & { userId: string }): Promise<Wallet> {
    const id = randomUUID();
    const wallet: Wallet = {
      ...insertWallet,
      name: insertWallet.name || null,
      id,
      balance: "0",
      isActive: false,
      createdAt: new Date()
    };
    this.wallets.set(id, wallet);
    return wallet;
  }

  async getUserMissions(): Promise<Mission[]> {
    // Return empty array - missions would be fetched from game mechanics API
    return [];
  }

  async getLeaderboard(): Promise<LeaderboardEntry[]> {
    // Return empty array - leaderboard would be calculated from user points
    return [];
  }

  async getAirdrops(): Promise<Airdrop[]> {
    // Return empty array - airdrops would come from partner integrations
    return [];
  }

  async getSystemStatus(): Promise<any> {
    return {
      uptime: "99.8%",
      rpcLatency: "45ms",
      activeSnipes: this.snipes.size,
      gasPrice: "0.00025 SOL",
      lastUpdate: new Date().toISOString()
    };
  }
}

export const storage = new MemStorage();
