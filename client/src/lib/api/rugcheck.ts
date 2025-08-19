import axios, { AxiosInstance, AxiosError } from 'axios';
import { ENV } from '@shared/env';
import { RugCheckData, APIResponse } from '@shared/types/api';

class RugCheckAPI {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: ENV.RUGCHECK_API,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': ENV.RUGCHECK_API_KEY ? `Bearer ${ENV.RUGCHECK_API_KEY}` : undefined,
      },
    });
  }

  async checkToken(mintAddress: string): Promise<APIResponse<RugCheckData>> {
    try {
      const response = await this.client.get(`/tokens/${mintAddress}/report`);

      return {
        success: true,
        data: response.data,
        timestamp: Date.now(),
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getTokenRisks(mintAddress: string): Promise<APIResponse<{ score: number; risks: any[] }>> {
    try {
      const response = await this.client.get(`/tokens/${mintAddress}/risks`);

      return {
        success: true,
        data: {
          score: response.data.score || 0,
          risks: response.data.risks || [],
        },
        timestamp: Date.now(),
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async getTokenHolders(mintAddress: string, limit = 100): Promise<APIResponse<any[]>> {
    try {
      const response = await this.client.get(`/tokens/${mintAddress}/holders`, {
        params: { limit },
      });

      return {
        success: true,
        data: response.data.holders || [],
        timestamp: Date.now(),
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async analyzeContract(mintAddress: string): Promise<APIResponse<{
    mintAuthority: string | null;
    freezeAuthority: string | null;
    decimals: number;
    supply: string;
    isInitialized: boolean;
  }>> {
    try {
      const response = await this.client.get(`/tokens/${mintAddress}/contract`);

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
        message: axiosError.message || 'RugCheck API error',
        code: axiosError.response?.status || 'UNKNOWN',
        details: axiosError.response?.data,
      },
      timestamp: Date.now(),
    };
  }
}

export const rugCheckAPI = new RugCheckAPI();