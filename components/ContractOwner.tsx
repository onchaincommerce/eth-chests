import { useCallback, useState } from 'react';
import { 
  Transaction,
  TransactionButton,
  TransactionSponsor,
  TransactionStatus,
  TransactionStatusLabel,
  TransactionStatusAction,
} from "@coinbase/onchainkit/transaction";
import type { LifecycleStatus } from '@coinbase/onchainkit/transaction';
import { parseEther, formatEther } from 'ethers/lib/utils';
import { useAccount } from 'wagmi';
import { ethers } from 'ethers';

// Define the type that matches OnchainKit's expectations
type TransactionCall = {
  to: `0x${string}`;
  data: `0x${string}`;
  value?: bigint;
};

const CONTRACT_ADDRESS = "0xad0B9085A343be3B5273619A053Ffa5c60789173" as `0x${string}`;
const OWNER_ADDRESS = "0xc17c78C007FC5C01d796a30334fa12b025426652";
const BASE_SEPOLIA_CHAIN_ID = 84532;

const contractInterface = new ethers.utils.Interface([
  "function owner() view returns (address)",
  "function withdraw(uint256 amount) external",
  "function setChestPrice(uint256 _price) external"
]);

export default function ContractOwner() {
  const { address } = useAccount();
  const [withdrawAmount, setWithdrawAmount] = useState("0.1");
  const [contractBalance, setContractBalance] = useState<string | null>(null);

  // Check if connected wallet is owner
  const isOwner = address?.toLowerCase() === OWNER_ADDRESS.toLowerCase();

  // Get contract balance
  const fetchContractBalance = async () => {
    const provider = new ethers.providers.JsonRpcProvider("https://sepolia.base.org");
    const balance = await provider.getBalance(CONTRACT_ADDRESS);
    setContractBalance(formatEther(balance));
  };

  const handleOnStatus = useCallback((status: LifecycleStatus) => {
    console.log('Transaction status:', status);
    if (status.statusName === 'success') {
      fetchContractBalance();
    }
  }, []);

  // Create withdraw transaction
  const getWithdrawCalls = (): TransactionCall[] => [{
    to: CONTRACT_ADDRESS,
    data: contractInterface.encodeFunctionData("withdraw", [
      parseEther(withdrawAmount).toString()
    ]) as `0x${string}`,
  }];

  if (!isOwner) {
    return null;
  }

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-red-50 dark:bg-red-900/20 rounded-lg shadow-lg max-w-md mx-auto mt-8">
      <h2 className="text-2xl font-bold mb-6 text-center">Contract Owner Controls</h2>
      
      {/* Contract Balance */}
      <div className="w-full mb-6">
        <div className="flex justify-between items-center">
          <span>Contract Balance:</span>
          <span className="font-bold">
            {contractBalance ? `${contractBalance} ETH` : '...'}
          </span>
        </div>
        <button 
          onClick={fetchContractBalance}
          className="mt-2 text-sm text-blue-600 hover:underline"
        >
          Refresh Balance
        </button>
      </div>

      {/* Withdraw Form */}
      <div className="w-full">
        <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-md mb-6">
          <h3 className="text-xl font-semibold mb-4">Withdraw Funds</h3>
          <div className="mb-4">
            <input
              type="number"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              step="0.01"
              min="0"
              className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-600"
              placeholder="Amount in ETH"
            />
          </div>
          <Transaction
            chainId={BASE_SEPOLIA_CHAIN_ID}
            calls={getWithdrawCalls()}
            onStatus={handleOnStatus}
          >
            <TransactionButton 
              className="w-full py-3 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              text="Withdraw ETH"
            />
            <TransactionSponsor />
            <TransactionStatus>
              <TransactionStatusLabel />
              <TransactionStatusAction />
            </TransactionStatus>
          </Transaction>
        </div>
      </div>
    </div>
  );
} 