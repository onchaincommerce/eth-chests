require('dotenv').config();
const { ethers } = require('ethers');

const CONTRACT_ADDRESS = "0xad0B9085A343be3B5273619A053Ffa5c60789173";
const CHEST_PRICE = "0.01";
const BASE_RPC = process.env.BASE_MAINNET_RPC || "https://sepolia.base.org";
let PRIVATE_KEY = process.env.PRIVATE_KEY || "";

// Remove 0x prefix if present
PRIVATE_KEY = PRIVATE_KEY.startsWith('0x') ? PRIVATE_KEY.slice(2) : PRIVATE_KEY;

const ABI = [
  "function buyChest() external payable",
  "function claimPrize(uint256 purchaseBlockNumber) external",
  "function owner() external view returns (address)"
];

async function main() {
  if (!PRIVATE_KEY) {
    throw new Error("Please set your PRIVATE_KEY in the .env file");
  }

  // Connect to Base Sepolia
  console.log("Connecting to Base Sepolia...");
  const provider = new ethers.providers.JsonRpcProvider(BASE_RPC);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, wallet);

  // Verify connection
  try {
    const network = await provider.getNetwork();
    console.log("Connected to network:", network.name, "chainId:", network.chainId);
    
    const balance = await wallet.getBalance();
    console.log("Wallet address:", wallet.address);
    console.log("Wallet balance:", ethers.utils.formatEther(balance), "ETH");

    // Verify contract
    const owner = await contract.owner();
    console.log("Contract owner:", owner);
    
    // Calculate required amount (chest price + estimated gas)
    const chestPrice = ethers.utils.parseEther(CHEST_PRICE);
    const estimatedGasPrice = await provider.getGasPrice();
    const estimatedGasLimit = 200000; // Combined gas limit for both transactions
    const estimatedGasCost = estimatedGasPrice.mul(estimatedGasLimit);
    const requiredAmount = chestPrice.add(estimatedGasCost);
    
    console.log("\nEstimated costs:");
    console.log("Chest price:", ethers.utils.formatEther(chestPrice), "ETH");
    console.log("Estimated gas cost:", ethers.utils.formatEther(estimatedGasCost), "ETH");
    console.log("Total required:", ethers.utils.formatEther(requiredAmount), "ETH");
    
    if (balance.lt(requiredAmount)) {
      throw new Error(`Insufficient balance. Need at least ${ethers.utils.formatEther(requiredAmount)} ETH (${CHEST_PRICE} ETH for chest + ${ethers.utils.formatEther(estimatedGasCost)} ETH for gas)`);
    }

    // Buy chest
    console.log("\nBuying chest for", CHEST_PRICE, "ETH");
    const buyTx = await contract.buyChest({
      value: ethers.utils.parseEther(CHEST_PRICE),
      gasLimit: 100000 // Reduced gas limit for buy
    });
    console.log("Buy transaction sent:", buyTx.hash);
    console.log("Waiting for transaction confirmation...");
    
    const buyReceipt = await buyTx.wait();
    console.log("Buy transaction confirmed in block:", buyReceipt.blockNumber);
    console.log("Gas used for buy:", buyReceipt.gasUsed.toString());

    // Wait for next block
    console.log("\nWaiting 15 seconds for next block...");
    await new Promise(resolve => setTimeout(resolve, 15000));

    // Claim prize
    console.log("Claiming prize from block:", buyReceipt.blockNumber);
    const claimTx = await contract.claimPrize(buyReceipt.blockNumber, {
      gasLimit: 100000 // Reduced gas limit for claim
    });
    console.log("Claim transaction sent:", claimTx.hash);
    
    const claimReceipt = await claimTx.wait();
    console.log("Claim transaction confirmed in block:", claimReceipt.blockNumber);
    console.log("Gas used for claim:", claimReceipt.gasUsed.toString());

    // Calculate final results
    const finalBalance = await wallet.getBalance();
    console.log("\nFinal wallet balance:", ethers.utils.formatEther(finalBalance), "ETH");
    
    const totalSpent = balance.sub(finalBalance);
    console.log("Total ETH spent (including gas):", ethers.utils.formatEther(totalSpent), "ETH");

  } catch (error) {
    console.error("\nError details:");
    if (error.error) {
      console.error("Provider error:", error.error);
    }
    if (error.transaction) {
      console.error("Transaction:", error.transaction);
    }
    if (error.receipt) {
      console.error("Receipt:", error.receipt);
    }
    console.error("Full error:", error);
    process.exit(1);
  }
}

main().catch(error => {
  console.error("Top level error:", error);
  process.exit(1);
}); 