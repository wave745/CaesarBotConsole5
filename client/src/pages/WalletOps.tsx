import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { FixedSizeList as List } from 'react-window';
import { Wallet, Plus, Download, Settings, Copy, Trash2, DollarSign, Send, RefreshCw, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Connection, Keypair, PublicKey, LAMPORTS_PER_SOL, SystemProgram, Transaction } from '@solana/web3.js';
import { useWallet } from '@/providers/WalletProvider';
import { useAppStore } from '@/store/useAppStore';
import CryptoJS from 'crypto-js';

// Live Data Integration Types
interface WalletData {
  pubkey: string;
  label: string;
  is_burner: boolean;
  sol_balance: number;
  token_balances: TokenBalance[];
  user_wallet: string;
  created_at: string;
  updated_at: string;
}

interface TokenBalance {
  mint: string;
  symbol: string;
  amount: number;
  decimals: number;
  uiAmount: number;
  value?: number;
}

// Form Schemas
const createWalletSchema = z.object({
  count: z.number().min(1).max(100),
  isBurner: z.boolean(),
});

const importWalletSchema = z.object({
  privateKey: z.string().min(1, 'Private key is required'),
  label: z.string().min(1, 'Label is required'),
  isBurner: z.boolean(),
});

const transferSchema = z.object({
  fromWallet: z.string().min(1, 'Please select a wallet'),
  toAddress: z.string().min(1, 'Recipient address is required'),
  amount: z.number().min(0.000000001, 'Amount must be greater than 0'),
  tokenMint: z.string().optional(),
});

type CreateWalletForm = z.infer<typeof createWalletSchema>;
type ImportWalletForm = z.infer<typeof importWalletSchema>;
type TransferForm = z.infer<typeof transferSchema>;

export function WalletOps() {
  const [isDevnet, setIsDevnet] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'pubkey' | 'label' | 'sol_balance'>('pubkey');
  const [flashingWallets, setFlashingWallets] = useState<Set<string>>(new Set());
  const [showPrivateKeys, setShowPrivateKeys] = useState(false);
  const [balanceUpdates, setBalanceUpdates] = useState<Map<string, number>>(new Map());
  
  const queryClient = useQueryClient();
  const { connection } = useWallet();
  const { user } = useAppStore();

  // Get network-specific connection
  const getConnection = useCallback(() => {
    const endpoint = isDevnet 
      ? import.meta.env.VITE_RPC_ENDPOINT || 'https://api.devnet.solana.com'
      : 'https://api.mainnet-beta.solana.com';
    return new Connection(endpoint, 'confirmed');
  }, [isDevnet]);

  // Live wallet data fetching with Supabase + Helius integration
  const { data: wallets = [], isLoading, refetch } = useQuery({
    queryKey: ['live-wallets', user?.walletAddress, isDevnet],
    queryFn: async () => {
      if (!user?.walletAddress) throw new Error('User not authenticated');
      
      const response = await fetch('/api/wallets/live-fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userWallet: user.walletAddress,
          network: isDevnet ? 'devnet' : 'mainnet-beta'
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch wallets');
      }
      
      const data = await response.json();
      
      // Start live balance monitoring
      if (data.wallets?.length > 0) {
        startLiveBalanceMonitoring(data.wallets);
      }
      
      return data.wallets || [];
    },
    enabled: !!user?.walletAddress,
    refetchInterval: 15000, // Refresh every 15 seconds for live updates
    retry: 2,
  });

  // Live balance monitoring with staggered Helius API calls
  const startLiveBalanceMonitoring = useCallback(async (walletsToMonitor: WalletData[]) => {
    if (walletsToMonitor.length === 0) return;
    
    try {
      const conn = getConnection();
      
      // Stagger balance checks to avoid rate limiting
      walletsToMonitor.forEach(async (wallet, index) => {
        setTimeout(async () => {
          try {
            const balance = await conn.getBalance(new PublicKey(wallet.pubkey));
            const solBalance = balance / LAMPORTS_PER_SOL;
            
            // Check if balance changed significantly
            if (Math.abs(solBalance - wallet.sol_balance) > 0.000001) {
              setBalanceUpdates(prev => new Map(prev).set(wallet.pubkey, solBalance));
              setFlashingWallets(prev => new Set(prev).add(wallet.pubkey));
              
              // Flash animation timeout
              setTimeout(() => {
                setFlashingWallets(prev => {
                  const newSet = new Set(prev);
                  newSet.delete(wallet.pubkey);
                  return newSet;
                });
              }, 2000);
            }
          } catch (error) {
            console.error('Balance check failed:', wallet.pubkey, error);
          }
        }, index * 100); // 100ms stagger between requests
      });
    } catch (error) {
      console.error('Balance monitoring setup failed:', error);
    }
  }, [getConnection]);

  // Create wallets with live Keypair generation + Supabase insert
  const createWalletsMutation = useMutation({
    mutationFn: async (data: CreateWalletForm) => {
      if (!user?.walletAddress) throw new Error('User not authenticated');
      
      const response = await fetch('/api/wallets/live-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          count: data.count,
          isBurner: data.isBurner,
          userWallet: user.walletAddress,
          network: isDevnet ? 'devnet' : 'mainnet-beta'
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create wallets');
      }
      
      const result = await response.json();
      
      // Show private keys once for security
      if (result.privateKeys && showPrivateKeys) {
        toast.success(
          `${data.count} wallet(s) created! Private keys logged to console (save them now).`,
          { duration: 15000 }
        );
        console.log('🔐 PRIVATE KEYS (Save these immediately!):', result.privateKeys);
      } else {
        toast.success(`${data.count} wallet(s) created successfully`);
      }
      
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['live-wallets'] });
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create wallets');
    },
  });

  // Import wallet with live validation + Supabase insert
  const importWalletMutation = useMutation({
    mutationFn: async (data: ImportWalletForm) => {
      if (!user?.walletAddress) throw new Error('User not authenticated');
      
      const response = await fetch('/api/wallets/live-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          privateKey: data.privateKey,
          label: data.label,
          isBurner: data.isBurner,
          userWallet: user.walletAddress,
          network: isDevnet ? 'devnet' : 'mainnet-beta'
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to import wallet');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['live-wallets'] });
      toast.success('Wallet imported and verified');
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to import wallet');
    },
  });

  // Live transfer with real transaction building
  const transferMutation = useMutation({
    mutationFn: async (data: TransferForm) => {
      if (!user?.walletAddress) throw new Error('User not authenticated');
      
      const response = await fetch('/api/wallets/live-transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromWallet: data.fromWallet,
          toAddress: data.toAddress,
          amount: data.amount,
          tokenMint: data.tokenMint,
          userWallet: user.walletAddress,
          network: isDevnet ? 'devnet' : 'mainnet-beta'
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Transfer failed');
      }
      
      return response.json();
    },
    onSuccess: (result) => {
      toast.success(
        <div>
          Transfer successful! 
          <a 
            href={`https://solscan.io/tx/${result.signature}${isDevnet ? '?cluster=devnet' : ''}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:underline ml-1"
          >
            View on Solscan
          </a>
        </div>
      );
      queryClient.invalidateQueries({ queryKey: ['live-wallets'] });
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Transfer failed');
    },
  });

  // Delete wallet with Supabase delete
  const deleteWalletMutation = useMutation({
    mutationFn: async (pubkey: string) => {
      if (!user?.walletAddress) throw new Error('User not authenticated');
      
      const response = await fetch('/api/wallets/live-delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          pubkey,
          userWallet: user.walletAddress 
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete wallet');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['live-wallets'] });
      toast.success('Wallet deleted from database');
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete wallet');
    },
  });

  // Airdrop SOL (devnet only)
  const airdropMutation = useMutation({
    mutationFn: async (pubkey: string) => {
      if (!isDevnet) throw new Error('Airdrop only available on devnet');
      
      const response = await fetch('/api/wallets/live-airdrop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          pubkey,
          amount: 2,
          network: 'devnet'
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Airdrop failed');
      }
      
      return response.json();
    },
    onSuccess: (result) => {
      toast.success(`Airdropped ${result.amount} SOL successfully!`);
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Airdrop failed');
    },
  });

  // Filter and sort wallets
  const filteredWallets = wallets
    .filter((wallet: WalletData) => 
      wallet.pubkey.toLowerCase().includes(searchTerm.toLowerCase()) ||
      wallet.label.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a: WalletData, b: WalletData) => {
      switch (sortBy) {
        case 'label': return a.label.localeCompare(b.label);
        case 'sol_balance': 
          const balanceA = balanceUpdates.get(a.pubkey) ?? a.sol_balance;
          const balanceB = balanceUpdates.get(b.pubkey) ?? b.sol_balance;
          return balanceB - balanceA;
        default: return a.pubkey.localeCompare(b.pubkey);
      }
    });

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  // Export wallets with live data
  const exportWallets = () => {
    const timestamp = new Date().toISOString().split('T')[0];
    const networkTag = isDevnet ? 'devnet' : 'mainnet';
    
    const csvContent = [
      'Public Key,Label,SOL Balance,Token Count,Is Burner,Created At,Updated At',
      ...filteredWallets.map((wallet: WalletData) => {
        const balance = balanceUpdates.get(wallet.pubkey) ?? wallet.sol_balance;
        return `${wallet.pubkey},${wallet.label},${balance.toFixed(9)},${wallet.token_balances?.length || 0},${wallet.is_burner},${wallet.created_at},${wallet.updated_at}`;
      })
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `caesarbot-wallets-${networkTag}-${timestamp}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Exported ${filteredWallets.length} wallets to CSV`);
  };

  // Wallet Row Component with live updates
  const WalletRow = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const wallet = filteredWallets[index] as WalletData;
    const currentBalance = balanceUpdates.get(wallet.pubkey) ?? wallet.sol_balance;
    const isFlashing = flashingWallets.has(wallet.pubkey);
    const balanceChanged = balanceUpdates.has(wallet.pubkey);
    
    return (
      <motion.div 
        style={style}
        className={`flex items-center p-3 border-b border-gray-800 hover:bg-gray-900/50 transition-all duration-200 ${
          isFlashing ? 'bg-green-900/20 border-green-600/30' : ''
        }`}
        animate={isFlashing ? { 
          backgroundColor: ['rgba(34, 197, 94, 0.2)', 'transparent'],
          borderColor: ['rgba(34, 197, 94, 0.3)', 'rgba(75, 85, 99, 1)']
        } : {}}
        transition={{ duration: 1.5 }}
      >
        <div className="flex-1 grid grid-cols-7 gap-3 items-center text-sm">
          {/* Public Key */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => copyToClipboard(wallet.pubkey)}
              className="font-mono text-yellow-400 hover:text-yellow-300 transition-colors"
              title={wallet.pubkey}
              data-testid={`wallet-pubkey-${index}`}
            >
              {truncateAddress(wallet.pubkey)}
            </button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(wallet.pubkey)}
              className="h-6 w-6 p-0"
              data-testid={`copy-pubkey-${index}`}
            >
              <Copy className="w-3 h-3" />
            </Button>
          </div>
          
          {/* Label */}
          <div className="text-gray-200 font-medium" data-testid={`wallet-label-${index}`}>
            {wallet.label}
          </div>
          
          {/* SOL Balance with live updates */}
          <div 
            className={`font-mono transition-colors ${
              balanceChanged ? 'text-green-400' : 'text-white'
            }`} 
            data-testid={`wallet-balance-${index}`}
          >
            {currentBalance.toFixed(6)} SOL
          </div>
          
          {/* Token Count */}
          <div className="text-gray-400" data-testid={`wallet-tokens-${index}`}>
            {wallet.token_balances?.length || 0} tokens
          </div>
          
          {/* Wallet Type */}
          <div>
            <Badge 
              variant={wallet.is_burner ? "destructive" : "secondary"}
              className="text-xs"
              data-testid={`wallet-type-${index}`}
            >
              {wallet.is_burner ? "Burner" : "Normal"}
            </Badge>
          </div>
          
          {/* Network Badge */}
          <div>
            <Badge 
              variant="outline" 
              className={`text-xs ${isDevnet ? 'border-yellow-400 text-yellow-400' : 'border-red-400 text-red-400'}`}
            >
              {isDevnet ? "DEVNET" : "MAINNET"}
            </Badge>
          </div>
          
          {/* Actions */}
          <div className="flex space-x-1">
            {isDevnet && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => airdropMutation.mutate(wallet.pubkey)}
                disabled={airdropMutation.isPending}
                title="Airdrop 2 SOL (Devnet only)"
                className="h-7 w-7 p-0 text-green-400 hover:text-green-300"
                data-testid={`airdrop-${index}`}
              >
                <DollarSign className="w-3 h-3" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => deleteWalletMutation.mutate(wallet.pubkey)}
              disabled={deleteWalletMutation.isPending}
              title="Delete wallet"
              className="h-7 w-7 p-0 text-red-400 hover:text-red-300"
              data-testid={`delete-wallet-${index}`}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </motion.div>
    );
  };

  if (!user?.walletAddress) {
    return (
      <div className="p-8 bg-black text-yellow-400 min-h-screen">
        <div className="max-w-2xl mx-auto text-center">
          <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-yellow-400" />
          <h2 className="text-2xl font-bold mb-4">Wallet Connection Required</h2>
          <p className="text-gray-300 mb-6">
            Connect your Solana wallet to access the live Wallet Operations console with real-time balance tracking.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-8 bg-black text-yellow-400 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-yellow-400" />
          <p className="text-gray-300">Loading live wallet data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-black text-yellow-400 min-h-screen" data-testid="wallet-ops-live">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-yellow-400" data-testid="page-title">
              Wallet Operations Console
            </h1>
            <p className="text-gray-300 mt-1">
              Real-time Solana wallet management with live balance tracking • {filteredWallets.length}/100 wallets
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Network Toggle */}
            <div className="flex items-center space-x-2 bg-gray-900 px-3 py-2 rounded-lg">
              <Label htmlFor="network-toggle" className={`text-sm ${isDevnet ? 'text-yellow-400' : 'text-red-400'}`}>
                {isDevnet ? 'DEVNET' : 'MAINNET'}
              </Label>
              <Switch
                id="network-toggle"
                checked={isDevnet}
                onCheckedChange={setIsDevnet}
                data-testid="network-toggle"
              />
            </div>
            
            {/* Private Key Visibility Toggle */}
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPrivateKeys(!showPrivateKeys)}
                className="text-gray-400"
                data-testid="toggle-private-keys"
              >
                {showPrivateKeys ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
            
            <Button onClick={exportWallets} variant="outline" className="border-yellow-400 text-yellow-400" data-testid="export-wallets">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            
            <Button onClick={() => refetch()} variant="outline" className="border-yellow-400 text-yellow-400" data-testid="refresh-wallets">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Security Warning */}
        <Card className="border-yellow-600/50 bg-yellow-900/10">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-semibold text-yellow-400 mb-1">Security & Privacy Notice</p>
                <p className="text-gray-300">
                  Private keys are never stored and shown only once during creation. Use burner wallets for enhanced privacy. 
                  All balances are fetched live from Helius API. Consider VPN usage for additional anonymity.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Operations Panel */}
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-yellow-400">
              <Settings className="w-5 h-5" />
              <span>Live Wallet Operations</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <CreateWalletDialog 
                onSubmit={(data) => createWalletsMutation.mutate(data)}
                isLoading={createWalletsMutation.isPending}
                showPrivateKeys={showPrivateKeys}
              />
              
              <ImportWalletDialog
                onSubmit={(data) => importWalletMutation.mutate(data)}
                isLoading={importWalletMutation.isPending}
              />
              
              <TransferDialog
                wallets={wallets}
                onSubmit={(data) => transferMutation.mutate(data)}
                isLoading={transferMutation.isPending}
                isDevnet={isDevnet}
              />
            </div>
          </CardContent>
        </Card>

        {/* Search and Filters */}
        <Card className="bg-gray-900 border-gray-700">
          <CardContent className="pt-6">
            <div className="flex space-x-4">
              <div className="flex-1">
                <Input
                  placeholder="Search by public key or label..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                  data-testid="wallet-search"
                />
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white"
                data-testid="sort-select"
              >
                <option value="pubkey">Sort by Public Key</option>
                <option value="label">Sort by Label</option>
                <option value="sol_balance">Sort by Balance</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Live Wallet List */}
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-yellow-400">
              <span>Live Wallets ({filteredWallets.length})</span>
              <div className="flex items-center space-x-4 text-sm text-gray-400">
                <span>
                  Total Balance: {filteredWallets.reduce((sum: number, w: WalletData) => 
                    sum + (balanceUpdates.get(w.pubkey) ?? w.sol_balance), 0
                  ).toFixed(6)} SOL
                </span>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>Live Updates</span>
                </div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {filteredWallets.length > 0 ? (
              <div>
                {/* Header Row */}
                <div className="flex items-center p-3 border-b border-gray-700 bg-gray-800/30 text-xs font-medium text-gray-400 uppercase tracking-wide">
                  <div className="flex-1 grid grid-cols-7 gap-3">
                    <div>Public Key</div>
                    <div>Label</div>
                    <div>SOL Balance</div>
                    <div>Tokens</div>
                    <div>Type</div>
                    <div>Network</div>
                    <div>Actions</div>
                  </div>
                </div>
                
                {/* Virtualized List with Live Updates */}
                <List
                  height={500}
                  itemCount={filteredWallets.length}
                  itemSize={60}
                  data-testid="live-wallet-list"
                >
                  {WalletRow}
                </List>
              </div>
            ) : (
              <div className="p-12 text-center">
                <Wallet className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                <p className="text-gray-400 mb-4">No wallets found</p>
                <p className="text-sm text-gray-500">
                  Create or import wallets to start live balance tracking
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Dialog Components with Enhanced Forms

function CreateWalletDialog({ onSubmit, isLoading, showPrivateKeys }: {
  onSubmit: (data: CreateWalletForm) => void;
  isLoading: boolean;
  showPrivateKeys: boolean;
}) {
  const [open, setOpen] = useState(false);
  const { register, handleSubmit, formState: { errors }, reset } = useForm<CreateWalletForm>({
    resolver: zodResolver(createWalletSchema),
    defaultValues: { count: 1, isBurner: true }
  });

  const onFormSubmit = (data: CreateWalletForm) => {
    onSubmit(data);
    setOpen(false);
    reset();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-yellow-400 text-black hover:bg-yellow-500 font-medium" data-testid="create-wallets-button">
          <Plus className="w-4 h-4 mr-2" />
          Create Wallets
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-gray-900 border-gray-700 text-white">
        <DialogHeader>
          <DialogTitle className="text-yellow-400">Create New Wallets</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="count" className="text-gray-300">Number of Wallets (1-100)</Label>
            <Input
              id="count"
              type="number"
              min="1"
              max="100"
              {...register('count', { valueAsNumber: true })}
              className="bg-gray-800 border-gray-600 text-white"
              data-testid="wallet-count-input"
            />
            {errors.count && (
              <p className="text-red-400 text-sm mt-1">{errors.count.message}</p>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isBurner"
              {...register('isBurner')}
              className="rounded"
              data-testid="burner-checkbox"
            />
            <Label htmlFor="isBurner" className="text-gray-300">
              Mark as burner wallets (recommended for privacy)
            </Label>
          </div>
          
          {!showPrivateKeys && (
            <div className="text-sm text-orange-400 bg-orange-900/20 p-3 rounded">
              <strong>Note:</strong> Private keys will be logged to console only once for security. 
              Toggle the eye icon to enable private key display.
            </div>
          )}
          
          <Button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-yellow-400 text-black hover:bg-yellow-500 font-medium"
            data-testid="submit-create"
          >
            {isLoading ? 'Creating Wallets...' : 'Create Wallets'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ImportWalletDialog({ onSubmit, isLoading }: {
  onSubmit: (data: ImportWalletForm) => void;
  isLoading: boolean;
}) {
  const [open, setOpen] = useState(false);
  const { register, handleSubmit, formState: { errors }, reset } = useForm<ImportWalletForm>({
    resolver: zodResolver(importWalletSchema),
    defaultValues: { isBurner: true }
  });

  const onFormSubmit = (data: ImportWalletForm) => {
    onSubmit(data);
    setOpen(false);
    reset();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-black" data-testid="import-wallet-button">
          <Wallet className="w-4 h-4 mr-2" />
          Import Wallet
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-gray-900 border-gray-700 text-white">
        <DialogHeader>
          <DialogTitle className="text-yellow-400">Import Existing Wallet</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="privateKey" className="text-gray-300">Private Key (Base64 or Base58)</Label>
            <Input
              id="privateKey"
              type="password"
              {...register('privateKey')}
              className="bg-gray-800 border-gray-600 text-white font-mono text-sm"
              placeholder="Enter your private key..."
              data-testid="private-key-input"
            />
            {errors.privateKey && (
              <p className="text-red-400 text-sm mt-1">{errors.privateKey.message}</p>
            )}
            <p className="text-xs text-gray-400 mt-1">
              Supports both Base64 and Base58 encoded private keys
            </p>
          </div>
          
          <div>
            <Label htmlFor="label" className="text-gray-300">Wallet Label</Label>
            <Input
              id="label"
              {...register('label')}
              className="bg-gray-800 border-gray-600 text-white"
              placeholder="Enter a descriptive label..."
              data-testid="wallet-label-input"
            />
            {errors.label && (
              <p className="text-red-400 text-sm mt-1">{errors.label.message}</p>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isBurner"
              {...register('isBurner')}
              className="rounded"
              data-testid="import-burner-checkbox"
            />
            <Label htmlFor="isBurner" className="text-gray-300">Mark as burner wallet</Label>
          </div>
          
          <Button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-yellow-400 text-black hover:bg-yellow-500 font-medium"
            data-testid="submit-import"
          >
            {isLoading ? 'Importing & Verifying...' : 'Import Wallet'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function TransferDialog({ wallets, onSubmit, isLoading, isDevnet }: {
  wallets: WalletData[];
  onSubmit: (data: TransferForm) => void;
  isLoading: boolean;
  isDevnet: boolean;
}) {
  const [open, setOpen] = useState(false);
  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm<TransferForm>({
    resolver: zodResolver(transferSchema),
  });

  const selectedWallet = watch('fromWallet');
  const selectedWalletData = wallets.find(w => w.pubkey === selectedWallet);

  const onFormSubmit = (data: TransferForm) => {
    onSubmit(data);
    setOpen(false);
    reset();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-black" data-testid="transfer-button">
          <Send className="w-4 h-4 mr-2" />
          Transfer SOL
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-gray-900 border-gray-700 text-white">
        <DialogHeader>
          <DialogTitle className="text-yellow-400">Transfer SOL</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="fromWallet" className="text-gray-300">From Wallet</Label>
            <select
              id="fromWallet"
              {...register('fromWallet')}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white"
              data-testid="from-wallet-select"
            >
              <option value="">Select source wallet...</option>
              {wallets.length === 0 ? (
                <option disabled>No wallets available</option>
              ) : (
                wallets.map((wallet) => (
                  <option 
                    key={wallet.pubkey} 
                    value={wallet.pubkey}
                    disabled={wallet.sol_balance <= 0}
                  >
                    {wallet.label || 'Wallet'} • {wallet.sol_balance.toFixed(6)} SOL • {wallet.pubkey.slice(0, 8)}...
                    {wallet.sol_balance <= 0 ? ' (Insufficient balance)' : ''}
                  </option>
                ))
              )}
            </select>
            {errors.fromWallet && (
              <p className="text-red-400 text-sm mt-1">{errors.fromWallet.message}</p>
            )}
            {selectedWalletData && (
              <div className="mt-1 space-y-1">
                <p className="text-xs text-gray-400">
                  Available: {selectedWalletData.sol_balance.toFixed(9)} SOL
                </p>
                {isDevnet && selectedWalletData.sol_balance === 0 && (
                  <p className="text-xs text-yellow-400">
                    💡 This wallet has no SOL. Use the Airdrop button to get devnet SOL first.
                  </p>
                )}
              </div>
            )}
            
            {wallets.length > 0 && wallets.every(w => w.sol_balance === 0) && (
              <p className="text-xs text-yellow-400 mt-1">
                💡 All wallets have 0 SOL. {isDevnet ? 'Use Airdrop to get devnet SOL' : 'Fund your wallets to enable transfers'}.
              </p>
            )}
          </div>
          
          <div>
            <Label htmlFor="toAddress" className="text-gray-300">Recipient Address</Label>
            <Input
              id="toAddress"
              {...register('toAddress')}
              className="bg-gray-800 border-gray-600 text-white font-mono text-sm"
              placeholder="Enter recipient's public key..."
              data-testid="to-address-input"
            />
            {errors.toAddress && (
              <p className="text-red-400 text-sm mt-1">{errors.toAddress.message}</p>
            )}
          </div>
          
          <div>
            <Label htmlFor="amount" className="text-gray-300">Amount (SOL)</Label>
            <Input
              id="amount"
              type="number"
              step="0.000000001"
              min="0.000000001"
              {...register('amount', { valueAsNumber: true })}
              className="bg-gray-800 border-gray-600 text-white font-mono"
              placeholder="0.001"
              data-testid="transfer-amount-input"
            />
            {errors.amount && (
              <p className="text-red-400 text-sm mt-1">{errors.amount.message}</p>
            )}
            <p className="text-xs text-gray-400 mt-1">
              Network: {isDevnet ? 'Devnet' : 'Mainnet'} • Transaction fees will be deducted
            </p>
          </div>
          
          <div>
            <Label htmlFor="tokenMint" className="text-gray-300">Token Mint (Optional)</Label>
            <Input
              id="tokenMint"
              {...register('tokenMint')}
              className="bg-gray-800 border-gray-600 text-white font-mono text-sm"
              placeholder="Leave empty for SOL transfers"
              data-testid="token-mint-input"
            />
            <p className="text-xs text-gray-400 mt-1">
              For token transfers, enter the mint address
            </p>
          </div>
          
          <Button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-yellow-400 text-black hover:bg-yellow-500 font-medium"
            data-testid="submit-transfer"
          >
            {isLoading ? 'Processing Transfer...' : 'Transfer SOL'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}