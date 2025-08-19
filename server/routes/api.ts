import { Router } from 'express';
import { heliusAPI, birdeyeAPI, jupiterAPI, openaiService, supabaseService } from '../services/api';

const router = Router();

// Wallet endpoints
router.get('/wallet/:address/balance', async (req, res) => {
  try {
    const { address } = req.params;
    const result = await heliusAPI.getNativeBalance(address);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/wallet/:address/tokens', async (req, res) => {
  try {
    const { address } = req.params;
    const result = await heliusAPI.getTokenAccounts(address);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/wallet/:address/transactions', async (req, res) => {
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
router.get('/market/trending', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const result = await birdeyeAPI.getTrendingTokens('volume24hUSD', 'desc', 0, limit);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/token/:address/price', async (req, res) => {
  try {
    const { address } = req.params;
    const result = await birdeyeAPI.getTokenPrice(address);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/token/:address/chart', async (req, res) => {
  try {
    const { address } = req.params;
    const timeframe = req.query.timeframe as string || '1H';
    const result = await birdeyeAPI.getTokenOHLCV(address, timeframe as any);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Trading endpoints
router.post('/trade/quote', async (req, res) => {
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
router.post('/ai/analyze', async (req, res) => {
  try {
    const { tokenData, timeframe } = req.body;
    const result = await openaiService.analyzeTrend(tokenData, timeframe);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// User stats endpoints
router.get('/user/:address/stats', async (req, res) => {
  try {
    const { address } = req.params;
    const result = await supabaseService.getUserStats(address);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/leaderboard', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const result = await supabaseService.getLeaderboard(limit);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;