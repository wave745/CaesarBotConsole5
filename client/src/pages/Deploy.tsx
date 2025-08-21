import { useState, useRef, useEffect } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Rocket, Upload, Twitter, Globe, CheckCircle, Plus, Trash2, Loader2, AlertTriangle, ExternalLink, Shield, Copy, Wallet, RefreshCw, Eye, EyeOff } from "lucide-react";
import { toast } from "react-hot-toast";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useWallet } from "@/providers/WalletProvider";
import { useAppStore } from "@/store/useAppStore";
import { Keypair } from "@solana/web3.js";

// Enhanced form schema based on specifications
const deployFormSchema = z.object({
  name: z.string().min(1, "Token name is required").max(32, "Name must be 32 characters or less"),
  symbol: z.string().min(1, "Token symbol is required").max(8, "Symbol must be 8 characters or less"),
  description: z.string().min(10, "Description must be at least 10 characters").max(1000, "Description must be 1000 characters or less"),
  website: z.string().url("Invalid website URL").optional().or(z.literal("")),
  twitter: z.string().optional(),
  telegram: z.string().optional(),
  tokenType: z.enum(["meme", "tech"]),
  launchpad: z.enum(["pump", "bonk"]),
  devBuyAmount: z.number().min(0.1, "Dev buy must be at least 0.1 SOL").max(10, "Dev buy cannot exceed 10 SOL"),
  slippage: z.number().min(0, "Slippage cannot be negative").max(50, "Slippage cannot exceed 50%"),
  priorityFee: z.number().min(0.00001, "Priority fee must be at least 0.00001 SOL").max(0.1, "Priority fee cannot exceed 0.1 SOL"),
  autoPost: z.boolean().default(false),
  useDevnet: z.boolean().default(false),
});

type DeployFormData = z.infer<typeof deployFormSchema>;

interface WalletData {
  pubkey: string;
  label: string;
  is_burner: boolean;
  sol_balance: number;
  token_balances: any[];
  user_wallet: string;
}

interface BundleWallet {
  pubkey: string;
  label: string;
  buyAmount: number;
  selected: boolean;
  privateKey?: string;
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

interface PresetData {
  name: string;
  launchpad: string;
  config: DeployFormData;
}

export function Deploy() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [imageUri, setImageUri] = useState<string>("");
  const [bundleWallets, setBundleWallets] = useState<BundleWallet[]>([]);
  const [selectedDevWallet, setSelectedDevWallet] = useState<string>("");
  const [deploymentResult, setDeploymentResult] = useState<DeploymentResult | null>(null);
  const [showPrivateKeys, setShowPrivateKeys] = useState(false);
  const [presetName, setPresetName] = useState("");
  const [isDevnet, setIsDevnet] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { user } = useAppStore();
  const { connection } = useWallet();

  const form = useForm<DeployFormData>({
    resolver: zodResolver(deployFormSchema),
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

  // Live wallet data fetch
  const { data: userWallets = [], isLoading: walletsLoading, refetch: refetchWallets } = useQuery({
    queryKey: ['user-wallets-deploy', user?.walletAddress, isDevnet],
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
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Load user presets
  const { data: userPresets = [] } = useQuery({
    queryKey: ['user-presets', user?.walletAddress],
    queryFn: async () => {
      if (!user?.walletAddress) return [];
      
      const response = await fetch('/api/deploy/presets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userWallet: user.walletAddress }),
      });
      
      if (!response.ok) return [];
      const data = await response.json();
      return data.presets || [];
    },
    enabled: !!user?.walletAddress,
  });

  // Image upload to IPFS via PumpPortal
  const uploadImageMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/deploy/upload-image', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Image upload failed');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success && data.ipfs) {
        setImageUri(data.ipfs);
        toast.success('Image uploaded to IPFS successfully!');
      } else {
        throw new Error(data.error || 'Upload failed');
      }
    },
    onError: (error: any) => {
      toast.error(`Image upload failed: ${error.message}`);
    },
  });

  // Metadata upload to IPFS via PumpPortal
  const uploadMetadataMutation = useMutation({
    mutationFn: async (metadata: any) => {
      const response = await fetch('/api/deploy/upload-metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(metadata),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Metadata upload failed');
      }
      
      return response.json();
    },
  });

  // Token deployment via PumpPortal API
  const deployTokenMutation = useMutation({
    mutationFn: async (deployData: any) => {
      const response = await fetch('/api/deploy/create-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(deployData),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Token creation failed');
      }
      
      return response.json();
    },
    onSuccess: async (data) => {
      setDeploymentResult(data);
      
      // Live RugCheck analysis
      try {
        toast.loading('Running security analysis...', { id: 'security-check' });
        const rugCheckResponse = await fetch(`/api/rugcheck/${data.mint}`);
        const rugCheckData = await rugCheckResponse.json();
        
        if (rugCheckData.success) {
          const score = rugCheckData.score;
          if (score >= 80) {
            toast.success(`Token deployed! Security score: ${score}/100`, { id: 'security-check' });
          } else {
            toast.error(`Token deployed but security score is low: ${score}/100`, { id: 'security-check' });
          }
          
          setDeploymentResult(prev => prev ? { ...prev, safetyCheck: rugCheckData } : null);
        }
      } catch (error) {
        toast.error('Security check failed', { id: 'security-check' });
      }
      
      // Execute bundle trades if configured
      if (bundleWallets.filter(w => w.selected).length > 0) {
        await executeBundleTrades(data.mint);
      }
      
      // Auto-post to Twitter if enabled
      if (form.getValues('autoPost')) {
        await autoPostToTwitter(data);
      }
      
      // Award Caesar Points
      await awardCaesarPoints();
      
      queryClient.invalidateQueries({ queryKey: ['user-wallets-deploy'] });
    },
    onError: (error: any) => {
      toast.error(`Deployment failed: ${error.message}`);
    },
  });

  // Save preset mutation
  const savePresetMutation = useMutation({
    mutationFn: async (preset: PresetData) => {
      const response = await fetch('/api/deploy/save-preset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userWallet: user?.walletAddress,
          ...preset,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save preset');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast.success('Preset saved successfully!');
      queryClient.invalidateQueries({ queryKey: ['user-presets'] });
      setPresetName("");
    },
  });

  // Create burner wallets
  const createWalletsMutation = useMutation({
    mutationFn: async (count: number) => {
      const response = await fetch('/api/wallets/live-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          count,
          isBurner: true,
          userWallet: user?.walletAddress,
          network: isDevnet ? 'devnet' : 'mainnet-beta',
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Wallet creation failed');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success && data.wallets) {
        toast.success(`Created ${data.wallets.length} burner wallets!`);
        refetchWallets();
        
        // Add to bundle wallets with private keys
        const newBundleWallets = data.wallets.map((wallet: any, index: number) => ({
          pubkey: wallet.pubkey,
          label: wallet.label,
          buyAmount: 0.01,
          selected: false,
          privateKey: data.privateKeys?.[index],
        }));
        
        setBundleWallets(prev => [...prev, ...newBundleWallets]);
      }
    },
  });

  // Helper functions
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Validate file size and type
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be less than 2MB');
      return;
    }
    
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      toast.error('Only JPEG, PNG, GIF, and SVG files are allowed');
      return;
    }
    
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target?.result as string);
    reader.readAsDataURL(file);
    
    // Upload to IPFS via PumpPortal
    uploadImageMutation.mutate(file);
  };

  const toggleWalletSelection = (pubkey: string) => {
    const wallet = userWallets.find((w: WalletData) => w.pubkey === pubkey);
    if (!wallet) return;

    const existingIndex = bundleWallets.findIndex(w => w.pubkey === pubkey);
    if (existingIndex >= 0) {
      setBundleWallets(prev => prev.filter(w => w.pubkey !== pubkey));
    } else {
      const newWallet: BundleWallet = {
        pubkey: wallet.pubkey,
        label: wallet.label,
        buyAmount: 0.01,
        selected: true,
      };
      setBundleWallets(prev => [...prev, newWallet]);
    }
  };

  const updateBundleWallet = (pubkey: string, field: keyof BundleWallet, value: any) => {
    setBundleWallets(prev => prev.map(w => 
      w.pubkey === pubkey ? { ...w, [field]: value } : w
    ));
  };

  const loadPreset = (preset: PresetData) => {
    form.reset(preset.config);
    toast.success(`Loaded preset: ${preset.name}`);
  };

  const saveCurrentAsPreset = () => {
    if (!presetName.trim()) {
      toast.error('Please enter a preset name');
      return;
    }
    
    const preset: PresetData = {
      name: presetName,
      launchpad: form.getValues('launchpad'),
      config: form.getValues(),
    };
    
    savePresetMutation.mutate(preset);
  };

  const autoFundDevWallet = async (walletAddress: string, requiredAmount: number) => {
    if (!isDevnet) return;
    
    try {
      const response = await fetch('/api/wallets/fund-devnet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress,
          amount: requiredAmount + 0.1, // Extra for fees
        }),
      });
      
      if (response.ok) {
        toast.success('Dev wallet funded automatically!');
        refetchWallets();
      }
    } catch (error) {
      console.error('Auto-funding failed:', error);
    }
  };

  const executeBundleTrades = async (mintAddress: string) => {
    const selectedWallets = bundleWallets.filter(w => w.selected && w.buyAmount > 0);
    if (selectedWallets.length === 0) return;
    
    try {
      toast.loading('Executing bundle trades...', { id: 'bundle-trades' });
      
      const response = await fetch('/api/deploy/execute-bundle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokenMint: mintAddress,
          wallets: selectedWallets,
          slippage: form.getValues('slippage'),
          priorityFee: form.getValues('priorityFee'),
          pool: form.getValues('launchpad'),
          network: isDevnet ? 'devnet' : 'mainnet-beta',
        }),
      });
      
      if (response.ok) {
        toast.success('Bundle trades executed successfully!', { id: 'bundle-trades' });
      } else {
        throw new Error('Bundle execution failed');
      }
    } catch (error) {
      toast.error('Bundle trades failed', { id: 'bundle-trades' });
    }
  };

  const autoPostToTwitter = async (deploymentData: DeploymentResult) => {
    try {
      toast.loading('Posting to Twitter...', { id: 'twitter-post' });
      
      const formData = form.getValues();
      const launchpadName = formData.launchpad === 'pump' ? 'Pump.fun' : 'LetsBonk.fun';
      
      const message = `🚀 Just launched ${formData.name} ($${formData.symbol}) on ${launchpadName}!

📊 ${formData.description.slice(0, 100)}...
💰 Dev Buy: ${formData.devBuyAmount} SOL
📈 Contract: ${deploymentData.mint}
🔗 ${deploymentData.explorerUrl}

#Solana #DeFi #CaesarBot #${formData.symbol}`;

      const response = await fetch('/api/twitter/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          tokenMint: deploymentData.mint,
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        toast.success(`Posted to Twitter! ${data.url}`, { id: 'twitter-post' });
      } else {
        throw new Error('Twitter API failed');
      }
    } catch (error) {
      toast.error('Failed to post to Twitter', { id: 'twitter-post' });
    }
  };

  const awardCaesarPoints = async () => {
    try {
      const bundleBonus = bundleWallets.filter(w => w.selected).length * 20;
      const totalPoints = 100 + bundleBonus;
      
      await fetch('/api/users/award-points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userWallet: user?.walletAddress,
          points: totalPoints,
          activity: 'token_deployment',
        }),
      });
      
      toast.success(`+${totalPoints} Caesar Points awarded!`);
    } catch (error) {
      console.error('Points award failed:', error);
    }
  };

  const checkWalletBalance = async (walletAddress: string, requiredAmount: number) => {
    try {
      const response = await fetch('/api/wallets/check-balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress,
          network: isDevnet ? 'devnet' : 'mainnet-beta',
        }),
      });
      
      const data = await response.json();
      if (data.balance < requiredAmount && isDevnet) {
        await autoFundDevWallet(walletAddress, requiredAmount);
      }
      
      return data.balance >= requiredAmount;
    } catch (error) {
      return false;
    }
  };

  const onSubmit = async (data: DeployFormData) => {
    if (!selectedDevWallet) {
      toast.error('Please select a developer wallet');
      return;
    }
    
    if (!imageUri) {
      toast.error('Please upload and wait for logo to process');
      return;
    }
    
    // Security prompt for hardware wallets
    toast.success('📶 Use VPN for privacy', { duration: 3000 });
    
    try {
      // Check dev wallet balance
      const hasBalance = await checkWalletBalance(selectedDevWallet, data.devBuyAmount);
      if (!hasBalance && !isDevnet) {
        toast.error('Insufficient balance in developer wallet');
        return;
      }
      
      // Step 1: Upload metadata to IPFS
      toast.loading('Uploading metadata to IPFS...', { id: 'deploy-process' });
      
      const metadata = {
        name: data.name,
        symbol: data.symbol,
        description: data.description,
        image: imageUri,
        external_url: data.website || undefined,
        twitter: data.twitter || undefined,
        telegram: data.telegram || undefined,
      };
      
      const metadataResult = await uploadMetadataMutation.mutateAsync(metadata);
      
      // Step 2: Generate mint keypair client-side
      const mintKeypair = Keypair.generate();
      
      // Step 3: Deploy token via PumpPortal
      toast.loading('Creating token on blockchain...', { id: 'deploy-process' });
      
      const deploymentData = {
        ...data,
        imageUri,
        metadataUri: metadataResult.uri,
        devWallet: selectedDevWallet,
        mint: mintKeypair.publicKey.toString(),
        network: isDevnet ? 'devnet' : 'mainnet-beta',
        bundleWallets: bundleWallets.filter(w => w.selected),
      };
      
      await deployTokenMutation.mutateAsync(deploymentData);
      
    } catch (error: any) {
      toast.error(`Deployment failed: ${error.message}`, { id: 'deploy-process' });
    }
  };

  const isFormValid = form.formState.isValid && 
    selectedDevWallet && 
    imageUri &&
    bundleWallets.filter(w => w.selected).length >= 1 &&
    bundleWallets.filter(w => w.selected).length <= 5;

  // Check devnet toggle changes
  useEffect(() => {
    if (isDevnet !== form.getValues('useDevnet')) {
      form.setValue('useDevnet', isDevnet);
      refetchWallets();
    }
  }, [isDevnet, form, refetchWallets]);

  return (
    <div className="max-w-7xl mx-auto space-y-8 p-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Deploy Console</h1>
        <p className="text-gray-400">
          Launch your token on Pump.fun and LetsBonk.fun with live PumpPortal integration. 
          Professional bundling, security checks, and auto-posting included.
        </p>
      </div>

      {/* Network Toggle */}
      <Card className="bg-caesar-dark border-gray-800">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Label htmlFor="devnet-toggle">Network:</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  id="devnet-toggle"
                  checked={isDevnet}
                  onCheckedChange={setIsDevnet}
                />
                <span className={`text-sm font-medium ${isDevnet ? 'text-yellow-400' : 'text-green-400'}`}>
                  {isDevnet ? 'Devnet' : 'Mainnet Beta'}
                </span>
              </div>
            </div>
            {isDevnet && (
              <Badge variant="outline" className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20">
                Auto-funding enabled
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Success Result */}
      {deploymentResult && (
        <Alert className="bg-green-500/10 border-green-500/20">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <AlertDescription className="flex flex-col space-y-2">
            <div className="flex items-center justify-between">
              <span>Token deployed successfully!</span>
              <div className="flex items-center space-x-2">
                {deploymentResult.safetyCheck && (
                  <Badge variant="outline" className={
                    deploymentResult.safetyCheck.score > 80 
                      ? "bg-green-500/10 text-green-500" 
                      : "bg-yellow-500/10 text-yellow-400"
                  }>
                    Safety: {deploymentResult.safetyCheck.score}/100
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-mono">CA: {deploymentResult.mint}</span>
              <Button size="sm" variant="ghost" onClick={() => navigator.clipboard.writeText(deploymentResult.mint)}>
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
              {/* Presets */}
              {userPresets.length > 0 && (
                <Card className="bg-caesar-dark border-gray-800">
                  <CardHeader>
                    <CardTitle className="text-lg">Quick Presets</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {userPresets.map((preset: PresetData) => (
                        <Button
                          key={preset.name}
                          variant="outline"
                          size="sm"
                          onClick={() => loadPreset(preset)}
                          className="bg-gray-800 border-gray-700 hover:bg-gray-700"
                        >
                          {preset.name}
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

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
                          <FormLabel>Token Name * <span className="text-xs text-gray-400">(max 32 chars)</span></FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="e.g., Caesar Coin" 
                              {...field}
                              maxLength={32}
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
                          <FormLabel>Token Symbol * <span className="text-xs text-gray-400">(max 8 chars)</span></FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="e.g., CAESAR" 
                              {...field}
                              maxLength={8}
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
                        <FormLabel>Description * <span className="text-xs text-gray-400">(10-1000 chars)</span></FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe your token's purpose, utility, and vision..."
                            className="bg-gray-800 border-gray-700 focus:border-caesar-gold min-h-[120px]"
                            maxLength={1000}
                            {...field}
                          />
                        </FormControl>
                        <div className="flex justify-between text-xs text-gray-400">
                          <FormMessage />
                          <span>{field.value?.length || 0}/1000</span>
                        </div>
                      </FormItem>
                    )}
                  />

                  {/* Social Links */}
                  <div className="space-y-4">
                    <Label>Social Links <span className="text-xs text-gray-400">(optional)</span></Label>
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
                                  placeholder="https://example.com"
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
                                  placeholder="@username"
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
                                placeholder="t.me/channel"
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
                    <Label>Token Logo * <span className="text-xs text-gray-400">(JPEG/PNG/GIF/SVG, max 2MB)</span></Label>
                    <div 
                      className="mt-2 border-2 border-dashed border-gray-700 rounded-lg p-6 text-center hover:border-caesar-gold/50 transition-colors cursor-pointer"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {imagePreview ? (
                        <div className="space-y-2">
                          <img src={imagePreview} alt="Preview" className="w-16 h-16 mx-auto rounded-lg object-cover" />
                          {uploadImageMutation.isPending && (
                            <div className="text-sm text-gray-400">Uploading to IPFS...</div>
                          )}
                          {imageUri && (
                            <div className="text-sm text-green-500">✓ Uploaded to IPFS</div>
                          )}
                        </div>
                      ) : (
                        <>
                          {uploadImageMutation.isPending ? (
                            <Loader2 className="w-12 h-12 mx-auto text-gray-400 mb-2 animate-spin" />
                          ) : (
                            <Upload className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                          )}
                          <p className="text-sm text-gray-400 mb-2">Drop your logo here or click to upload</p>
                          <p className="text-xs text-gray-500">JPEG, PNG, GIF, or SVG (max 2MB)</p>
                        </>
                      )}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".jpg,.jpeg,.png,.gif,.svg"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </div>
                  </div>

                  {/* Token Type & Launchpad */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="tokenType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Token Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-gray-800 border-gray-700 focus:border-caesar-gold">
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="meme">Meme Token</SelectItem>
                              <SelectItem value="tech">Tech/Utility</SelectItem>
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
                          <FormLabel>Launchpad</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-gray-800 border-gray-700 focus:border-caesar-gold">
                                <SelectValue placeholder="Select launchpad" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="pump">Pump.fun (~1 SOL fee)</SelectItem>
                              <SelectItem value="bonk">LetsBonk.fun (~0.5 SOL fee)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Trading Settings */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="devBuyAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Dev Buy Amount (SOL) <span className="text-xs text-gray-400">(0.1-10)</span></FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              step="0.01"
                              min="0.1"
                              max="10"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value))}
                              className="bg-gray-800 border-gray-700 focus:border-caesar-gold font-mono"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="slippage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Slippage (%) <span className="text-xs text-gray-400">(0-50)</span></FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              step="0.1"
                              min="0"
                              max="50"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value))}
                              className="bg-gray-800 border-gray-700 focus:border-caesar-gold font-mono"
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
                          <FormLabel>Priority Fee (SOL) <span className="text-xs text-gray-400">(0.00001-0.1)</span></FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              step="0.00001"
                              min="0.00001"
                              max="0.1"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value))}
                              className="bg-gray-800 border-gray-700 focus:border-caesar-gold font-mono"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Auto-post Toggle */}
                  <FormField
                    control={form.control}
                    name="autoPost"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border border-gray-700 p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Auto-post to Twitter</FormLabel>
                          <FormDescription>
                            Automatically tweet about your token launch
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
                </CardContent>
              </Card>

              {/* Save Preset */}
              <Card className="bg-caesar-dark border-gray-800">
                <CardHeader>
                  <CardTitle className="text-lg">Save Configuration as Preset</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Preset name (e.g., 'Meme Launch Standard')"
                      value={presetName}
                      onChange={(e) => setPresetName(e.target.value)}
                      className="bg-gray-800 border-gray-700 focus:border-caesar-gold"
                    />
                    <Button
                      type="button"
                      onClick={saveCurrentAsPreset}
                      disabled={!presetName.trim() || savePresetMutation.isPending}
                      className="bg-caesar-gold text-caesar-black hover:bg-caesar-gold-muted"
                    >
                      {savePresetMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        'Save'
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Sidebar */}
            <div className="space-y-6">
              {/* Wallet Selection */}
              <Card className="bg-caesar-dark border-gray-800">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Wallet Selection</CardTitle>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => refetchWallets()}
                      disabled={walletsLoading}
                      className="bg-gray-800 border-gray-700 hover:bg-gray-700"
                    >
                      <RefreshCw className={`w-4 h-4 ${walletsLoading ? 'animate-spin' : ''}`} />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Developer Wallet */}
                  <div>
                    <Label className="text-sm font-medium">Developer Wallet (first selected) *</Label>
                    <Select value={selectedDevWallet} onValueChange={setSelectedDevWallet}>
                      <SelectTrigger className="mt-1 bg-gray-800 border-gray-700 focus:border-caesar-gold">
                        <SelectValue placeholder="Select dev wallet" />
                      </SelectTrigger>
                      <SelectContent>
                        {userWallets.map((wallet: WalletData) => (
                          <SelectItem key={wallet.pubkey} value={wallet.pubkey}>
                            <div className="flex items-center justify-between w-full">
                              <span className="text-sm">{wallet.label}</span>
                              <span className="text-xs text-gray-400 ml-2">
                                {wallet.sol_balance.toFixed(4)} SOL
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  {/* Bundle Wallets */}
                  <div>
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Bundle Wallets (min 2, max 5 total)</Label>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => createWalletsMutation.mutate(3)}
                        disabled={createWalletsMutation.isPending}
                        className="bg-caesar-gold text-caesar-black hover:bg-caesar-gold-muted"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Create 3
                      </Button>
                    </div>
                    
                    <div className="mt-2 space-y-2 max-h-60 overflow-y-auto">
                      {userWallets.map((wallet: WalletData) => {
                        if (wallet.pubkey === selectedDevWallet) return null;
                        
                        const bundleWallet = bundleWallets.find(w => w.pubkey === wallet.pubkey);
                        const isSelected = !!bundleWallet;
                        
                        return (
                          <div key={wallet.pubkey} className="p-3 border border-gray-700 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={() => toggleWalletSelection(wallet.pubkey)}
                                disabled={!isSelected && bundleWallets.filter(w => w.selected).length >= 5}
                              />
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium">{wallet.label}</span>
                                  {wallet.is_burner && (
                                    <Badge variant="outline" className="text-xs bg-orange-500/10 text-orange-400">
                                      Burner
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-xs text-gray-400 font-mono">
                                  {wallet.pubkey.slice(0, 8)}...{wallet.pubkey.slice(-8)}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {wallet.sol_balance.toFixed(4)} SOL
                                </div>
                              </div>
                            </div>
                            
                            {isSelected && bundleWallet && (
                              <div className="mt-2 flex items-center space-x-2">
                                <Label className="text-xs">Buy Amount:</Label>
                                <Input
                                  type="number"
                                  step="0.001"
                                  min="0.001"
                                  max="1"
                                  value={bundleWallet.buyAmount}
                                  onChange={(e) => updateBundleWallet(wallet.pubkey, 'buyAmount', parseFloat(e.target.value))}
                                  className="h-6 text-xs bg-gray-800 border-gray-700 focus:border-caesar-gold font-mono"
                                />
                                <span className="text-xs text-gray-400">SOL</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    
                    {bundleWallets.filter(w => w.selected).length > 0 && (
                      <div className="mt-2 p-2 bg-gray-800 rounded text-xs">
                        <div className="flex justify-between">
                          <span>Selected:</span>
                          <span>{bundleWallets.filter(w => w.selected).length}/5</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total Buy:</span>
                          <span>
                            {bundleWallets.filter(w => w.selected).reduce((sum, w) => sum + w.buyAmount, 0).toFixed(3)} SOL
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Private Keys Management */}
              {bundleWallets.some(w => w.privateKey) && (
                <Card className="bg-caesar-dark border-gray-800 border-yellow-500/20">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center space-x-2">
                      <Shield className="w-5 h-5 text-yellow-400" />
                      <span>Private Keys</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Show Private Keys</span>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => setShowPrivateKeys(!showPrivateKeys)}
                        >
                          {showPrivateKeys ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </div>
                      
                      {showPrivateKeys && (
                        <div className="space-y-2">
                          {bundleWallets.filter(w => w.privateKey).map(wallet => (
                            <div key={wallet.pubkey} className="p-2 bg-gray-800 rounded text-xs">
                              <div className="font-medium mb-1">{wallet.label}</div>
                              <div className="font-mono text-gray-400 break-all">
                                {wallet.privateKey}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      <Alert className="bg-yellow-500/10 border-yellow-500/20">
                        <AlertTriangle className="h-4 w-4 text-yellow-400" />
                        <AlertDescription className="text-xs">
                          Private keys are only shown once. Save them securely before deployment.
                          Keys are automatically cleared after use.
                        </AlertDescription>
                      </Alert>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Deployment Summary */}
              <Card className="bg-caesar-dark border-gray-800">
                <CardHeader>
                  <CardTitle className="text-lg">Deployment Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Launchpad:</span>
                    <span className="capitalize">{form.watch('launchpad') === 'pump' ? 'Pump.fun' : 'LetsBonk.fun'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Dev Buy:</span>
                    <span>{form.watch('devBuyAmount')} SOL</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Bundle Wallets:</span>
                    <span>{bundleWallets.filter(w => w.selected).length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Total Bundle Buy:</span>
                    <span>{bundleWallets.filter(w => w.selected).reduce((sum, w) => sum + w.buyAmount, 0).toFixed(3)} SOL</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Caesar Points Reward:</span>
                    <span>{100 + (bundleWallets.filter(w => w.selected).length * 20)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Network:</span>
                    <span>{isDevnet ? 'Devnet' : 'Mainnet Beta'}</span>
                  </div>
                  
                  {!isFormValid && (
                    <Alert className="bg-red-500/10 border-red-500/20">
                      <AlertTriangle className="h-4 w-4 text-red-400" />
                      <AlertDescription className="text-xs">
                        {!selectedDevWallet && <div>• Select developer wallet</div>}
                        {!imageUri && <div>• Upload and process logo</div>}
                        {bundleWallets.filter(w => w.selected).length < 1 && <div>• Select at least 1 bundle wallet</div>}
                        {bundleWallets.filter(w => w.selected).length > 5 && <div>• Maximum 5 bundle wallets</div>}
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>

              {/* Deploy Button */}
              <Button
                type="submit"
                disabled={!isFormValid || deployTokenMutation.isPending}
                className="w-full bg-caesar-gold text-caesar-black hover:bg-caesar-gold-muted font-medium text-lg py-3"
              >
                {deployTokenMutation.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Deploying...
                  </>
                ) : (
                  <>
                    <Rocket className="w-5 h-5 mr-2" />
                    Deploy Token
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}