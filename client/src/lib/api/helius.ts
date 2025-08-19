import axios, { AxiosInstance, AxiosError } from 'axios';
import { ENV } from '@shared/env';
import { HeliusTokenAccount, HeliusTransaction, APIResponse } from '@shared/types/api';

class HeliusAPI {
  private client: AxiosInstance;
  private rpcClient: AxiosInstance;

  constructor() {
    if (!ENV.HELIUS_API_KEY) {
      throw new Error('HELIUS_API_KEY is required');
    }

    this.client = axios.create({
      baseURL: `https://api.helius.xyz/v0`,
      headers: {
        'Content-Type': 'application/json',
      },
      params: {
        'api-key': ENV.HELIUS_API_KEY,
      },
    });

    this.rpcClient = axios.create({
      baseURL: ENV.HELIUS_RPC,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  async getTokenAccounts(walletAddress: string): Promise<APIResponse<HeliusTokenAccount[]>> {
    try {
      const response = await this.client.get(`/addresses/${walletAddress}/balances`);
      
      return {
        success: true,
        data: response.data.tokens || [],
        timestamp: Date.now(),
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getTransactionHistory(walletAddress: string, limit = 100): Promise<APIResponse<HeliusTransaction[]>> {
    try {
      const response = await this.client.get(`/addresses/${walletAddress}/transactions`, {
        params: {
          limit,
          type: 'all',
        },
      });

      return {
        success: true,
        data: response.data || [],
        timestamp: Date.now(),
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getNativeBalance(walletAddress: string): Promise<APIResponse<number>> {
    try {
      const response = await this.rpcClient.post('', {
        jsonrpc: '2.0',
        id: 1,
        method: 'getBalance',
        params: [walletAddress],
      });

      const balance = response.data.result?.value || 0;
      return {
        success: true,
        data: balance / 1e9, // Convert lamports to SOL
        timestamp: Date.now(),
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getTokenMetadata(mintAddress: string): Promise<APIResponse<any>> {
    try {
      const response = await this.rpcClient.post('', {
        jsonrpc: '2.0',
        id: 1,
        method: 'getAsset',
        params: {
          id: mintAddress,
        },
      });

      return {
        success: true,
        data: response.data.result,
        timestamp: Date.now(),
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getPriorityFees(): Promise<APIResponse<{ priorityFeeEstimate: number }>> {
    try {
      const response = await this.client.get('/priority-fee');
      
      return {
        success: true,
        data: response.data,
        timestamp: Date.now(),
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async searchAssets(query: {
    creatorAddress?: string;
    ownerAddress?: string;
    jsonUri?: string;
    grouping?: string;
    burnt?: boolean;
    sortBy?: {
      sortBy: 'created' | 'updated' | 'recent_action' | 'none';
      sortDirection: 'asc' | 'desc';
    };
    limit?: number;
    page?: number;
    before?: string;
    after?: string;
  }): Promise<APIResponse<any[]>> {
    try {
      const response = await this.rpcClient.post('', {
        jsonrpc: '2.0',
        id: 1,
        method: 'searchAssets',
        params: query,
      });

      return {
        success: true,
        data: response.data.result?.items || [],
        timestamp: Date.now(),
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Webhook handler for real-time updates
  async setupWebhook(webhookUrl: string, accountAddresses: string[]): Promise<APIResponse<any>> {
    try {
      const response = await this.client.post('/webhooks', {
        webhookURL: webhookUrl,
        accountAddresses,
        transactionTypes: ['Any'],
        webhookType: 'enhanced',
      });

      return {
        success: true,
        data: response.data,
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

export const heliusAPI = new HeliusAPI();