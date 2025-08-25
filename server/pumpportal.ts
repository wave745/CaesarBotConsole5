import { Keypair } from "@solana/web3.js";
import bs58 from "bs58";

const PUMPPORTAL_API_BASE = "https://pumpportal.fun/api";
const PUMPPORTAL_API_KEY = process.env.PUMPPORTAL_API_KEY;

if (!PUMPPORTAL_API_KEY) {
  console.warn("PUMPPORTAL_API_KEY not found in environment variables");
}

export interface PumpPortalUploadResponse {
  ipfs: string;
  error?: string;
}

export interface PumpPortalCreateResponse {
  signature: string;
  mint: string;
  error?: string;
}

export interface PumpPortalWalletResponse {
  publicKey: string;
  privateKey: string;
  error?: string;
}

export class PumpPortalAPI {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async uploadImage(imageFile: Buffer, filename: string): Promise<PumpPortalUploadResponse> {
    try {
      const formData = new FormData();
      const blob = new Blob([new Uint8Array(imageFile)], { type: 'image/png' });
      formData.append('file', blob, filename);

      const response = await fetch(`${PUMPPORTAL_API_BASE}/upload/img`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Image upload error:', error);
      return { ipfs: '', error: error instanceof Error ? error.message : 'Upload failed' };
    }
  }

  async uploadMetadata(metadata: {
    name: string;
    symbol: string;
    description: string;
    image: string;
    twitter?: string;
    telegram?: string;
    website?: string;
  }): Promise<PumpPortalUploadResponse> {
    try {
      const response = await fetch(`${PUMPPORTAL_API_BASE}/upload/meta`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(metadata),
      });

      if (!response.ok) {
        throw new Error(`Metadata upload failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Metadata upload error:', error);
      return { ipfs: '', error: error instanceof Error ? error.message : 'Metadata upload failed' };
    }
  }

  async createToken(params: {
    tokenMetadata: string; // URI from metadata upload
    mint: string; // Public key of mint keypair
    denominatedInSol: boolean;
    amount: number;
    slippage: number;
    priorityFee: number;
    pool: 'pump' | 'bonk';
  }): Promise<PumpPortalCreateResponse> {
    try {
      const queryParams = new URLSearchParams({
        'api-key': this.apiKey,
      });

      const response = await fetch(`${PUMPPORTAL_API_BASE}/trade?${queryParams}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'create',
          ...params,
        }),
      });

      if (!response.ok) {
        throw new Error(`Token creation failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Token creation error:', error);
      return { signature: '', mint: '', error: error instanceof Error ? error.message : 'Token creation failed' };
    }
  }

  async createWallet(): Promise<PumpPortalWalletResponse> {
    try {
      const response = await fetch(`${PUMPPORTAL_API_BASE}/create-wallet?api-key=${this.apiKey}`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error(`Wallet creation failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Wallet creation error:', error);
      return { publicKey: '', privateKey: '', error: error instanceof Error ? error.message : 'Wallet creation failed' };
    }
  }

  async buyToken(params: {
    tokenMint: string;
    amount: number;
    denominatedInSol: boolean;
    slippage: number;
    priorityFee: number;
    pool: 'pump' | 'bonk';
  }): Promise<PumpPortalCreateResponse> {
    try {
      const queryParams = new URLSearchParams({
        'api-key': this.apiKey,
      });

      const response = await fetch(`${PUMPPORTAL_API_BASE}/trade?${queryParams}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'buy',
          mint: params.tokenMint,
          denominatedInSol: params.denominatedInSol,
          amount: params.amount,
          slippage: params.slippage,
          priorityFee: params.priorityFee,
          pool: params.pool,
        }),
      });

      if (!response.ok) {
        throw new Error(`Buy failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Buy token error:', error);
      return { signature: '', mint: '', error: error instanceof Error ? error.message : 'Buy failed' };
    }
  }
}

export const pumpPortalAPI = PUMPPORTAL_API_KEY ? new PumpPortalAPI(PUMPPORTAL_API_KEY) : null;

// Utility function to generate a new mint keypair
export function generateMintKeypair(): { publicKey: string; privateKey: string } {
  const keypair = Keypair.generate();
  return {
    publicKey: keypair.publicKey.toString(),
    privateKey: bs58.encode(keypair.secretKey),
  };
}

// Utility function to check RugCheck API
export async function checkTokenSafety(mintAddress: string): Promise<{
  score: number;
  risks: string[];
  error?: string;
}> {
  try {
    const response = await fetch(`https://api.rugcheck.xyz/v1/tokens/${mintAddress}/report`);
    
    if (!response.ok) {
      throw new Error(`RugCheck API failed: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      score: data.score || 0,
      risks: data.risks || [],
    };
  } catch (error) {
    console.error('RugCheck error:', error);
    return {
      score: 0,
      risks: ['Unable to verify token safety'],
      error: error instanceof Error ? error.message : 'Safety check failed',
    };
  }
}