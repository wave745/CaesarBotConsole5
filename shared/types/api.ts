// API Response Types
export interface HeliusTokenAccount {
  tokenAccount: string;
  mint: string;
  owner: string;
  amount: string;
  decimals: number;
  tokenSymbol?: string;
  tokenName?: string;
  uiAmount?: number;
}

export interface HeliusTransaction {
  signature: string;
  slot: number;
  timestamp: number;
  fee: number;
  feePayer: string;
  events: TransactionEvent[];
  type: 'SWAP' | 'TRANSFER' | 'UNKNOWN';
  description: string;
  source: string;
}

export interface TransactionEvent {
  type: string;
  tokenTransfers?: TokenTransfer[];
  nativeTransfers?: NativeTransfer[];
}

export interface TokenTransfer {
  fromTokenAccount: string;
  toTokenAccount: string;
  mint: string;
  tokenAmount: number;
  tokenStandard: string;
}

export interface NativeTransfer {
  fromUserAccount: string;
  toUserAccount: string;
  amount: number;
}

export interface BirdeyePrice {
  address: string;
  value: number;
  updateUnixTime: number;
  priceChange24h: number;
  priceChange24hPercent: number;
  liquidity: number;
  marketCap: number;
}

export interface BirdeyeOHLCV {
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
  unixTime: number;
}

export interface JupiterQuote {
  inputMint: string;
  inAmount: string;
  outputMint: string;
  outAmount: string;
  otherAmountThreshold: string;
  swapMode: string;
  slippageBps: number;
  platformFee?: {
    amount: string;
    feeBps: number;
  };
  priceImpactPct: string;
  routePlan: RoutePlan[];
}

export interface RoutePlan {
  swapInfo: {
    ammKey: string;
    label: string;
    inputMint: string;
    outputMint: string;
    inAmount: string;
    outAmount: string;
    feeAmount: string;
    feeMint: string;
  };
  percent: number;
}

export interface RugCheckData {
  mint: string;
  score: number;
  risks: Risk[];
  markets: Market[];
  topHolders: Holder[];
  totalSupply: string;
  createdAt: string;
}

export interface Risk {
  name: string;
  description: string;
  level: 'info' | 'warn' | 'danger';
  score: number;
}

export interface Market {
  name: string;
  liquidity: number;
  liquidityUsd: number;
  lp: {
    reserve0: string;
    reserve1: string;
  };
}

export interface Holder {
  owner: string;
  amount: string;
  percentage: number;
}

export interface PumpFunToken {
  mint: string;
  name: string;
  symbol: string;
  description: string;
  image: string;
  showName: boolean;
  createdTimestamp: number;
  raydiumPool?: string;
  complete: boolean;
  virtualSolReserves: number;
  virtualTokenReserves: number;
  totalSupply: number;
  website?: string;
  telegram?: string;
  twitter?: string;
  bonding_curve: string;
  associated_bonding_curve: string;
  creator: string;
  market_cap: number;
  reply_count: number;
  last_reply: number;
  nsfw: boolean;
  market_id?: string;
  inverted?: boolean;
  is_currently_live: boolean;
  king_of_the_hill_timestamp?: number;
  king_of_the_hill_previous_king?: string;
}

export interface APIError {
  message: string;
  code?: string | number;
  details?: any;
}

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: APIError;
  timestamp: number;
}