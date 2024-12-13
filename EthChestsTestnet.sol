// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title EthChests (Blockhash-Based Randomness) - Base Testnet Version
 * @dev This contract is intended for deployment on the Base testnet (base-sepolia).
 *      Users buy chests with test ETH and can claim a pseudo-random prize.
 *      Randomness is derived from blockhash, suitable for low-stakes scenarios.
 *
 * USAGE:
 * - Deploy on base-sepolia.
 * - Fund with some test ETH if needed (e.g., from a faucet).
 * - Users call buyChest() paying 0.01 test ETH.
 * - After at least one new block, they call claimPrize() with the block number where they bought the chest.
 */

contract EthChestsTestnet {
    address public owner;
    uint256 public chestPrice = 0.01 ether;

    // Probability distribution (sum to 10000)
    uint16[] public probabilities = [6500, 2000, 1000, 400, 100];

    // ETH payouts for each tier
    uint256[] public payouts = [
        0.004 ether, // 65%
        0.008 ether, // 20%
        0.015 ether, // 10%
        0.04 ether,  // 4%
        0.1 ether    // 1%
    ];

    event ChestPurchased(address indexed player, uint256 blockNumber);
    event PrizeAwarded(address indexed player, uint256 prize);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    /**
     * @dev Player buys a chest by sending the exact chestPrice.
     */
    function buyChest() external payable {
        require(msg.value == chestPrice, "Incorrect ETH sent");
        emit ChestPurchased(msg.sender, block.number);
    }

    /**
     * @dev Player calls claimPrize() after at least one new block has been mined.
     * @param purchaseBlockNumber The block number at which buyChest() was called.
     */
    function claimPrize(uint256 purchaseBlockNumber) external {
        require(block.number > purchaseBlockNumber, "Need a future block");
        require(block.number - purchaseBlockNumber <= 256, "Blockhash not available");

        bytes32 hash = blockhash(purchaseBlockNumber);
        require(hash != bytes32(0), "Blockhash not found");

        uint256 randomNumber = uint256(keccak256(abi.encodePacked(hash, msg.sender))) % 10000;

        uint256 cumulative = 0;
        uint256 prize;
        for (uint256 i = 0; i < probabilities.length; i++) {
            cumulative += probabilities[i];
            if (randomNumber < cumulative) {
                prize = payouts[i];
                break;
            }
        }

        if (prize > 0 && prize <= address(this).balance) {
            (bool success, ) = msg.sender.call{value: prize}("");
            require(success, "ETH transfer failed");
            emit PrizeAwarded(msg.sender, prize);
        }
        // House profit accumulates as chestPrice - prize.
    }

    /**
     * @dev Owner can adjust distribution if desired.
     */
    function setDistribution(uint16[] calldata _probabilities, uint256[] calldata _payouts) external onlyOwner {
        require(_probabilities.length == _payouts.length, "Mismatched lengths");
        uint16 sum;
        for (uint16 i = 0; i < _probabilities.length; i++) {
            sum += _probabilities[i];
        }
        require(sum == 10000, "Probabilities must sum to 10000");

        probabilities = _probabilities;
        payouts = _payouts;
    }

    /**
     * @dev Owner can withdraw accumulated funds.
     */
    function withdraw(uint256 amount) external onlyOwner {
        require(amount <= address(this).balance, "Not enough balance");
        (bool success, ) = owner.call{value: amount}("");
        require(success, "Transfer failed");
    }

    /**
     * @dev Adjust chest price if desired.
     */
    function setChestPrice(uint256 _price) external onlyOwner {
        chestPrice = _price;
    }

    receive() external payable {}
} 