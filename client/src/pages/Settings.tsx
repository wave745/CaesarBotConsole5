import { useAppStore } from "@/store/useAppStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Settings as SettingsIcon, Palette, Bell, Shield, Smartphone, Monitor, Sun, Moon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function Settings() {
  const { theme, setTheme, notifications, setNotifications, user } = useAppStore();
  const { toast } = useToast();

  const handleThemeChange = (newTheme: 'dark' | 'light') => {
    setTheme(newTheme);
    document.documentElement.classList.toggle('light', newTheme === 'light');
    toast({
      title: "Theme Updated",
      description: `Switched to ${newTheme} mode`,
    });
  };

  const handleNotificationChange = (type: keyof typeof notifications, enabled: boolean) => {
    setNotifications({ [type]: enabled });
    toast({
      title: "Notification Settings Updated",
      description: `${type} notifications ${enabled ? 'enabled' : 'disabled'}`,
    });
  };

  const resetToDefaults = () => {
    setTheme('dark');
    setNotifications({
      trading: true,
      airdrops: true,
      rewards: true,
      system: true,
    });
    document.documentElement.classList.remove('light');
    toast({
      title: "Settings Reset",
      description: "All settings have been reset to defaults",
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-gray-400">
          Customize your Caesarbot experience with themes and notifications.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Theme Settings */}
        <Card className="bg-caesar-dark border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Palette className="w-5 h-5 text-caesar-gold" />
              <span>Appearance</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label className="text-base font-medium mb-4 block">Theme</Label>
              <div className="grid grid-cols-2 gap-4">
                <Button
                  variant={theme === 'dark' ? 'default' : 'outline'}
                  onClick={() => handleThemeChange('dark')}
                  className={`h-20 flex flex-col items-center space-y-2 ${
                    theme === 'dark' 
                      ? 'bg-caesar-gold text-caesar-black border-caesar-gold' 
                      : 'border-gray-700 hover:border-caesar-gold'
                  }`}
                  data-testid="dark-theme-button"
                >
                  <Moon className="w-6 h-6" />
                  <span>Dark</span>
                </Button>
                
                <Button
                  variant={theme === 'light' ? 'default' : 'outline'}
                  onClick={() => handleThemeChange('light')}
                  className={`h-20 flex flex-col items-center space-y-2 ${
                    theme === 'light' 
                      ? 'bg-caesar-gold text-caesar-black border-caesar-gold' 
                      : 'border-gray-700 hover:border-caesar-gold'
                  }`}
                  data-testid="light-theme-button"
                >
                  <Sun className="w-6 h-6" />
                  <span>Light</span>
                </Button>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <Label className="text-base font-medium">Display Settings</Label>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-medium">Compact Mode</Label>
                    <p className="text-sm text-gray-400">Reduce spacing for more content</p>
                  </div>
                  <Switch data-testid="compact-mode-switch" />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-medium">Auto-hide Sidebar (Mobile)</Label>
                    <p className="text-sm text-gray-400">Sidebar collapses on small screens</p>
                  </div>
                  <Switch defaultChecked data-testid="auto-hide-sidebar-switch" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card className="bg-caesar-dark border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bell className="w-5 h-5 text-caesar-gold" />
              <span>Notifications</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="font-medium">Trading Alerts</Label>
                  <p className="text-sm text-gray-400">Price changes, trade executions</p>
                </div>
                <Switch
                  checked={notifications.trading}
                  onCheckedChange={(enabled) => handleNotificationChange('trading', enabled)}
                  data-testid="trading-notifications-switch"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label className="font-medium">Airdrops</Label>
                  <p className="text-sm text-gray-400">New airdrop opportunities</p>
                </div>
                <Switch
                  checked={notifications.airdrops}
                  onCheckedChange={(enabled) => handleNotificationChange('airdrops', enabled)}
                  data-testid="airdrops-notifications-switch"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label className="font-medium">Rewards & Points</Label>
                  <p className="text-sm text-gray-400">Caesar Points, tier changes</p>
                </div>
                <Switch
                  checked={notifications.rewards}
                  onCheckedChange={(enabled) => handleNotificationChange('rewards', enabled)}
                  data-testid="rewards-notifications-switch"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label className="font-medium">System Updates</Label>
                  <p className="text-sm text-gray-400">Maintenance, new features</p>
                </div>
                <Switch
                  checked={notifications.system}
                  onCheckedChange={(enabled) => handleNotificationChange('system', enabled)}
                  data-testid="system-notifications-switch"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Settings */}
        <Card className="bg-caesar-dark border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-caesar-gold" />
              <span>Account</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label className="text-base font-medium mb-4 block">Current Tier</Label>
              <div className="flex items-center space-x-3">
                <Badge variant="secondary" className="bg-caesar-gold text-caesar-black">
                  {user?.tier}
                </Badge>
                <span className="text-caesar-gold font-mono">
                  {user?.caesarPoints?.toLocaleString()} points
                </span>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <Label className="text-base font-medium">Security</Label>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-medium">Two-Factor Authentication</Label>
                    <p className="text-sm text-gray-400">Secure your account</p>
                  </div>
                  <Badge variant="outline">Coming Soon</Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-medium">Session Timeout</Label>
                    <p className="text-sm text-gray-400">Auto-logout after inactivity</p>
                  </div>
                  <Badge variant="outline">30 minutes</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Mobile & Responsive Settings */}
        <Card className="bg-caesar-dark border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Smartphone className="w-5 h-5 text-caesar-gold" />
              <span>Mobile Experience</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="font-medium">Touch-friendly UI</Label>
                  <p className="text-sm text-gray-400">Larger buttons and touch targets</p>
                </div>
                <Switch defaultChecked data-testid="touch-friendly-switch" />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label className="font-medium">Simplified Layout</Label>
                  <p className="text-sm text-gray-400">Hide advanced features on mobile</p>
                </div>
                <Switch defaultChecked data-testid="simplified-layout-switch" />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label className="font-medium">Swipe Gestures</Label>
                  <p className="text-sm text-gray-400">Navigate with swipe actions</p>
                </div>
                <Switch data-testid="swipe-gestures-switch" />
              </div>
            </div>

            <Separator />

            <div>
              <Label className="text-base font-medium mb-4 block">Quick Actions</Label>
              <p className="text-sm text-gray-400 mb-3">
                Customize which features appear in mobile quick access bar
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">Trade</Badge>
                <Badge variant="outline">Snipe</Badge>
                <Badge variant="outline">Deploy</Badge>
                <Badge variant="outline">Scan</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reset Settings */}
      <Card className="bg-red-950/20 border-red-800/30">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-red-200">Reset Settings</h3>
              <p className="text-sm text-red-300">
                This will reset all settings to their default values.
              </p>
            </div>
            <Button
              variant="destructive"
              onClick={resetToDefaults}
              data-testid="reset-settings-button"
            >
              Reset to Defaults
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}