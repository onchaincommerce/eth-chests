import { useCallback } from 'react';
import { TransactionDefault } from "@coinbase/onchainkit/transaction";
import type { LifecycleStatus } from '@coinbase/onchainkit/transaction';
import { parseEther } from 'ethers/lib/utils';

const CONTRACT_ADDRESS = "0xad0B9085A343be3B5273619A053Ffa5c60789173";
const CHEST_PRICE = "0.01";

export default function ChestPurchase() {
  // Handle transaction status updates
  const handleOnStatus = useCallback((status: LifecycleStatus) => {
    console.log('Transaction status:', status);
    
    if (status.statusName === 'success') {
      // Get the block number from the receipt for claiming
      const blockNumber = status.statusData.transactionReceipts[0].blockNumber;
      console.log('Purchase successful in block:', blockNumber);
    }
  }, []);

  // Define the contract calls
  const calls = [
    {
      address: CONTRACT_ADDRESS,
      abi: [
        "function buyChest() external payable",
        "function claimPrize(uint256 purchaseBlockNumber) external"
      ],
      functionName: 'buyChest',
      value: parseEther(CHEST_PRICE).toString(),
    }
  ];

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Buy ETH Chest</h2>
      <div className="bg-gray-100 p-4 rounded-lg mb-4">
        <p>Price: {CHEST_PRICE} ETH</p>
      </div>
      
      <TransactionDefault 
        calls={calls}
        onStatus={handleOnStatus}
      />
    </div>
  );
} 