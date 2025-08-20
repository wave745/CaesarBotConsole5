import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Filter, TrendingUp, TrendingDown, AlertTriangle, Shield, Star, Copy, ExternalLink, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TokenScan {
  id: string;
  symbol: string;
  name: string;
  contractAddress: string;
  price: string;
  marketCap: string;
  volume24h: string;
  priceChange24h: string;
  liquidity: string;
  holders: number;
  age: string;
  launchpad: string;
  caesarRating: number;
  riskLevel: 'low' | 'medium' | 'high';
  isHoneypot: boolean;
  hasLpLock: boolean;
  mintDisabled: boolean;
  creatorScore: number;
}

export function Scanner() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLaunchpad, setSelectedLaunchpad] = useState("all");
  const [minMarketCap, setMinMarketCap] = useState([0]);
  const [maxMarketCap, setMaxMarketCap] = useState([10000]);
  const [minVolume, setMinVolume] = useState([0]);
  const [minRating, setMinRating] = useState([0]);
  const [showHoneypots, setShowHoneypots] = useState(false);
  const [requireLpLock, setRequireLpLock] = useState(false);
  const [sortBy, setSortBy] = useState("marketCap");
  const [sortOrder, setSortOrder] = useState("desc");

  // Fetch tokens from scanner API
  const { data: tokens = [], isLoading, error } = useQuery<TokenScan[]>({
    queryKey: ['scanner-tokens', {
      search: searchQuery,
      launchpad: selectedLaunchpad,
      minMarketCap: minMarketCap[0],
      maxMarketCap: maxMarketCap[0],
      minVolume: minVolume[0],
      minRating: minRating[0],
      showHoneypots,
      requireLpLock,
      sortBy,
      sortOrder
    }],
    queryFn: async () => {
      const params = new URLSearchParams({
        search: searchQuery,
        launchpad: selectedLaunchpad,
        minMarketCap: minMarketCap[0].toString(),
        maxMarketCap: maxMarketCap[0].toString(),
        minVolume: minVolume[0].toString(),
        minRating: minRating[0].toString(),
        showHoneypots: showHoneypots.toString(),
        requireLpLock: requireLpLock.toString(),
        sortBy,
        sortOrder
      });
      
      const response = await fetch(`/api/scanner/tokens?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch tokens');
      }
      return response.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const handleCopyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    toast({
      title: "Copied",
      description: "Contract address copied to clipboard",
    });
  };

  const handleQuickSnipe = (token: TokenScan) => {
    toast({
      title: "Quick Snipe Initiated",
      description: `Preparing to snipe ${token.symbol}`,
    });
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'bg-green-500/10 text-green-500';
      case 'medium': return 'bg-yellow-500/10 text-yellow-500';
      case 'high': return 'bg-red-500/10 text-red-500';
      default: return 'bg-gray-500/10 text-gray-500';
    }
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 8) return 'text-green-500';
    if (rating >= 6) return 'text-yellow-500';
    if (rating >= 4) return 'text-orange-500';
    return 'text-red-500';
  };

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="bg-caesar-dark border-gray-800">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Scanner Unavailable</h3>
            <p className="text-gray-400">Unable to connect to token scanner. Please check your connection and try again.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Pump.fun Scanner</h1>
        <p className="text-gray-400">
          Advanced token discovery with risk analysis and Caesar AI ratings.
        </p>
      </div>

      {/* Filters */}
      <Card className="bg-caesar-dark border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-caesar-gold" />
            <span>Scanner Filters</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Search and Basic Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="search">Search Tokens</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="search"
                  type="text"
                  placeholder="Search by symbol, name, or contract..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-gray-800 border-gray-700 focus:border-caesar-gold pl-10"
                  data-testid="search-tokens-input"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="launchpad">Launchpad</Label>
              <Select value={selectedLaunchpad} onValueChange={setSelectedLaunchpad}>
                <SelectTrigger className="bg-gray-800 border-gray-700 focus:border-caesar-gold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Launchpads</SelectItem>
                  <SelectItem value="pumpfun">Pump.fun</SelectItem>
                  <SelectItem value="letsbonk">LetsBonk.fun</SelectItem>
                  <SelectItem value="moonit">Moon.it</SelectItem>
                  <SelectItem value="boop">Boop.fun</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="sort">Sort By</Label>
              <Select value={`${sortBy}-${sortOrder}`} onValueChange={(value) => {
                const [field, order] = value.split('-');
                setSortBy(field);
                setSortOrder(order);
              }}>
                <SelectTrigger className="bg-gray-800 border-gray-700 focus:border-caesar-gold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="marketCap-desc">Market Cap (High to Low)</SelectItem>
                  <SelectItem value="marketCap-asc">Market Cap (Low to High)</SelectItem>
                  <SelectItem value="volume24h-desc">Volume (High to Low)</SelectItem>
                  <SelectItem value="priceChange24h-desc">Price Change (High to Low)</SelectItem>
                  <SelectItem value="caesarRating-desc">Caesar Rating (High to Low)</SelectItem>
                  <SelectItem value="age-asc">Age (Newest First)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Advanced Filters */}
          <Tabs defaultValue="financial" className="w-full">
            <TabsList className="bg-gray-800">
              <TabsTrigger value="financial">Financial</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
              <TabsTrigger value="social">Social</TabsTrigger>
            </TabsList>
            
            <TabsContent value="financial" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label>Market Cap Range ($K)</Label>
                  <div className="px-3 py-2">
                    <Slider
                      value={minMarketCap}
                      onValueChange={setMinMarketCap}
                      max={1000}
                      step={10}
                      className="w-full"
                      data-testid="market-cap-min-slider"
                    />
                    <div className="flex justify-between text-sm text-gray-400 mt-1">
                      <span>Min: ${minMarketCap[0]}K</span>
                      <span>Max: ${maxMarketCap[0]}K</span>
                    </div>
                  </div>
                </div>
                <div>
                  <Label>24h Volume ($K)</Label>
                  <div className="px-3 py-2">
                    <Slider
                      value={minVolume}
                      onValueChange={setMinVolume}
                      max={500}
                      step={5}
                      className="w-full"
                      data-testid="volume-min-slider"
                    />
                    <div className="flex justify-between text-sm text-gray-400 mt-1">
                      <span>Min: ${minVolume[0]}K</span>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="security" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="lp-lock">Require LP Lock</Label>
                  <Switch
                    id="lp-lock"
                    checked={requireLpLock}
                    onCheckedChange={setRequireLpLock}
                    data-testid="lp-lock-toggle"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="show-honeypots">Show Honeypots</Label>
                  <Switch
                    id="show-honeypots"
                    checked={showHoneypots}
                    onCheckedChange={setShowHoneypots}
                    data-testid="honeypots-toggle"
                  />
                </div>
                <div>
                  <Label>Min Caesar Rating</Label>
                  <div className="px-3 py-2">
                    <Slider
                      value={minRating}
                      onValueChange={setMinRating}
                      max={10}
                      step={1}
                      className="w-full"
                      data-testid="rating-min-slider"
                    />
                    <div className="text-sm text-gray-400 mt-1">
                      Min: {minRating[0]}/10
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="social" className="space-y-4">
              <div className="text-center text-gray-400 py-8">
                <p>Social metrics and sentiment analysis coming soon...</p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Results */}
      <Card className="bg-caesar-dark border-gray-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Scan Results</CardTitle>
            <div className="flex items-center space-x-2 text-sm text-gray-400">
              <span data-testid="results-count">
                {isLoading ? 'Scanning...' : `${tokens.length} tokens found`}
              </span>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="bg-gray-800 rounded-lg p-4 animate-pulse">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-700 rounded w-24"></div>
                      <div className="h-3 bg-gray-700 rounded w-32"></div>
                    </div>
                    <div className="h-8 bg-gray-700 rounded w-20"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : tokens.length === 0 ? (
            <div className="text-center py-12">
              <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No tokens found</h3>
              <p className="text-gray-400">
                Try adjusting your filters or search criteria to find tokens.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {tokens.map((token: TokenScan) => (
                <div key={token.id} className="bg-gray-800 rounded-lg p-4 hover:bg-gray-750 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-lg" data-testid={`token-symbol-${token.symbol}`}>
                              {token.symbol}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {token.launchpad}
                            </Badge>
                            {token.isHoneypot && (
                              <Badge className="bg-red-500/10 text-red-500 text-xs">
                                <AlertTriangle className="w-3 h-3 mr-1" />
                                Honeypot
                              </Badge>
                            )}
                            {token.hasLpLock && (
                              <Badge className="bg-green-500/10 text-green-500 text-xs">
                                <Shield className="w-3 h-3 mr-1" />
                                LP Locked
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-gray-400">{token.name}</div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                        <div>
                          <div className="text-gray-400">Price</div>
                          <div className="font-mono" data-testid={`token-price-${token.id}`}>
                            ${token.price}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-400">Market Cap</div>
                          <div className="font-mono" data-testid={`token-market-cap-${token.id}`}>
                            {token.marketCap}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-400">24h Volume</div>
                          <div className="font-mono">{token.volume24h}</div>
                        </div>
                        <div>
                          <div className="text-gray-400">24h Change</div>
                          <div className={`font-mono flex items-center ${
                            token.priceChange24h.startsWith('+') ? 'text-green-500' : 'text-red-500'
                          }`}>
                            {token.priceChange24h.startsWith('+') ? (
                              <TrendingUp className="w-3 h-3 mr-1" />
                            ) : (
                              <TrendingDown className="w-3 h-3 mr-1" />
                            )}
                            {token.priceChange24h}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-400">Holders</div>
                          <div className="font-mono">{token.holders.toLocaleString()}</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end space-y-2">
                      <div className="flex items-center space-x-2">
                        <Badge className={getRiskColor(token.riskLevel)}>
                          {token.riskLevel.toUpperCase()}
                        </Badge>
                        <div className="text-right">
                          <div className="text-sm text-gray-400">Caesar Rating</div>
                          <div className={`text-xl font-bold ${getRatingColor(token.caesarRating)}`}>
                            <Star className="w-4 h-4 inline mr-1" />
                            {token.caesarRating}/10
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopyAddress(token.contractAddress)}
                          className="text-gray-400 hover:text-white p-2"
                          data-testid={`copy-address-${token.id}`}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-gray-400 hover:text-white p-2"
                          data-testid={`view-details-${token.id}`}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => handleQuickSnipe(token)}
                          size="sm"
                          className="bg-caesar-gold text-caesar-black hover:bg-caesar-gold-muted"
                          data-testid={`quick-snipe-${token.id}`}
                        >
                          <Zap className="w-4 h-4 mr-1" />
                          Snipe
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-500 font-mono truncate">
                    {token.contractAddress}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
