import { Router } from 'express';
import { Connection, clusterApiUrl, PublicKey } from '@solana/web3.js';
import bs58 from 'bs58';
import { createHash } from 'crypto';
import { supabaseService } from '../services/api.js';

const router = Router();

// Initialize Solana connection
const getConnection = () => {
  const rpcEndpoint = process.env.RPC_ENDPOINT || clusterApiUrl('devnet');
  return new Connection(rpcEndpoint, 'confirmed');
};

// Generate authentication nonce using latest blockhash
router.get('/api/auth/nonce', async (req, res) => {
  try {
    const connection = getConnection();
    const { blockhash } = await connection.getLatestBlockhash();
    
    res.json({
      nonce: blockhash,
      timestamp: Date.now(),
    });
  } catch (error: any) {
    console.error('Nonce generation error:', error);
    res.status(500).json({
      error: 'Failed to generate authentication nonce',
      message: error.message,
    });
  }
});

// Verify wallet signature and authenticate user
router.post('/api/auth/verify', async (req, res) => {
  try {
    const { publicKey, signature, nonce } = req.body;

    if (!publicKey || !signature || !nonce) {
      return res.status(400).json({
        error: 'Missing required fields: publicKey, signature, nonce',
      });
    }

    // Reconstruct the message that was signed
    const message = new TextEncoder().encode(
      `Authenticate with Caesarbot Console\nNonce: ${nonce}\nWallet: ${publicKey}`
    );

    // For now, we'll do basic validation - in production you'd use proper ed25519 verification
    // This is a simplified approach for development
    const isValid = publicKey && signature && nonce;

    if (!isValid) {
      return res.status(401).json({
        error: 'Invalid signature',
      });
    }

    // Upsert user in Supabase (simplified for now)
    try {
      // For now, create a simple user object without Supabase until configured
      const userData = {
        wallet: publicKey,
        points: 0,
        lastLogin: new Date(),
      };

      // Create session (in production, use proper JWT tokens)
      if (req.session) {
        req.session.user = {
          wallet: publicKey,
          authenticated: true,
          loginTime: Date.now(),
        };
      }

      res.json({
        success: true,
        user: userData,
        session: {
          authenticated: true,
          wallet: publicKey,
        },
        message: 'Authentication successful',
      });

    } catch (supabaseError: any) {
      console.error('Supabase user creation error:', supabaseError);
      
      // Even if Supabase fails, allow authentication with in-memory session
      if (req.session) {
        req.session.user = {
          wallet: publicKey,
          authenticated: true,
          loginTime: Date.now(),
        };
      }

      res.json({
        success: true,
        user: {
          wallet: publicKey,
          points: 0,
        },
        session: {
          authenticated: true,
          wallet: publicKey,
        },
        message: 'Authentication successful (limited features due to database connection)',
      });
    }

  } catch (error: any) {
    console.error('Authentication verification error:', error);
    res.status(500).json({
      error: 'Authentication failed',
      message: error.message,
    });
  }
});

// Logout endpoint
router.post('/api/auth/logout', (req, res) => {
  if (req.session) {
    req.session.destroy((err: any) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to logout' });
      }
      res.json({ success: true, message: 'Logged out successfully' });
    });
  } else {
    res.json({ success: true, message: 'No active session' });
  }
});

// Check authentication status
router.get('/api/auth/status', (req, res) => {
  const user = req.session?.user;
  
  if (user && user.authenticated) {
    res.json({
      authenticated: true,
      user: {
        wallet: user.wallet,
        loginTime: user.loginTime,
      },
    });
  } else {
    res.json({
      authenticated: false,
    });
  }
});

export { router as authRoutes };