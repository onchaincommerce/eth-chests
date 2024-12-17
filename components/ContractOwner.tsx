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
import { 
  CONTRACT_ADDRESS, 
  OWNER_ADDRESS, 
  BASE_SEPOLIA_CHAIN_ID 
} from '../constants';

// Define the type that matches OnchainKit's expectations
type TransactionCall = {
  to: `0x${string}`;
  data: `0x${string}`;
  value?: bigint;
};

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

  // Handle transaction status
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

  // If not owner, don't render anything
  if (!isOwner) {
    return null;
  }

  return (
    <div className="backdrop-blur-md bg-black/20 rounded-lg border border-amber-900/30 shadow-xl">
      <div className="p-6">
        <h2 className="text-2xl font-pirata mb-6 text-center text-amber-300 drop-shadow-lg">
          Captain's Controls
        </h2>
        
        {/* Contract Balance */}
        <div className="w-full mb-6">
          <div className="flex justify-between items-center text-amber-200">
            <span>Contract Balance:</span>
            <span className="font-bold">
              {contractBalance ? `${contractBalance} ETH` : '...'}
            </span>
          </div>
          <button 
            onClick={fetchContractBalance}
            className="mt-2 text-sm text-amber-400 hover:text-amber-300 transition-colors"
          >
            Refresh Balance
          </button>
        </div>

        {/* Withdraw Form */}
        <div className="w-full">
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-amber-300">Withdraw Funds</h3>
            <div className="mb-4">
              <input
                type="number"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                step="0.01"
                min="0"
                className="w-full p-2 bg-black/30 border border-amber-900/50 rounded text-amber-200 placeholder-amber-200/50"
                placeholder="Amount in ETH"
              />
            </div>
            <Transaction
              chainId={BASE_SEPOLIA_CHAIN_ID}
              calls={getWithdrawCalls()}
              onStatus={handleOnStatus}
            >
              <TransactionButton 
                className="w-full py-3 px-4 bg-amber-600/80 hover:bg-amber-600 text-white rounded-lg transition-colors"
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
    </div>
  );
} 