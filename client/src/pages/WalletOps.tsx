import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Wallet,
  Plus,
  Copy,
  Download,
  Upload,
  Trash2,
  Send,
  Users,
  Shield,
  AlertTriangle,
  ExternalLink,
  Loader2,
  CheckCircle,
  Eye,
  EyeOff,
  RefreshCw,
  Zap,
  DollarSign,
  Settings,
  Filter,
  Search,
  QrCode,
  Shuffle,
  TrendingUp,
  ArrowRightLeft,
} from "lucide-react";
import { toast } from "react-hot-toast";
import CryptoJS from 'crypto-js';
import { FixedSizeList as List } from 'react-window';
import {
  WalletData,
  WalletTransfer,
  WalletMultisend,
  CreateWallets,
  ImportWallet,
  walletTransferSchema,
  walletMultisendSchema,
  createWalletsSchema,
  importWalletSchema,
} from "@shared/schema";
import { z } from "zod";

// Enhanced schemas for professional wallet operations
const enhancedCreateWalletsSchema = createWalletsSchema.extend({
  count: z.number().min(1).max(100, "Maximum 100 wallets allowed"),
  labelPrefix: z.string().min(1, "Label prefix required"),
  isBurner: z.boolean().default(true),
});

const enhancedImportWalletSchema = importWalletSchema.extend({
  privateKey: z.string().min(44, "Invalid private key format"),
  label: z.string().min(1, "Label required"),
  isBurner: z.boolean().default(false),
});

const quickBuySchema = z.object({
  fromWallet: z.string().min(1, "Select wallet"),
  tokenMint: z.string().min(32, "Invalid token address"),
  amountType: z.enum(["fixed", "range"]),
  fixedAmount: z.number().min(0),
  minAmount: z.number().min(0),
  maxAmount: z.number().min(0),
  slippage: z.number().min(0.1).max(50).default(1),
});

const consolidateSchema = z.object({
  targetWallet: z.string().min(1, "Select target wallet"),
  minBalance: z.number().min(0).default(0.001),
  keepAmount: z.number().min(0).default(0.001),
});

type EnhancedCreateWallets = z.infer<typeof enhancedCreateWalletsSchema>;
type EnhancedImportWallet = z.infer<typeof enhancedImportWalletSchema>;
type QuickBuyData = z.infer<typeof quickBuySchema>;
type ConsolidateData = z.infer<typeof consolidateSchema>;

interface EnhancedWallet extends WalletData {
  balance: number;
  tokenBalances: Record<string, number>;
  isLoading?: boolean;
  lastUpdate?: Date;
  flashColor?: 'green' | 'red' | null;
}

// Advanced wallet operations component
export function WalletOps() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // State management
  const [selectedWallets, setSelectedWallets] = useState<string[]>([]);
  const [showPrivateKeys, setShowPrivateKeys] = useState<Record<string, boolean>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<'label' | 'balance' | 'created'>('balance');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterBurner, setFilterBurner] = useState<'all' | 'burner' | 'regular'>('all');
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [isQuickBuyOpen, setIsQuickBuyOpen] = useState(false);
  const [isConsolidateOpen, setIsConsolidateOpen] = useState(false);
  const [networkMode, setNetworkMode] = useState<'devnet' | 'mainnet'>('devnet');

  // Security and encryption
  const [encryptionKey] = useState(() => CryptoJS.lib.WordArray.random(256/8).toString());
  
  // Privacy warning on mount
  useEffect(() => {
    toast("🔒 Use burner wallets for privacy. VPN recommended for enhanced anonymity.", {
      duration: 8000,
      style: { 
        background: '#1f2937', 
        color: '#fbbf24',
        border: '1px solid #d97706'
      },
    });
  }, []);

  // Real-time wallet data fetching
  const { data: wallets = [], isLoading: walletsLoading, refetch: refetchWallets } = useQuery({
    queryKey: ['/api/wallets', networkMode],
    queryFn: async () => {
      const response = await fetch(`/api/wallets?network=${networkMode}`);
      if (!response.ok) throw new Error('Failed to fetch wallets');
      const data = await response.json();
      
      // Simulate real-time balance updates (in production, use Helius WebSocket)
      return data.map((wallet: any) => ({
        ...wallet,
        balance: Math.random() * 10, // This would come from Helius API
        tokenBalances: {}, // Token balances from Helius
        lastUpdate: new Date(),
      }));
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Forms setup
  const createForm = useForm<EnhancedCreateWallets>({
    resolver: zodResolver(enhancedCreateWalletsSchema),
    defaultValues: {
      count: 1,
      labelPrefix: "Wallet",
      isBurner: true,
    },
  });

  const importForm = useForm<EnhancedImportWallet>({
    resolver: zodResolver(enhancedImportWalletSchema),
    defaultValues: {
      privateKey: "",
      label: "",
      isBurner: false,
    },
  });

  const transferForm = useForm<WalletTransfer>({
    resolver: zodResolver(walletTransferSchema),
    defaultValues: {
      fromWallet: "",
      recipientAddress: "",
      amount: 0,
      priorityFee: 0.0001,
    },
  });

  const multisendForm = useForm<WalletMultisend>({
    resolver: zodResolver(walletMultisendSchema),
    defaultValues: {
      fromWallet: "",
      recipients: [{ address: "", amount: 0 }],
      priorityFee: 0.0001,
    },
  });

  const quickBuyForm = useForm<QuickBuyData>({
    resolver: zodResolver(quickBuySchema),
    defaultValues: {
      fromWallet: "",
      tokenMint: "",
      amountType: "fixed",
      fixedAmount: 0.1,
      minAmount: 0.05,
      maxAmount: 0.2,
      slippage: 1,
    },
  });

  const consolidateForm = useForm<ConsolidateData>({
    resolver: zodResolver(consolidateSchema),
    defaultValues: {
      targetWallet: "",
      minBalance: 0.001,
      keepAmount: 0.001,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: multisendForm.control,
    name: "recipients",
  });

  // Mutations for wallet operations
  const createWalletsMutation = useMutation({
    mutationFn: async (data: EnhancedCreateWallets) => {
      const response = await fetch('/api/wallets/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          network: networkMode,
        }),
      });
      if (!response.ok) throw new Error('Failed to create wallets');
      return response.json();
    },
    onSuccess: (data) => {
      toast.success(`Successfully created ${data.wallets?.length || data.count} wallet(s)!`);
      
      if (data.privateKeys) {
        // Secure private key handling - show once and download
        const privateKeysText = data.privateKeys
          .map((pk: string, i: number) => `${data.labels[i]}: ${pk}`)
          .join('\n');
        
        // Create encrypted backup
        const encrypted = CryptoJS.AES.encrypt(privateKeysText, encryptionKey).toString();
        const blob = new Blob([`ENCRYPTED_BACKUP\n${encrypted}\n\nKEY: ${encryptionKey}`], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `caesar-wallets-${Date.now()}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        toast("🔑 Private keys downloaded. SAVE SECURELY - they won't be shown again!", {
          duration: 15000,
          style: { background: '#dc2626', color: '#ffffff' },
        });
      }

      queryClient.invalidateQueries({ queryKey: ['/api/wallets'] });
      createForm.reset();
    },
    onError: (error: any) => {
      toast.error(`Failed to create wallets: ${error.message}`);
    },
  });

  const importWalletMutation = useMutation({
    mutationFn: async (data: EnhancedImportWallet) => {
      const response = await fetch('/api/wallets/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          network: networkMode,
        }),
      });
      if (!response.ok) throw new Error('Failed to import wallet');
      return response.json();
    },
    onSuccess: () => {
      toast.success("Wallet imported successfully!");
      queryClient.invalidateQueries({ queryKey: ['/api/wallets'] });
      importForm.reset();
      // Clear private key from memory
      setTimeout(() => {
        importForm.setValue('privateKey', '');
      }, 100);
    },
    onError: (error: any) => {
      toast.error(`Failed to import wallet: ${error.message}`);
    },
  });

  const transferMutation = useMutation({
    mutationFn: async (data: WalletTransfer) => {
      const response = await fetch('/api/wallets/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, network: networkMode }),
      });
      if (!response.ok) throw new Error('Transfer failed');
      return response.json();
    },
    onSuccess: (data) => {
      toast.success("Transfer completed successfully!");
      if (data.txHash) {
        const explorerUrl = networkMode === 'mainnet' 
          ? `https://solscan.io/tx/${data.txHash}`
          : `https://solscan.io/tx/${data.txHash}?cluster=devnet`;
        
        toast((t) => (
          <div>
            <span>View on Solscan</span>
            <button 
              onClick={() => window.open(explorerUrl, '_blank')}
              className="ml-2 text-blue-400 underline"
            >
              {data.txHash.slice(0, 8)}...
            </button>
          </div>
        ), { duration: 10000 });
      }
      queryClient.invalidateQueries({ queryKey: ['/api/wallets'] });
      transferForm.reset();
    },
    onError: (error: any) => {
      toast.error(`Transfer failed: ${error.message}`);
    },
  });

  const multisendMutation = useMutation({
    mutationFn: async (data: WalletMultisend) => {
      const response = await fetch('/api/wallets/multisend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, network: networkMode }),
      });
      if (!response.ok) throw new Error('Multisend failed');
      return response.json();
    },
    onSuccess: (data) => {
      toast.success(`Multisend completed! ${data.successful}/${data.total} transactions successful`);
      queryClient.invalidateQueries({ queryKey: ['/api/wallets'] });
      multisendForm.reset();
    },
    onError: (error: any) => {
      toast.error(`Multisend failed: ${error.message}`);
    },
  });

  const quickBuyMutation = useMutation({
    mutationFn: async (data: QuickBuyData) => {
      const response = await fetch('/api/wallets/quick-buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, network: networkMode }),
      });
      if (!response.ok) throw new Error('Quick buy failed');
      return response.json();
    },
    onSuccess: (data) => {
      toast.success(`Quick buy completed! ${data.txHash.slice(0, 8)}...`);
      setIsQuickBuyOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/wallets'] });
    },
    onError: (error: any) => {
      toast.error(`Quick buy failed: ${error.message}`);
    },
  });

  const consolidateMutation = useMutation({
    mutationFn: async (data: ConsolidateData) => {
      const response = await fetch('/api/wallets/consolidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, network: networkMode }),
      });
      if (!response.ok) throw new Error('Consolidation failed');
      return response.json();
    },
    onSuccess: (data) => {
      toast.success(`Consolidated ${data.amount} SOL from ${data.walletCount} wallets`);
      setIsConsolidateOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/wallets'] });
    },
    onError: (error: any) => {
      toast.error(`Consolidation failed: ${error.message}`);
    },
  });

  // Helper functions
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const exportWallets = () => {
    const csvData = [
      ['Public Key', 'Label', 'Is Burner', 'Balance', 'Created At'],
      ...filteredWallets.map((wallet: EnhancedWallet) => [
        wallet.pubkey,
        wallet.label,
        wallet.isBurner ? 'Yes' : 'No',
        wallet.balance?.toString() || '0',
        wallet.createdAt ? new Date(wallet.createdAt).toLocaleDateString() : '',
      ])
    ];

    const csv = csvData.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `caesar-wallets-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success(`Exported ${filteredWallets.length} wallets to CSV`);
  };

  // Wallet filtering and sorting
  const filteredWallets = wallets
    .filter((wallet: EnhancedWallet) => {
      const matchesSearch = wallet.pubkey.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          wallet.label.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterBurner === 'all' || 
                          (filterBurner === 'burner' && wallet.isBurner) ||
                          (filterBurner === 'regular' && !wallet.isBurner);
      return matchesSearch && matchesFilter;
    })
    .sort((a: EnhancedWallet, b: EnhancedWallet) => {
      let aVal: any, bVal: any;
      switch (sortBy) {
        case 'balance':
          aVal = a.balance || 0;
          bVal = b.balance || 0;
          break;
        case 'created':
          aVal = new Date(a.createdAt || 0);
          bVal = new Date(b.createdAt || 0);
          break;
        default:
          aVal = a.label.toLowerCase();
          bVal = b.label.toLowerCase();
      }
      
      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

  // Wallet row component for virtualization
  const WalletRow = ({ index, style }: { index: number; style: any }) => {
    const wallet = filteredWallets[index] as EnhancedWallet;
    
    return (
      <div style={style} className="px-4 py-2 border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 flex-1">
            <Checkbox
              checked={selectedWallets.includes(wallet.pubkey)}
              onCheckedChange={(checked) => {
                if (checked) {
                  setSelectedWallets([...selectedWallets, wallet.pubkey]);
                } else {
                  setSelectedWallets(selectedWallets.filter(id => id !== wallet.pubkey));
                }
              }}
            />
            
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <span className="font-mono text-sm text-caesar-gold">
                  {wallet.pubkey.slice(0, 8)}...{wallet.pubkey.slice(-8)}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(wallet.pubkey)}
                  className="h-6 w-6 p-0"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
              <div className="text-sm text-gray-400">{wallet.label}</div>
            </div>

            <div className="text-right">
              <div className={`font-medium ${wallet.flashColor === 'green' ? 'text-green-400' : wallet.flashColor === 'red' ? 'text-red-400' : ''}`}>
                {wallet.balance?.toFixed(4) || '0.0000'} SOL
              </div>
              {wallet.isBurner && (
                <Badge variant="secondary" className="text-xs">
                  Burner
                </Badge>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Button size="sm" variant="ghost" onClick={() => {}}>
                <Send className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => {}}>
                <Zap className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => {}}>
                <Trash2 className="h-4 w-4 text-red-400" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-8 bg-black text-caesar-gold space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Wallet Operations Console</h1>
          <p className="text-gray-400">
            Professional-grade multi-wallet management for up to 100 Solana wallets
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Label>Network:</Label>
            <Select value={networkMode} onValueChange={(value: 'devnet' | 'mainnet') => setNetworkMode(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="devnet">Devnet</SelectItem>
                <SelectItem value="mainnet">Mainnet</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Button onClick={exportWallets} variant="outline" className="space-x-2">
            <Download className="h-4 w-4" />
            <span>Export CSV</span>
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="wallets" className="space-y-6">
        <TabsList className="bg-caesar-dark border border-gray-800">
          <TabsTrigger value="wallets">Wallets ({wallets.length})</TabsTrigger>
          <TabsTrigger value="create">Create</TabsTrigger>
          <TabsTrigger value="import">Import</TabsTrigger>
          <TabsTrigger value="transfer">Transfer</TabsTrigger>
          <TabsTrigger value="multisend">Multisend</TabsTrigger>
        </TabsList>

        {/* Wallets Tab */}
        <TabsContent value="wallets">
          <Card className="bg-caesar-dark border-gray-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Managed Wallets</CardTitle>
                <div className="flex items-center space-x-4">
                  {/* Search and filters */}
                  <div className="flex items-center space-x-2">
                    <Search className="h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search wallets..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-64"
                    />
                  </div>
                  
                  <Select value={sortBy} onValueChange={(value: 'label' | 'balance' | 'created') => setSortBy(value)}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="balance">Balance</SelectItem>
                      <SelectItem value="label">Label</SelectItem>
                      <SelectItem value="created">Created</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={filterBurner} onValueChange={(value: 'all' | 'burner' | 'regular') => setFilterBurner(value)}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="burner">Burners</SelectItem>
                      <SelectItem value="regular">Regular</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button onClick={() => refetchWallets()} variant="outline" size="sm">
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {walletsLoading ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Bulk actions */}
                  {selectedWallets.length > 0 && (
                    <div className="flex items-center space-x-4 p-4 bg-gray-800 rounded-lg">
                      <span className="text-sm">
                        {selectedWallets.length} wallet{selectedWallets.length !== 1 ? 's' : ''} selected
                      </span>
                      <Button size="sm" variant="outline">Fund Selected</Button>
                      <Button size="sm" variant="outline">Consolidate</Button>
                      <Button size="sm" variant="outline" className="text-red-400">Delete Selected</Button>
                    </div>
                  )}

                  {/* Virtualized wallet list */}
                  {filteredWallets.length > 0 ? (
                    <List
                      height={600}
                      itemCount={filteredWallets.length}
                      itemSize={80}
                      className="border border-gray-800 rounded-lg"
                    >
                      {WalletRow}
                    </List>
                  ) : (
                    <div className="text-center text-gray-500 py-12">
                      <Wallet className="h-12 w-12 mx-auto mb-4" />
                      <p>No wallets found</p>
                      <p className="text-sm">Create or import wallets to get started</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Create Wallets Tab */}
        <TabsContent value="create">
          <Card className="bg-caesar-dark border-gray-800">
            <CardHeader>
              <CardTitle>Create New Wallets</CardTitle>
              <p className="text-gray-400">Generate up to 100 wallets at once</p>
            </CardHeader>
            <CardContent>
              <Form {...createForm}>
                <form onSubmit={createForm.handleSubmit((data) => createWalletsMutation.mutate(data))} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FormField
                      control={createForm.control}
                      name="count"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Number of Wallets</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              max="100"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                            />
                          </FormControl>
                          <FormDescription>1-100 wallets</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={createForm.control}
                      name="labelPrefix"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Label Prefix</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormDescription>e.g., "Trading", "Sniper"</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={createForm.control}
                      name="isBurner"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel>Mark as Burner</FormLabel>
                            <FormDescription>
                              Recommended for privacy
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <Alert>
                    <Shield className="h-4 w-4" />
                    <AlertDescription>
                      Private keys will be shown once and downloaded automatically. Save them securely.
                    </AlertDescription>
                  </Alert>

                  <Button 
                    type="submit" 
                    disabled={createWalletsMutation.isPending}
                    className="w-full bg-caesar-gold text-caesar-black hover:bg-caesar-gold/90"
                  >
                    {createWalletsMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating Wallets...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Wallets
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Import Wallet Tab */}
        <TabsContent value="import">
          <Card className="bg-caesar-dark border-gray-800">
            <CardHeader>
              <CardTitle>Import Existing Wallet</CardTitle>
              <p className="text-gray-400">Import wallet using private key</p>
            </CardHeader>
            <CardContent>
              <Form {...importForm}>
                <form onSubmit={importForm.handleSubmit((data) => importWalletMutation.mutate(data))} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={importForm.control}
                      name="privateKey"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Private Key</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder="Base64 private key..."
                              className="font-mono"
                            />
                          </FormControl>
                          <FormDescription>Base64 encoded private key</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="space-y-6">
                      <FormField
                        control={importForm.control}
                        name="label"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Wallet Label</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormDescription>Descriptive name</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={importForm.control}
                        name="isBurner"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel>Mark as Burner</FormLabel>
                              <FormDescription>
                                For privacy operations
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Private key will be cleared from memory after import. Ensure you have a backup.
                    </AlertDescription>
                  </Alert>

                  <Button 
                    type="submit" 
                    disabled={importWalletMutation.isPending}
                    className="w-full bg-caesar-gold text-caesar-black hover:bg-caesar-gold/90"
                  >
                    {importWalletMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Importing...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Import Wallet
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transfer Tab */}
        <TabsContent value="transfer">
          <Card className="bg-caesar-dark border-gray-800">
            <CardHeader>
              <CardTitle>Single Transfer</CardTitle>
              <p className="text-gray-400">Send SOL or SPL tokens from one wallet</p>
            </CardHeader>
            <CardContent>
              <Form {...transferForm}>
                <form onSubmit={transferForm.handleSubmit((data) => transferMutation.mutate(data))} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={transferForm.control}
                      name="fromWallet"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>From Wallet</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select wallet" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {wallets.map((wallet: EnhancedWallet) => (
                                <SelectItem key={wallet.pubkey} value={wallet.pubkey}>
                                  {wallet.label} ({wallet.balance?.toFixed(4)} SOL)
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={transferForm.control}
                      name="recipientAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Recipient Address</FormLabel>
                          <FormControl>
                            <Input {...field} className="font-mono" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={transferForm.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Amount</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.000001"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={transferForm.control}
                      name="priorityFee"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Priority Fee</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.000001"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value))}
                            />
                          </FormControl>
                          <FormDescription>SOL for priority fee</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Button 
                    type="submit" 
                    disabled={transferMutation.isPending}
                    className="w-full bg-caesar-gold text-caesar-black hover:bg-caesar-gold/90"
                  >
                    {transferMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Transferring...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Send Transfer
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Multisend Tab */}
        <TabsContent value="multisend">
          <Card className="bg-caesar-dark border-gray-800">
            <CardHeader>
              <CardTitle>Multi-recipient Transfer</CardTitle>
              <p className="text-gray-400">Send to multiple addresses at once (max 50 recipients)</p>
            </CardHeader>
            <CardContent>
              <Form {...multisendForm}>
                <form onSubmit={multisendForm.handleSubmit((data) => multisendMutation.mutate(data))} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={multisendForm.control}
                      name="fromWallet"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>From Wallet</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select wallet" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {wallets.map((wallet: EnhancedWallet) => (
                                <SelectItem key={wallet.pubkey} value={wallet.pubkey}>
                                  {wallet.label} ({wallet.balance?.toFixed(4)} SOL)
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={multisendForm.control}
                      name="priorityFee"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Priority Fee</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.000001"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Recipients */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Recipients ({fields.length}/50)</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => append({ address: "", amount: 0 })}
                        disabled={fields.length >= 50}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Recipient
                      </Button>
                    </div>

                    {fields.map((field, index) => (
                      <div key={field.id} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                        <FormField
                          control={multisendForm.control}
                          name={`recipients.${index}.address`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input {...field} placeholder="Recipient address" className="font-mono" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={multisendForm.control}
                          name={`recipients.${index}.amount`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.000001"
                                  placeholder="Amount"
                                  {...field}
                                  onChange={(e) => field.onChange(parseFloat(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => remove(index)}
                          disabled={fields.length <= 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  <Button 
                    type="submit" 
                    disabled={multisendMutation.isPending}
                    className="w-full bg-caesar-gold text-caesar-black hover:bg-caesar-gold/90"
                  >
                    {multisendMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing Multisend...
                      </>
                    ) : (
                      <>
                        <Users className="h-4 w-4 mr-2" />
                        Send to {fields.length} Recipients
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Advanced Operations Sheet */}
      <Sheet open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" className="fixed bottom-8 right-8 rounded-full w-16 h-16">
            <Settings className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-[600px] bg-caesar-dark border-gray-800">
          <SheetHeader>
            <SheetTitle>Advanced Operations</SheetTitle>
            <SheetDescription>
              Professional wallet management tools
            </SheetDescription>
          </SheetHeader>
          
          <div className="mt-8 space-y-4">
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => setIsQuickBuyOpen(true)}
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Quick Buy Token
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => setIsConsolidateOpen(true)}
            >
              <ArrowRightLeft className="h-4 w-4 mr-2" />
              Consolidate Wallets
            </Button>
            
            <Button variant="outline" className="w-full justify-start">
              <QrCode className="h-4 w-4 mr-2" />
              Generate QR Codes
            </Button>
            
            <Button variant="outline" className="w-full justify-start">
              <Shuffle className="h-4 w-4 mr-2" />
              Mixer Operations
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Quick Buy Modal */}
      <Dialog open={isQuickBuyOpen} onOpenChange={setIsQuickBuyOpen}>
        <DialogContent className="bg-caesar-dark border-gray-800">
          <DialogHeader>
            <DialogTitle>Quick Buy Token</DialogTitle>
            <DialogDescription>
              Execute Jupiter swap with selected wallet
            </DialogDescription>
          </DialogHeader>
          
          <Form {...quickBuyForm}>
            <form onSubmit={quickBuyForm.handleSubmit((data) => quickBuyMutation.mutate(data))} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={quickBuyForm.control}
                  name="fromWallet"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>From Wallet</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select wallet" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {wallets.map((wallet: EnhancedWallet) => (
                            <SelectItem key={wallet.pubkey} value={wallet.pubkey}>
                              {wallet.label} ({wallet.balance?.toFixed(4)} SOL)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={quickBuyForm.control}
                  name="tokenMint"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Token Address</FormLabel>
                      <FormControl>
                        <Input {...field} className="font-mono" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={quickBuyForm.control}
                  name="amountType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="fixed">Fixed Amount</SelectItem>
                          <SelectItem value="range">Random Range</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={quickBuyForm.control}
                  name="slippage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Slippage (%)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Button 
                type="submit" 
                disabled={quickBuyMutation.isPending}
                className="w-full bg-caesar-gold text-caesar-black hover:bg-caesar-gold/90"
              >
                {quickBuyMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Executing Buy...
                  </>
                ) : (
                  <>
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Execute Buy
                  </>
                )}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Consolidate Modal */}
      <Dialog open={isConsolidateOpen} onOpenChange={setIsConsolidateOpen}>
        <DialogContent className="bg-caesar-dark border-gray-800">
          <DialogHeader>
            <DialogTitle>Consolidate SOL</DialogTitle>
            <DialogDescription>
              Combine SOL from multiple wallets into one target wallet
            </DialogDescription>
          </DialogHeader>
          
          <Form {...consolidateForm}>
            <form onSubmit={consolidateForm.handleSubmit((data) => consolidateMutation.mutate(data))} className="space-y-6">
              <FormField
                control={consolidateForm.control}
                name="targetWallet"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target Wallet</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select target wallet" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {wallets.map((wallet: EnhancedWallet) => (
                          <SelectItem key={wallet.pubkey} value={wallet.pubkey}>
                            {wallet.label} ({wallet.balance?.toFixed(4)} SOL)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={consolidateForm.control}
                  name="minBalance"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Minimum Balance</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.001"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>Only consolidate wallets with more than this amount</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={consolidateForm.control}
                  name="keepAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Keep Amount</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.001"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>SOL to leave in each wallet for rent</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Button 
                type="submit" 
                disabled={consolidateMutation.isPending}
                className="w-full bg-caesar-gold text-caesar-black hover:bg-caesar-gold/90"
              >
                {consolidateMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Consolidating...
                  </>
                ) : (
                  <>
                    <ArrowRightLeft className="h-4 w-4 mr-2" />
                    Start Consolidation
                  </>
                )}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}