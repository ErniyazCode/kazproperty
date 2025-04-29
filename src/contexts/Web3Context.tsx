import React, { createContext, useContext, useEffect, useState } from 'react';
import Web3 from 'web3';
import { AbiItem } from 'web3-utils';
import { toast } from 'sonner';
import config from '@/config/config';
import RealEstateABI from '@/abis/RealEstate.json';

// Type definitions are now in global.d.ts

interface Web3ContextType {
  web3: Web3 | null;
  account: string | null;
  contract: any;
  isConnected: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  isLoading: boolean;
}

const Web3Context = createContext<Web3ContextType>({
  web3: null,
  account: null,
  contract: null,
  isConnected: false,
  connect: async () => {},
  disconnect: () => {},
  isLoading: false,
});

export const useWeb3 = () => useContext(Web3Context);

export const Web3Provider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [web3, setWeb3] = useState<Web3 | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [contract, setContract] = useState<any>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Initialize web3
  useEffect(() => {
    const initWeb3 = async () => {
      if (window.ethereum) {
        try {
          const web3Instance = new Web3(window.ethereum);
          setWeb3(web3Instance);
          
          // Check if already connected
          const accounts = await web3Instance.eth.getAccounts();
          if (accounts.length > 0) {
            setAccount(accounts[0]);
            setIsConnected(true);
            initContract(web3Instance, accounts[0]);
          }
          
          // Listen for account changes
          window.ethereum.on('accountsChanged', (newAccounts: string[]) => {
            if (newAccounts.length === 0) {
              setAccount(null);
              setIsConnected(false);
              toast.error('Metamask disconnected');
            } else {
              setAccount(newAccounts[0]);
              setIsConnected(true);
              initContract(web3Instance, newAccounts[0]);
              toast.success('Metamask account changed');
            }
          });
          
          // Listen for chain changes
          window.ethereum.on('chainChanged', () => {
            window.location.reload();
          });
        } catch (error) {
          console.error('Error initializing web3:', error);
          toast.error('Failed to initialize web3');
        }
      } else {
        toast.error('Metamask not detected. Please install Metamask.');
      }
    };
    
    initWeb3();
  }, []);

  // Initialize contract
  const initContract = async (web3Instance: Web3, userAccount: string) => {
    try {
      // Check if ABI and contract address are available
      if (RealEstateABI && config.CONTRACT_ADDRESS) {
        const contractInstance = new web3Instance.eth.Contract(
          RealEstateABI.abi as AbiItem[],
          config.CONTRACT_ADDRESS
        );
        setContract(contractInstance);
      } else {
        console.warn('Contract ABI or address not available');
      }
    } catch (error) {
      console.error('Error initializing contract:', error);
      toast.error('Failed to initialize contract');
    }
  };

  // Connect to MetaMask
  const connect = async () => {
    if (!web3) {
      toast.error('Web3 not initialized');
      return;
    }
    
    setIsLoading(true);
    try {
      // Request account access
      const accounts = await window.ethereum?.request({ method: 'eth_requestAccounts' });
      if (accounts && accounts.length > 0) {
        setAccount(accounts[0]);
        setIsConnected(true);
        initContract(web3, accounts[0]);
        toast.success('Connected to MetaMask');
      }
    } catch (error: any) {
      console.error('Error connecting to MetaMask:', error);
      toast.error(error.message || 'Failed to connect to MetaMask');
    } finally {
      setIsLoading(false);
    }
  };

  // Disconnect from MetaMask
  const disconnect = () => {
    setAccount(null);
    setIsConnected(false);
    toast.info('Disconnected from MetaMask');
  };

  return (
    <Web3Context.Provider value={{ 
      web3, 
      account, 
      contract, 
      isConnected, 
      connect, 
      disconnect,
      isLoading
    }}>
      {children}
    </Web3Context.Provider>
  );
};
