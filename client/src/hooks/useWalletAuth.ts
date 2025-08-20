import { useWallet } from '@/providers/WalletProvider';
import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { toast } from 'react-hot-toast';
import bs58 from 'bs58';
import { useAppStore } from '@/store/useAppStore';

export function useWalletAuth() {
  const { publicKey, signMessage, connected, disconnect } = useWallet();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [, navigate] = useLocation();
  const { setUser, user, connectWallet, setWalletConnected } = useAppStore();

  // Check if user is authenticated on wallet connection
  useEffect(() => {
    if (connected && publicKey) {
      handleAuthentication();
    } else {
      setIsAuthenticated(false);
      setWalletConnected(false);
      setUser(null);
    }
  }, [connected, publicKey]);

  const handleAuthentication = async () => {
    if (!publicKey || !signMessage) {
      toast.error('Wallet not properly connected');
      return;
    }

    setIsAuthenticating(true);

    try {
      // Step 1: Get nonce from server
      const nonceResponse = await fetch('/api/auth/nonce');
      if (!nonceResponse.ok) {
        throw new Error('Failed to get authentication nonce');
      }
      
      const { nonce } = await nonceResponse.json();

      // Step 2: Sign the nonce
      const message = new TextEncoder().encode(
        `Authenticate with Caesarbot Console\nNonce: ${nonce}\nWallet: ${publicKey.toString()}`
      );
      
      const signature = await signMessage(message);

      // Step 3: Verify signature on server
      const verifyResponse = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          publicKey: publicKey.toString(),
          signature: bs58.encode(signature),
          nonce,
        }),
      });

      if (!verifyResponse.ok) {
        throw new Error('Authentication failed');
      }

      const { user, session } = await verifyResponse.json();

      // Update app state using the existing connectWallet method
      await connectWallet(publicKey.toString());
      setWalletConnected(true);
      
      setIsAuthenticated(true);
      toast.success('Wallet authenticated successfully!');

    } catch (error: any) {
      console.error('Authentication error:', error);
      toast.error(error.message || 'Authentication failed');
      await handleDisconnect();
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
      setIsAuthenticated(false);
      setWalletConnected(false);
      setUser(null);
      toast.success('Wallet disconnected');
      navigate('/');
    } catch (error) {
      console.error('Disconnect error:', error);
    }
  };

  const requireAuth = (callback: () => void) => {
    if (!isAuthenticated) {
      toast.error('Please connect your wallet first');
      navigate('/');
      return;
    }
    callback();
  };

  return {
    isAuthenticated,
    isAuthenticating,
    publicKey,
    connected,
    handleAuthentication,
    handleDisconnect,
    requireAuth,
  };
}