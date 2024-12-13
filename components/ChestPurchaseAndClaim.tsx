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

const CONTRACT_ADDRESS = "0xad0B9085A343be3B5273619A053Ffa5c60789173";
const CHEST_PRICE = "0.01";
const BASE_SEPOLIA_CHAIN_ID = 84532;
const BASE_SEPOLIA_EXPLORER = "https://sepolia.basescan.org";

const contractInterface = new ethers.utils.Interface([
  "function buyChest() external payable",
  "function claimPrize(uint256 purchaseBlockNumber) external",
  "event PrizeAwarded(address indexed player, uint256 prize)"
]);

export default function ChestPurchaseAndClaim() {
  const { address } = useAccount();
  const [purchaseBlockNumber, setPurchaseBlockNumber] = useState<number | null>(null);
  const [canClaim, setCanClaim] = useState(false);
  const [prizeAmount, setPrizeAmount] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const handleOnStatus = useCallback(async (status: LifecycleStatus) => {
    console.log('Transaction status:', status);
    
    if (status.statusName === 'success') {
      const receipt = status.statusData.transactionReceipts[0];
      setTxHash(receipt.transactionHash);

      if (!purchaseBlockNumber) {
        // This is the buy transaction
        const blockNumber = Number(receipt.blockNumber);
        setPurchaseBlockNumber(blockNumber);
        setTimeout(() => setCanClaim(true), 15000);
      } else {
        // This is the claim transaction
        // Parse the PrizeAwarded event from the logs
        const logs = receipt.logs;
        for (const log of logs) {
          try {
            const parsedLog = contractInterface.parseLog(log);
            if (parsedLog.name === 'PrizeAwarded') {
              const prize = formatEther(parsedLog.args.prize);
              console.log('Prize won:', prize); // Debug log
              setPrizeAmount(prize);
              setCanClaim(false); // Make sure we're not in claim state
              break;
            }
          } catch (e) {
            console.error('Error parsing log:', e);
          }
        }
      }
    }
  }, [purchaseBlockNumber]);

  const purchaseCalls = [{
    to: CONTRACT_ADDRESS,
    data: contractInterface.encodeFunctionData("buyChest", []),
    value: parseEther(CHEST_PRICE).toString(),
  }];

  const getClaimCalls = () => {
    if (!purchaseBlockNumber) return [];
    return [{
      to: CONTRACT_ADDRESS,
      data: contractInterface.encodeFunctionData("claimPrize", [purchaseBlockNumber]),
    }];
  };

  // Add reset function
  const resetGame = useCallback(() => {
    console.log('Resetting game...'); // Debug log
    setPurchaseBlockNumber(null);
    setCanClaim(false);
    setPrizeAmount(null);
    setTxHash(null);
  }, []);

  // Debug log to track state
  console.log('Current state:', {
    purchaseBlockNumber,
    canClaim,
    prizeAmount,
    txHash
  });

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-gray-50 dark:bg-gray-800 rounded-lg shadow-lg max-w-md mx-auto">
      {!purchaseBlockNumber ? (
        <div className="w-full">
          <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-md mb-6">
            <h3 className="text-xl font-semibold mb-4">Open a Treasure Chest</h3>
            <div className="flex justify-between items-center mb-4">
              <span>Cost:</span>
              <span className="font-bold">{CHEST_PRICE} ETH</span>
            </div>
            <Transaction
              chainId={BASE_SEPOLIA_CHAIN_ID}
              calls={purchaseCalls}
              onStatus={handleOnStatus}
            >
              <TransactionButton className="w-full py-3 px-4 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors">
                Buy Chest 🎁
              </TransactionButton>
              <TransactionSponsor />
              <TransactionStatus>
                <TransactionStatusLabel />
                <TransactionStatusAction />
              </TransactionStatus>
            </Transaction>
          </div>
        </div>
      ) : canClaim ? (
        <div className="w-full">
          <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-md mb-6">
            <h3 className="text-xl font-semibold mb-4">Claim Your Treasure</h3>
            <div className="mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Purchase Block: {purchaseBlockNumber}
              </p>
            </div>
            <Transaction 
              chainId={BASE_SEPOLIA_CHAIN_ID}
              calls={getClaimCalls()}
              onStatus={handleOnStatus}
            >
              <TransactionButton className="w-full py-3 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                Claim Prize 💎
              </TransactionButton>
              <TransactionSponsor />
              <TransactionStatus>
                <TransactionStatusLabel />
                <TransactionStatusAction />
              </TransactionStatus>
            </Transaction>
          </div>
        </div>
      ) : prizeAmount ? (
        <div className="w-full bg-green-100 dark:bg-green-900 p-6 rounded-lg text-center">
          <h3 className="text-xl font-bold mb-4">🎉 Treasure Found! 🎉</h3>
          <p className="text-2xl font-bold mb-4 text-green-800 dark:text-green-200">
            {prizeAmount} ETH
          </p>
          <div className="space-y-4">
            <a 
              href={`${BASE_SEPOLIA_EXPLORER}/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-blue-600 dark:text-blue-400 hover:underline mb-4"
            >
              View on Block Explorer ↗
            </a>
            <button
              onClick={resetGame}
              className="w-full py-3 px-4 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
            >
              Play Again! 🎲
            </button>
          </div>
        </div>
      ) : (
        <div className="w-full bg-yellow-100 dark:bg-yellow-900 p-6 rounded-lg">
          <p className="text-center text-yellow-800 dark:text-yellow-200">
            Preparing your treasure... It will be claimable in a few seconds. ⏳
          </p>
        </div>
      )}
    </div>
  );
} 