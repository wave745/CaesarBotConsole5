import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Rocket, Upload, Twitter, Globe, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function Deploy() {
  const [tokenName, setTokenName] = useState("");
  const [tokenSymbol, setTokenSymbol] = useState("");
  const [description, setDescription] = useState("");
  const [website, setWebsite] = useState("");
  const [twitter, setTwitter] = useState("");
  const [telegram, setTelegram] = useState("");
  const [selectedLaunchpad, setSelectedLaunchpad] = useState("");
  const [tokenType, setTokenType] = useState("meme");
  const [autoPost, setAutoPost] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const { toast } = useToast();

  const launchpads = [
    { value: "pumpfun", label: "Pump.fun", fee: "1 SOL" },
    { value: "letsbonk", label: "LetsBonk.fun", fee: "0.5 SOL" },
    { value: "moonit", label: "Moon.it", fee: "0.8 SOL" },
    { value: "boop", label: "Boop.fun", fee: "0.3 SOL" },
    { value: "cook", label: "Cook.meme", fee: "0.6 SOL" },
  ];

  const handleDeploy = async () => {
    if (!tokenName || !tokenSymbol || !selectedLaunchpad) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsDeploying(true);

    try {
      // Simulate deployment process
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      toast({
        title: "Success!",
        description: `Token ${tokenSymbol} deployed successfully on ${selectedLaunchpad}`,
      });

      // Reset form
      setTokenName("");
      setTokenSymbol("");
      setDescription("");
      setWebsite("");
      setTwitter("");
      setTelegram("");
      setSelectedLaunchpad("");
    } catch (error) {
      toast({
        title: "Deployment Failed",
        description: "An error occurred during deployment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Deploy Console</h1>
        <p className="text-gray-400">
          Launch your token across multiple launchpads with Caesar deployment tools.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Deployment Form */}
        <div className="lg:col-span-2">
          <Card className="bg-caesar-dark border-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Rocket className="w-5 h-5 text-caesar-gold" />
                <span>Token Details</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="token-name">Token Name *</Label>
                  <Input
                    id="token-name"
                    type="text"
                    placeholder="e.g., Caesar Coin"
                    value={tokenName}
                    onChange={(e) => setTokenName(e.target.value)}
                    className="bg-gray-800 border-gray-700 focus:border-caesar-gold"
                    data-testid="token-name-input"
                  />
                </div>
                <div>
                  <Label htmlFor="token-symbol">Token Symbol *</Label>
                  <Input
                    id="token-symbol"
                    type="text"
                    placeholder="e.g., CAESAR"
                    value={tokenSymbol}
                    onChange={(e) => setTokenSymbol(e.target.value.toUpperCase())}
                    className="bg-gray-800 border-gray-700 focus:border-caesar-gold"
                    data-testid="token-symbol-input"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your token and its purpose..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="bg-gray-800 border-gray-700 focus:border-caesar-gold min-h-[100px]"
                  data-testid="token-description-input"
                />
              </div>

              {/* Social Links */}
              <div className="space-y-4">
                <Label>Social Links</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      type="url"
                      placeholder="Website URL"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      className="bg-gray-800 border-gray-700 focus:border-caesar-gold pl-10"
                      data-testid="website-input"
                    />
                  </div>
                  <div className="relative">
                    <Twitter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      type="text"
                      placeholder="Twitter handle"
                      value={twitter}
                      onChange={(e) => setTwitter(e.target.value)}
                      className="bg-gray-800 border-gray-700 focus:border-caesar-gold pl-10"
                      data-testid="twitter-input"
                    />
                  </div>
                  <div className="relative">
                    <Input
                      type="text"
                      placeholder="Telegram"
                      value={telegram}
                      onChange={(e) => setTelegram(e.target.value)}
                      className="bg-gray-800 border-gray-700 focus:border-caesar-gold"
                      data-testid="telegram-input"
                    />
                  </div>
                </div>
              </div>

              {/* Token Type */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="token-type">Token Type</Label>
                  <Select value={tokenType} onValueChange={setTokenType}>
                    <SelectTrigger className="bg-gray-800 border-gray-700 focus:border-caesar-gold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="meme">Meme Token</SelectItem>
                      <SelectItem value="tech">Tech Token</SelectItem>
                      <SelectItem value="utility">Utility Token</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="launchpad">Launchpad *</Label>
                  <Select value={selectedLaunchpad} onValueChange={setSelectedLaunchpad}>
                    <SelectTrigger className="bg-gray-800 border-gray-700 focus:border-caesar-gold">
                      <SelectValue placeholder="Select launchpad" />
                    </SelectTrigger>
                    <SelectContent>
                      {launchpads.map((launchpad) => (
                        <SelectItem key={launchpad.value} value={launchpad.value}>
                          {launchpad.label} ({launchpad.fee})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Logo Upload */}
              <div>
                <Label>Token Logo</Label>
                <div className="mt-2 border-2 border-dashed border-gray-700 rounded-lg p-6 text-center hover:border-caesar-gold/50 transition-colors">
                  <Upload className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-400 mb-2">Drop your logo here or click to upload</p>
                  <p className="text-xs text-gray-500">PNG, JPG or SVG (max 2MB)</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2 bg-gray-800 border-gray-700 hover:bg-gray-700"
                    data-testid="upload-logo-button"
                  >
                    Choose File
                  </Button>
                </div>
              </div>

              {/* Options */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="auto-post">Auto-post to X/Twitter</Label>
                    <p className="text-sm text-gray-400">Automatically announce your token launch</p>
                  </div>
                  <Switch
                    id="auto-post"
                    checked={autoPost}
                    onCheckedChange={setAutoPost}
                    data-testid="auto-post-toggle"
                  />
                </div>
              </div>

              {/* Deploy Button */}
              <Button
                onClick={handleDeploy}
                disabled={isDeploying || !tokenName || !tokenSymbol || !selectedLaunchpad}
                className="w-full bg-caesar-gold text-caesar-black hover:bg-caesar-gold-muted font-medium text-lg py-3"
                data-testid="deploy-button"
              >
                {isDeploying ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-caesar-black mr-2"></div>
                    Deploying...
                  </>
                ) : (
                  <>
                    <Rocket className="w-5 h-5 mr-2" />
                    Deploy Token
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Deployment Preview */}
          <Card className="bg-caesar-dark border-gray-800">
            <CardHeader>
              <CardTitle className="text-lg">Deployment Preview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {tokenName ? (
                <div>
                  <p className="text-sm text-gray-400">Token Name</p>
                  <p className="font-medium" data-testid="preview-token-name">{tokenName}</p>
                </div>
              ) : (
                <div className="text-gray-500 text-sm">Enter token details to see preview</div>
              )}
              
              {tokenSymbol && (
                <div>
                  <p className="text-sm text-gray-400">Symbol</p>
                  <p className="font-medium font-mono" data-testid="preview-token-symbol">{tokenSymbol}</p>
                </div>
              )}

              {selectedLaunchpad && (
                <div>
                  <p className="text-sm text-gray-400">Launchpad</p>
                  <p className="font-medium" data-testid="preview-launchpad">
                    {launchpads.find(l => l.value === selectedLaunchpad)?.label}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Deployment Checklist */}
          <Card className="bg-caesar-dark border-gray-800">
            <CardHeader>
              <CardTitle className="text-lg">Pre-Deployment Checklist</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-2">
                <CheckCircle className={`w-4 h-4 ${tokenName ? 'text-green-500' : 'text-gray-400'}`} />
                <span className={`text-sm ${tokenName ? 'text-white' : 'text-gray-400'}`}>
                  Token name provided
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className={`w-4 h-4 ${tokenSymbol ? 'text-green-500' : 'text-gray-400'}`} />
                <span className={`text-sm ${tokenSymbol ? 'text-white' : 'text-gray-400'}`}>
                  Token symbol provided
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className={`w-4 h-4 ${selectedLaunchpad ? 'text-green-500' : 'text-gray-400'}`} />
                <span className={`text-sm ${selectedLaunchpad ? 'text-white' : 'text-gray-400'}`}>
                  Launchpad selected
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-400">Logo uploaded (optional)</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className={`w-4 h-4 ${description ? 'text-green-500' : 'text-gray-400'}`} />
                <span className={`text-sm ${description ? 'text-white' : 'text-gray-400'}`}>
                  Description added (recommended)
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Caesar Points Reward */}
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
    </div>
  );
}
