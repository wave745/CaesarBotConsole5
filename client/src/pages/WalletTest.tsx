import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useWallet } from "@/providers/WalletProvider";
import { useWalletAuth } from "@/hooks/useWalletAuth";
import { useAppStore } from "@/store/useAppStore";

export function WalletTest() {
  const { connected, publicKey, connect, disconnect } = useWallet();
  const { isAuthenticated, isAuthenticating } = useWalletAuth();
  const { user, isWalletConnected } = useAppStore();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-caesar-gold">Wallet Connection Test</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Wallet Provider Status */}
        <Card>
          <CardHeader>
            <CardTitle>Wallet Provider Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <strong>Connected:</strong> {connected ? "✅ Yes" : "❌ No"}
            </div>
            <div>
              <strong>Public Key:</strong> 
              <br />
              <code className="text-xs bg-gray-800 p-1 rounded">
                {publicKey?.toString() || "None"}
              </code>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={connect} 
                disabled={connected}
                data-testid="connect-wallet"
              >
                Connect Wallet
              </Button>
              <Button 
                onClick={disconnect} 
                disabled={!connected}
                variant="destructive"
                data-testid="disconnect-wallet"
              >
                Disconnect
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Authentication Status */}
        <Card>
          <CardHeader>
            <CardTitle>Authentication Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <strong>Authenticated:</strong> {isAuthenticated ? "✅ Yes" : "❌ No"}
            </div>
            <div>
              <strong>Authenticating:</strong> {isAuthenticating ? "🔄 Yes" : "❌ No"}
            </div>
            <div>
              <strong>Store Connected:</strong> {isWalletConnected ? "✅ Yes" : "❌ No"}
            </div>
          </CardContent>
        </Card>

        {/* User Store Status */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>User Store Data</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-800 p-4 rounded text-xs overflow-auto">
              {JSON.stringify({
                user,
                isWalletConnected,
              }, null, 2)}
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}