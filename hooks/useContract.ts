import { useEffect, useState, useCallback } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESS } from '../constants';

interface ContractConfig {
  address?: string;
  abi?: ethers.ContractInterface;
}

const DEFAULT_ABI = [
  "function buyChest() external payable",
  "function claimPrize(uint256 purchaseBlockNumber) external",
  "event PrizeAwarded(address indexed player, uint256 prize)"
];

export function useContract(config?: ContractConfig) {
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const initContract = useCallback(async () => {
    try {
      const provider = new ethers.providers.JsonRpcProvider("https://sepolia.base.org");
      const contractInstance = new ethers.Contract(
        config?.address || CONTRACT_ADDRESS,
        config?.abi || DEFAULT_ABI,
        provider
      );
      
      // Test the contract connection
      await contractInstance.provider.getNetwork();
      
      setContract(contractInstance);
      setError(null);
    } catch (err) {
      console.error('Error initializing contract:', err);
      setError(err instanceof Error ? err : new Error('Failed to initialize contract'));
      setContract(null);
    }
  }, [config?.address, config?.abi]);

  useEffect(() => {
    initContract();
    
    // Retry connection every 30 seconds if failed
    const interval = setInterval(() => {
      if (!contract) {
        initContract();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [initContract, contract]);

  return { contract, error };
} 