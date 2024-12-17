'use client';

import {
  ConnectWallet,
  Wallet,
  WalletDropdown,
  WalletDropdownLink,
  WalletDropdownDisconnect,
} from '@coinbase/onchainkit/wallet';
import {
  Address,
  Avatar,
  Name,
  Identity,
  EthBalance,
} from '@coinbase/onchainkit/identity';
import ChestPurchaseAndClaim from '../components/ChestPurchaseAndClaim';
import ContractOwner from '../components/ContractOwner';
import Image from 'next/image';
import { useEthPrice } from '../hooks/useEthPrice';
import TransactionHistory from '../components/TransactionHistory';
import { CHEST_PRICE } from '../constants';

export default function App() {
  const ethPrice = useEthPrice();

  const formatUsdValue = (ethAmount: string) => {
    if (!ethPrice) return '';
    const usdValue = Number(ethAmount) * ethPrice;
    return `(≈$${usdValue.toFixed(2)})`;
  };

  const PRIZE_TIERS = [
    { emoji: '🥉', tier: 'Common', chance: '65%', amount: '0.004' },
    { emoji: '🥈', tier: 'Uncommon', chance: '20%', amount: '0.008' },
    { emoji: '🥇', tier: 'Rare', chance: '10%', amount: '0.015' },
    { emoji: '💎', tier: 'Epic', chance: '4%', amount: '0.04' },
    { emoji: '👑', tier: 'Legendary', chance: '1%', amount: '0.1' },
  ];

  return (
    <div className="relative min-h-screen">
      {/* Background Image */}
      <div className="fixed inset-0 -z-10">
        <Image
          src="/pirate-ship-bg.png"
          alt="Pirate Ship Background"
          fill
          className="object-cover object-center"
          priority
        />
        <div className="absolute inset-0 bg-black/70" />
      </div>

      {/* Header with wallet */}
      <header className="p-4 bg-[#2c1810]/80 backdrop-blur-sm relative z-50">
        <div className="flex justify-between items-center max-w-6xl mx-auto">
          <div className="flex items-center gap-4">
            <Image
              src="/eth-chest-logo.png"
              alt="ETH Chest Logo"
              width={60}
              height={60}
              className="rounded-lg"
            />
            <h1 className="text-4xl text-amber-400 font-pirata">ETH Chests</h1>
          </div>
          <div className="wallet-container">
            <Wallet>
              <ConnectWallet>
                <Avatar className="h-6 w-6" />
                <Name />
              </ConnectWallet>
              <WalletDropdown>
                <Identity className="px-4 pt-3 pb-2" hasCopyAddressOnClick>
                  <Avatar />
                  <Name />
                  <Address />
                  <EthBalance />
                </Identity>
                <WalletDropdownLink 
                  icon="wallet" 
                  href="https://sepolia.basescan.org/address/0xad0B9085A343be3B5273619A053Ffa5c60789173"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View Contract
                </WalletDropdownLink>
                <WalletDropdownDisconnect />
              </WalletDropdown>
            </Wallet>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="relative z-10">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            {/* Pirate themed intro */}
            <div className="text-center mb-12">
              <p className="text-4xl mb-4 text-amber-300 drop-shadow-lg font-pirata">
                Ahoy, Treasure Hunter! 🏴‍☠️
              </p>
              <p className="text-xl mb-6 text-amber-200 drop-shadow-lg leading-relaxed">
                Ye stand before the mystical ETH Chests, where digital doubloons await the brave! 
                Will ye risk a mere {CHEST_PRICE} ETH to claim yer share of the bounty?
              </p>
            </div>
            
            {/* Components with glass morphism */}
            <div className="space-y-8">
              {/* Main game container */}
              <div className="backdrop-blur-md bg-black/20 rounded-lg border border-amber-900/30 shadow-xl">
                <div className="p-6">
                  <ChestPurchaseAndClaim />
                </div>
              </div>
              
              {/* Transaction History */}
              <div className="relative">
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                  <span className="text-amber-300 text-2xl">⚓</span>
                </div>
                <TransactionHistory />
              </div>
              
              {/* Prize tiers info */}
              <div className="backdrop-blur-md bg-black/20 p-8 rounded-lg border border-amber-900/30 shadow-xl">
                <h2 className="text-2xl font-bold mb-6 text-center text-amber-300 drop-shadow-lg">
                  The Treasure Map 🗺️
                </h2>
                <p className="text-amber-200/80 mb-6 text-center">
                  Chart yer course to riches! Here be the bounties that await:
                </p>
                <div className="space-y-4 text-amber-200">
                  {PRIZE_TIERS.map(({ emoji, tier, chance, amount }) => (
                    <div key={tier} className="flex justify-between items-center">
                      <span>{emoji} {tier} ({chance})</span>
                      <span className="text-right">
                        <span>{amount} ETH</span>
                        <span className="text-sm ml-2 text-amber-200/80">{formatUsdValue(amount)}</span>
                      </span>
                    </div>
                  ))}
                </div>
                <p className="mt-6 text-amber-200/70 text-sm text-center italic">
                  "Fortune favors the bold, but the sea decides who claims her treasures!"
                </p>
              </div>

              {/* Contract Owner container will only render if owner is connected */}
              <ContractOwner />
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#2c1810]/80 backdrop-blur-sm text-amber-400 py-4 mt-8 relative z-20">
        <div className="container mx-auto px-4 text-center">
          <p className="text-lg">
            May the winds of fortune fill yer sails! ⛵
          </p>
        </div>
      </footer>
    </div>
  );
}
