import { useAppStore } from "@/store/useAppStore";
import { Link, useLocation } from "wouter";
import { BarChart3, Rocket, Brain, Target, Wallet, Search, Gift, Bolt, Settings } from "lucide-react";
import caesarBotLogo from "@assets/CaesarBotLogo-removebg-preview_1755561624266.png";
import { useEffect } from "react";

export function Sidebar() {
  const { sidebarCollapsed, setSidebarCollapsed, user } = useAppStore();
  const [location] = useLocation();

  // Auto-collapse sidebar only on initial mobile load
  useEffect(() => {
    if (window.innerWidth < 1024) { // lg breakpoint
      setSidebarCollapsed(true);
    }
  }, []); // Only run once on mount

  // Close sidebar when clicking on mobile nav item
  const handleMobileNavClick = () => {
    if (window.innerWidth < 1024) {
      setSidebarCollapsed(true);
    }
  };

  const menuItems = [
    { path: "/", label: "Dashboard", icon: BarChart3 },
    { path: "/deploy", label: "Deploy", icon: Rocket },
    { path: "/ai-trading", label: "AI Trading", icon: Brain, notification: true, notificationColor: "bg-caesar-purple" },
    { path: "/sniper", label: "Caesar Sniper", icon: Target },
    { path: "/wallet-ops", label: "Wallet Operations", icon: Wallet },
    { path: "/scanner", label: "Pump.fun Scanner", icon: Search },
    { path: "/rewards", label: "Rewards", icon: Gift, notification: true, notificationColor: "bg-green-500" },
    { path: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {!sidebarCollapsed && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarCollapsed(true)}
          data-testid="sidebar-overlay"
        />
      )}
      
      <div 
        className={`fixed left-0 top-0 h-full w-64 bg-caesar-dark border-r border-gray-800 transform transition-transform duration-300 z-50 ${
          sidebarCollapsed ? '-translate-x-full' : 'translate-x-0'
        }`}
        data-testid="sidebar"
      >
      {/* Profile Section */}
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-caesar-gold to-caesar-gold-muted rounded-full flex items-center justify-center">
            <img src={caesarBotLogo} alt="CaesarBot" className="w-8 h-8" />
          </div>
          <div>
            <div className="text-sm font-medium text-caesar-gold" data-testid="console-title">
              Caesarbot console
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="p-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.path || (location === "/" && item.path === "/");
          
          return (
            <Link 
              key={item.path} 
              href={item.path}
              onClick={handleMobileNavClick}
              className={`nav-item flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive 
                  ? 'active' 
                  : 'hover:bg-gray-800'
              }`}
              data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <div className="flex items-center space-x-3">
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </div>
              {item.notification && (
                <div className={`w-2 h-2 ${item.notificationColor} rounded-full animate-pulse-slow`}></div>
              )}
            </Link>
          );
        })}
      </nav>
      </div>
    </>
  );
}
