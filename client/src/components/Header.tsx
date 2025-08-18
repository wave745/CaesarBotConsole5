import { useAppStore } from "@/store/useAppStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Menu, Search, Rocket, Bell, Copy } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import caesarBotLogo from "@assets/CaesarBotLogo-removebg-preview_1755538261130.png";

export function Header() {
  const { sidebarCollapsed, setSidebarCollapsed, user, isWalletConnected } = useAppStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [, setLocation] = useLocation();

  const handleSidebarToggle = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const handleCopyWallet = async () => {
    if (user?.walletAddress) {
      await navigator.clipboard.writeText(user.walletAddress);
    }
  };

  const handleQuickDeploy = () => {
    setLocation("/deploy");
  };

  return (
    <header 
      className={`fixed top-0 right-0 h-16 bg-caesar-dark/95 backdrop-blur-sm border-b border-gray-800 z-40 transition-all duration-300 ${
        sidebarCollapsed ? 'left-0' : 'left-64'
      }`}
      data-testid="header"
    >
      <div className="flex items-center justify-between h-full px-6">
        {/* Sidebar Toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSidebarToggle}
          className="text-gray-400 hover:text-white"
          data-testid="sidebar-toggle"
        >
          <Menu className="w-5 h-5" />
        </Button>

        {/* Search */}
        <div className="flex-1 max-w-md mx-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Search token or wallet..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-800 border-gray-700 pl-10 pr-4 py-2 text-sm focus:border-caesar-gold"
              data-testid="search-input"
            />
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center space-x-4">
          {/* Quick Deploy */}
          <Button 
            onClick={handleQuickDeploy}
            className="bg-caesar-gold text-caesar-black hover:bg-caesar-gold-muted font-medium"
            data-testid="quick-deploy-button"
          >
            <Rocket className="w-4 h-4 mr-2" />
            Quick Deploy
          </Button>

          {/* Notifications */}
          <Button
            variant="ghost"
            size="sm"
            className="relative text-gray-400 hover:text-white"
            data-testid="notifications-button"
          >
            <Bell className="w-5 h-5" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
          </Button>

          {/* Wallet Connection */}
          {isWalletConnected && user && (
            <div className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm font-mono" data-testid="wallet-address-display">
                {user.walletAddress}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyWallet}
                className="text-gray-400 hover:text-white p-1"
                data-testid="copy-wallet-button"
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
