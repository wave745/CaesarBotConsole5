import { useQuery } from '@tanstack/react-query';
import { useWallet } from '@solana/wallet-adapter-react';
import { heliusAPI } from '@/lib/api';

export interface Transaction {
  id: string;
  type: 'buy' | 'sell' | 'transfer' | 'swap' | 'deploy';
  token?: string;
  amount?: string;
  launchpad?: string;
  timestamp: string;
  signature: string;
  status: 'success' | 'failed' | 'pending';
}

export const useTransactionHistory = () => {
  const { publicKey, connected } = useWallet();

  return useQuery({
    queryKey: ['wallet-transactions', publicKey?.toString()],
    queryFn: async (): Promise<Transaction[]> => {
      if (!publicKey || !connected) {
        throw new Error('Wallet not connected');
      }

      try {
        const response = await heliusAPI.getTransactionHistory(publicKey.toString());
        if (response.success && response.data) {
          return response.data.map(tx => ({
            id: tx.signature,
            type: tx.type === 'SWAP' ? 'swap' : 'transfer',
            token: tx.events[0]?.tokenTransfers?.[0]?.mint || 'SOL',
            amount: tx.events[0]?.tokenTransfers?.[0]?.tokenAmount?.toString() || '0',
            launchpad: '',
            timestamp: new Date(tx.timestamp).toISOString(),
            signature: tx.signature,
            status: 'success' as const,
          }));
        }
        return [];
      } catch (error) {
        console.error('Failed to fetch transaction history:', error);
        return [];
      }
    },
    enabled: !!publicKey && connected,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
};
