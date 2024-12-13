'use client';

import {
  ConnectWallet,
  Wallet,
  WalletDropdown,
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
import Image from 'next/image';
import ContractOwner from '../components/ContractOwner';

export default function App() {
  return (
    <div className="flex flex-col min-h-screen font-[MedievalSharp] dark:bg-[#1a1a2e] dark:text-amber-100 bg-[#f0e6d2] text-[#2c1810]">
      {/* Header with wallet */}
      <header className="p-4 bg-[#2c1810] dark:bg-[#0f0f1a]">
        <div className="flex justify-between items-center max-w-6xl mx-auto">
          <div className="flex items-center gap-4">
            <Image
              src="/eth-chest-logo.png"
              alt="ETH Chest Logo"
              width={60}
              height={60}
              className="rounded-lg"
            />
            <h1 className="text-4xl text-amber-400 font-bold">ETH Chests</h1>
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
                <WalletDropdownDisconnect />
              </WalletDropdown>
            </Wallet>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-grow">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            {/* Pirate themed intro */}
            <div className="text-center mb-8">
              <p className="text-xl mb-4">
                Ahoy, brave adventurer! 🏴‍☠️
              </p>
              <p className="text-lg mb-6">
                Dare ye try yer luck with our mystical chests? Each one holds secrets and treasures untold!
              </p>
            </div>
            
            {/* Chest purchase component */}
            <ChestPurchaseAndClaim />
            {/* Add owner controls */}
            <ContractOwner />
            
            {/* Prize tiers info */}
            <div className="mt-12 bg-[#2c1810]/10 dark:bg-[#ffffff]/5 rounded-lg p-6">
              <h2 className="text-2xl font-bold mb-4 text-center">Treasure Tiers</h2>
              <div className="space-y-2">
                <p>🥉 Common (65%): 0.004 ETH</p>
                <p>🥈 Uncommon (20%): 0.008 ETH</p>
                <p>🥇 Rare (10%): 0.015 ETH</p>
                <p>💎 Epic (4%): 0.04 ETH</p>
                <p>👑 Legendary (1%): 0.1 ETH</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#2c1810] dark:bg-[#0f0f1a] text-amber-400 py-4">
        <div className="container mx-auto px-4 text-center">
          <p>May fortune favor the bold! ⚔️</p>
        </div>
      </footer>
    </div>
  );
}
