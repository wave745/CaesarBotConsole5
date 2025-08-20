import { createContext, useContext, useEffect, useState } from 'react';
import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
import { toast } from 'react-hot-toast';

interface WalletContextType {
  connected: boolean;
  publicKey: PublicKey | null;
  signMessage: ((message: Uint8Array) => Promise<Uint8Array>) | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  connection: Connection;
}

const WalletContext = createContext<WalletContextType | null>(null);

interface WalletProviderProps {
  children: React.ReactNode;
  network?: 'mainnet-beta' | 'devnet' | 'testnet';
}

export function WalletProvider({ children, network = 'devnet' }: WalletProviderProps) {
  const [connected, setConnected] = useState(false);
  const [publicKey, setPublicKey] = useState<PublicKey | null>(null);
  const [signMessage, setSignMessage] = useState<((message: Uint8Array) => Promise<Uint8Array>) | null>(null);

  // Create connection
  const connection = new Connection(
    import.meta.env.VITE_RPC_ENDPOINT || clusterApiUrl(network),
    'confirmed'
  );

  const connect = async () => {
    try {
      // Check if wallet is available (Phantom, Solflare, etc.)
      const { solana } = window as any;
      
      if (!solana) {
        toast.error('Please install a Solana wallet (Phantom, Solflare, etc.)');
        return;
      }

      const response = await solana.connect({ onlyIfTrusted: false });
      const pubKey = new PublicKey(response.publicKey.toString());
      
      setPublicKey(pubKey);
      setConnected(true);
      
      // Set up sign message function
      setSignMessage(() => async (message: Uint8Array) => {
        const { signature } = await solana.signMessage(message);
        return signature;
      });
      
      toast.success('Wallet connected!');
    } catch (error: any) {
      console.error('Wallet connection failed:', error);
      toast.error('Failed to connect wallet');
    }
  };

  const disconnect = async () => {
    try {
      const { solana } = window as any;
      if (solana) {
        await solana.disconnect();
      }
      
      setConnected(false);
      setPublicKey(null);
      setSignMessage(null);
      toast.success('Wallet disconnected');
    } catch (error) {
      console.error('Disconnect failed:', error);
    }
  };

  // Auto-connect on page load if previously connected
  useEffect(() => {
    const { solana } = window as any;
    if (solana?.isPhantom && solana.isConnected) {
      connect();
    }
  }, []);

  const value: WalletContextType = {
    connected,
    publicKey,
    signMessage,
    connect,
    disconnect,
    connection,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}