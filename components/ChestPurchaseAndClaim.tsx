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
import { useEthPrice } from '../hooks/useEthPrice';
import { 
  CONTRACT_ADDRESS, 
  CHEST_PRICE, 
  BASE_SEPOLIA_CHAIN_ID, 
  BASE_SEPOLIA_EXPLORER 
} from '../constants';

// Define the type that matches OnchainKit's expectations
type TransactionCall = {
  to: `0x${string}`;
  data: `0x${string}`;
  value?: bigint;
};

const contractInterface = new ethers.utils.Interface([
  "function buyChest() external payable",
  "function claimPrize(uint256 purchaseBlockNumber) external",
  "event PrizeAwarded(address indexed player, uint256 prize)"
]);

export default function ChestPurchaseAndClaim() {
  const { address: _ } = useAccount();
  const [purchaseBlockNumber, setPurchaseBlockNumber] = useState<number | null>(null);
  const [canClaim, setCanClaim] = useState(false);
  const [prizeAmount, setPrizeAmount] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const ethPrice = useEthPrice();

  const handleOnStatus = useCallback(async (status: LifecycleStatus) => {
    console.log('Transaction status:', status);
    
    if (status.statusName === 'success') {
      const receipt = status.statusData.transactionReceipts[0];
      setTxHash(receipt.transactionHash);

      if (!purchaseBlockNumber) {
        const blockNumber = Number(receipt.blockNumber);
        setPurchaseBlockNumber(blockNumber);
        setTimeout(() => setCanClaim(true), 15000);
      } else {
        const logs = receipt.logs;
        for (const log of logs) {
          try {
            const parsedLog = contractInterface.parseLog(log);
            if (parsedLog.name === 'PrizeAwarded') {
              const prize = formatEther(parsedLog.args.prize);
              setPrizeAmount(prize);
              setCanClaim(false);
              break;
            }
          } catch (e) {
            console.error('Error parsing log:', e);
          }
        }
      }
    }
  }, [purchaseBlockNumber]);

  const purchaseCalls: TransactionCall[] = [{
    to: CONTRACT_ADDRESS,
    data: contractInterface.encodeFunctionData("buyChest", []) as `0x${string}`,
    value: BigInt(parseEther(CHEST_PRICE).toString()),
  }];

  const getClaimCalls = (): TransactionCall[] => {
    if (!purchaseBlockNumber) return [];
    return [{
      to: CONTRACT_ADDRESS,
      data: contractInterface.encodeFunctionData("claimPrize", [purchaseBlockNumber]) as `0x${string}`,
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

  const formatUsdValue = (ethAmount: string) => {
    if (!ethPrice) return '';
    const usdValue = Number(ethAmount) * ethPrice;
    return `(≈$${usdValue.toFixed(2)})`;
  };

  return (
    <div className="text-amber-200">
      {!purchaseBlockNumber ? (
        <div className="w-full">
          <h3 className="text-2xl font-pirata mb-6 text-center text-amber-300 drop-shadow-lg">
            Unlock the Chest's Secrets
          </h3>
          <div className="flex justify-between items-center mb-6">
            <span>Offering:</span>
            <span className="text-right">
              <span className="font-bold">{CHEST_PRICE} ETH</span>
              <span className="text-sm ml-2 text-amber-200/80">{formatUsdValue(CHEST_PRICE)}</span>
            </span>
          </div>
          <Transaction
            chainId={BASE_SEPOLIA_CHAIN_ID}
            calls={purchaseCalls}
            onStatus={handleOnStatus}
          >
            <TransactionButton 
              className="w-full py-3 px-4 bg-amber-600/80 hover:bg-amber-600 text-white rounded-lg transition-colors"
              text="Buy Chest 🎁"
            />
            <TransactionSponsor />
            <TransactionStatus>
              <TransactionStatusLabel />
              <TransactionStatusAction />
            </TransactionStatus>
          </Transaction>
        </div>
      ) : canClaim ? (
        <div className="w-full">
          <h3 className="text-2xl font-semibold mb-6 text-center text-amber-300 drop-shadow-lg">
            Claim Yer Bounty!
          </h3>
          <div className="mb-4 text-center">
            <span className="text-amber-200">
              Purchase Block: <span className="font-bold">{purchaseBlockNumber}</span>
            </span>
          </div>
          <Transaction 
            chainId={BASE_SEPOLIA_CHAIN_ID}
            calls={getClaimCalls()}
            onStatus={handleOnStatus}
          >
            <TransactionButton 
              className="w-full py-3 px-4 bg-amber-600/80 hover:bg-amber-600 text-white rounded-lg transition-colors"
              text="Claim Prize 💎"
            />
            <TransactionSponsor />
            <TransactionStatus>
              <TransactionStatusLabel />
              <TransactionStatusAction />
            </TransactionStatus>
          </Transaction>
        </div>
      ) : prizeAmount ? (
        <div className="text-center">
          <h3 className="text-2xl font-bold mb-4 text-amber-300 drop-shadow-lg">
            🎉 Treasure Secured! 🎉
          </h3>
          <div className="text-2xl font-bold mb-2">
            <span>{prizeAmount} ETH</span>
            <span className="text-lg ml-2 text-amber-200/80">{formatUsdValue(prizeAmount)}</span>
          </div>
          <div className="space-y-4">
            <a 
              href={`${BASE_SEPOLIA_EXPLORER}/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-amber-400 hover:text-amber-300 transition-colors mb-4"
            >
              View on Block Explorer ↗
            </a>
            <button
              onClick={resetGame}
              className="w-full py-3 px-4 bg-amber-600/80 hover:bg-amber-600 text-white rounded-lg transition-colors"
            >
              Play Again! 🎲
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center">
          <span className="text-amber-200">
            The chest's lock be turnin'... Stand ready to claim yer prize! ⏳
          </span>
        </div>
      )}
    </div>
  );
} 