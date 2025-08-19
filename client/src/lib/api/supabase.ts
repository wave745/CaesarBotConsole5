import { createClient, RealtimeChannel } from '@supabase/supabase-js';
import { ENV } from '@shared/env';
import { APIResponse } from '@shared/types/api';

interface UserStats {
  wallet_address: string;
  caesar_points: number;
  tier: string;
  successful_snipes: number;
  tokens_deployed: number;
  total_trades: number;
  last_activity: string;
  created_at: string;
}

interface LeaderboardEntry extends UserStats {
  rank: number;
}

interface Mission {
  id: string;
  title: string;
  description: string;
  reward_points: number;
  target_value: number;
  mission_type: 'daily' | 'weekly' | 'achievement';
  is_active: boolean;
  expires_at?: string;
}

interface UserMission {
  user_id: string;
  mission_id: string;
  progress: number;
  completed_at?: string;
  claimed_at?: string;
}

class SupabaseService {
  private client;
  private channels: Map<string, RealtimeChannel> = new Map();

  constructor() {
    if (!ENV.SUPABASE_URL || !ENV.SUPABASE_ANON_KEY) {
      throw new Error('Supabase credentials are required');
    }

    this.client = createClient(ENV.SUPABASE_URL, ENV.SUPABASE_ANON_KEY, {
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });
  }

  // User Stats Management
  async getUserStats(walletAddress: string): Promise<APIResponse<UserStats | null>> {
    try {
      const { data, error } = await this.client
        .from('user_stats')
        .select('*')
        .eq('wallet_address', walletAddress)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }

      return {
        success: true,
        data: data || null,
        timestamp: Date.now(),
      };
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  async updateUserStats(walletAddress: string, updates: Partial<UserStats>): Promise<APIResponse<UserStats>> {
    try {
      const { data, error } = await this.client
        .from('user_stats')
        .upsert({
          wallet_address: walletAddress,
          ...updates,
          last_activity: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data,
        timestamp: Date.now(),
      };
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  // Leaderboard
  async getLeaderboard(limit = 100): Promise<APIResponse<LeaderboardEntry[]>> {
    try {
      const { data, error } = await this.client
        .from('user_stats')
        .select('*')
        .order('caesar_points', { ascending: false })
        .limit(limit);

      if (error) throw error;

      const leaderboard = data.map((user, index) => ({
        ...user,
        rank: index + 1,
      }));

      return {
        success: true,
        data: leaderboard,
        timestamp: Date.now(),
      };
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  async getUserRank(walletAddress: string): Promise<APIResponse<number>> {
    try {
      const { count, error } = await this.client
        .from('user_stats')
        .select('wallet_address', { count: 'exact', head: true })
        .gt('caesar_points', 
          `(SELECT caesar_points FROM user_stats WHERE wallet_address = '${walletAddress}')`
        );

      if (error) throw error;

      return {
        success: true,
        data: (count || 0) + 1,
        timestamp: Date.now(),
      };
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  // Missions System
  async getActiveMissions(): Promise<APIResponse<Mission[]>> {
    try {
      const { data, error } = await this.client
        .from('missions')
        .select('*')
        .eq('is_active', true)
        .or('expires_at.is.null,expires_at.gt.now()');

      if (error) throw error;

      return {
        success: true,
        data: data || [],
        timestamp: Date.now(),
      };
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  async getUserMissions(walletAddress: string): Promise<APIResponse<(UserMission & Mission)[]>> {
    try {
      const { data, error } = await this.client
        .from('user_missions')
        .select(`
          *,
          missions (*)
        `)
        .eq('wallet_address', walletAddress);

      if (error) throw error;

      return {
        success: true,
        data: data || [],
        timestamp: Date.now(),
      };
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  async updateMissionProgress(
    walletAddress: string,
    missionId: string,
    progress: number
  ): Promise<APIResponse<UserMission>> {
    try {
      const { data, error } = await this.client
        .from('user_missions')
        .upsert({
          wallet_address: walletAddress,
          mission_id: missionId,
          progress,
          completed_at: progress >= 100 ? new Date().toISOString() : null,
        })
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data,
        timestamp: Date.now(),
      };
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  // Real-time subscriptions
  async subscribeToLeaderboard(callback: (payload: any) => void): Promise<string> {
    const channelName = 'leaderboard-updates';
    
    if (this.channels.has(channelName)) {
      this.channels.get(channelName)?.unsubscribe();
    }

    const channel = this.client
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_stats',
        },
        callback
      )
      .subscribe();

    this.channels.set(channelName, channel);
    return channelName;
  }

  async subscribeToUserStats(walletAddress: string, callback: (payload: any) => void): Promise<string> {
    const channelName = `user-stats-${walletAddress}`;
    
    if (this.channels.has(channelName)) {
      this.channels.get(channelName)?.unsubscribe();
    }

    const channel = this.client
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_stats',
          filter: `wallet_address=eq.${walletAddress}`,
        },
        callback
      )
      .subscribe();

    this.channels.set(channelName, channel);
    return channelName;
  }

  async unsubscribe(channelName: string): Promise<void> {
    const channel = this.channels.get(channelName);
    if (channel) {
      await channel.unsubscribe();
      this.channels.delete(channelName);
    }
  }

  async unsubscribeAll(): Promise<void> {
    const channels = Array.from(this.channels.values());
    for (const channel of channels) {
      await channel.unsubscribe();
    }
    this.channels.clear();
  }

  private handleError(error: any): APIResponse<never> {
    return {
      success: false,
      error: {
        message: error.message || 'Supabase error',
        code: error.code || 'SUPABASE_ERROR',
        details: error,
      },
      timestamp: Date.now(),
    };
  }
}

export const supabaseService = new SupabaseService();