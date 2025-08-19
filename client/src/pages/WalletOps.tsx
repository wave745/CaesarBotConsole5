import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Wallet, Plus, Download, Upload, Send, Copy, Eye, EyeOff, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface WalletData {
  id: string;
  name: string;
  address: string;
  balance: string;
  isActive: boolean;
}

export function WalletOps() {
  const { toast } = useToast();
  const [wallets, setWallets] = useState<WalletData[]>([]);

  const [selectedWallets, setSelectedWallets] = useState<string[]>([]);
  const [transferAmount, setTransferAmount] = useState("");
  const [recipientAddress, setRecipientAddress] = useState("");
  const [multisendData, setMultisendData] = useState("");
  const [generateCount, setGenerateCount] = useState("1");
  const [showPrivateKeys, setShowPrivateKeys] = useState<Record<string, boolean>>({});

  const handleCreateWallet = () => {
    const newWallet: WalletData = {
      id: Date.now().toString(),
      name: `Wallet #${wallets.length + 1}`,
      address: generateMockAddress(),
      balance: "0.00",
      isActive: false,
    };
    
    setWallets([...wallets, newWallet]);
    toast({
      title: "Wallet Created",
      description: `New wallet ${newWallet.name} has been created`,
    });
  };

  const handleBulkCreate = () => {
    const count = parseInt(generateCount);
    const newWallets: WalletData[] = [];
    
    for (let i = 0; i < count; i++) {
      newWallets.push({
        id: (Date.now() + i).toString(),
        name: `Bulk Wallet #${wallets.length + i + 1}`,
        address: generateMockAddress(),
        balance: "0.00",
        isActive: false,
      });
    }
    
    setWallets([...wallets, ...newWallets]);
    toast({
      title: "Wallets Created",
      description: `Successfully created ${count} wallets`,
    });
  };

  const handleTransfer = () => {
    if (!transferAmount || !recipientAddress) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Transfer Initiated",
      description: `Transferring ${transferAmount} SOL to ${recipientAddress}`,
    });
    
    setTransferAmount("");
    setRecipientAddress("");
  };

  const handleMultisend = () => {
    if (!multisendData.trim()) {
      toast({
        title: "Error", 
        description: "Please enter recipient data",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Multisend Initiated",
      description: "Processing bulk transfers...",
    });
    
    setMultisendData("");
  };

  const handleExportWallets = () => {
    const exportData = wallets.map(w => ({
      name: w.name,
      address: w.address,
      balance: w.balance,
    }));
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'caesar-wallets.json';
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Export Complete",
      description: "Wallet data exported successfully",
    });
  };

  const handleCopyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    toast({
      title: "Copied",
      description: "Address copied to clipboard",
    });
  };

  const togglePrivateKey = (walletId: string) => {
    setShowPrivateKeys(prev => ({
      ...prev,
      [walletId]: !prev[walletId]
    }));
  };

  const generateMockAddress = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 44; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Wallet Operations</h1>
        <p className="text-gray-400">
          Manage your Solana wallets, transfers, and multi-wallet operations.
        </p>
      </div>

      <Tabs defaultValue="manage" className="space-y-6">
        <TabsList className="bg-caesar-dark border border-gray-800">
          <TabsTrigger value="manage" className="data-[state=active]:bg-caesar-gold data-[state=active]:text-caesar-black">
            Manage Wallets
          </TabsTrigger>
          <TabsTrigger value="create" className="data-[state=active]:bg-caesar-gold data-[state=active]:text-caesar-black">
            Create/Import
          </TabsTrigger>
          <TabsTrigger value="transfer" className="data-[state=active]:bg-caesar-gold data-[state=active]:text-caesar-black">
            Transfer
          </TabsTrigger>
          <TabsTrigger value="multisend" className="data-[state=active]:bg-caesar-gold data-[state=active]:text-caesar-black">
            Multisend
          </TabsTrigger>
        </TabsList>

        {/* Manage Wallets Tab */}
        <TabsContent value="manage">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3">
              <Card className="bg-caesar-dark border-gray-800">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Your Wallets</CardTitle>
                    <Button 
                      onClick={handleExportWallets}
                      variant="outline" 
                      size="sm" 
                      className="bg-gray-800 border-gray-700 hover:bg-gray-700"
                      data-testid="export-wallets-button"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {wallets.map((wallet) => (
                      <div key={wallet.id} className="bg-gray-800 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className={`w-3 h-3 rounded-full ${
                              wallet.isActive ? 'bg-green-500' : 'bg-gray-500'
                            }`}></div>
                            <div>
                              <div className="font-medium" data-testid={`wallet-name-${wallet.id}`}>
                                {wallet.name}
                              </div>
                              <div className="text-sm text-gray-400 font-mono" data-testid={`wallet-address-${wallet.id}`}>
                                {wallet.address}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold" data-testid={`wallet-balance-${wallet.id}`}>
                              {wallet.balance} SOL
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCopyAddress(wallet.address)}
                              className="text-gray-400 hover:text-white p-1"
                              data-testid={`copy-address-${wallet.id}`}
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => togglePrivateKey(wallet.id)}
                              className="text-gray-400 hover:text-white p-1"
                              data-testid={`toggle-private-key-${wallet.id}`}
                            >
                              {showPrivateKeys[wallet.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </Button>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="bg-gray-700 border-gray-600 hover:bg-gray-600"
                              data-testid={`set-active-${wallet.id}`}
                            >
                              {wallet.isActive ? 'Active' : 'Set Active'}
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                              data-testid={`delete-wallet-${wallet.id}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        
                        {showPrivateKeys[wallet.id] && (
                          <div className="mt-3 pt-3 border-t border-gray-700">
                            <Label className="text-xs text-gray-400">Private Key</Label>
                            <div className="bg-gray-900 p-2 rounded text-xs font-mono break-all text-red-400">
                              *** PRIVATE KEY WOULD BE DISPLAYED HERE ***
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Wallet Stats Sidebar */}
            <div>
              <Card className="bg-caesar-dark border-gray-800">
                <CardHeader>
                  <CardTitle className="text-lg">Portfolio Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="text-sm text-gray-400">Total Wallets</div>
                    <div className="text-2xl font-bold" data-testid="total-wallets">
                      {wallets.length}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400">Total Balance</div>
                    <div className="text-2xl font-bold text-caesar-gold" data-testid="total-balance">
                      {wallets.reduce((sum, w) => sum + parseFloat(w.balance), 0).toFixed(2)} SOL
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400">Active Wallets</div>
                    <div className="text-2xl font-bold text-green-500" data-testid="active-wallets">
                      {wallets.filter(w => w.isActive).length}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Create/Import Tab */}
        <TabsContent value="create">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-caesar-dark border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Plus className="w-5 h-5 text-caesar-gold" />
                  <span>Create New Wallets</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="generate-count">Number of wallets to generate</Label>
                  <Input
                    id="generate-count"
                    type="number"
                    min="1"
                    max="100"
                    value={generateCount}
                    onChange={(e) => setGenerateCount(e.target.value)}
                    className="bg-gray-800 border-gray-700 focus:border-caesar-gold"
                    data-testid="generate-count-input"
                  />
                </div>
                
                <Button 
                  onClick={handleBulkCreate}
                  className="w-full bg-caesar-gold text-caesar-black hover:bg-caesar-gold-muted"
                  data-testid="bulk-create-button"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Generate Wallets
                </Button>
                
                <Button 
                  onClick={handleCreateWallet}
                  variant="outline"
                  className="w-full bg-gray-800 border-gray-700 hover:bg-gray-700"
                  data-testid="single-create-button"
                >
                  Create Single Wallet
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-caesar-dark border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Upload className="w-5 h-5 text-caesar-gold" />
                  <span>Import Wallets</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="import-method">Import Method</Label>
                  <Select defaultValue="mnemonic">
                    <SelectTrigger className="bg-gray-800 border-gray-700 focus:border-caesar-gold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mnemonic">Seed Phrase</SelectItem>
                      <SelectItem value="private-key">Private Key</SelectItem>
                      <SelectItem value="json">JSON File</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="import-data">Wallet Data</Label>
                  <Textarea
                    id="import-data"
                    placeholder="Enter seed phrase, private key, or paste JSON data..."
                    className="bg-gray-800 border-gray-700 focus:border-caesar-gold min-h-[100px]"
                    data-testid="import-data-input"
                  />
                </div>
                
                <Button 
                  className="w-full bg-caesar-gold text-caesar-black hover:bg-caesar-gold-muted"
                  data-testid="import-wallets-button"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Import Wallets
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Transfer Tab */}
        <TabsContent value="transfer">
          <Card className="bg-caesar-dark border-gray-800 max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Send className="w-5 h-5 text-caesar-gold" />
                <span>Transfer SOL</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="from-wallet">From Wallet</Label>
                <Select>
                  <SelectTrigger className="bg-gray-800 border-gray-700 focus:border-caesar-gold">
                    <SelectValue placeholder="Select source wallet" />
                  </SelectTrigger>
                  <SelectContent>
                    {wallets.map((wallet) => (
                      <SelectItem key={wallet.id} value={wallet.id}>
                        {wallet.name} ({wallet.balance} SOL)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="recipient-address">Recipient Address</Label>
                <Input
                  id="recipient-address"
                  type="text"
                  placeholder="Enter recipient wallet address..."
                  value={recipientAddress}
                  onChange={(e) => setRecipientAddress(e.target.value)}
                  className="bg-gray-800 border-gray-700 focus:border-caesar-gold font-mono"
                  data-testid="recipient-address-input"
                />
              </div>
              
              <div>
                <Label htmlFor="transfer-amount">Amount (SOL)</Label>
                <Input
                  id="transfer-amount"
                  type="number"
                  step="0.001"
                  placeholder="0.000"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  className="bg-gray-800 border-gray-700 focus:border-caesar-gold font-mono"
                  data-testid="transfer-amount-input"
                />
              </div>
              
              <Button 
                onClick={handleTransfer}
                className="w-full bg-caesar-gold text-caesar-black hover:bg-caesar-gold-muted font-medium text-lg py-3"
                data-testid="transfer-button"
              >
                <Send className="w-5 h-5 mr-2" />
                Send Transfer
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Multisend Tab */}
        <TabsContent value="multisend">
          <Card className="bg-caesar-dark border-gray-800 max-w-4xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Send className="w-5 h-5 text-caesar-gold" />
                <span>Multisend</span>
              </CardTitle>
              <p className="text-gray-400">Send SOL to multiple recipients at once</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="multisend-from">From Wallet</Label>
                <Select>
                  <SelectTrigger className="bg-gray-800 border-gray-700 focus:border-caesar-gold">
                    <SelectValue placeholder="Select source wallet" />
                  </SelectTrigger>
                  <SelectContent>
                    {wallets.map((wallet) => (
                      <SelectItem key={wallet.id} value={wallet.id}>
                        {wallet.name} ({wallet.balance} SOL)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="multisend-data">Recipients</Label>
                <p className="text-sm text-gray-400 mb-2">
                  Format: address,amount (one per line)
                </p>
                <Textarea
                  id="multisend-data"
                  placeholder={`3xK7...aB9c,0.1\n7pL2...xZ4m,0.5\n9qR5...nV8k,0.25`}
                  value={multisendData}
                  onChange={(e) => setMultisendData(e.target.value)}
                  className="bg-gray-800 border-gray-700 focus:border-caesar-gold font-mono min-h-[150px]"
                  data-testid="multisend-data-input"
                />
              </div>
              
              <Button 
                onClick={handleMultisend}
                className="w-full bg-caesar-gold text-caesar-black hover:bg-caesar-gold-muted font-medium text-lg py-3"
                data-testid="multisend-button"
              >
                <Send className="w-5 h-5 mr-2" />
                Execute Multisend
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
