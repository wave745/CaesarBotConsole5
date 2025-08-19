import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Gift, Users, Trophy, Calendar, Copy, ExternalLink, Flame, Target, Rocket } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { useToast } from "@/hooks/use-toast";
import caesarBotLogo from "@assets/CaesarBotLogo-removebg-preview_1755561624266.png";

interface Mission {
  id: string;
  title: string;
  description: string;
  reward: number;
  progress: number;
  target: number;
  type: 'daily' | 'weekly' | 'achievement';
  completed: boolean;
  icon: string;
}

interface LeaderboardEntry {
  rank: number;
  walletAddress: string;
  tier: string;
  points: number;
  trades: number;
  deployments: number;
}

interface Airdrop {
  id: string;
  tokenSymbol: string;
  tokenName: string;
  amount: string;
  value: string;
  claimable: boolean;
  expires: string;
  requirements: string[];
}

export function Rewards() {
  const { user } = useAppStore();
  const { toast } = useToast();
  const [referralCode, setReferralCode] = useState("");

  // Fetch user missions
  const { data: missions = [] } = useQuery({
    queryKey: ['/api/rewards/missions'],
  });

  // Fetch leaderboard
  const { data: leaderboard = [] } = useQuery({
    queryKey: ['/api/rewards/leaderboard'],
  });

  // Fetch available airdrops
  const { data: airdrops = [] } = useQuery({
    queryKey: ['/api/rewards/airdrops'],
  });

  const handleClaimAirdrop = (airdropId: string) => {
    toast({
      title: "Airdrop Claimed",
      description: "Tokens have been sent to your wallet",
    });
  };

  const handleCopyReferral = () => {
    const referralLink = `https://caesarbot.app/ref/${user?.walletAddress}`;
    navigator.clipboard.writeText(referralLink);
    toast({
      title: "Copied",
      description: "Referral link copied to clipboard",
    });
  };

  const handleUseReferral = () => {
    if (!referralCode.trim()) {
      toast({
        title: "Error",
        description: "Please enter a referral code",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Referral Applied",
      description: "You'll receive bonus points on your next trade",
    });
    setReferralCode("");
  };

  const getTierProgress = (points: number) => {
    const tiers = [
      { name: 'Legionnaire', min: 0, max: 10000 },
      { name: 'Centurion', min: 10000, max: 50000 },
      { name: 'Praetor', min: 50000, max: 100000 },
      { name: 'Caesar', min: 100000, max: Infinity },
    ];

    const currentTier = tiers.find(tier => points >= tier.min && points < tier.max);
    if (!currentTier) return { tier: 'Caesar', progress: 100, pointsToNext: 0 };

    const progress = currentTier.max === Infinity 
      ? 100 
      : ((points - currentTier.min) / (currentTier.max - currentTier.min)) * 100;
    
    const pointsToNext = currentTier.max === Infinity 
      ? 0 
      : currentTier.max - points;

    return { tier: currentTier.name, progress, pointsToNext };
  };

  const tierInfo = getTierProgress(user?.caesarPoints || 0);

  const mockMissions: Mission[] = [
    {
      id: "1",
      title: "Daily Trader",
      description: "Execute 5 trades today",
      reward: 100,
      progress: 3,
      target: 5,
      type: "daily",
      completed: false,
      icon: "target"
    },
    {
      id: "2",
      title: "Token Deployer",
      description: "Deploy a token this week",
      reward: 500,
      progress: 0,
      target: 1,
      type: "weekly",
      completed: false,
      icon: "rocket"
    },
    {
      id: "3",
      title: "Sniper Master",
      description: "Complete 50 successful snipes",
      reward: 1000,
      progress: 47,
      target: 50,
      type: "achievement",
      completed: false,
      icon: "flame"
    }
  ];

  const mockLeaderboard: LeaderboardEntry[] = [
    { rank: 1, walletAddress: "9pR3...xL7k", tier: "Caesar", points: 125000, trades: 2340, deployments: 45 },
    { rank: 2, walletAddress: "4mN8...qW9v", tier: "Praetor", points: 89000, trades: 1890, deployments: 32 },
    { rank: 3, walletAddress: "7xT5...bC2n", tier: "Praetor", points: 76500, trades: 1650, deployments: 28 },
    { rank: 847, walletAddress: user?.walletAddress || "", tier: user?.tier || "Centurion", points: user?.caesarPoints || 0, trades: 127, deployments: 34 },
  ];

  const mockAirdrops: Airdrop[] = [
    {
      id: "1",
      tokenSymbol: "CAESAR",
      tokenName: "Caesar Token",
      amount: "1,000",
      value: "$250",
      claimable: true,
      expires: "2024-02-15",
      requirements: ["Complete 10 trades", "Hold CAESAR tokens"]
    },
    {
      id: "2",
      tokenSymbol: "BONK",
      tokenName: "Bonk Inu",
      amount: "50,000",
      value: "$125",
      claimable: false,
      expires: "2024-02-20",
      requirements: ["Deploy 3 tokens", "Refer 5 users"]
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Rewards & Leaderboard</h1>
        <p className="text-gray-400">
          Earn Caesar Points, climb the leaderboard, and claim exclusive airdrops.
        </p>
      </div>

      {/* Points Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card className="lg:col-span-2 bg-gradient-to-r from-caesar-gold/10 to-caesar-gold-muted/10 border-caesar-gold/20">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <img src={caesarBotLogo} alt="CaesarBot" className="w-6 h-6" />
              <span>Caesar Points Overview</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-caesar-gold" data-testid="total-points">
                  {user?.caesarPoints?.toLocaleString() || "0"}
                </div>
                <div className="text-sm text-gray-400">Total Caesar Points</div>
              </div>
              <div className="text-right">
                <div className="text-lg font-semibold" data-testid="current-tier">
                  {user?.tier || "Legionnaire"}
                </div>
                <div className="text-sm text-gray-400">Current Tier</div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-400">Progress to next tier</span>
                <span className="text-sm text-caesar-gold font-mono">
                  {tierInfo.pointsToNext > 0 ? `${tierInfo.pointsToNext} points needed` : 'Max tier reached'}
                </span>
              </div>
              <Progress value={tierInfo.progress} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-caesar-dark border-gray-800">
          <CardHeader>
            <CardTitle className="text-lg">Today's Earnings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-2xl font-bold text-green-500" data-testid="daily-points">+450</div>
              <div className="text-sm text-gray-400">Points earned today</div>
            </div>
            <div>
              <div className="text-lg font-semibold">Streak: 5 days</div>
              <div className="text-sm text-gray-400">Keep going for bonus rewards!</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="missions" className="space-y-6">
        <TabsList className="bg-caesar-dark border border-gray-800">
          <TabsTrigger value="missions" className="data-[state=active]:bg-caesar-gold data-[state=active]:text-caesar-black">
            Missions
          </TabsTrigger>
          <TabsTrigger value="leaderboard" className="data-[state=active]:bg-caesar-gold data-[state=active]:text-caesar-black">
            Leaderboard
          </TabsTrigger>
          <TabsTrigger value="airdrops" className="data-[state=active]:bg-caesar-gold data-[state=active]:text-caesar-black">
            Airdrops
          </TabsTrigger>
          <TabsTrigger value="referrals" className="data-[state=active]:bg-caesar-gold data-[state=active]:text-caesar-black">
            Referrals
          </TabsTrigger>
        </TabsList>

        {/* Missions Tab */}
        <TabsContent value="missions">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {mockMissions.map((mission) => (
              <Card key={mission.id} className={`bg-caesar-dark border-gray-800 ${
                mission.completed ? 'border-green-500/50' : ''
              }`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {mission.icon === 'target' && <Target className="w-5 h-5 text-caesar-gold" />}
                      {mission.icon === 'rocket' && <Rocket className="w-5 h-5 text-caesar-gold" />}
                      {mission.icon === 'flame' && <Flame className="w-5 h-5 text-caesar-gold" />}
                      <CardTitle className="text-lg">{mission.title}</CardTitle>
                    </div>
                    <Badge variant={mission.type === 'daily' ? 'default' : mission.type === 'weekly' ? 'secondary' : 'outline'}>
                      {mission.type}
                    </Badge>
                  </div>
                  <p className="text-gray-400">{mission.description}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-400">Progress</span>
                      <span className="text-sm font-mono">
                        {mission.progress}/{mission.target}
                      </span>
                    </div>
                    <Progress 
                      value={(mission.progress / mission.target) * 100} 
                      className="h-2"
                    />
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="text-caesar-gold font-bold" data-testid={`mission-reward-${mission.id}`}>
                      +{mission.reward} points
                    </div>
                    {mission.completed ? (
                      <Button disabled className="bg-green-600">
                        Completed
                      </Button>
                    ) : (
                      <Button 
                        disabled={mission.progress < mission.target}
                        className="bg-caesar-gold text-caesar-black hover:bg-caesar-gold-muted"
                        data-testid={`claim-mission-${mission.id}`}
                      >
                        Claim
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Leaderboard Tab */}
        <TabsContent value="leaderboard">
          <Card className="bg-caesar-dark border-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Trophy className="w-5 h-5 text-caesar-gold" />
                <span>Global Leaderboard</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockLeaderboard.map((entry, index) => (
                  <div 
                    key={entry.rank} 
                    className={`flex items-center justify-between p-4 rounded-lg ${
                      entry.walletAddress === user?.walletAddress 
                        ? 'bg-caesar-gold/10 border border-caesar-gold/30' 
                        : 'bg-gray-800'
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                        entry.rank <= 3 ? 'bg-caesar-gold text-caesar-black' : 'bg-gray-700'
                      }`}>
                        {entry.rank <= 3 ? (
                          <Trophy className="w-4 h-4" />
                        ) : (
                          entry.rank
                        )}
                      </div>
                      <div>
                        <div className="font-mono text-sm" data-testid={`leaderboard-address-${entry.rank}`}>
                          {entry.walletAddress}
                        </div>
                        <div className="text-xs text-gray-400">{entry.tier}</div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="font-bold text-caesar-gold" data-testid={`leaderboard-points-${entry.rank}`}>
                        {entry.points.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-400">
                        {entry.trades} trades • {entry.deployments} deploys
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Airdrops Tab */}
        <TabsContent value="airdrops">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {mockAirdrops.map((airdrop) => (
              <Card key={airdrop.id} className="bg-caesar-dark border-gray-800">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center space-x-2">
                        <Gift className="w-5 h-5 text-caesar-gold" />
                        <span>{airdrop.tokenSymbol}</span>
                      </CardTitle>
                      <p className="text-gray-400">{airdrop.tokenName}</p>
                    </div>
                    <Badge variant={airdrop.claimable ? "default" : "secondary"}>
                      {airdrop.claimable ? "Claimable" : "Locked"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-2xl font-bold" data-testid={`airdrop-amount-${airdrop.id}`}>
                        {airdrop.amount}
                      </div>
                      <div className="text-sm text-gray-400">
                        Estimated value: {airdrop.value}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-400">Expires</div>
                      <div className="font-mono text-sm">{airdrop.expires}</div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-gray-400 mb-2">Requirements:</div>
                    <ul className="text-xs space-y-1">
                      {airdrop.requirements.map((req, index) => (
                        <li key={index} className="text-gray-400">• {req}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <Button
                    onClick={() => handleClaimAirdrop(airdrop.id)}
                    disabled={!airdrop.claimable}
                    className="w-full bg-caesar-gold text-caesar-black hover:bg-caesar-gold-muted"
                    data-testid={`claim-airdrop-${airdrop.id}`}
                  >
                    {airdrop.claimable ? 'Claim Airdrop' : 'Requirements Not Met'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Referrals Tab */}
        <TabsContent value="referrals">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-caesar-dark border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="w-5 h-5 text-caesar-gold" />
                  <span>Share & Earn</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-gray-400 mb-4">
                    Earn 10% of your referrals' Caesar Points and help them get started with bonus rewards.
                  </p>
                  
                  <div className="bg-gray-800 p-3 rounded-lg mb-4">
                    <div className="text-sm text-gray-400 mb-1">Your referral link:</div>
                    <div className="flex items-center space-x-2">
                      <div className="font-mono text-sm flex-1 truncate">
                        https://caesarbot.app/ref/{user?.walletAddress}
                      </div>
                      <Button
                        onClick={handleCopyReferral}
                        variant="ghost"
                        size="sm"
                        className="text-gray-400 hover:text-white"
                        data-testid="copy-referral-link"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-caesar-gold" data-testid="total-referrals">
                        7
                      </div>
                      <div className="text-sm text-gray-400">Total Referrals</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-500" data-testid="referral-earnings">
                        +850
                      </div>
                      <div className="text-sm text-gray-400">Points Earned</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-caesar-dark border-gray-800">
              <CardHeader>
                <CardTitle>Use Referral Code</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-400">
                  Have a referral code? Enter it below to get bonus points on your next trade.
                </p>
                
                <div className="space-y-3">
                  <Input
                    type="text"
                    placeholder="Enter referral code..."
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value)}
                    className="bg-gray-800 border-gray-700 focus:border-caesar-gold"
                    data-testid="referral-code-input"
                  />
                  
                  <Button
                    onClick={handleUseReferral}
                    className="w-full bg-caesar-gold text-caesar-black hover:bg-caesar-gold-muted"
                    data-testid="apply-referral-button"
                  >
                    Apply Referral Code
                  </Button>
                </div>
                
                <div className="bg-caesar-gold/10 p-3 rounded-lg">
                  <div className="text-sm text-caesar-gold font-medium">Bonus Rewards</div>
                  <div className="text-xs text-gray-400">
                    • 50% bonus points on next 5 trades<br/>
                    • Exclusive access to premium features<br/>
                    • Priority customer support
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
