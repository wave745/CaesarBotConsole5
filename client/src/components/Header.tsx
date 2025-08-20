import { useAppStore } from "@/store/useAppStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Menu, Search, Bell, Copy } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { WalletConnectButton } from "@/components/WalletConnectButton";
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
      className={`fixed top-0 right-0 h-16 bg-caesar-dark border-b border-gray-800 z-40 transition-all duration-300 ${
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
        <div className="flex-1 max-w-md mx-4 lg:mx-8 hidden sm:block">
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
        <div className="flex items-center space-x-2 lg:space-x-4">
          {/* Network Toggle */}
          <div className="flex items-center">
            <div className="text-xs px-2 py-1 rounded-md bg-gray-800 border border-gray-700">
              <span className="text-yellow-400">●</span> Devnet
            </div>
          </div>

          {/* Wallet Connection */}
          <WalletConnectButton />

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
        </div>
      </div>
    </header>
  );
}
