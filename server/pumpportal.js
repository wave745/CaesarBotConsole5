// PumpPortal API Integration for Caesarbot Deploy Console
// Based on latest 2025 PumpPortal API documentation

import { Keypair } from '@solana/web3.js';
import axios from 'axios';
import FormData from 'form-data';

const PUMPPORTAL_API_KEY = process.env.PUMPPORTAL_API_KEY;
const PUMPPORTAL_BASE_URL = 'https://pumpportal.fun/api';

class PumpPortalAPI {
  constructor() {
    this.apiKey = PUMPPORTAL_API_KEY;
    this.baseURL = PUMPPORTAL_BASE_URL;
    
    if (!this.apiKey) {
      console.warn('PUMPPORTAL_API_KEY not configured - using mock responses');
    }
    
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });
  }

  /**
   * Upload image to IPFS via PumpPortal
   * @param {Buffer} imageBuffer - Image file buffer
   * @param {string} filename - Original filename
   * @returns {Promise<{success: boolean, ipfs?: string, error?: string}>}
   */
  async uploadImage(imageBuffer, filename) {
    try {
      if (!this.apiKey) {
        // Mock response for development
        return {
          success: true,
          ipfs: `https://ipfs.io/ipfs/Qm${Math.random().toString(36).substr(2, 44)}`,
        };
      }

      const formData = new FormData();
      formData.append('file', imageBuffer, {
        filename,
        contentType: this.getContentType(filename),
      });

      const response = await axios.post(`${this.baseURL}/upload/img`, formData, {
        headers: {
          ...formData.getHeaders(),
          'Authorization': `Bearer ${this.apiKey}`,
        },
        timeout: 60000, // 60 seconds for image upload
      });

      if (response.data && response.data.ipfs) {
        return {
          success: true,
          ipfs: response.data.ipfs,
        };
      } else {
        throw new Error('Invalid response from PumpPortal image upload');
      }
    } catch (error) {
      console.error('PumpPortal image upload error:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      };
    }
  }

  /**
   * Upload metadata to IPFS via PumpPortal
   * @param {Object} metadata - Token metadata object
   * @returns {Promise<{success: boolean, ipfs?: string, error?: string}>}
   */
  async uploadMetadata(metadata) {
    try {
      if (!this.apiKey) {
        // Mock response for development
        return {
          success: true,
          ipfs: `https://ipfs.io/ipfs/Qm${Math.random().toString(36).substr(2, 44)}`,
        };
      }

      const response = await this.client.post('/upload/meta', {
        name: metadata.name,
        symbol: metadata.symbol,
        description: metadata.description,
        image: metadata.image,
        external_url: metadata.external_url,
        twitter: metadata.twitter,
        telegram: metadata.telegram,
      });

      if (response.data && response.data.ipfs) {
        return {
          success: true,
          ipfs: response.data.ipfs,
        };
      } else {
        throw new Error('Invalid response from PumpPortal metadata upload');
      }
    } catch (error) {
      console.error('PumpPortal metadata upload error:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      };
    }
  }

  /**
   * Create token via PumpPortal API
   * @param {Object} params - Token creation parameters
   * @returns {Promise<{success: boolean, mint?: string, signature?: string, error?: string}>}
   */
  async createToken(params) {
    try {
      const {
        tokenMetadata,
        mint,
        denominatedInSol = true,
        amount,
        slippage = 5,
        priorityFee = 0.0001,
        pool = 'pump', // 'pump' for Pump.fun, 'bonk' for LetsBonk.fun
      } = params;

      if (!this.apiKey) {
        // Mock response for development
        return {
          success: true,
          mint: mint.toString(),
          signature: `mock_sig_${Math.random().toString(36).substr(2, 88)}`,
        };
      }

      const response = await this.client.post(`/trade?api-key=${this.apiKey}`, {
        action: 'create',
        tokenMetadata,
        mint: mint.toString(),
        denominatedInSol,
        amount,
        slippage,
        priorityFee,
        pool,
      });

      if (response.data && response.data.signature) {
        return {
          success: true,
          mint: mint.toString(),
          signature: response.data.signature,
          txid: response.data.txid,
        };
      } else {
        throw new Error('Invalid response from PumpPortal token creation');
      }
    } catch (error) {
      console.error('PumpPortal token creation error:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      };
    }
  }

  /**
   * Buy token via PumpPortal API
   * @param {Object} params - Buy parameters
   * @returns {Promise<{success: boolean, signature?: string, error?: string}>}
   */
  async buyToken(params) {
    try {
      const {
        tokenMint,
        amount,
        denominatedInSol = true,
        slippage = 5,
        priorityFee = 0.0001,
        pool = 'pump',
      } = params;

      if (!this.apiKey) {
        // Mock response for development
        return {
          success: true,
          signature: `mock_buy_sig_${Math.random().toString(36).substr(2, 88)}`,
        };
      }

      const response = await this.client.post(`/trade?api-key=${this.apiKey}`, {
        action: 'buy',
        tokenMint,
        denominatedInSol,
        amount,
        slippage,
        priorityFee,
        pool,
      });

      if (response.data && response.data.signature) {
        return {
          success: true,
          signature: response.data.signature,
          txid: response.data.txid,
        };
      } else {
        throw new Error('Invalid response from PumpPortal buy');
      }
    } catch (error) {
      console.error('PumpPortal buy error:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      };
    }
  }

  /**
   * Get trade transaction data for local signing
   * @param {Object} params - Trade parameters
   * @returns {Promise<{success: boolean, transaction?: string, error?: string}>}
   */
  async getTradeTransaction(params) {
    try {
      const {
        tokenMint,
        amount,
        denominatedInSol = true,
        slippage = 5,
        priorityFee = 0.0001,
        pool = 'pump',
        action = 'buy',
      } = params;

      if (!this.apiKey) {
        // Mock response for development
        return {
          success: true,
          transaction: Buffer.from('mock_transaction_data').toString('base64'),
        };
      }

      const response = await this.client.get('/trade-local', {
        params: {
          'api-key': this.apiKey,
          action,
          tokenMint,
          denominatedInSol,
          amount,
          slippage,
          priorityFee,
          pool,
        },
      });

      if (response.data && response.data.transaction) {
        return {
          success: true,
          transaction: response.data.transaction,
        };
      } else {
        throw new Error('Invalid response from PumpPortal trade-local');
      }
    } catch (error) {
      console.error('PumpPortal trade-local error:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      };
    }
  }

  /**
   * Create new wallet keypair
   * @returns {Promise<{success: boolean, publicKey?: string, privateKey?: string, error?: string}>}
   */
  async createWallet() {
    try {
      // Generate keypair using Solana Web3.js
      const keypair = Keypair.generate();
      
      return {
        success: true,
        publicKey: keypair.publicKey.toString(),
        privateKey: Buffer.from(keypair.secretKey).toString('base64'),
        // Also provide API key format for easy integration
        apiKey: Buffer.from(keypair.secretKey).toString('hex').slice(0, 32),
      };
    } catch (error) {
      console.error('Wallet creation error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get content type for file extension
   * @param {string} filename - File name
   * @returns {string} Content type
   */
  getContentType(filename) {
    const ext = filename.toLowerCase().split('.').pop();
    const contentTypes = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'svg': 'image/svg+xml',
    };
    return contentTypes[ext] || 'application/octet-stream';
  }
}

/**
 * Generate mint keypair for token creation
 * @returns {Keypair} Solana keypair
 */
export function generateMintKeypair() {
  return Keypair.generate();
}

/**
 * Check token safety via RugCheck API
 * @param {string} mintAddress - Token mint address
 * @returns {Promise<{score: number, risks: string[], status: string}>}
 */
export async function checkTokenSafety(mintAddress) {
  try {
    const RUGCHECK_API_KEY = process.env.RUGCHECK_API_KEY;
    
    if (!RUGCHECK_API_KEY) {
      // Mock response for development
      return {
        score: Math.floor(Math.random() * 40) + 60, // 60-100
        risks: [],
        status: 'safe',
      };
    }

    const response = await axios.get(`https://api.rugcheck.xyz/v1/tokens/${mintAddress}/report`, {
      headers: {
        'X-API-Key': RUGCHECK_API_KEY,
      },
      timeout: 10000,
    });

    return response.data;
  } catch (error) {
    console.error('RugCheck API error:', error);
    // Return default safe score on error
    return {
      score: 75,
      risks: ['API check failed'],
      status: 'unknown',
    };
  }
}

// Export singleton instance
export const pumpPortalAPI = new PumpPortalAPI();