import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertTokenSchema, insertSnipeSchema, insertDeploymentSchema, insertWalletSchema } from "@shared/schema";
import { z } from "zod";
import { heliusAPI, birdeyeAPI, jupiterAPI, openaiService, supabaseService } from './services/api';
import multer from 'multer';

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Real API endpoints
  
  // Wallet endpoints
  app.get("/api/wallet/:address/balance", async (req, res) => {
    try {
      const { address } = req.params;
      const result = await heliusAPI.getNativeBalance(address);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.get("/api/wallet/:address/tokens", async (req, res) => {
    try {
      const { address } = req.params;
      const result = await heliusAPI.getTokenAccounts(address);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.get("/api/wallet/:address/transactions", async (req, res) => {
    try {
      const { address } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;
      const result = await heliusAPI.getTransactionHistory(address, limit);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Market data endpoints
  app.get("/api/market/trending", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const result = await birdeyeAPI.getTrendingTokens('volume24hUSD', 'desc', 0, limit);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post("/api/market/prices", async (req, res) => {
    try {
      const { tokens } = req.body;
      const result = await birdeyeAPI.getTokenPrice(tokens[0]); // Simplified for single token
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.get("/api/token/:address/price", async (req, res) => {
    try {
      const { address } = req.params;
      const result = await birdeyeAPI.getTokenPrice(address);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Trading endpoints
  app.post("/api/trade/quote", async (req, res) => {
    try {
      const { inputMint, outputMint, amount, slippageBps } = req.body;
      const result = await jupiterAPI.getQuote({
        inputMint,
        outputMint,
        amount,
        slippageBps,
      });
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // AI endpoints
  app.post("/api/ai/analyze", async (req, res) => {
    try {
      const { tokenData, timeframe } = req.body;
      const result = await openaiService.analyzeTrend(tokenData, timeframe);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // User stats endpoints
  app.get("/api/user/:address/stats", async (req, res) => {
    try {
      const { address } = req.params;
      const result = await supabaseService.getUserStats(address);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.get("/api/leaderboard", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const result = await supabaseService.getLeaderboard(limit);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Scanner endpoints
  app.get("/api/scanner/tokens", async (req, res) => {
    try {
      const { 
        search = "",
        launchpad = "all",
        minMarketCap = 0,
        maxMarketCap = 10000,
        minVolume = 0,
        minRating = 0,
        showHoneypots = false,
        requireLpLock = false,
        sortBy = "marketCap",
        sortOrder = "desc"
      } = req.query;

      const tokens = await storage.scanTokens({
        search: search as string,
        launchpad: launchpad as string,
        minMarketCap: Number(minMarketCap),
        maxMarketCap: Number(maxMarketCap),
        minVolume: Number(minVolume),
        minRating: Number(minRating),
        showHoneypots: showHoneypots === 'true',
        requireLpLock: requireLpLock === 'true',
        sortBy: sortBy as string,
        sortOrder: sortOrder as string
      });

      res.json(tokens);
    } catch (error) {
      res.status(500).json({ error: "Failed to scan tokens" });
    }
  });

  // Rewards endpoints
  app.get("/api/rewards/missions", async (req, res) => {
    try {
      const missions = await storage.getUserMissions();
      res.json(missions);
    } catch (error) {
      res.status(500).json({ error: "Failed to get missions" });
    }
  });

  app.get("/api/rewards/leaderboard", async (req, res) => {
    try {
      const leaderboard = await storage.getLeaderboard();
      res.json(leaderboard);
    } catch (error) {
      res.status(500).json({ error: "Failed to get leaderboard" });
    }
  });

  app.get("/api/rewards/airdrops", async (req, res) => {
    try {
      const airdrops = await storage.getAirdrops();
      res.json(airdrops);
    } catch (error) {
      res.status(500).json({ error: "Failed to get airdrops" });
    }
  });

  // Token operations
  app.post("/api/tokens", async (req, res) => {
    try {
      const validatedData = insertTokenSchema.parse(req.body);
      const token = await storage.createToken(validatedData);
      res.json(token);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid token data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create token" });
      }
    }
  });

  app.get("/api/tokens", async (req, res) => {
    try {
      const tokens = await storage.getTokens();
      res.json(tokens);
    } catch (error) {
      res.status(500).json({ error: "Failed to get tokens" });
    }
  });

  // Snipe operations
  app.post("/api/snipes", async (req, res) => {
    try {
      const validatedData = insertSnipeSchema.parse(req.body);
      const snipe = await storage.createSnipe({
        ...validatedData,
        userId: "default-user" // In real app, get from auth
      });
      res.json(snipe);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid snipe data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create snipe" });
      }
    }
  });

  app.get("/api/snipes", async (req, res) => {
    try {
      const snipes = await storage.getSnipes();
      res.json(snipes);
    } catch (error) {
      res.status(500).json({ error: "Failed to get snipes" });
    }
  });

  // Deployment operations
  app.post("/api/deployments", async (req, res) => {
    try {
      const validatedData = insertDeploymentSchema.parse(req.body);
      const deployment = await storage.createDeployment({
        ...validatedData,
        userId: "default-user" // In real app, get from auth
      });
      res.json(deployment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid deployment data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create deployment" });
      }
    }
  });

  app.get("/api/deployments", async (req, res) => {
    try {
      const deployments = await storage.getDeployments();
      res.json(deployments);
    } catch (error) {
      res.status(500).json({ error: "Failed to get deployments" });
    }
  });

  // Wallet operations
  app.post("/api/wallets", async (req, res) => {
    try {
      const validatedData = insertWalletSchema.parse(req.body);
      const wallet = await storage.createWallet({
        ...validatedData,
        userId: "default-user" // In real app, get from auth
      });
      res.json(wallet);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid wallet data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create wallet" });
      }
    }
  });

  app.get("/api/wallets", async (req, res) => {
    try {
      const wallets = await storage.getWallets();
      res.json(wallets);
    } catch (error) {
      res.status(500).json({ error: "Failed to get wallets" });
    }
  });

  // System status endpoint
  app.get("/api/system/status", async (req, res) => {
    try {
      const status = await storage.getSystemStatus();
      res.json(status);
    } catch (error) {
      res.status(500).json({ error: "Failed to get system status" });
    }
  });

  // Token deployment endpoints
  app.post("/api/deploy/upload-image", upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const { pumpPortalAPI } = await import('./pumpportal.js');
      if (!pumpPortalAPI) {
        return res.status(500).json({ error: "PumpPortal API not configured" });
      }

      const result = await pumpPortalAPI.uploadImage(req.file.buffer, req.file.originalname);
      res.json(result);
    } catch (error) {
      console.error('Image upload error:', error);
      res.status(500).json({ error: "Failed to upload image" });
    }
  });

  app.post("/api/deploy/create-token", async (req, res) => {
    try {
      const { tokenDeploymentSchema } = await import('../shared/schema.js');
      const validatedData = tokenDeploymentSchema.parse(req.body);
      
      const { pumpPortalAPI, generateMintKeypair, checkTokenSafety } = await import('./pumpportal.js');
      if (!pumpPortalAPI) {
        return res.status(500).json({ error: "PumpPortal API not configured" });
      }

      // Generate mint keypair
      const mintKeypair = generateMintKeypair();

      // Create metadata object
      const metadata = {
        name: validatedData.name,
        symbol: validatedData.symbol,
        description: validatedData.description || "",
        image: req.body.imageUri || "", // From previous upload
        twitter: validatedData.twitter,
        telegram: validatedData.telegram,
        website: validatedData.website,
      };

      // Upload metadata to IPFS
      const metadataResult = await pumpPortalAPI.uploadMetadata(metadata);
      if (metadataResult.error) {
        return res.status(500).json({ error: metadataResult.error });
      }

      // Create token
      const createResult = await pumpPortalAPI.createToken({
        tokenMetadata: metadataResult.ipfs,
        mint: mintKeypair.publicKey,
        denominatedInSol: true,
        amount: validatedData.devBuyAmount,
        slippage: validatedData.slippage,
        priorityFee: validatedData.priorityFee,
        pool: validatedData.launchpad,
      });

      if (createResult.error) {
        return res.status(500).json({ error: createResult.error });
      }

      // Store deployment in database
      const deployment = await storage.createDeployment({
        tokenId: "temp-token-id", // Will be updated with actual token
        launchpad: validatedData.launchpad === 'pump' ? 'Pump.fun' : 'LetsBonk.fun',
        metadata: {
          ...validatedData,
          mintAddress: createResult.mint,
          signature: createResult.signature,
          metadataUri: metadataResult.ipfs,
        },
        userId: "default-user" // In real app, get from auth
      });

      // Check token safety (optional, don't block on failure)
      let safetyCheck = null;
      try {
        safetyCheck = await checkTokenSafety(createResult.mint);
      } catch (error) {
        console.warn('Safety check failed:', error);
      }

      res.json({
        success: true,
        mint: createResult.mint,
        signature: createResult.signature,
        deployment,
        safetyCheck,
        explorerUrl: `https://solscan.io/token/${createResult.mint}${validatedData.useDevnet ? '?cluster=devnet' : ''}`,
      });
    } catch (error) {
      console.error('Token creation error:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid deployment data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create token" });
      }
    }
  });

  app.post("/api/deploy/create-wallet", async (req, res) => {
    try {
      const { pumpPortalAPI } = await import('./pumpportal.js');
      if (!pumpPortalAPI) {
        return res.status(500).json({ error: "PumpPortal API not configured" });
      }

      const result = await pumpPortalAPI.createWallet();
      res.json(result);
    } catch (error) {
      console.error('Wallet creation error:', error);
      res.status(500).json({ error: "Failed to create wallet" });
    }
  });

  app.post("/api/deploy/buy-token", async (req, res) => {
    try {
      const { tokenMint, amount, slippage, priorityFee, pool } = req.body;
      
      const { pumpPortalAPI } = await import('./pumpportal.js');
      if (!pumpPortalAPI) {
        return res.status(500).json({ error: "PumpPortal API not configured" });
      }

      const result = await pumpPortalAPI.buyToken({
        tokenMint,
        amount,
        denominatedInSol: true,
        slippage: slippage || 5,
        priorityFee: priorityFee || 0.0001,
        pool: pool || 'pump',
      });

      res.json(result);
    } catch (error) {
      console.error('Buy token error:', error);
      res.status(500).json({ error: "Failed to buy token" });
    }
  });

  app.post("/api/twitter/post", async (req, res) => {
    try {
      // Placeholder for Twitter integration
      // In production, implement with twitter-api-v2 or similar
      const { message, tokenMint } = req.body;
      
      // Simulate Twitter post
      console.log('Twitter post (placeholder):', { message, tokenMint });
      
      res.json({
        success: true,
        message: "Twitter post functionality not implemented yet. Use manual posting.",
        tweetUrl: null,
      });
    } catch (error) {
      console.error('Twitter post error:', error);
      res.status(500).json({ error: "Failed to post to Twitter" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
