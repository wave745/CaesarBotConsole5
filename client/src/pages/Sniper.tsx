import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Target, Brain, Play, Square, Settings, TrendingUp, Clock, CheckCircle, XCircle } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { useToast } from "@/hooks/use-toast";

export function Sniper() {
  const { aiTradingEnabled, setAiTradingEnabled, activeSnipes, addSnipe } = useAppStore();
  const { toast } = useToast();
  
  const [isSnipingActive, setIsSnipingActive] = useState(false);
  const [selectedLaunchpad, setSelectedLaunchpad] = useState("pumpfun");
  const [snipeAmount, setSnipeAmount] = useState("0.05");
  const [maxSnipes, setMaxSnipes] = useState("10");
  const [slippage, setSlippage] = useState("10");
  const [gasPrice, setGasPrice] = useState("0.00025");
  
  // Bundle Bot settings
  const [bundleWallets, setBundleWallets] = useState("5");
  const [bundleAmount, setBundleAmount] = useState("0.1");
  const [bundleDelay, setBundleDelay] = useState("0.5");
  
  // Token filters
  const [tickerFilter, setTickerFilter] = useState("");
  const [filterType, setFilterType] = useState("contains");
  const [minMarketCap, setMinMarketCap] = useState("");
  const [maxMarketCap, setMaxMarketCap] = useState("");

  const handleStartSniping = () => {
    if (isSnipingActive) {
      setIsSnipingActive(false);
      toast({
        title: "Sniping Stopped",
        description: "Caesar Sniper has been deactivated",
      });
    } else {
      setIsSnipingActive(true);
      toast({
        title: "Sniping Started",
        description: `Caesar Sniper is now monitoring ${selectedLaunchpad}`,
      });
      
      // Add a mock snipe to demonstrate
      addSnipe({
        id: Date.now().toString(),
        tokenId: "mock-token-" + Date.now(),
        amount: snipeAmount,
        status: 'pending',
        timestamp: new Date(),
      });
    }
  };

  const mockSnipeHistory = [
    {
      id: "1",
      token: "BONK",
      amount: "0.05 SOL",
      price: "$0.0000123",
      status: "successful",
      profit: "+245%",
      timestamp: "2 min ago",
    },
    {
      id: "2", 
      token: "PEPE",
      amount: "0.1 SOL",
      price: "$0.0000045",
      status: "failed",
      reason: "Slippage exceeded",
      timestamp: "5 min ago",
    },
    {
      id: "3",
      token: "WIF",
      amount: "0.05 SOL", 
      price: "$0.0001234",
      status: "successful",
      profit: "+67%",
      timestamp: "12 min ago",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Caesar Sniper</h1>
        <p className="text-gray-400">
          Advanced token sniping with AI-powered detection and multi-wallet bundling.
        </p>
      </div>

      <Tabs defaultValue="sniper" className="space-y-6">
        <TabsList className="bg-caesar-dark border border-gray-800">
          <TabsTrigger value="sniper" className="data-[state=active]:bg-caesar-gold data-[state=active]:text-caesar-black">
            Caesar Sniper
          </TabsTrigger>
          <TabsTrigger value="bundle" className="data-[state=active]:bg-caesar-gold data-[state=active]:text-caesar-black">
            Bundle Bot
          </TabsTrigger>
          <TabsTrigger value="manual" className="data-[state=active]:bg-caesar-gold data-[state=active]:text-caesar-black">
            Manual Snipe
          </TabsTrigger>
        </TabsList>

        {/* Caesar Sniper Tab */}
        <TabsContent value="sniper">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Sniper Controls */}
            <div className="lg:col-span-2">
              <Card className="bg-caesar-dark border-gray-800">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center space-x-2">
                      <Target className="w-5 h-5 text-caesar-gold" />
                      <span>Sniper Configuration</span>
                    </CardTitle>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-400">Caesar AI</span>
                      <Switch
                        checked={aiTradingEnabled}
                        onCheckedChange={setAiTradingEnabled}
                        data-testid="ai-sniper-toggle"
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Basic Settings */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="launchpad">Launchpad</Label>
                      <Select value={selectedLaunchpad} onValueChange={setSelectedLaunchpad}>
                        <SelectTrigger className="bg-gray-800 border-gray-700 focus:border-caesar-gold">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pumpfun">Pump.fun</SelectItem>
                          <SelectItem value="letsbonk">LetsBonk.fun</SelectItem>
                          <SelectItem value="moonit">Moon.it</SelectItem>
                          <SelectItem value="boop">Boop.fun</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="snipe-amount">Amount per Snipe (SOL)</Label>
                      <Input
                        id="snipe-amount"
                        type="number"
                        step="0.01"
                        value={snipeAmount}
                        onChange={(e) => setSnipeAmount(e.target.value)}
                        className="bg-gray-800 border-gray-700 focus:border-caesar-gold font-mono"
                        data-testid="snipe-amount-input"
                      />
                    </div>
                    <div>
                      <Label htmlFor="max-snipes">Max Snipes</Label>
                      <Input
                        id="max-snipes"
                        type="number"
                        value={maxSnipes}
                        onChange={(e) => setMaxSnipes(e.target.value)}
                        className="bg-gray-800 border-gray-700 focus:border-caesar-gold font-mono"
                        data-testid="max-snipes-input"
                      />
                    </div>
                  </div>

                  {/* Advanced Settings */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="slippage">Slippage Tolerance (%)</Label>
                      <Input
                        id="slippage"
                        type="number"
                        value={slippage}
                        onChange={(e) => setSlippage(e.target.value)}
                        className="bg-gray-800 border-gray-700 focus:border-caesar-gold font-mono"
                        data-testid="slippage-input"
                      />
                    </div>
                    <div>
                      <Label htmlFor="gas-price">Gas Price (SOL)</Label>
                      <Input
                        id="gas-price"
                        type="number"
                        step="0.000001"
                        value={gasPrice}
                        onChange={(e) => setGasPrice(e.target.value)}
                        className="bg-gray-800 border-gray-700 focus:border-caesar-gold font-mono"
                        data-testid="gas-price-input"
                      />
                    </div>
                  </div>

                  {/* Token Filters */}
                  <div className="space-y-4">
                    <Label>Token Filters</Label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="ticker-filter">Ticker Filter</Label>
                        <Input
                          id="ticker-filter"
                          type="text"
                          placeholder="e.g., PEPE"
                          value={tickerFilter}
                          onChange={(e) => setTickerFilter(e.target.value)}
                          className="bg-gray-800 border-gray-700 focus:border-caesar-gold"
                          data-testid="ticker-filter-input"
                        />
                      </div>
                      <div>
                        <Label htmlFor="filter-type">Filter Type</Label>
                        <Select value={filterType} onValueChange={setFilterType}>
                          <SelectTrigger className="bg-gray-800 border-gray-700 focus:border-caesar-gold">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="contains">Contains</SelectItem>
                            <SelectItem value="startswith">Starts With</SelectItem>
                            <SelectItem value="exact">Exact Match</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label htmlFor="min-mc">Min MC (K)</Label>
                          <Input
                            id="min-mc"
                            type="number"
                            placeholder="100"
                            value={minMarketCap}
                            onChange={(e) => setMinMarketCap(e.target.value)}
                            className="bg-gray-800 border-gray-700 focus:border-caesar-gold font-mono text-sm"
                            data-testid="min-market-cap-input"
                          />
                        </div>
                        <div>
                          <Label htmlFor="max-mc">Max MC (K)</Label>
                          <Input
                            id="max-mc"
                            type="number"
                            placeholder="1000"
                            value={maxMarketCap}
                            onChange={(e) => setMaxMarketCap(e.target.value)}
                            className="bg-gray-800 border-gray-700 focus:border-caesar-gold font-mono text-sm"
                            data-testid="max-market-cap-input"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Control Buttons */}
                  <div className="flex space-x-4 pt-4">
                    <Button
                      onClick={handleStartSniping}
                      className={`flex-1 font-medium text-lg py-3 ${
                        isSnipingActive
                          ? 'bg-red-600 hover:bg-red-700 text-white'
                          : 'bg-caesar-gold text-caesar-black hover:bg-caesar-gold-muted'
                      }`}
                      data-testid="toggle-sniping-button"
                    >
                      {isSnipingActive ? (
                        <>
                          <Square className="w-5 h-5 mr-2" />
                          Stop Sniping
                        </>
                      ) : (
                        <>
                          <Play className="w-5 h-5 mr-2" />
                          Start Sniping
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      className="px-6 bg-gray-800 border-gray-700 hover:bg-gray-700"
                      data-testid="sniper-settings-button"
                    >
                      <Settings className="w-5 h-5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Status & Activity */}
            <div className="space-y-6">
              {/* Sniper Status */}
              <Card className="bg-caesar-dark border-gray-800">
                <CardHeader>
                  <CardTitle className="text-lg">Sniper Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Status</span>
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${
                        isSnipingActive ? 'bg-green-500' : 'bg-gray-500'
                      }`}></div>
                      <span className="text-sm font-mono" data-testid="sniper-status">
                        {isSnipingActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Target</span>
                    <span className="text-sm font-mono capitalize" data-testid="sniper-target">
                      {selectedLaunchpad.replace('fun', '.fun')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Active Snipes</span>
                    <span className="text-sm font-mono" data-testid="active-snipes-count">
                      {activeSnipes.length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Success Rate</span>
                    <span className="text-sm font-mono text-green-500">78.5%</span>
                  </div>
                </CardContent>
              </Card>

              {/* AI Insights */}
              {aiTradingEnabled && (
                <Card className="bg-caesar-dark border-gray-800">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center space-x-2">
                      <Brain className="w-5 h-5 text-caesar-purple" />
                      <span>AI Insights</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-sm">
                      <div className="text-caesar-gold mb-1">High Activity Detected</div>
                      <div className="text-gray-400">Pump.fun showing 23% increase in new token launches</div>
                    </div>
                    <div className="text-sm">
                      <div className="text-green-500 mb-1">Trending Pattern</div>
                      <div className="text-gray-400">Meme tokens with animal names performing +180% avg</div>
                    </div>
                    <div className="text-sm">
                      <div className="text-caesar-purple mb-1">Market Sentiment</div>
                      <div className="text-gray-400">Bullish indicators on small-cap launches</div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Bundle Bot Tab */}
        <TabsContent value="bundle">
          <Card className="bg-caesar-dark border-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="w-5 h-5 text-caesar-gold" />
                <span>Caesar Bundle Bot</span>
              </CardTitle>
              <p className="text-gray-400">Execute simultaneous transactions across multiple wallets for stealth launches</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="bundle-wallets">Number of Wallets</Label>
                  <Input
                    id="bundle-wallets"
                    type="number"
                    value={bundleWallets}
                    onChange={(e) => setBundleWallets(e.target.value)}
                    className="bg-gray-800 border-gray-700 focus:border-caesar-gold font-mono"
                    data-testid="bundle-wallets-input"
                  />
                </div>
                <div>
                  <Label htmlFor="bundle-amount">Amount per Wallet (SOL)</Label>
                  <Input
                    id="bundle-amount"
                    type="number"
                    step="0.01"
                    value={bundleAmount}
                    onChange={(e) => setBundleAmount(e.target.value)}
                    className="bg-gray-800 border-gray-700 focus:border-caesar-gold font-mono"
                    data-testid="bundle-amount-input"
                  />
                </div>
                <div>
                  <Label htmlFor="bundle-delay">Delay (seconds)</Label>
                  <Input
                    id="bundle-delay"
                    type="number"
                    step="0.1"
                    value={bundleDelay}
                    onChange={(e) => setBundleDelay(e.target.value)}
                    className="bg-gray-800 border-gray-700 focus:border-caesar-gold font-mono"
                    data-testid="bundle-delay-input"
                  />
                </div>
              </div>
              
              <Button className="w-full bg-caesar-gold text-caesar-black hover:bg-caesar-gold-muted font-medium text-lg py-3" data-testid="start-bundle-button">
                <Target className="w-5 h-5 mr-2" />
                Execute Bundle
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Manual Snipe Tab */}
        <TabsContent value="manual">
          <Card className="bg-caesar-dark border-gray-800">
            <CardHeader>
              <CardTitle>Manual Token Snipe</CardTitle>
              <p className="text-gray-400">Target specific tokens with precision timing</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="target-token">Token Contract Address</Label>
                  <Input
                    id="target-token"
                    type="text"
                    placeholder="Enter token contract address..."
                    className="bg-gray-800 border-gray-700 focus:border-caesar-gold font-mono"
                    data-testid="target-token-input"
                  />
                </div>
                <div>
                  <Label htmlFor="manual-amount">Amount (SOL)</Label>
                  <Input
                    id="manual-amount"
                    type="number"
                    step="0.01"
                    placeholder="0.1"
                    className="bg-gray-800 border-gray-700 focus:border-caesar-gold font-mono"
                    data-testid="manual-amount-input"
                  />
                </div>
              </div>
              
              <Button className="w-full bg-caesar-gold text-caesar-black hover:bg-caesar-gold-muted font-medium text-lg py-3" data-testid="manual-snipe-button">
                <Target className="w-5 h-5 mr-2" />
                Snipe Token
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Snipe History */}
      <Card className="bg-caesar-dark border-gray-800">
        <CardHeader>
          <CardTitle>Recent Snipes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mockSnipeHistory.map((snipe) => (
              <div key={snipe.id} className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    snipe.status === 'successful' ? 'bg-green-500/10' : 'bg-red-500/10'
                  }`}>
                    {snipe.status === 'successful' ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                  <div>
                    <div className="font-medium" data-testid={`snipe-token-${snipe.id}`}>
                      {snipe.token}
                    </div>
                    <div className="text-xs text-gray-400">
                      {snipe.amount} at {snipe.price}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-medium ${
                    snipe.status === 'successful' ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {snipe.status === 'successful' ? snipe.profit : snipe.status}
                  </div>
                  <div className="text-xs text-gray-400 flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    {snipe.timestamp}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
