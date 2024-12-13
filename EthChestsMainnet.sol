// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title EthChests (Blockhash-Based Randomness) - Base Mainnet Version
 * @dev This contract is intended for deployment on the Base mainnet.
 *      Users buy chests with real ETH and can claim a pseudo-random prize.
 *
 * NOTE:
 * - Uses blockhash for randomness. Not secure for high-value scenarios.
 * - Suitable for low-stakes and initial launch.
 */

contract EthChestsMainnet {
    address public owner;
    uint256 public chestPrice = 0.01 ether;

    // Probability distribution (sum to 10000)
    uint16[] public probabilities = [6500, 2000, 1000, 400, 100];

    // ETH payouts
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

    function buyChest() external payable {
        require(msg.value == chestPrice, "Incorrect ETH sent");
        emit ChestPurchased(msg.sender, block.number);
    }

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
    }

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

    function withdraw(uint256 amount) external onlyOwner {
        require(amount <= address(this).balance, "Not enough balance");
        (bool success, ) = owner.call{value: amount}("");
        require(success, "Transfer failed");
    }

    function setChestPrice(uint256 _price) external onlyOwner {
        chestPrice = _price;
    }

    receive() external payable {}
} 