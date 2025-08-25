import { useAppStore } from "@/store/useAppStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wallet, Target, Rocket, TrendingUp, TrendingDown, ArrowUp, ArrowDown, Brain, Activity, BarChart3, Loader2 } from "lucide-react";
import { useState } from "react";
import { useWalletData, useTokenPrice, useTokenChart } from "@/hooks/useWalletData";
import { usePumpFunData } from "@/hooks/usePumpFunData";
import { useTransactionHistory } from "@/hooks/useTransactionHistory";
import { PriceChart } from "@/components/PriceChart";
import { useWallet } from "@solana/wallet-adapter-react";
import caesarBotLogo from "@assets/CaesarBotLogo-removebg-preview_1755561624266.png";

export function Dashboard() {
  const { user, recentActivity, aiTradingEnabled, setAiTradingEnabled, executeSnipe } = useAppStore();
  const { connected } = useWallet();
  const [tokenAddress, setTokenAddress] = useState("");
  const [tradeAmount, setTradeAmount] = useState("");
  const [snipeAmount, setSnipeAmount] = useState("0.05");
  const [maxSnipes, setMaxSnipes] = useState("10");
  const [selectedLaunchpad, setSelectedLaunchpad] = useState("pumpfun");
  
  // Real data hooks
  const { portfolio, isLoading: portfolioLoading } = useWalletData();
  const { data: latestTokens, isLoading: pumpFunLoading } = usePumpFunData();
  const { data: transactions, isLoading: txLoading } = useTransactionHistory();
  const { data: tokenPrice } = useTokenPrice(tokenAddress);
  const { data: tokenChart } = useTokenChart(tokenAddress, '1D');
  
  // Chart data for the selected token
  const chartData = tokenChart ? {
    labels: tokenChart.labels || [],
    datasets: [{
      label: 'Price',
      data: tokenChart.prices || [],
      borderColor: '#fbbf24',
      backgroundColor: 'rgba(251, 191, 36, 0.1)',
    }]
  } : null;

  // Real stats data only
  const stats = [
    {
      title: "Portfolio Value",
      value: portfolio ? `$${portfolio.totalValue.toFixed(2)}` : portfolioLoading ? "Loading..." : "$0.00",
      change: portfolio ? `${portfolio.change24h >= 0 ? '+' : ''}${portfolio.change24h.toFixed(2)}%` : "+0.00%",
      changeType: portfolio && portfolio.change24h >= 0 ? "positive" : "negative",
      icon: Wallet,
    },
    {
      title: "SOL Balance",
      value: portfolio ? `${portfolio.solBalance.toFixed(4)} SOL` : portfolioLoading ? "Loading..." : "0 SOL",
      change: "Real-time",
      changeType: "neutral" as const,
      icon: () => <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full" />,
    },
    {
      title: "Token Holdings",
      value: portfolio ? portfolio.tokenHoldings.length.toString() : "0",
      change: "Active positions",
      changeType: "positive" as const,
      icon: Rocket,
    },
    {
      title: "Caesar Points",
      value: user?.caesarPoints?.toLocaleString() || "0",
      change: `${user?.tier || 'Legionnaire'}`,
      changeType: "neutral" as const,
      icon: () => <img src={caesarBotLogo} alt="CaesarBot" className="w-8 h-8" />,
    },
  ];



  const handleBuy = async () => {
    if (!tokenAddress || !tradeAmount || !connected) return;
    
    try {
      // TODO: Implement Jupiter swap
      console.log('Buy:', { tokenAddress, tradeAmount });
    } catch (error) {
      console.error('Buy failed:', error);
    }
  };

  const handleSell = async () => {
    if (!tokenAddress || !tradeAmount || !connected) return;
    
    try {
      // TODO: Implement Jupiter swap
      console.log('Sell:', { tokenAddress, tradeAmount });
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
        
        {!connected && (
          <div className="mt-4 p-4 bg-yellow-900/20 border border-yellow-700/50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse" />
              <span className="text-yellow-300 font-medium">Wallet Not Connected</span>
            </div>
            <p className="text-yellow-200/80 text-sm mt-2">
              Connect your Solana wallet to view portfolio data, execute trades, and access all features.
            </p>
          </div>
        )}
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
              </div>
            </CardHeader>
            <CardContent>
              {/* Price Chart */}
              <div className="bg-gray-900 rounded-lg p-4 mb-6">
                {tokenAddress && chartData ? (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium">Price Chart</h3>
                      {tokenPrice && (
                        <div className="text-right">
                          <div className="text-2xl font-bold text-caesar-gold">
                            ${tokenPrice.data?.value?.toFixed(6) || '0.000000'}
                          </div>
                          <div className="text-sm text-gray-400">
                            {(tokenPrice.data?.priceChange24hPercent || 0) >= 0 ? '+' : ''}{(tokenPrice.data?.priceChange24hPercent || 0).toFixed(2)}%
                          </div>
                        </div>
                      )}
                    </div>
                    <PriceChart data={chartData} height={300} />
                  </div>
                ) : (
                  <div className="h-64 flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <BarChart3 className="w-16 h-16 mb-4 mx-auto" />
                      <div className="text-lg font-medium">Enter Token Address</div>
                      <div className="text-sm">To view real-time price chart</div>
                    </div>
                  </div>
                )}
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
                  disabled={!tokenAddress || !tradeAmount}
                  data-testid="buy-button"
                >
                  <ArrowUp className="w-4 h-4 mr-2" />
                  Buy
                </Button>
                <Button 
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                  onClick={handleSell}
                  disabled={!tokenAddress || !tradeAmount}
                  data-testid="sell-button"
                >
                  <ArrowDown className="w-4 h-4 mr-2" />
                  Sell
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
                {latestTokens && latestTokens.length > 0 ? (
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
                {transactions && transactions.length > 0 ? (
                  transactions.map((tx, index) => (
                    <div key={tx.id} className="flex items-start space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center mt-1 ${
                        tx.type === 'buy' ? 'bg-green-500/10' :
                        tx.type === 'deploy' ? 'bg-caesar-gold/10' :
                        tx.type === 'sell' ? 'bg-red-500/10' :
                        'bg-blue-500/10'
                      }`}>
                        {tx.type === 'buy' && <TrendingUp className="text-green-500 w-4 h-4" />}
                        {tx.type === 'deploy' && <Rocket className="text-caesar-gold w-4 h-4" />}
                        {tx.type === 'sell' && <TrendingDown className="text-red-500 w-4 h-4" />}
                        {tx.type === 'transfer' && <Activity className="text-blue-500 w-4 h-4" />}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm" data-testid={`activity-${tx.id}`}>
                          {tx.type === 'buy' && `Bought ${tx.token || 'token'}`}
                          {tx.type === 'deploy' && `Deployed ${tx.token || 'token'}`}
                          {tx.type === 'sell' && `Sold ${tx.token || 'token'}`}
                          {tx.type === 'transfer' && `Transferred ${tx.token || 'SOL'}`}
                        </div>
                        <div className="text-xs text-gray-400">
                          {tx.amount && `${tx.amount} • `}
                          {tx.launchpad && `${tx.launchpad} • `}
                          {new Date(tx.timestamp).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <div className="text-sm">No recent activity</div>
                    <div className="text-xs mt-1">Connect wallet to see transaction history</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
