import { Button } from "@/components/ui/button";
import { Wallet, LogOut } from "lucide-react";
import { useWallet } from "@/providers/WalletProvider";
import { useWalletAuth } from "@/hooks/useWalletAuth";
import { useAppStore } from "@/store/useAppStore";
import { cn } from "@/lib/utils";

interface WalletConnectButtonProps {
  className?: string;
}

export function WalletConnectButton({ className }: WalletConnectButtonProps) {
  const { connected, connect } = useWallet();
  const { isAuthenticated, isAuthenticating, handleDisconnect } = useWalletAuth();
  const { user } = useAppStore();

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  if (connected && isAuthenticated && user?.walletAddress) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-800/50 rounded-lg border border-gray-700">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-sm text-gray-300">
            {truncateAddress(user.walletAddress)}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDisconnect}
          className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
          data-testid="button-wallet-disconnect"
        >
          <LogOut className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <Button
      onClick={connected ? () => {} : connect}
      disabled={isAuthenticating}
      className={cn(
        "bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400",
        "text-black font-semibold shadow-lg hover:shadow-yellow-500/25",
        "border-0 transition-all duration-200",
        className
      )}
      data-testid="button-wallet-connect"
    >
      <Wallet className="w-4 h-4 mr-2" />
      {isAuthenticating ? "Connecting..." : "Connect Wallet"}
    </Button>
  );
}