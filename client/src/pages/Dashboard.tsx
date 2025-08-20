import { useAppStore } from "@/store/useAppStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wallet, Target, Rocket, TrendingUp, TrendingDown, ArrowUp, ArrowDown, Brain, Activity, BarChart3, Loader2 } from "lucide-react";
import { useState } from "react";
// Temporarily disable real data hooks until API keys are properly configured
// import { useWalletData, usePortfolio, useMarketData, useAutoRefresh, useTradeToken } from "@/hooks/useRealTimeData";
import caesarBotLogo from "@assets/CaesarBotLogo-removebg-preview_1755561624266.png";

export function Dashboard() {
  const { user, recentActivity, aiTradingEnabled, setAiTradingEnabled, executeSnipe } = useAppStore();
  const [tokenAddress, setTokenAddress] = useState("");
  const [tradeAmount, setTradeAmount] = useState("");
  const [snipeAmount, setSnipeAmount] = useState("0.05");
  const [maxSnipes, setMaxSnipes] = useState("10");
  const [selectedLaunchpad, setSelectedLaunchpad] = useState("pumpfun");
  
  // Temporarily use mock data
  const walletData = { balance: 0 };
  const walletLoading = false;
  const portfolio = { totalValue: 0, change24h: 0, tokens: [] };
  const portfolioLoading = false;
  const marketData = null;
  const marketLoading = false;
  const tradeTokenMutation = { isPending: false, mutateAsync: async (params: any) => {} };

  // Enhanced stats data with mock realistic values
  const stats = [
    {
      title: "Portfolio Value",
      value: portfolio ? `$${portfolio.totalValue.toFixed(2)}` : walletLoading ? "Loading..." : "$2,450.75",
      change: portfolio ? `${portfolio.change24h >= 0 ? '+' : ''}${portfolio.change24h.toFixed(2)}%` : "+12.5%",
      changeType: portfolio?.change24h >= 0 ? "positive" : "positive",
      icon: Wallet,
    },
    {
      title: "SOL Balance",
      value: walletData ? `${(walletData.balance || 0).toFixed(4)} SOL` : walletLoading ? "Loading..." : "10.4521 SOL",
      change: "Real-time",
      changeType: "neutral",
      icon: () => <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full" />,
    },
    {
      title: "Token Holdings",
      value: portfolio ? portfolio.tokens.length.toString() : "12",
      change: "Active positions",
      changeType: "positive",
      icon: Rocket,
    },
    {
      title: "Caesar Points",
      value: user?.caesarPoints?.toLocaleString() || "0",
      change: `${user?.tier || 'Legionnaire'}`,
      changeType: "neutral",
      icon: () => <img src={caesarBotLogo} alt="CaesarBot" className="w-8 h-8" />,
    },
  ];

  // Mock latest tokens for demonstration (in production, these would come from real APIs)
  const latestTokens = [
    {
      symbol: "MOONCAT",
      name: "MoonCat",
      address: "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",
      price: "$0.000045",
      change: "+234.5%",
      marketCap: "$2.1M",
      volume: "$458K",
      age: "2m ago",
      changeType: "positive"
    },
    {
      symbol: "SOLDOG",
      name: "Solana Dog",
      address: "5uQw5SgV2vwcBBPHjdwAQ8q6SiV2NPTurVWeJ3rdJUYv",
      price: "$0.000012",
      change: "+89.2%",
      marketCap: "$850K",
      volume: "$92K",
      age: "5m ago",
      changeType: "positive"
    },
    {
      symbol: "WIZARDS",
      name: "Solana Wizards",
      address: "3NFMu38HiQPGPVwUfHjHQQaoWU1ZrJFd8iyHLgcMEbsJ",
      price: "$0.000089",
      change: "-12.1%",
      marketCap: "$3.2M",
      volume: "$156K",
      age: "8m ago",
      changeType: "negative"
    }
  ];



  const handleBuy = async () => {
    if (!tokenAddress || !tradeAmount || !user?.walletAddress) return;
    
    try {
      await tradeTokenMutation.mutateAsync({
        inputMint: 'So11111111111111111111111111111111111111112', // SOL
        outputMint: tokenAddress,
        amount: parseFloat(tradeAmount) * 1e9, // Convert SOL to lamports
      });
    } catch (error) {
      console.error('Buy failed:', error);
    }
  };

  const handleSell = async () => {
    if (!tokenAddress || !tradeAmount || !user?.walletAddress) return;
    
    try {
      await tradeTokenMutation.mutateAsync({
        inputMint: tokenAddress,
        outputMint: 'So11111111111111111111111111111111111111112', // SOL
        amount: parseFloat(tradeAmount),
      });
    } catch (error) {
      console.error('Sell failed:', error);
    }
  };

  const handleStartSniping = async () => {
    if (!tokenAddress || !snipeAmount) return;
    
    try {
      await executeSnipe(tokenAddress, parseFloat(snipeAmount));
    } catch (error) {
      console.error('Snipe failed:', error);
    }
  };

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          Welcome back, <span className="text-caesar-gold">{user?.tier}</span>
        </h1>
        <p className="text-gray-400">
          Your trading console is ready. Monitor markets, execute trades, and build your empire.
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6" data-testid="stats-overview">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="bg-caesar-dark border-gray-800 hover:border-caesar-gold/50 transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-caesar-gold/10 rounded-lg flex items-center justify-center">
                    <Icon className="text-caesar-gold w-6 h-6" />
                  </div>
                  <span className={`text-xs ${
                    stat.changeType === 'positive' ? 'text-green-500' : 
                    stat.changeType === 'negative' ? 'text-red-500' : 'text-caesar-gold'
                  }`}>
                    {stat.change}
                  </span>
                </div>
                <div className="text-2xl font-bold mb-1" data-testid={`stat-${stat.title.toLowerCase().replace(/\s+/g, '-')}`}>
                  {stat.value}
                </div>
                <div className="text-sm text-gray-400">{stat.title}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Trading Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Trading Panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Market Overview */}
          <Card className="bg-caesar-dark border-gray-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Market Overview</CardTitle>
                <Tabs defaultValue="market" className="w-auto">
                  <TabsList className="bg-gray-800">
                    <TabsTrigger value="market" className="data-[state=active]:bg-caesar-gold data-[state=active]:text-caesar-black">
                      Market
                    </TabsTrigger>
                    <TabsTrigger value="limit">Limit</TabsTrigger>
                    <TabsTrigger value="advanced">Advanced</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardHeader>
            <CardContent>
              {/* Chart Placeholder */}
              <div className="bg-gray-900 rounded-lg p-4 mb-6">
                <div className="h-64 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <BarChart3 className="w-16 h-16 mb-4 mx-auto" />
                    <div className="text-lg font-medium">Real-time Price Chart</div>
                    <div className="text-sm">Integrated with Solana price feeds</div>
                  </div>
                </div>
              </div>

              {/* Quick Trade */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Token Address</label>
                  <Input
                    type="text"
                    placeholder="Enter token contract address..."
                    value={tokenAddress}
                    onChange={(e) => setTokenAddress(e.target.value)}
                    className="bg-gray-800 border-gray-700 font-mono focus:border-caesar-gold"
                    data-testid="token-address-input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Amount (SOL)</label>
                  <Input
                    type="number"
                    placeholder="0.1"
                    value={tradeAmount}
                    onChange={(e) => setTradeAmount(e.target.value)}
                    className="bg-gray-800 border-gray-700 font-mono focus:border-caesar-gold"
                    data-testid="trade-amount-input"
                  />
                </div>
              </div>

              <div className="flex space-x-4">
                <Button 
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  onClick={handleBuy}
                  disabled={!tokenAddress || !tradeAmount || tradeTokenMutation.isPending}
                  data-testid="buy-button"
                >
                  {tradeTokenMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <ArrowUp className="w-4 h-4 mr-2" />
                  )}
                  Buy
                </Button>
                <Button 
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                  onClick={handleSell}
                  disabled={!tokenAddress || !tradeAmount || tradeTokenMutation.isPending}
                  data-testid="sell-button"
                >
                  {tradeTokenMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <ArrowDown className="w-4 h-4 mr-2" />
                  )}
                  Sell
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Caesar Sniper Interface */}
          <Card className="bg-caesar-dark border-gray-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Caesar Sniper</CardTitle>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-400">Caesar AI</span>
                  <Switch
                    checked={aiTradingEnabled}
                    onCheckedChange={setAiTradingEnabled}
                    data-testid="ai-trading-toggle"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Launchpad</label>
                  <Select value={selectedLaunchpad} onValueChange={setSelectedLaunchpad}>
                    <SelectTrigger className="bg-gray-800 border-gray-700 focus:border-caesar-gold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pumpfun">Pump.fun</SelectItem>
                      <SelectItem value="letsbonk">LetsBonk.fun</SelectItem>
                      <SelectItem value="moonit">Moon.it</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Amount per Snipe</label>
                  <Input
                    type="number"
                    value={snipeAmount}
                    onChange={(e) => setSnipeAmount(e.target.value)}
                    className="bg-gray-800 border-gray-700 font-mono focus:border-caesar-gold"
                    data-testid="snipe-amount-input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Max Snipes</label>
                  <Input
                    type="number"
                    value={maxSnipes}
                    onChange={(e) => setMaxSnipes(e.target.value)}
                    className="bg-gray-800 border-gray-700 font-mono focus:border-caesar-gold"
                    data-testid="max-snipes-input"
                  />
                </div>
              </div>

              <div className="flex space-x-4">
                <Button 
                  className="flex-1 bg-caesar-gold text-caesar-black hover:bg-caesar-gold-muted"
                  onClick={handleStartSniping}
                  data-testid="start-sniping-button"
                >
                  <Target className="w-4 h-4 mr-2" />
                  Start Sniping
                </Button>
                <Button 
                  variant="outline" 
                  className="px-6 bg-gray-800 border-gray-700 hover:bg-gray-700"
                  data-testid="sniper-settings-button"
                >
                  <Brain className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Pump.fun Feed */}
          <Card className="bg-caesar-dark border-gray-800">
            <CardHeader>
              <CardTitle className="text-lg">Latest Pump.fun</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {latestTokens.length > 0 ? (
                  latestTokens.map((token: any, index: number) => (
                    <div 
                      key={index} 
                      className="bg-gray-800 rounded-lg p-3 hover:bg-gray-750 transition-colors cursor-pointer"
                      onClick={() => setTokenAddress(token.address || '')}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium" data-testid={`token-symbol-${token.symbol.toLowerCase()}`}>
                          {token.symbol}
                        </div>
                        <div className={`text-sm ${
                          token.change.startsWith('+') ? 'text-green-500' : 'text-red-500'
                        }`}>
                          {token.change}
                        </div>
                      </div>
                      <div className="text-xs text-gray-400 mb-1">{token.name}</div>
                      <div className="text-xs font-mono text-gray-500">MC: {token.marketCap}</div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <div className="text-sm">No tokens available</div>
                    <div className="text-xs mt-1">Connect to real APIs to see live data</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>



          {/* Recent Activity */}
          <Card className="bg-caesar-dark border-gray-800">
            <CardHeader>
              <CardTitle className="text-lg">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentActivity.map((activity, index) => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center mt-1 ${
                      activity.type === 'buy' ? 'bg-green-500/10' :
                      activity.type === 'deploy' ? 'bg-caesar-gold/10' :
                      'bg-red-500/10'
                    }`}>
                      {activity.type === 'buy' && <TrendingUp className="text-green-500 w-4 h-4" />}
                      {activity.type === 'deploy' && <Rocket className="text-caesar-gold w-4 h-4" />}
                      {activity.type === 'sell' && <TrendingDown className="text-red-500 w-4 h-4" />}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm" data-testid={`activity-${activity.id}`}>
                        {activity.type === 'buy' && `Bought ${activity.token}`}
                        {activity.type === 'deploy' && `Deployed ${activity.token}`}
                        {activity.type === 'sell' && `Sold ${activity.token}`}
                      </div>
                      <div className="text-xs text-gray-400">
                        {activity.amount && `${activity.amount} • `}
                        {activity.launchpad && `${activity.launchpad} • `}
                        {new Date(activity.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
