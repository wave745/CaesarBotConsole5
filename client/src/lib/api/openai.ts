import OpenAI from 'openai';
import { ENV } from '@shared/env';
import { APIResponse } from '@shared/types/api';

class OpenAIService {
  private client: OpenAI;

  constructor() {
    // Skip API key validation on client side since env vars might not be prefixed with VITE_

    this.client = new OpenAI({
      apiKey: ENV.OPENAI_API_KEY || 'placeholder-key',
      dangerouslyAllowBrowser: true,
    });
  }

  async analyzeTrend(
    tokenData: {
      symbol: string;
      price: number;
      volume24h: number;
      priceChange24h: number;
      marketCap: number;
      holders?: number;
    },
    timeframe = '24h'
  ): Promise<APIResponse<{ analysis: string; prediction: string; confidence: number }>> {
    try {
      const prompt = `
Analyze this Solana token data and provide trading insights:

Token: ${tokenData.symbol}
Current Price: $${tokenData.price}
24h Volume: $${tokenData.volume24h}
24h Price Change: ${tokenData.priceChange24h}%
Market Cap: $${tokenData.marketCap}
${tokenData.holders ? `Holders: ${tokenData.holders}` : ''}

Timeframe: ${timeframe}

Please provide:
1. Market sentiment analysis
2. Price prediction for the next ${timeframe}
3. Risk assessment
4. Confidence level (0-100%)

Keep the response concise and actionable for a crypto trader.
`;

      const completion = await this.client.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'You are an expert crypto analyst specializing in Solana DeFi tokens. Provide clear, actionable trading insights.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 500,
        temperature: 0.3,
      });

      const content = completion.choices[0]?.message?.content || '';
      
      // Extract confidence level from response
      const confidenceMatch = content.match(/confidence[:\s]*(\d+)%/i);
      const confidence = confidenceMatch ? parseInt(confidenceMatch[1]) : 50;

      return {
        success: true,
        data: {
          analysis: content,
          prediction: content.split('\n').find(line => line.toLowerCase().includes('prediction')) || '',
          confidence,
        },
        timestamp: Date.now(),
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async generateTradingStrategy(
    portfolio: any[],
    riskTolerance: 'low' | 'medium' | 'high' = 'medium'
  ): Promise<APIResponse<{ strategy: string; recommendations: string[] }>> {
    try {
      const portfolioSummary = portfolio.map(token => 
        `${token.symbol}: $${token.value} (${token.percentage}%)`
      ).join('\n');

      const prompt = `
Current Portfolio:
${portfolioSummary}

Risk Tolerance: ${riskTolerance}

Generate a personalized trading strategy for this Solana DeFi portfolio. Include:
1. Portfolio diversification recommendations
2. Entry/exit strategies
3. Risk management tips
4. Specific action items

Keep recommendations practical and implementable.
`;

      const completion = await this.client.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'You are a DeFi portfolio manager specializing in Solana tokens. Provide strategic advice.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 600,
        temperature: 0.4,
      });

      const content = completion.choices[0]?.message?.content || '';
      const recommendations = content.split('\n')
        .filter(line => line.match(/^\d+\.|^-|^•/))
        .slice(0, 5);

      return {
        success: true,
        data: {
          strategy: content,
          recommendations,
        },
        timestamp: Date.now(),
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  async detectRugPull(tokenMetrics: {
    liquidityLocked: boolean;
    ownershipRenounced: boolean;
    topHolderPercentage: number;
    liquidityAmount: number;
    ageInDays: number;
    tradingVolume24h: number;
  }): Promise<APIResponse<{ riskScore: number; warnings: string[] }>> {
    try {
      const prompt = `
Analyze this token for rug pull risk:

Liquidity Locked: ${tokenMetrics.liquidityLocked}
Ownership Renounced: ${tokenMetrics.ownershipRenounced}
Top Holder %: ${tokenMetrics.topHolderPercentage}%
Liquidity: $${tokenMetrics.liquidityAmount}
Age: ${tokenMetrics.ageInDays} days
24h Volume: $${tokenMetrics.tradingVolume24h}

Provide:
1. Risk score (0-100, where 100 is highest risk)
2. Specific warning flags
3. Key indicators to monitor

Be direct about red flags.
`;

      const completion = await this.client.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'You are a smart contract security analyst. Identify rug pull risks clearly.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 400,
        temperature: 0.2,
      });

      const content = completion.choices[0]?.message?.content || '';
      
      // Extract risk score
      const scoreMatch = content.match(/risk score[:\s]*(\d+)/i);
      const riskScore = scoreMatch ? parseInt(scoreMatch[1]) : 50;

      // Extract warnings
      const warnings = content.split('\n')
        .filter(line => line.toLowerCase().includes('warning') || line.includes('🚩') || line.includes('⚠️'))
        .slice(0, 5);

      return {
        success: true,
        data: {
          riskScore,
          warnings,
        },
        timestamp: Date.now(),
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  private handleError(error: any): APIResponse<never> {
    return {
      success: false,
      error: {
        message: error.message || 'OpenAI API error',
        code: error.code || 'OPENAI_ERROR',
        details: error,
      },
      timestamp: Date.now(),
    };
  }
}

export const openaiService = new OpenAIService();