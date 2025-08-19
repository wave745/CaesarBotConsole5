// Server-side API services that use server environment variables
import axios, { AxiosInstance } from 'axios';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import { SERVER_ENV } from '../env';

// Helius API Service
class HeliusAPIServer {
  private client: AxiosInstance;
  private rpcClient: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: 'https://api.helius.xyz/v0',
      headers: { 'Content-Type': 'application/json' },
      params: { 'api-key': SERVER_ENV.HELIUS_API_KEY },
    });

    this.rpcClient = axios.create({
      baseURL: `https://rpc.helius.xyz/?api-key=${SERVER_ENV.HELIUS_API_KEY}`,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  async getNativeBalance(walletAddress: string) {
    const response = await this.rpcClient.post('', {
      jsonrpc: '2.0',
      id: 1,
      method: 'getBalance',
      params: [walletAddress],
    });
    return { success: true, data: (response.data.result?.value || 0) / 1e9 };
  }

  async getTokenAccounts(walletAddress: string) {
    const response = await this.client.get(`/addresses/${walletAddress}/balances`);
    return { success: true, data: response.data.tokens || [] };
  }

  async getTransactionHistory(walletAddress: string, limit = 100) {
    const response = await this.client.get(`/addresses/${walletAddress}/transactions`, {
      params: { limit, type: 'all' },
    });
    return { success: true, data: response.data || [] };
  }
}

// Birdeye API Service
class BirdeyeAPIServer {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: 'https://public-api.birdeye.so',
      headers: { 'Content-Type': 'application/json' },
    });
  }

  async getTokenPrice(tokenAddress: string) {
    const response = await this.client.get('/defi/price', {
      params: { address: tokenAddress },
    });
    return { success: true, data: response.data.data };
  }

  async getTrendingTokens(sortBy = 'volume24hUSD', sortType = 'desc', offset = 0, limit = 50) {
    const response = await this.client.get('/defi/tokenlist', {
      params: { sort_by: sortBy, sort_type: sortType, offset, limit },
    });
    return { success: true, data: response.data.data?.tokens || [] };
  }

  async getTokenOHLCV(tokenAddress: string, timeframe = '1H') {
    const response = await this.client.get('/defi/ohlcv', {
      params: {
        address: tokenAddress,
        type: timeframe,
        time_to: Math.floor(Date.now() / 1000),
        time_from: Math.floor(Date.now() / 1000) - 86400,
      },
    });
    return { success: true, data: response.data.data };
  }
}

// Jupiter API Service
class JupiterAPIServer {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: 'https://quote-api.jup.ag/v6',
      headers: { 'Content-Type': 'application/json' },
    });
  }

  async getQuote(params: any) {
    const response = await this.client.get('/quote', { params });
    return { success: true, data: response.data };
  }
}

// OpenAI Service
class OpenAIServiceServer {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({ apiKey: SERVER_ENV.OPENAI_API_KEY });
  }

  async analyzeTrend(tokenData: any, timeframe = '24h') {
    const completion = await this.client.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are an expert crypto analyst. Provide actionable trading insights.',
        },
        {
          role: 'user',
          content: `Analyze this token: ${JSON.stringify(tokenData)}`,
        },
      ],
      max_tokens: 500,
    });

    return {
      success: true,
      data: {
        analysis: completion.choices[0]?.message?.content || '',
        confidence: 75,
      },
    };
  }
}

// Supabase Service
class SupabaseServiceServer {
  private client;

  constructor() {
    this.client = createClient(SERVER_ENV.SUPABASE_URL, SERVER_ENV.SUPABASE_ANON_KEY);
  }

  async getUserStats(walletAddress: string) {
    const { data, error } = await this.client
      .from('user_stats')
      .select('*')
      .eq('wallet_address', walletAddress)
      .single();

    return { success: !error, data: data || null };
  }

  async getLeaderboard(limit = 100) {
    const { data, error } = await this.client
      .from('user_stats')
      .select('*')
      .order('caesar_points', { ascending: false })
      .limit(limit);

    return { success: !error, data: data || [] };
  }
}

export const heliusAPI = new HeliusAPIServer();
export const birdeyeAPI = new BirdeyeAPIServer();
export const jupiterAPI = new JupiterAPIServer();
export const openaiService = new OpenAIServiceServer();
export const supabaseService = new SupabaseServiceServer();