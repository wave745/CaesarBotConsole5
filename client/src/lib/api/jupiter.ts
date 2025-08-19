import axios, { AxiosInstance, AxiosError } from 'axios';
import { ENV } from '@shared/env';
import { JupiterQuote, APIResponse } from '@shared/types/api';

class JupiterAPI {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: ENV.JUPITER_API,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  async getQuote(params: {
    inputMint: string;
    outputMint: string;
    amount: number;
    slippageBps?: number;
    feeBps?: number;
    swapMode?: 'ExactIn' | 'ExactOut';
    dexes?: string[];
    excludeDexes?: string[];
    onlyDirectRoutes?: boolean;
    asLegacyTransaction?: boolean;
    platformFeeBps?: number;
    maxAccounts?: number;
  }): Promise<APIResponse<JupiterQuote>> {
    try {
      const response = await this.client.get('/quote', {
        params: {
          ...params,
          slippageBps: params.slippageBps || 50,
          swapMode: params.swapMode || 'ExactIn',
        },
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

  async getSwapTransaction(quoteResponse: JupiterQuote, userPublicKey: string): Promise<APIResponse<{ swapTransaction: string }>> {
    try {
      const response = await this.client.post('/swap', {
        quoteResponse,
        userPublicKey,
        wrapAndUnwrapSol: true,
        useSharedAccounts: true,
        feeAccount: undefined,
        computeUnitPriceMicroLamports: 'auto',
        asLegacyTransaction: false,
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

  async getTokenList(): Promise<APIResponse<any[]>> {
    try {
      const response = await this.client.get('/tokens');

      return {
        success: true,
        data: response.data,
        timestamp: Date.now(),
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getIndexedRouteMap(): Promise<APIResponse<Record<string, string[]>>> {
    try {
      const response = await this.client.get('/indexed-route-map');

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

export const jupiterAPI = new JupiterAPI();