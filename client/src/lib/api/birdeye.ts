import axios, { AxiosInstance, AxiosError } from 'axios';
import { ENV } from '@shared/env';
import { BirdeyePrice, BirdeyeOHLCV, APIResponse } from '@shared/types/api';

class BirdeyeAPI {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: ENV.BIRDEYE_API,
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': import.meta.env.VITE_BIRDEYE_API_KEY || '', // Optional API key for higher limits
      },
    });
  }

  async getTokenPrice(tokenAddress: string): Promise<APIResponse<BirdeyePrice>> {
    try {
      const response = await this.client.get(`/defi/price`, {
        params: {
          address: tokenAddress,
        },
      });

      return {
        success: true,
        data: response.data.data,
        timestamp: Date.now(),
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getMultipleTokenPrices(tokenAddresses: string[]): Promise<APIResponse<Record<string, BirdeyePrice>>> {
    try {
      const response = await this.client.get(`/defi/multi_price`, {
        params: {
          list_address: tokenAddresses.join(','),
        },
      });

      return {
        success: true,
        data: response.data.data,
        timestamp: Date.now(),
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getTokenOHLCV(
    tokenAddress: string,
    timeframe: '1m' | '3m' | '5m' | '15m' | '30m' | '1H' | '2H' | '4H' | '6H' | '8H' | '12H' | '1D' | '3D' | '1W' | '1M' = '1H',
    timeTo?: number,
    timeFrom?: number
  ): Promise<APIResponse<{ items: BirdeyeOHLCV[] }>> {
    try {
      const response = await this.client.get(`/defi/ohlcv`, {
        params: {
          address: tokenAddress,
          type: timeframe,
          time_to: timeTo || Math.floor(Date.now() / 1000),
          time_from: timeFrom || Math.floor(Date.now() / 1000) - 86400, // 24h ago
        },
      });

      return {
        success: true,
        data: response.data.data,
        timestamp: Date.now(),
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getTokenInfo(tokenAddress: string): Promise<APIResponse<any>> {
    try {
      const response = await this.client.get(`/defi/token_overview`, {
        params: {
          address: tokenAddress,
        },
      });

      return {
        success: true,
        data: response.data.data,
        timestamp: Date.now(),
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getTokenTrades(
    tokenAddress: string,
    limit = 100,
    offset = 0
  ): Promise<APIResponse<any[]>> {
    try {
      const response = await this.client.get(`/defi/txs/token`, {
        params: {
          address: tokenAddress,
          limit,
          offset,
        },
      });

      return {
        success: true,
        data: response.data.data?.items || [],
        timestamp: Date.now(),
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getWalletTokenPortfolio(walletAddress: string): Promise<APIResponse<any[]>> {
    try {
      const response = await this.client.get(`/v1/wallet/token_list`, {
        params: {
          wallet: walletAddress,
        },
      });

      return {
        success: true,
        data: response.data.data?.items || [],
        timestamp: Date.now(),
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getTrendingTokens(
    sortBy: 'volume24hUSD' | 'priceChange24hPercent' | 'liquidityChangePercent24h' = 'volume24hUSD',
    sortType: 'desc' | 'asc' = 'desc',
    offset = 0,
    limit = 50
  ): Promise<APIResponse<any[]>> {
    try {
      const response = await this.client.get(`/defi/tokenlist`, {
        params: {
          sort_by: sortBy,
          sort_type: sortType,
          offset,
          limit,
        },
      });

      return {
        success: true,
        data: response.data.data?.tokens || [],
        timestamp: Date.now(),
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  private handleError(error: any): APIResponse<never> {
    const axiosError = error as AxiosError;
    
    return {
      success: false,
      error: {
        message: axiosError.message || 'Unknown error occurred',
        code: axiosError.response?.status || 'UNKNOWN',
        details: axiosError.response?.data,
      },
      timestamp: Date.now(),
    };
  }
}

export const birdeyeAPI = new BirdeyeAPI();