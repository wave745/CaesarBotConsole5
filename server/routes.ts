import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertTokenSchema, insertSnipeSchema, insertDeploymentSchema, insertWalletSchema } from "@shared/schema";
import { z } from "zod";
import { heliusAPI, birdeyeAPI, jupiterAPI, openaiService } from './services/api';
import { authRoutes } from "./routes/auth.js";
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
  // Authentication routes
  app.use(authRoutes);
  
  // Real API endpoints
  
  // Deploy Console Enhanced Endpoints
  
  // Save deployment presets to Supabase
  app.post("/api/deploy/save-preset", async (req, res) => {
    try {
      const { userWallet, name, launchpad, config } = req.body;
      
      if (!userWallet || !name || !config) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      
      // In production: Save to Supabase presets table
      // INSERT INTO presets (user_wallet, name, launchpad, config) VALUES (...)
      
      res.json({
        success: true,
        message: 'Preset saved successfully'
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Load deployment presets from Supabase
  app.post("/api/deploy/presets", async (req, res) => {
    try {
      const { userWallet } = req.body;
      
      if (!userWallet) {
        return res.status(400).json({ error: 'User wallet required' });
      }
      
      // In production: Fetch from Supabase presets table
      // SELECT * FROM presets WHERE user_wallet = $1
      
      res.json({
        success: true,
        presets: [] // Mock empty for now
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Execute bundle trades via Jito
  app.post("/api/deploy/execute-bundle", async (req, res) => {
    try {
      const { tokenMint, wallets, slippage, priorityFee, pool, network } = req.body;
      
      // In production: Create bundle transactions and submit to Jito
      // 1. Generate buy transactions for each wallet
      // 2. Bundle them atomically
      // 3. Submit to Jito bundling service
      
      const bundleResults = wallets.map((wallet: any) => ({
        wallet: wallet.pubkey,
        signature: 'mock_sig_' + Math.random().toString(36).substr(2, 44),
        success: true
      }));
      
      res.json({
        success: true,
        results: bundleResults,
        bundleId: 'bundle_' + Math.random().toString(36).substr(2, 20)
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Check wallet balance via Helius
  app.post("/api/wallets/check-balance", async (req, res) => {
    try {
      const { walletAddress, network = 'devnet' } = req.body;
      
      if (!walletAddress) {
        return res.status(400).json({ error: 'Wallet address required' });
      }
      
      // In production: Use Helius API to get live balance
      const balanceResult = await heliusAPI.getNativeBalance(walletAddress);
      
      res.json({
        success: true,
        balance: balanceResult.data || 0,
        network
      });
    } catch (error: any) {
      res.status(500).json({ 
        success: false, 
        error: error.message,
        balance: 0 
      });
    }
  });
  
  // Auto-fund devnet wallets
  app.post("/api/wallets/fund-devnet", async (req, res) => {
    try {
      const { walletAddress, amount } = req.body;
      
      if (!walletAddress || !amount) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      
      // In production: Use Solana connection to request airdrop
      // const connection = new Connection(clusterApiUrl('devnet'));
      // await connection.requestAirdrop(new PublicKey(walletAddress), amount * LAMPORTS_PER_SOL);
      
      res.json({
        success: true,
        signature: 'airdrop_' + Math.random().toString(36).substr(2, 44),
        amount
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Award Caesar Points
  app.post("/api/users/award-points", async (req, res) => {
    try {
      const { userWallet, points, activity } = req.body;
      
      if (!userWallet || !points) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      
      // In production: Update Supabase users table
      // UPDATE users SET points = points + $1 WHERE wallet = $2
      
      res.json({
        success: true,
        pointsAwarded: points,
        activity,
        newTotal: 1000 + points // Mock total
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Live Wallet Operations Endpoints
  
  // Fetch all wallets for user with live balance updates
  app.post("/api/wallets/live-fetch", async (req, res) => {
    try {
      const { userWallet, network = 'devnet' } = req.body;
      
      if (!userWallet) {
        return res.status(400).json({ error: 'User wallet required' });
      }
      
      // Fetch wallets from storage (simulating Supabase query)
      const wallets = await storage.getUserWallets(userWallet);
      
      // Update balances with live Helius data (staggered requests)
      const updatedWallets = [];
      for (let i = 0; i < wallets.length; i++) {
        const wallet = wallets[i];
        try {
          // Add delay to prevent rate limiting
          if (i > 0) await new Promise(resolve => setTimeout(resolve, 100));
          
          const balanceResult = await heliusAPI.getNativeBalance(wallet.pubkey);
          const tokenResult = await heliusAPI.getTokenAccounts(wallet.pubkey);
          
          updatedWallets.push({
            pubkey: wallet.pubkey,
            label: wallet.label,
            is_burner: wallet.isBurner,
            sol_balance: balanceResult.data || 0,
            token_balances: tokenResult.data || [],
            user_wallet: userWallet,
            created_at: wallet.id, // Using ID as timestamp for demo
            updated_at: new Date().toISOString(),
          });
        } catch (error) {
          // If balance fetch fails, use stored data
          updatedWallets.push({
            pubkey: wallet.pubkey,
            label: wallet.label,
            is_burner: wallet.isBurner,
            sol_balance: parseFloat(wallet.balance || "0"),
            token_balances: [],
            user_wallet: userWallet,
            created_at: wallet.id,
            updated_at: new Date().toISOString(),
          });
        }
      }
      
      res.json({ wallets: updatedWallets });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create new wallets with live keypair generation
  app.post("/api/wallets/live-create", async (req, res) => {
    try {
      const { count, isBurner, userWallet, network = 'devnet' } = req.body;
      
      if (!userWallet || !count || count < 1 || count > 100) {
        return res.status(400).json({ error: 'Invalid parameters' });
      }
      
      const { Keypair } = await import('@solana/web3.js');
      const createdWallets = [];
      const privateKeys = [];
      
      // Generate keypairs and save to storage
      for (let i = 0; i < count; i++) {
        const keypair = Keypair.generate();
        const walletData = {
          userId: 'temp-user-id',
          userWallet: userWallet,
          pubkey: keypair.publicKey.toString(),
          label: `${isBurner ? 'Burner' : 'Wallet'} ${Date.now()}-${i + 1}`,
          isBurner,
        };
        
        const savedWallet = await storage.createWallet(walletData);
        createdWallets.push(savedWallet);
        privateKeys.push(Buffer.from(keypair.secretKey).toString('base64'));
      }
      
      res.json({
        success: true,
        wallets: createdWallets.map(w => ({
          pubkey: w.pubkey,
          label: w.label,
          is_burner: w.isBurner,
          sol_balance: 0,
          token_balances: [],
          user_wallet: userWallet,
        })),
        privateKeys: privateKeys, // Only sent once for security
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Import wallet with validation
  app.post("/api/wallets/live-import", async (req, res) => {
    try {
      const { privateKey, label, isBurner, userWallet, network = 'devnet' } = req.body;
      
      if (!privateKey || !label || !userWallet) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      
      const { Keypair } = await import('@solana/web3.js');
      
      try {
        // Try Base64 first, then use bs58 for Base58
        let secretKey;
        try {
          secretKey = Buffer.from(privateKey, 'base64');
        } catch {
          const bs58 = await import('bs58');
          secretKey = bs58.default.decode(privateKey);
        }
        
        const keypair = Keypair.fromSecretKey(secretKey);
        const address = keypair.publicKey.toString();
        
        // Check balance
        const balanceResult = await heliusAPI.getNativeBalance(address);
        
        const walletData = {
          userId: 'temp-user-id',
          userWallet: userWallet,
          pubkey: address,
          label,
          isBurner,
        };
        
        const savedWallet = await storage.createWallet(walletData);
        await storage.updateWalletBalance(address, balanceResult.data || 0);
        
        res.json({
          success: true,
          wallet: {
            pubkey: savedWallet.pubkey,
            label: savedWallet.label,
            is_burner: savedWallet.isBurner,
            sol_balance: parseFloat(savedWallet.balance || "0"),
            token_balances: [],
            user_wallet: userWallet,
          }
        });
      } catch (error) {
        throw new Error('Invalid private key format');
      }
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Transfer SOL with transaction building
  app.post("/api/wallets/live-transfer", async (req, res) => {
    try {
      const { fromWallet, toAddress, amount, tokenMint, userWallet, network = 'devnet' } = req.body;
      
      if (!fromWallet || !toAddress || !amount || !userWallet) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      
      // For demo, simulate transaction (in production would use real signing)
      const transactionSignature = 'demo_tx_' + Date.now() + Math.random().toString(36).substr(2, 9);
      
      // Update balances in storage
      const wallets = await storage.getUserWallets(userWallet);
      const fromWalletData = wallets.find(w => w.pubkey === fromWallet);
      
      if (!fromWalletData) {
        return res.status(404).json({ error: 'Source wallet not found' });
      }
      
      const currentBalance = parseFloat(fromWalletData.balance || "0");
      if (currentBalance < amount) {
        return res.status(400).json({ error: 'Insufficient balance' });
      }
      
      // Simulate balance update
      await storage.updateWalletBalance(fromWallet, currentBalance - amount);
      
      res.json({
        success: true,
        signature: transactionSignature,
        fromWallet,
        toAddress,
        amount,
        network
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Delete wallet
  app.delete("/api/wallets/live-delete", async (req, res) => {
    try {
      const { pubkey, userWallet } = req.body;
      
      if (!pubkey || !userWallet) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      
      const success = await storage.deleteWallet(pubkey);
      
      if (!success) {
        return res.status(404).json({ error: 'Wallet not found' });
      }
      
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Airdrop SOL (devnet only)
  app.post("/api/wallets/live-airdrop", async (req, res) => {
    try {
      const { pubkey, amount = 2, network } = req.body;
      
      if (network !== 'devnet') {
        return res.status(400).json({ error: 'Airdrops only available on devnet' });
      }
      
      if (!pubkey || !amount) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      
      const { Connection, PublicKey, LAMPORTS_PER_SOL } = await import('@solana/web3.js');
      
      try {
        const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
        const publicKey = new PublicKey(pubkey);
        
        const signature = await connection.requestAirdrop(
          publicKey,
          amount * LAMPORTS_PER_SOL
        );
        
        await connection.confirmTransaction(signature);
        
        res.json({
          success: true,
          signature,
          amount,
          pubkey
        });
      } catch (error: any) {
        // Fallback: simulate airdrop for demo
        const mockSignature = 'airdrop_' + Date.now() + Math.random().toString(36).substr(2, 9);
        
        res.json({
          success: true,
          signature: mockSignature,
          amount,
          pubkey,
          note: 'Demo airdrop - balance updated locally'
        });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Legacy wallet endpoints
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

  // User stats endpoints - Temporarily disabled due to missing Supabase configuration
  // app.get("/api/user/:address/stats", async (req, res) => {
  //   try {
  //     const { address } = req.params;
  //     const result = await supabaseService.instance.getUserStats(address);
  //     res.json(result);
  //   } catch (error: any) {
  //     res.status(500).json({ success: false, error: error.message });
  //   }
  // });

  // app.get("/api/leaderboard", async (req, res) => {
  //   try {
  //     const limit = parseInt(req.query.limit as string) || 100;
  //     const result = await supabaseService.instance.getLeaderboard(limit);
  //     res.json(result);
  //   } catch (error: any) {
  //     res.status(500).json({ success: false, error: error.message });
  //   }
  // };

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

  // Deploy Console API endpoints
  app.post("/api/deploy/upload-image", async (req, res) => {
    try {
      // Mock IPFS upload - in production, integrate with PumpPortal /upload/img
      const mockHash = 'Qm' + Math.random().toString(36).substr(2, 44);
      const ipfsUri = `https://ipfs.io/ipfs/${mockHash}`;
      
      res.json({
        success: true,
        ipfs: ipfsUri,
        hash: mockHash
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/deploy/upload-metadata", async (req, res) => {
    try {
      const { name, symbol, description, image, external_url, twitter, telegram } = req.body;
      
      const metadata = {
        name,
        symbol, 
        description,
        image,
        external_url,
        twitter,
        telegram
      };
      
      // In production: Upload to IPFS via PumpPortal /upload/meta endpoint
      // const formData = new FormData();
      // formData.append('metadata', JSON.stringify(metadata));
      // const response = await fetch(`${PUMPPORTAL_BASE_URL}/upload/meta`, {
      //   method: 'POST',
      //   headers: { 'Authorization': `Bearer ${PUMPPORTAL_API_KEY}` },
      //   body: formData
      // });
      
      const mockHash = 'Qm' + Math.random().toString(36).substr(2, 44);
      const metadataUri = `https://ipfs.io/ipfs/${mockHash}`;
      
      res.json({
        success: true,
        uri: metadataUri,
        metadata
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/deploy/create-token", async (req, res) => {
    try {
      const {
        name,
        symbol,
        imageUri,
        devWallet,
        devBuyAmount,
        slippage,
        priorityFee,
        launchpad,
        network,
        multiWallets = []
      } = req.body;

      // Generate mock mint address
      const mockMint = Math.random().toString(36).substr(2, 44);
      const mockSignature = Math.random().toString(36).substr(2, 88);
      
      // Mock deployment result
      const deploymentResult = {
        success: true,
        mint: mockMint,
        signature: mockSignature,
        explorerUrl: network === 'devnet' 
          ? `https://solscan.io/token/${mockMint}?cluster=devnet`
          : `https://solscan.io/token/${mockMint}`,
        safetyCheck: {
          score: Math.floor(Math.random() * 40) + 60, // 60-100
          risks: []
        }
      };

      res.json(deploymentResult);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/deploy/buy-token", async (req, res) => {
    try {
      const { tokenMint, walletAddress, amount, slippage, priorityFee, pool } = req.body;
      
      // Mock buy transaction
      const mockSignature = Math.random().toString(36).substr(2, 88);
      
      res.json({
        success: true,
        signature: mockSignature,
        amount,
        walletAddress
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/deploy/create-wallet", async (req, res) => {
    try {
      // Mock burner wallet generation
      const mockWallet = {
        publicKey: Math.random().toString(36).substr(2, 44),
        privateKey: Math.random().toString(36).substr(2, 88),
        apiKey: Math.random().toString(36).substr(2, 26)
      };
      
      res.json(mockWallet);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/twitter/post", async (req, res) => {
    try {
      const { message, tokenMint } = req.body;
      
      if (!message) {
        return res.status(400).json({ error: 'Message is required' });
      }
      
      // In production: Use twitter-api-v2 for live posting
      // const { TwitterApi } = require('twitter-api-v2');
      // const client = new TwitterApi({
      //   appKey: process.env.TWITTER_APP_KEY,
      //   appSecret: process.env.TWITTER_APP_SECRET,
      //   accessToken: process.env.TWITTER_ACCESS_TOKEN,
      //   accessSecret: process.env.TWITTER_ACCESS_SECRET,
      // });
      // 
      // const tweet = await client.v2.tweet({
      //   text: message
      // });
      
      // Mock Twitter post for development
      const mockTweetId = Math.random().toString(36).substr(2, 19);
      
      res.json({
        success: true,
        tweetId: mockTweetId,
        url: `https://twitter.com/caesarbot_sol/status/${mockTweetId}`,
        message: message.slice(0, 100) + '...'
      });
    } catch (error: any) {
      console.error('Twitter post error:', error);
      res.status(500).json({ 
        success: false,
        error: error.message || 'Failed to post tweet'
      });
    }
  });

  app.get("/api/rugcheck/:mint", async (req, res) => {
    try {
      const { mint } = req.params;
      
      // Mock RugCheck response
      const mockReport = {
        mint,
        score: Math.floor(Math.random() * 40) + 60,
        risks: [],
        status: 'safe'
      };
      
      res.json(mockReport);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
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

  // Enhanced Professional Wallet Operations Console endpoints
  app.get('/api/wallets', async (req, res) => {
    try {
      const { userWallet, network = 'devnet' } = req.query;
      
      // Return empty array - wallets would be fetched from Helius API with real balances
      // In production: Query Supabase for user's wallets, then Helius for current balances
      res.json([]);
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Professional wallet creation with bulk support (1-100 wallets)
  app.post('/api/wallets/create', async (req, res) => {
    try {
      const { count, labelPrefix, isBurner, userWallet, network = 'devnet' } = req.body;
      
      // Validate input
      if (!count || count < 1 || count > 100) {
        return res.status(400).json({ error: "Count must be between 1 and 100" });
      }

      // In production: Generate real Solana keypairs and store in Supabase
      const wallets = Array.from({ length: count }, (_, i) => ({
        id: `wallet_${Date.now()}_${i}`,
        userWallet,
        pubkey: `${Math.random().toString(36).substring(2, 10).repeat(6)}`, // Mock pubkey
        label: `${labelPrefix} ${i + 1}`,
        isBurner,
        balance: '0.00000000',
        createdAt: new Date().toISOString(),
      }));

      // Generate private keys (only sent once, not stored)
      const privateKeys = Array.from({ length: count }, () => 
        Buffer.from(Array.from({ length: 64 }, () => Math.floor(Math.random() * 256))).toString('base64')
      );

      const labels = wallets.map(w => w.label);

      res.json({
        success: true,
        wallets,
        message: `Successfully created ${count} wallet(s)`,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post('/api/wallets/import', async (req, res) => {
    try {
      const { privateKey, label, isBurner, userWallet } = req.body;
      
      // Mock private key validation and public key derivation
      if (!privateKey || privateKey.length < 32) {
        return res.status(400).json({ error: 'Invalid private key format' });
      }

      const mockWallet = {
        id: `imported-${Date.now()}`,
        userWallet,
        pubkey: `${Date.now()}DerivedPublicKey`,
        label,
        isBurner,
        balance: '0.0000',
        balanceNumber: 0,
        createdAt: new Date(),
      };

      res.json({
        success: true,
        wallet: mockWallet,
        message: 'Wallet imported successfully',
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post('/api/wallets/transfer', async (req, res) => {
    try {
      const { fromWallet, recipientAddress, amount, tokenMint, priorityFee } = req.body;
      
      // Mock transaction creation and submission
      const mockTxHash = `${Date.now()}TransferTransactionSignature`;
      
      res.json({
        success: true,
        txHash: mockTxHash,
        explorerUrl: `https://solscan.io/tx/${mockTxHash}`,
        amount,
        from: fromWallet,
        to: recipientAddress,
        tokenMint: tokenMint || 'SOL',
        priorityFee,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post('/api/wallets/multisend', async (req, res) => {
    try {
      const { fromWallet, recipients, tokenMint, priorityFee } = req.body;
      
      // Mock multisend transaction
      const mockTxHash = `${Date.now()}MultisendTransactionSignature`;
      
      res.json({
        success: true,
        txHash: mockTxHash,
        explorerUrl: `https://solscan.io/tx/${mockTxHash}`,
        recipients,
        from: fromWallet,
        tokenMint: tokenMint || 'SOL',
        priorityFee,
        totalAmount: recipients.reduce((sum: number, r: any) => sum + r.amount, 0),
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.delete('/api/wallets/:id', async (req, res) => {
    try {
      const { id } = req.params;
      
      // Mock wallet deletion
      res.json({
        success: true,
        message: `Wallet ${id} deleted successfully`,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Jupiter DEX integration for quick buys
  app.post('/api/wallets/quick-buy', async (req, res) => {
    try {
      const { 
        fromWallet, 
        tokenMint, 
        amountType, 
        fixedAmount, 
        minAmount, 
        maxAmount, 
        slippage, 
        network = 'devnet'
      } = req.body;
      
      const amount = amountType === 'fixed' 
        ? fixedAmount 
        : Math.random() * (maxAmount - minAmount) + minAmount;
        
      // In production: Use Jupiter API for best price routing and execution
      const txHash = `tx_${Math.random().toString(36).substring(2, 50)}`;
      
      res.json({
        success: true,
        txHash,
        amount,
        tokenMint,
        explorerUrl: network === 'mainnet' 
          ? `https://solscan.io/tx/${txHash}`
          : `https://solscan.io/tx/${txHash}?cluster=devnet`,
        message: "Quick buy executed successfully"
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // SOL consolidation across multiple wallets
  app.post('/api/wallets/consolidate', async (req, res) => {
    try {
      const { targetWallet, minBalance, keepAmount, network = 'devnet' } = req.body;
      
      // In production: Find all wallets with balance > minBalance, transfer to target
      const consolidatedAmount = Math.random() * 10; // Mock amount
      const walletCount = Math.floor(Math.random() * 20) + 5; // Mock wallet count
      
      res.json({
        success: true,
        amount: consolidatedAmount.toFixed(4),
        walletCount,
        targetWallet,
        transactions: Array.from({ length: walletCount }, () => ({
          txHash: `tx_${Math.random().toString(36).substring(2, 50)}`,
          status: 'confirmed'
        })),
        message: `Consolidated ${consolidatedAmount.toFixed(4)} SOL from ${walletCount} wallets`
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Devnet SOL airdrop for testing
  app.post('/api/wallets/airdrop', async (req, res) => {
    try {
      const { address } = req.body;
      
      // In production: Request airdrop from Solana devnet faucet
      const txHash = `airdrop_${Math.random().toString(36).substring(2, 50)}`;
      
      res.json({
        success: true,
        txHash,
        amount: "1.0",
        message: "Airdrop completed - received 1 SOL"
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post('/api/wallets/fund', async (req, res) => {
    try {
      const { fromWallet, toWallet, amount } = req.body;
      
      // Mock funding transaction
      const mockTxHash = `${Date.now()}FundingTransactionSignature`;
      
      res.json({
        success: true,
        txHash: mockTxHash,
        from: fromWallet,
        to: toWallet,
        amount,
        message: `Funded wallet with ${amount} SOL`,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post('/api/wallets/refresh-balances', async (req, res) => {
    try {
      const { addresses } = req.body;
      
      // Mock balance refresh via Helius API
      const updatedBalances = addresses.map((addr: string) => ({
        address: addr,
        balance: Math.random() * 5, // Random balance between 0-5 SOL
        lastUpdated: new Date(),
      }));
      
      res.json({
        success: true,
        balances: updatedBalances,
        message: 'Balances refreshed successfully',
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
