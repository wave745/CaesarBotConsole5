import { useQuery } from '@tanstack/react-query';
import { pumpFunAPI } from '@/lib/api';

export interface PumpFunToken {
  address: string;
  symbol: string;
  name: string;
  marketCap: string;
  change: string;
  launchTime: string;
  liquidity: string;
}

export const usePumpFunData = () => {
  return useQuery({
    queryKey: ['pumpfun-latest'],
    queryFn: async (): Promise<PumpFunToken[]> => {
      try {
        const response = await pumpFunAPI.getLatestTokens();
        return response || [];
      } catch (error) {
        console.error('Failed to fetch pump.fun data:', error);
        return [];
      }
    },
    refetchInterval: 60000, // Refetch every minute
  });
};
