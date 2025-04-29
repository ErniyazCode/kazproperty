
import { useWeb3 } from '@/contexts/Web3Context';
import { Button } from '@/components/ui/button';
import { LogIn, LogOut, Loader2 } from 'lucide-react';

const MetaMaskButton = () => {
  const { isConnected, connect, disconnect, account, isLoading } = useWeb3();
  
  const handleAuth = async () => {
    if (isConnected) {
      disconnect();
    } else {
      await connect();
    }
  };
  
  return (
    <Button 
      onClick={handleAuth} 
      variant={isConnected ? "destructive" : "default"}
      disabled={isLoading}
      className="flex items-center gap-2"
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isConnected ? (
        <LogOut className="h-4 w-4" />
      ) : (
        <LogIn className="h-4 w-4" />
      )}
      {isConnected 
        ? `Disconnect ${account?.slice(0, 6)}...${account?.slice(-4)}` 
        : 'Connect MetaMask'}
    </Button>
  );
};

export default MetaMaskButton;
