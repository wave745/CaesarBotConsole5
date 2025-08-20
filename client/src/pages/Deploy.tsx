import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Rocket, Upload, Twitter, Globe, CheckCircle, Plus, Trash2, Loader2, AlertTriangle, ExternalLink, Shield, Copy, Wallet, RefreshCw } from "lucide-react";
import { toast } from "react-hot-toast";
import { tokenDeploymentSchema, type TokenDeploymentForm } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useWallet } from "@/providers/WalletProvider";
import { useAppStore } from "@/store/useAppStore";

interface WalletData {
  pubkey: string;
  label: string;
  is_burner: boolean;
  sol_balance: number;
  token_balances: any[];
  user_wallet: string;
  created_at: string;
  updated_at: string;
}

interface MultiWallet {
  id: string;
  walletAddress: string;
  label: string;
  buyAmount: number;
  selected: boolean;
}

interface DeploymentResult {
  success: boolean;
  mint: string;
  signature: string;
  explorerUrl: string;
  safetyCheck?: {
    score: number;
    risks: string[];
  };
}

export function Deploy() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [imageUri, setImageUri] = useState<string>("");
  const [multiWallets, setMultiWallets] = useState<MultiWallet[]>([]);
  const [deploymentResult, setDeploymentResult] = useState<DeploymentResult | null>(null);
  const [selectedDevWallet, setSelectedDevWallet] = useState<string>("");
  const [isDevnet, setIsDevnet] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { user } = useAppStore();

  // Load user wallets from wallet operations
  const { data: userWallets = [], isLoading: walletsLoading, refetch: refetchWallets } = useQuery({
    queryKey: ['user-wallets', user?.walletAddress, isDevnet],
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
      return data.wallets || [];
    },
    enabled: !!user?.walletAddress,
    retry: 1,
  });

  const form = useForm<TokenDeploymentForm>({
    resolver: zodResolver(tokenDeploymentSchema),
    defaultValues: {
      name: "",
      symbol: "",
      description: "",
      website: "",
      twitter: "",
      telegram: "",
      tokenType: "meme",
      launchpad: "pump",
      devBuyAmount: 0.1,
      slippage: 5,
      priorityFee: 0.0001,
      autoPost: false,
      useDevnet: false,
    },
  });

  const launchpads = [
    { value: "pump", label: "Pump.fun", fee: "~1 SOL", pool: "pump" },
    { value: "bonk", label: "LetsBonk.fun", fee: "~0.5 SOL", pool: "bonk" },
  ];

  // Image upload mutation
  const uploadImageMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/deploy/upload-image', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Image upload failed');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      if (data.error) {
        toast.error(`Image upload failed: ${data.error}`);
      } else {
        setImageUri(data.ipfs);
        toast.success('Image uploaded successfully!');
      }
    },
    onError: (error) => {
      toast.error(`Image upload failed: ${error.message}`);
    },
  });

  // Token deployment mutation
  const deployTokenMutation = useMutation({
    mutationFn: async (data: TokenDeploymentForm & { imageUri: string }) => {
      const response = await fetch('/api/deploy/create-token', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Deployment failed');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      setDeploymentResult(data);
      toast.success(`Token ${form.getValues('symbol')} deployed successfully!`);
      
      // Auto-post to Twitter if enabled
      if (form.getValues('autoPost')) {
        autoPostToTwitter(data);
      }
      
      // Handle multi-wallet buys
      if (multiWallets.length > 0) {
        handleMultiWalletBuys(data.mint);
      }
      
      queryClient.invalidateQueries({ queryKey: ['/api/deployments'] });
    },
    onError: (error: any) => {
      toast.error(`Deployment failed: ${error.message || 'Unknown error'}`);
    },
  });

  // Generate burner wallet mutation
  const generateWalletMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/deploy/create-wallet', {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Wallet generation failed');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      if (data.error) {
        toast.error(`Wallet generation failed: ${data.error}`);
      } else {
        toast.success('Burner wallet generated!');
      }
    },
  });

  // Helper functions
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Image must be less than 2MB');
        return;
      }
      
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      
      // Upload image immediately
      uploadImageMutation.mutate(file);
    }
  };

  const addMultiWallet = (walletData: WalletData) => {
    const newWallet: MultiWallet = {
      id: walletData.pubkey,
      walletAddress: walletData.pubkey,
      label: walletData.label,
      buyAmount: 0.01,
      selected: true,
    };
    setMultiWallets(prev => [...prev, newWallet]);
  };

  const removeMultiWallet = (id: string) => {
    setMultiWallets(prev => prev.filter(w => w.id !== id));
  };

  const updateMultiWallet = (id: string, field: keyof MultiWallet, value: string | number | boolean) => {
    setMultiWallets(prev => prev.map(w => 
      w.id === id ? { ...w, [field]: value } : w
    ));
  };

  const toggleWalletSelection = (walletAddress: string) => {
    const wallet = userWallets.find(w => w.pubkey === walletAddress);
    if (!wallet) return;

    const existingIndex = multiWallets.findIndex(w => w.walletAddress === walletAddress);
    if (existingIndex >= 0) {
      // Remove wallet
      setMultiWallets(prev => prev.filter(w => w.walletAddress !== walletAddress));
    } else {
      // Add wallet
      addMultiWallet(wallet);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const autoPostToTwitter = async (deploymentData: any) => {
    try {
      const message = `🚀 Just launched ${form.getValues('name')} ($${form.getValues('symbol')}) on ${launchpads.find(l => l.value === form.getValues('launchpad'))?.label}!

CA: ${deploymentData.mint}
${deploymentData.explorerUrl}

#Solana #DeFi #CaesarBot`;

      await fetch('/api/twitter/post', {
        method: 'POST',
        body: JSON.stringify({
          message,
          tokenMint: deploymentData.mint,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      console.error('Auto-post failed:', error);
      toast.error('Auto-post to Twitter failed');
    }
  };

  const handleMultiWalletBuys = async (mintAddress: string) => {
    const selectedLaunchpad = form.getValues('launchpad');
    
    for (const wallet of multiWallets.filter(w => w.selected && w.buyAmount > 0)) {
      try {
        await fetch('/api/deploy/buy-token', {
          method: 'POST',
          body: JSON.stringify({
            tokenMint: mintAddress,
            walletAddress: wallet.walletAddress,
            amount: wallet.buyAmount,
            slippage: form.getValues('slippage'),
            priorityFee: form.getValues('priorityFee'),
            pool: selectedLaunchpad,
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        });
      } catch (error) {
        console.error(`Multi-wallet buy failed for wallet ${wallet.label}:`, error);
      }
    }
  };

  const onSubmit = async (data: TokenDeploymentForm) => {
    if (!imageUri && imageFile) {
      toast.error('Please wait for image upload to complete');
      return;
    }

    const deploymentData = {
      ...data,
      imageUri,
      devWallet: selectedDevWallet,
      multiWallets: multiWallets.filter(w => w.selected),
      network: isDevnet ? 'devnet' : 'mainnet-beta',
    };

    deployTokenMutation.mutate(deploymentData);
  };

  const isFormValid = form.formState.isValid && 
    form.watch('name') && 
    form.watch('symbol') && 
    form.watch('launchpad') &&
    selectedDevWallet;

  return (
    <div className="max-w-6xl mx-auto space-y-8 p-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Deploy Console</h1>
        <p className="text-gray-400">
          Launch your token on Pump.fun and LetsBonk.fun with PumpPortal integration. Lightning mode enabled for secure server-side deployment.
        </p>
      </div>

      {/* Success Result */}
      {deploymentResult && (
        <Alert className="bg-green-500/10 border-green-500/20">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <AlertDescription className="flex flex-col space-y-2">
            <div className="flex items-center justify-between">
              <span>Token deployed successfully!</span>
              <Badge variant="outline" className="bg-green-500/10 text-green-500">
                {deploymentResult.safetyCheck?.score && deploymentResult.safetyCheck.score > 80 ? 'Safe' : 'Verify'}
              </Badge>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm">Contract: {deploymentResult.mint}</span>
              <Button size="sm" variant="ghost" onClick={() => copyToClipboard(deploymentResult.mint)}>
                <Copy className="w-3 h-3" />
              </Button>
              <Button size="sm" variant="ghost" asChild>
                <a href={deploymentResult.explorerUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-3 h-3" />
                </a>
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Token Details */}
              <Card className="bg-caesar-dark border-gray-800">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Rocket className="w-5 h-5 text-caesar-gold" />
                    <span>Token Details</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Name & Symbol */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Token Name *</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="e.g., Caesar Coin" 
                              {...field}
                              className="bg-gray-800 border-gray-700 focus:border-caesar-gold"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="symbol"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Token Symbol *</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="e.g., CAESAR" 
                              {...field}
                              onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                              className="bg-gray-800 border-gray-700 focus:border-caesar-gold"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Description */}
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe your token and its purpose..."
                            className="bg-gray-800 border-gray-700 focus:border-caesar-gold min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Social Links */}
                  <div className="space-y-4">
                    <Label>Social Links</Label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="website"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <div className="relative">
                                <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <Input 
                                  placeholder="Website URL"
                                  className="bg-gray-800 border-gray-700 focus:border-caesar-gold pl-10"
                                  {...field}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="twitter"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <div className="relative">
                                <Twitter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <Input 
                                  placeholder="Twitter handle"
                                  className="bg-gray-800 border-gray-700 focus:border-caesar-gold pl-10"
                                  {...field}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="telegram"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input 
                                placeholder="Telegram"
                                className="bg-gray-800 border-gray-700 focus:border-caesar-gold"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Logo Upload */}
                  <div>
                    <Label>Token Logo</Label>
                    <div 
                      className="mt-2 border-2 border-dashed border-gray-700 rounded-lg p-6 text-center hover:border-caesar-gold/50 transition-colors cursor-pointer"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {imagePreview ? (
                        <div className="space-y-2">
                          <img src={imagePreview} alt="Preview" className="w-16 h-16 mx-auto rounded-lg object-cover" />
                          {uploadImageMutation.isPending && <div className="text-sm text-gray-400">Uploading...</div>}
                          {imageUri && <div className="text-sm text-green-500">✓ Uploaded to IPFS</div>}
                        </div>
                      ) : (
                        <>
                          {uploadImageMutation.isPending ? (
                            <Loader2 className="w-12 h-12 mx-auto text-gray-400 mb-2 animate-spin" />
                          ) : (
                            <Upload className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                          )}
                          <p className="text-sm text-gray-400 mb-2">Drop your logo here or click to upload</p>
                          <p className="text-xs text-gray-500">PNG, JPG or SVG (max 2MB)</p>
                        </>
                      )}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Launch Configuration */}
              <Card className="bg-caesar-dark border-gray-800">
                <CardHeader>
                  <CardTitle>Launch Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Type & Launchpad */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="tokenType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Token Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-gray-800 border-gray-700">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="meme">Meme Token</SelectItem>
                              <SelectItem value="tech">Tech Token</SelectItem>
                              <SelectItem value="utility">Utility Token</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="launchpad"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Launchpad *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-gray-800 border-gray-700">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {launchpads.map((launchpad) => (
                                <SelectItem key={launchpad.value} value={launchpad.value}>
                                  {launchpad.label} ({launchpad.fee})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Trading Parameters */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="devBuyAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Dev Buy (SOL)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              step="0.01"
                              min="0.01"
                              max="10"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value))}
                              className="bg-gray-800 border-gray-700"
                            />
                          </FormControl>
                          <FormDescription>Initial buy amount</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="slippage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Slippage (%)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              step="0.1"
                              min="0.1"
                              max="50"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value))}
                              className="bg-gray-800 border-gray-700"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="priorityFee"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Priority Fee (SOL)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              step="0.0001"
                              min="0"
                              max="0.01"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value))}
                              className="bg-gray-800 border-gray-700"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Options */}
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="useDevnet"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border border-gray-700 p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Use Devnet</FormLabel>
                            <FormDescription>
                              Deploy on Solana devnet for testing
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={(checked) => {
                                field.onChange(checked);
                                setIsDevnet(checked);
                              }}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="autoPost"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border border-gray-700 p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Auto-post to X/Twitter</FormLabel>
                            <FormDescription>
                              Automatically announce your token launch
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

                  {/* Developer Wallet Selection */}
                  <div className="space-y-4">
                    <Label>Developer Wallet (Required for Deployment)</Label>
                    {walletsLoading ? (
                      <div className="p-4 bg-gray-800/50 rounded-lg text-center">
                        <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                        <p className="text-sm text-gray-400">Loading wallets...</p>
                      </div>
                    ) : userWallets.length === 0 ? (
                      <div className="p-4 bg-gray-800/50 rounded-lg text-center">
                        <Wallet className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm text-gray-400 mb-2">No wallets found</p>
                        <p className="text-xs text-gray-500">Create a wallet in Wallet Operations first</p>
                      </div>
                    ) : (
                      <Select value={selectedDevWallet} onValueChange={setSelectedDevWallet}>
                        <SelectTrigger className="bg-gray-800 border-gray-700">
                          <SelectValue placeholder="Select developer wallet for deployment" />
                        </SelectTrigger>
                        <SelectContent>
                          {userWallets.map((wallet) => (
                            <SelectItem key={wallet.pubkey} value={wallet.pubkey}>
                              <div className="flex items-center justify-between w-full">
                                <div className="flex items-center space-x-2">
                                  <span className="font-mono text-sm">
                                    {wallet.label || 'Wallet'}
                                  </span>
                                  {wallet.is_burner && (
                                    <Badge variant="outline" className="text-xs">Burner</Badge>
                                  )}
                                </div>
                                <span className="text-xs text-gray-400 ml-2">
                                  {wallet.sol_balance.toFixed(4)} SOL
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Multi-Wallet Configuration */}
              <Card className="bg-caesar-dark border-gray-800">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Multi-Wallet Configuration (Optional)</span>
                    <div className="flex space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => generateWalletMutation.mutate()}
                        disabled={generateWalletMutation.isPending}
                      >
                        {generateWalletMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Plus className="w-4 h-4" />
                        )}
                        Generate Burner
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={refetchWallets}
                        disabled={walletsLoading}
                      >
                        <RefreshCw className="w-4 h-4" />
                        Refresh Wallets
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert className="bg-yellow-500/10 border-yellow-500/20">
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    <AlertDescription>
                      For privacy, use burner wallets. Never store private keys permanently. Consider using VPN.
                    </AlertDescription>
                  </Alert>

                  {/* User Wallets Selection */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Available Wallets ({userWallets.length})</Label>
                      <div className="text-sm text-gray-400">
                        Network: {isDevnet ? 'Devnet' : 'Mainnet'}
                      </div>
                    </div>
                    
                    {walletsLoading ? (
                      <div className="text-center py-4">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                        <p className="text-sm text-gray-400">Loading wallets...</p>
                      </div>
                    ) : userWallets.length === 0 ? (
                      <div className="text-center py-8 bg-gray-800/50 rounded-lg">
                        <Wallet className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm text-gray-400 mb-2">No wallets found</p>
                        <p className="text-xs text-gray-500">Create wallets in Wallet Operations first</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto">
                        {userWallets.map((wallet) => {
                          const isSelected = multiWallets.some(w => w.walletAddress === wallet.pubkey);
                          return (
                            <div 
                              key={wallet.pubkey} 
                              className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                                isSelected 
                                  ? 'bg-caesar-gold/10 border-caesar-gold/30' 
                                  : 'bg-gray-800 border-gray-700 hover:border-gray-600'
                              }`}
                              onClick={() => toggleWalletSelection(wallet.pubkey)}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="flex items-center space-x-2">
                                    <span className="font-mono text-sm">{wallet.label || 'Wallet'}</span>
                                    {wallet.is_burner && (
                                      <Badge variant="outline" className="text-xs">Burner</Badge>
                                    )}
                                  </div>
                                  <div className="text-xs text-gray-400 font-mono">
                                    {wallet.pubkey.slice(0, 8)}...{wallet.pubkey.slice(-8)}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-sm font-medium">
                                    {wallet.sol_balance.toFixed(4)} SOL
                                  </div>
                                  <div className="text-xs text-gray-400">
                                    {wallet.token_balances?.length || 0} tokens
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Selected Wallets Configuration */}
                  {multiWallets.length > 0 && (
                    <div className="space-y-3">
                      <Label>Selected Wallets ({multiWallets.length})</Label>
                      {multiWallets.map((wallet) => (
                        <div key={wallet.id} className="p-4 border border-caesar-gold/30 bg-caesar-gold/5 rounded-lg space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Label className="font-mono text-sm">{wallet.label}</Label>
                              <span className="text-xs text-gray-400 font-mono">
                                {wallet.walletAddress.slice(0, 8)}...{wallet.walletAddress.slice(-8)}
                              </span>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeMultiWallet(wallet.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="flex items-center space-x-4">
                            <div className="flex-1">
                              <Label className="text-xs text-gray-400">Buy Amount (SOL)</Label>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                max="10"
                                value={wallet.buyAmount}
                                onChange={(e) => updateMultiWallet(wallet.id, 'buyAmount', parseFloat(e.target.value) || 0)}
                                className="bg-gray-800 border-gray-700 focus:border-caesar-gold"
                              />
                            </div>
                            <div className="flex items-center space-x-2 pt-5">
                              <Switch
                                checked={wallet.selected}
                                onCheckedChange={(checked) => updateMultiWallet(wallet.id, 'selected', checked)}
                              />
                              <Label className="text-xs">Enabled</Label>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Deploy Button */}
              <Button
                type="submit"
                disabled={!isFormValid || deployTokenMutation.isPending || uploadImageMutation.isPending}
                className="w-full bg-caesar-gold text-caesar-black hover:bg-caesar-gold-muted font-medium text-lg py-6"
              >
                {deployTokenMutation.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Deploying Token...
                  </>
                ) : (
                  <>
                    <Rocket className="w-5 h-5 mr-2" />
                    Deploy Token
                  </>
                )}
              </Button>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Preview */}
              <Card className="bg-caesar-dark border-gray-800">
                <CardHeader>
                  <CardTitle className="text-lg">Deployment Preview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {form.watch('name') ? (
                    <div>
                      <p className="text-sm text-gray-400">Token Name</p>
                      <p className="font-medium">{form.watch('name')}</p>
                    </div>
                  ) : (
                    <div className="text-gray-500 text-sm">Enter token details to see preview</div>
                  )}
                  
                  {form.watch('symbol') && (
                    <div>
                      <p className="text-sm text-gray-400">Symbol</p>
                      <p className="font-medium font-mono">{form.watch('symbol')}</p>
                    </div>
                  )}

                  {form.watch('launchpad') && (
                    <div>
                      <p className="text-sm text-gray-400">Launchpad</p>
                      <p className="font-medium">
                        {launchpads.find(l => l.value === form.watch('launchpad'))?.label}
                      </p>
                    </div>
                  )}

                  {form.watch('devBuyAmount') && (
                    <div>
                      <p className="text-sm text-gray-400">Dev Buy</p>
                      <p className="font-medium">{form.watch('devBuyAmount')} SOL</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Checklist */}
              <Card className="bg-caesar-dark border-gray-800">
                <CardHeader>
                  <CardTitle className="text-lg">Pre-Deployment Checklist</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className={`w-4 h-4 ${form.watch('name') ? 'text-green-500' : 'text-gray-400'}`} />
                    <span className={`text-sm ${form.watch('name') ? 'text-white' : 'text-gray-400'}`}>
                      Token name provided
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className={`w-4 h-4 ${form.watch('symbol') ? 'text-green-500' : 'text-gray-400'}`} />
                    <span className={`text-sm ${form.watch('symbol') ? 'text-white' : 'text-gray-400'}`}>
                      Token symbol provided
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className={`w-4 h-4 ${form.watch('launchpad') ? 'text-green-500' : 'text-gray-400'}`} />
                    <span className={`text-sm ${form.watch('launchpad') ? 'text-white' : 'text-gray-400'}`}>
                      Launchpad selected
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className={`w-4 h-4 ${imageUri ? 'text-green-500' : 'text-gray-400'}`} />
                    <span className={`text-sm ${imageUri ? 'text-white' : 'text-gray-400'}`}>
                      Logo uploaded (optional)
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className={`w-4 h-4 ${form.watch('description') ? 'text-green-500' : 'text-gray-400'}`} />
                    <span className={`text-sm ${form.watch('description') ? 'text-white' : 'text-gray-400'}`}>
                      Description added (recommended)
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Security Notice */}
              <Card className="bg-yellow-500/10 border-yellow-500/20">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-yellow-500">
                    <Shield className="w-5 h-5" />
                    <span>Security Notice</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p>• Lightning mode: Server-side deployment for security</p>
                  <p>• Use hardware wallet for production launches</p>
                  <p>• Burner wallets recommended for privacy</p>
                  <p>• Post-launch safety check via RugCheck API</p>
                </CardContent>
              </Card>

              {/* Rewards */}
              <Card className="bg-gradient-to-r from-caesar-gold/10 to-caesar-gold-muted/10 border-caesar-gold/20">
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-caesar-gold mb-1">+500</div>
                    <div className="text-sm text-gray-300">Caesar Points</div>
                    <div className="text-xs text-gray-400 mt-1">Earned per successful deployment</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
