import { FC } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Button } from '@/components/ui/button';
import { Wallet, LogOut } from 'lucide-react';

export const WalletConnectButton: FC = () => {
  const { connected, disconnect } = useWallet();

  if (connected) {
    return (
      <div className="flex items-center gap-2">
        <WalletMultiButton className="bg-caesar-gold hover:bg-caesar-gold/80 text-black font-medium px-4 py-2 rounded-lg" />
        <Button
          variant="outline"
          size="sm"
          onClick={disconnect}
          className="border-gray-600 hover:border-red-500 hover:text-red-500"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <WalletMultiButton className="bg-caesar-gold hover:bg-caesar-gold/80 text-black font-medium px-4 py-2 rounded-lg flex items-center gap-2">
      <Wallet className="w-4 h-4" />
      Connect Wallet
    </WalletMultiButton>
  );
};