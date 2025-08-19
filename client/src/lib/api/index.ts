// Centralized API exports
export { heliusAPI } from './helius';
export { jupiterAPI } from './jupiter';
export { birdeyeAPI } from './birdeye';
export { openaiService } from './openai';
export { supabaseService } from './supabase';
export { rugCheckAPI } from './rugcheck';
export { pumpFunAPI } from './pumpfun';
export { solanaService } from './solana';

// API utility functions
export const apiUtils = {
  handleResponse: <T>(response: { success: boolean; data?: T; error?: any }) => {
    if (!response.success) {
      console.error('API Error:', response.error);
      throw new Error(response.error?.message || 'API request failed');
    }
    return response.data;
  },

  withRetry: async <T>(
    apiCall: () => Promise<T>,
    maxRetries = 3,
    delay = 1000
  ): Promise<T> => {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await apiCall();
      } catch (error) {
        if (i === maxRetries - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
      }
    }
    throw new Error('Max retries exceeded');
  },

  combineResponses: <T extends Record<string, any>>(
    responses: Array<{ success: boolean; data?: any; error?: any }>
  ): { success: boolean; data: T; errors: any[] } => {
    const data = {} as T;
    const errors: any[] = [];

    responses.forEach((response, index) => {
      if (response.success && response.data) {
        Object.assign(data, response.data);
      } else if (response.error) {
        errors.push({ index, error: response.error });
      }
    });

    return {
      success: errors.length === 0,
      data,
      errors,
    };
  },
};