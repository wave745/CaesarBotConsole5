import { useState, useRef, useEffect } from "react";
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
} from "lucide-react";
import { toast } from "react-hot-toast";
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

// Connected wallet will come from wallet adapter when implemented
const CONNECTED_WALLET = "";

interface ManagedWallet extends WalletData {
  balanceNumber?: number;
  isLoading?: boolean;
}

interface RecipientRow {
  address: string;
  amount: number;
}

export function WalletOps() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedWallets, setSelectedWallets] = useState<string[]>([]);
  const [showPrivateKeys, setShowPrivateKeys] = useState<Record<string, string>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<'label' | 'balance' | 'created'>('label');
  const [filterBurner, setFilterBurner] = useState<'all' | 'burner' | 'regular'>('all');

  // Privacy warning effect
  useEffect(() => {
    toast("🔒 Privacy tip: Use a VPN (ProtonVPN, etc.) for enhanced anonymity during trading operations", {
      duration: 8000,
      style: { background: '#1f2937', color: '#fbbf24' },
    });
  }, []);

  // Fetch managed wallets
  const { data: wallets = [], isLoading: walletsLoading, refetch: refetchWallets } = useQuery({
    queryKey: ['/api/wallets'],
    queryFn: async () => {
      const response = await fetch(`/api/wallets?userWallet=${encodeURIComponent(CONNECTED_WALLET || '')}`);
      if (!response.ok) throw new Error('Failed to fetch wallets');
      return response.json();
    },
  });

  // Create wallets form
  const createForm = useForm<CreateWallets>({
    resolver: zodResolver(createWalletsSchema),
    defaultValues: {
      count: 1,
      labelPrefix: "Wallet",
      isBurner: true,
    },
  });

  // Import wallet form
  const importForm = useForm<ImportWallet>({
    resolver: zodResolver(importWalletSchema),
    defaultValues: {
      privateKey: "",
      label: "",
      isBurner: false,
    },
  });

  // Transfer form
  const transferForm = useForm<WalletTransfer>({
    resolver: zodResolver(walletTransferSchema),
    defaultValues: {
      fromWallet: "",
      recipientAddress: "",
      amount: 0,
      priorityFee: 0.0001,
    },
  });

  // Multisend form
  const multisendForm = useForm<WalletMultisend>({
    resolver: zodResolver(walletMultisendSchema),
    defaultValues: {
      fromWallet: "",
      recipients: [{ address: "", amount: 0 }],
      priorityFee: 0.0001,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: multisendForm.control,
    name: "recipients",
  });

  // Create wallets mutation
  const createWalletsMutation = useMutation({
    mutationFn: async (data: CreateWallets) => {
      const response = await fetch('/api/wallets/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          userWallet: CONNECTED_WALLET,
        }),
      });
      if (!response.ok) throw new Error('Failed to create wallets');
      return response.json();
    },
    onSuccess: (data) => {
      toast.success(`Successfully created ${data.wallets.length} wallet(s)!`);
      
      // Show private keys once with download option
      const privateKeysText = data.wallets
        .map((w: any) => `${w.label}: ${w.privateKey}`)
        .join('\n');
      
      // Create downloadable file
      const blob = new Blob([privateKeysText], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `caesar-wallets-${Date.now()}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast("🔑 Private keys downloaded. SAVE SECURELY - they won't be shown again!", {
        duration: 10000,
        style: { background: '#dc2626', color: '#ffffff' },
      });

      queryClient.invalidateQueries({ queryKey: ['/api/wallets'] });
      createForm.reset();
    },
    onError: (error: any) => {
      toast.error(`Failed to create wallets: ${error.message}`);
    },
  });

  // Import wallet mutation
  const importWalletMutation = useMutation({
    mutationFn: async (data: ImportWallet) => {
      const response = await fetch('/api/wallets/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          userWallet: CONNECTED_WALLET,
        }),
      });
      if (!response.ok) throw new Error('Failed to import wallet');
      return response.json();
    },
    onSuccess: () => {
      toast.success("Wallet imported successfully!");
      queryClient.invalidateQueries({ queryKey: ['/api/wallets'] });
      importForm.reset();
    },
    onError: (error: any) => {
      toast.error(`Failed to import wallet: ${error.message}`);
    },
  });

  // Transfer mutation
  const transferMutation = useMutation({
    mutationFn: async (data: WalletTransfer) => {
      const response = await fetch('/api/wallets/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Transfer failed');
      return response.json();
    },
    onSuccess: (data) => {
      toast.success("Transfer completed successfully!");
      if (data.txHash) {
        toast(`View transaction: ${data.txHash.slice(0, 8)}...`, {
          duration: 8000,
          style: { cursor: 'pointer' },
        });
      }
      queryClient.invalidateQueries({ queryKey: ['/api/wallets'] });
      transferForm.reset();
    },
    onError: (error: any) => {
      toast.error(`Transfer failed: ${error.message}`);
    },
  });

  // Multisend mutation
  const multisendMutation = useMutation({
    mutationFn: async (data: WalletMultisend) => {
      const response = await fetch('/api/wallets/multisend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Multisend failed');
      return response.json();
    },
    onSuccess: (data) => {
      toast.success(`Multisend completed! Sent to ${data.recipients.length} addresses`);
      if (data.txHash) {
        toast(`View transaction: ${data.txHash.slice(0, 8)}...`, {
          duration: 8000,
        });
      }
      queryClient.invalidateQueries({ queryKey: ['/api/wallets'] });
      multisendForm.reset({ recipients: [{ address: "", amount: 0 }] });
    },
    onError: (error: any) => {
      toast.error(`Multisend failed: ${error.message}`);
    },
  });

  // Delete wallet mutation
  const deleteWalletMutation = useMutation({
    mutationFn: async (walletId: string) => {
      const response = await fetch(`/api/wallets/${walletId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete wallet');
      return response.json();
    },
    onSuccess: () => {
      toast.success("Wallet deleted successfully");
      queryClient.invalidateQueries({ queryKey: ['/api/wallets'] });
    },
    onError: (error: any) => {
      toast.error(`Failed to delete wallet: ${error.message}`);
    },
  });

  // Request airdrop mutation
  const airdropMutation = useMutation({
    mutationFn: async (walletAddress: string) => {
      const response = await fetch('/api/wallets/airdrop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: walletAddress }),
      });
      if (!response.ok) throw new Error('Airdrop failed');
      return response.json();
    },
    onSuccess: (data) => {
      toast.success(`Airdrop successful! Received 1 SOL`);
      queryClient.invalidateQueries({ queryKey: ['/api/wallets'] });
    },
    onError: (error: any) => {
      toast.error(`Airdrop failed: ${error.message}`);
    },
  });

  // Fund wallet mutation (from main wallet)
  const fundWalletMutation = useMutation({
    mutationFn: async (walletAddress: string) => {
      const response = await fetch('/api/wallets/fund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromWallet: CONNECTED_WALLET,
          toWallet: walletAddress,
          amount: 0.1, // Fund with 0.1 SOL
        }),
      });
      if (!response.ok) throw new Error('Funding failed');
      return response.json();
    },
    onSuccess: () => {
      toast.success("Wallet funded with 0.1 SOL!");
      queryClient.invalidateQueries({ queryKey: ['/api/wallets'] });
    },
    onError: (error: any) => {
      toast.error(`Funding failed: ${error.message}`);
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
      ...wallets.map((wallet: ManagedWallet) => [
        wallet.pubkey,
        wallet.label,
        wallet.isBurner ? 'Yes' : 'No',
        wallet.balanceNumber?.toString() || '0',
        wallet.createdAt ? new Date(wallet.createdAt).toLocaleDateString() : '',
      ])
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `caesar-wallets-export-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success("Wallets exported (public keys only - private keys not stored)");
  };

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  const refreshBalances = async () => {
    try {
      const response = await fetch('/api/wallets/refresh-balances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          addresses: wallets.map((w: ManagedWallet) => w.pubkey)
        }),
      });
      
      if (response.ok) {
        toast.success("Balances refreshed!");
        queryClient.invalidateQueries({ queryKey: ['/api/wallets'] });
      }
    } catch (error) {
      toast.error("Failed to refresh balances");
    }
  };

  // Filter and sort wallets
  const filteredWallets = wallets
    .filter((wallet: ManagedWallet) => {
      const matchesSearch = wallet.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          wallet.pubkey.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterBurner === 'all' ||
                          (filterBurner === 'burner' && wallet.isBurner) ||
                          (filterBurner === 'regular' && !wallet.isBurner);
      return matchesSearch && matchesFilter;
    })
    .sort((a: ManagedWallet, b: ManagedWallet) => {
      switch (sortBy) {
        case 'balance':
          return (b.balanceNumber || 0) - (a.balanceNumber || 0);
        case 'created':
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        default:
          return a.label.localeCompare(b.label);
      }
    });

  return (
    <div className="max-w-7xl mx-auto space-y-8 p-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Wallet Operations Console</h1>
        <p className="text-gray-400">
          Manage up to 100 Solana wallets for trading, sniping, and token deployment. Generate burners for privacy.
        </p>
      </div>



      <Tabs defaultValue="manage" className="space-y-6">
        <TabsList className="bg-caesar-dark border border-gray-800">
          <TabsTrigger value="manage" className="data-[state=active]:bg-caesar-gold data-[state=active]:text-caesar-black">
            <Wallet className="w-4 h-4 mr-2" />
            Manage ({wallets.length}/100)
          </TabsTrigger>
          <TabsTrigger value="create" className="data-[state=active]:bg-caesar-gold data-[state=active]:text-caesar-black">
            <Plus className="w-4 h-4 mr-2" />
            Create/Import
          </TabsTrigger>
          <TabsTrigger value="transfer" className="data-[state=active]:bg-caesar-gold data-[state=active]:text-caesar-black">
            <Send className="w-4 h-4 mr-2" />
            Transfer
          </TabsTrigger>
          <TabsTrigger value="multisend" className="data-[state=active]:bg-caesar-gold data-[state=active]:text-caesar-black">
            <Users className="w-4 h-4 mr-2" />
            Multisend
          </TabsTrigger>
        </TabsList>

        {/* Manage Wallets Tab */}
        <TabsContent value="manage" className="space-y-6">
          {/* Controls */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Input
                placeholder="Search wallets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-gray-800 border-gray-700"
              />
            </div>
            <div>
              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger className="bg-gray-800 border-gray-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="label">Sort by Label</SelectItem>
                  <SelectItem value="balance">Sort by Balance</SelectItem>
                  <SelectItem value="created">Sort by Date</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select value={filterBurner} onValueChange={(value: any) => setFilterBurner(value)}>
                <SelectTrigger className="bg-gray-800 border-gray-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Wallets</SelectItem>
                  <SelectItem value="burner">Burners Only</SelectItem>
                  <SelectItem value="regular">Regular Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex space-x-2">
              <Button onClick={refreshBalances} variant="outline" size="sm" className="flex-1">
                <RefreshCw className="w-4 h-4" />
              </Button>
              <Button onClick={exportWallets} variant="outline" size="sm" className="flex-1">
                <Download className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Wallets Table */}
          <Card className="bg-caesar-dark border-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Your Managed Wallets</span>
                <Badge variant="outline">
                  {filteredWallets.length} of {wallets.length} shown
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {walletsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span className="ml-2">Loading wallets...</span>
                </div>
              ) : filteredWallets.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Wallet className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No wallets found. Create some wallets to get started.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Label</TableHead>
                        <TableHead>Public Key</TableHead>
                        <TableHead>Balance</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredWallets.map((wallet: ManagedWallet) => (
                        <TableRow key={wallet.id}>
                          <TableCell className="font-medium">{wallet.label}</TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <code className="text-sm bg-gray-800 px-2 py-1 rounded">
                                {truncateAddress(wallet.pubkey)}
                              </code>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => copyToClipboard(wallet.pubkey)}
                              >
                                <Copy className="w-3 h-3" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <span>{wallet.balanceNumber?.toFixed(4) || '0.0000'} SOL</span>
                              {wallet.isLoading && <Loader2 className="w-3 h-3 animate-spin" />}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={wallet.isBurner ? "outline" : "secondary"}>
                              {wallet.isBurner ? "Burner" : "Regular"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-gray-400">
                            {wallet.createdAt ? new Date(wallet.createdAt).toLocaleDateString() : 'N/A'}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => airdropMutation.mutate(wallet.pubkey)}
                                disabled={airdropMutation.isPending}
                                title="Request 1 SOL (devnet only)"
                              >
                                <Zap className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => fundWalletMutation.mutate(wallet.pubkey)}
                                disabled={fundWalletMutation.isPending}
                                title="Fund with 0.1 SOL from main wallet"
                              >
                                <DollarSign className="w-3 h-3" />
                              </Button>
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button size="sm" variant="outline" className="text-red-400">
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Delete Wallet</DialogTitle>
                                    <DialogDescription>
                                      Are you sure you want to delete "{wallet.label}"? This action cannot be undone.
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="flex justify-end space-x-2">
                                    <Button variant="outline">Cancel</Button>
                                    <Button
                                      variant="destructive"
                                      onClick={() => deleteWalletMutation.mutate(wallet.id)}
                                      disabled={deleteWalletMutation.isPending}
                                    >
                                      Delete
                                    </Button>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Create/Import Tab */}
        <TabsContent value="create" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Create Wallets */}
            <Card className="bg-caesar-dark border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Plus className="w-5 h-5 text-caesar-gold" />
                  <span>Create New Wallets</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...createForm}>
                  <form onSubmit={createForm.handleSubmit((data) => createWalletsMutation.mutate(data))} className="space-y-4">
                    <FormField
                      control={createForm.control}
                      name="count"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Number of Wallets (1-100)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              max="100"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                              className="bg-gray-800 border-gray-700"
                            />
                          </FormControl>
                          <FormDescription>
                            Create multiple wallets for bundling and privacy
                          </FormDescription>
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
                            <Input
                              placeholder="e.g., Burner, Deploy, Trading"
                              {...field}
                              className="bg-gray-800 border-gray-700"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={createForm.control}
                      name="isBurner"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border border-gray-700 p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Mark as Burner Wallets</FormLabel>
                            <FormDescription>
                              Recommended for privacy in trading/sniping
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

                    <Button
                      type="submit"
                      disabled={createWalletsMutation.isPending || wallets.length >= 100}
                      className="w-full bg-caesar-gold text-caesar-black hover:bg-caesar-gold-muted"
                    >
                      {createWalletsMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Creating Wallets...
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-2" />
                          Create Wallets
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            {/* Import Wallet */}
            <Card className="bg-caesar-dark border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Upload className="w-5 h-5 text-caesar-gold" />
                  <span>Import Existing Wallet</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...importForm}>
                  <form onSubmit={importForm.handleSubmit((data) => importWalletMutation.mutate(data))} className="space-y-4">
                    <FormField
                      control={importForm.control}
                      name="privateKey"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Private Key (Base58)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Paste your private key from Phantom or other wallet..."
                              className="bg-gray-800 border-gray-700 min-h-[100px] font-mono text-xs"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Private key will be validated and discarded after import
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={importForm.control}
                      name="label"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Wallet Label</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., Main Trading, Phantom Import"
                              {...field}
                              className="bg-gray-800 border-gray-700"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={importForm.control}
                      name="isBurner"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border border-gray-700 p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Is Burner Wallet?</FormLabel>
                            <FormDescription>
                              Check if used for privacy/anonymous operations
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

                    <Button
                      type="submit"
                      disabled={importWalletMutation.isPending}
                      className="w-full bg-caesar-gold text-caesar-black hover:bg-caesar-gold-muted"
                    >
                      {importWalletMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Importing Wallet...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          Import Wallet
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>

          {/* Security Notice */}
          <Alert className="bg-red-500/10 border-red-500/20">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <AlertDescription>
              <strong>Security:</strong> Private keys are shown only once during creation and downloaded automatically. 
              Import keys are validated and discarded immediately. Never share or store private keys in plain text.
            </AlertDescription>
          </Alert>
        </TabsContent>

        {/* Transfer Tab */}
        <TabsContent value="transfer" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-caesar-dark border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Send className="w-5 h-5 text-caesar-gold" />
                  <span>Single Transfer</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...transferForm}>
                  <form onSubmit={transferForm.handleSubmit((data) => transferMutation.mutate(data))} className="space-y-4">
                    <FormField
                      control={transferForm.control}
                      name="fromWallet"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>From Wallet</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-gray-800 border-gray-700">
                                <SelectValue placeholder="Select sender wallet" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {wallets.map((wallet: ManagedWallet) => (
                                <SelectItem key={wallet.id} value={wallet.pubkey}>
                                  {wallet.label} ({truncateAddress(wallet.pubkey)}) - {wallet.balanceNumber?.toFixed(4) || '0'} SOL
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
                            <Input
                              placeholder="Public key of recipient"
                              {...field}
                              className="bg-gray-800 border-gray-700 font-mono text-sm"
                            />
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
                          <FormLabel>Amount (SOL)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.000000001"
                              min="0.000000001"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              className="bg-gray-800 border-gray-700"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={transferForm.control}
                      name="tokenMint"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Token Mint (Optional)</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Leave empty for SOL transfer"
                              {...field}
                              className="bg-gray-800 border-gray-700 font-mono text-sm"
                            />
                          </FormControl>
                          <FormDescription>
                            SPL token mint address (e.g., USDC, USDT)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={transferForm.control}
                      name="priorityFee"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Priority Fee (SOL)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.0001"
                              min="0"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              className="bg-gray-800 border-gray-700"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      disabled={transferMutation.isPending}
                      className="w-full bg-caesar-gold text-caesar-black hover:bg-caesar-gold-muted"
                    >
                      {transferMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing Transfer...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Send Transfer
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            {/* Transaction History Preview */}
            <Card className="bg-caesar-dark border-gray-800">
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-sm text-gray-400 text-center py-4">
                    Transaction history will appear here after transfers
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Multisend Tab */}
        <TabsContent value="multisend" className="space-y-6">
          <Card className="bg-caesar-dark border-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-caesar-gold" />
                <span>Bulk Multisend (Max 50 Recipients)</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...multisendForm}>
                <form onSubmit={multisendForm.handleSubmit((data) => multisendMutation.mutate(data))} className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <FormField
                      control={multisendForm.control}
                      name="fromWallet"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>From Wallet</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-gray-800 border-gray-700">
                                <SelectValue placeholder="Select sender wallet" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {wallets.map((wallet: ManagedWallet) => (
                                <SelectItem key={wallet.id} value={wallet.pubkey}>
                                  {wallet.label} - {wallet.balanceNumber?.toFixed(4) || '0'} SOL
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
                          <FormLabel>Priority Fee (SOL)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.0001"
                              min="0"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              className="bg-gray-800 border-gray-700"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={multisendForm.control}
                    name="tokenMint"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Token Mint (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Leave empty for SOL multisend"
                            {...field}
                            className="bg-gray-800 border-gray-700 font-mono text-sm"
                          />
                        </FormControl>
                        <FormDescription>
                          SPL token mint address for token multisend
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

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
                        <Plus className="w-4 h-4 mr-1" />
                        Add Recipient
                      </Button>
                    </div>

                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {fields.map((field, index) => (
                        <div key={field.id} className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 border border-gray-700 rounded-lg">
                          <div className="md:col-span-2">
                            <Input
                              placeholder="Recipient address"
                              {...multisendForm.register(`recipients.${index}.address`)}
                              className="bg-gray-800 border-gray-700 font-mono text-sm"
                            />
                          </div>
                          <div className="flex space-x-2">
                            <Input
                              type="number"
                              step="0.000000001"
                              min="0.000000001"
                              placeholder="Amount"
                              {...multisendForm.register(`recipients.${index}.amount`, {
                                valueAsNumber: true,
                              })}
                              className="bg-gray-800 border-gray-700"
                            />
                            {fields.length > 1 && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => remove(index)}
                                className="px-2"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={multisendMutation.isPending || fields.length === 0}
                    className="w-full bg-caesar-gold text-caesar-black hover:bg-caesar-gold-muted"
                  >
                    {multisendMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing Multisend...
                      </>
                    ) : (
                      <>
                        <Users className="w-4 h-4 mr-2" />
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
    </div>
  );
}