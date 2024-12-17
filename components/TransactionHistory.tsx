import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { useEthPrice } from '../hooks/useEthPrice';
import { CONTRACT_ADDRESS } from '../constants';

const ITEMS_PER_PAGE = 5;
const MAX_ITEMS = 100;
const BASESCAN_API_KEY = process.env.NEXT_PUBLIC_BASESCAN_API_KEY;
const BASESCAN_API = "https://api-sepolia.basescan.org/api";

interface PrizeEvent {
  player: string;
  prize: string;
  timestamp: number;
  transactionHash: string;
}

interface PrizeTier {
  name: string;
  minValue: number;
  color: string;
  emoji: string;
}

const PRIZE_TIERS: PrizeTier[] = [
  { name: 'All', minValue: 0, color: 'text-amber-200', emoji: '🎯' },
  { name: 'Legendary', minValue: 0.1, color: 'text-amber-300', emoji: '👑' },
  { name: 'Epic', minValue: 0.04, color: 'text-purple-300', emoji: '💎' },
  { name: 'Rare', minValue: 0.015, color: 'text-blue-300', emoji: '🥇' },
  { name: 'Uncommon', minValue: 0.008, color: 'text-green-300', emoji: '🥈' },
  { name: 'Common', minValue: 0.004, color: 'text-gray-300', emoji: '🥉' },
];

const contractInterface = new ethers.utils.Interface([
  "event PrizeAwarded(address indexed player, uint256 prize)"
]);

interface BasescanLog {
  topics: string[];
  data: string;
  timeStamp: string;
  transactionHash: string;
}

interface BasescanResponse {
  status: string;
  result: BasescanLog[];
}

export default function TransactionHistory() {
  const [prizeEvents, setPrizeEvents] = useState<PrizeEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTier, setSelectedTier] = useState<string>('All');
  const ethPrice = useEthPrice();

  const fetchTransactions = async () => {
    try {
      const provider = new ethers.providers.JsonRpcProvider("https://sepolia.base.org");
      const contract = new ethers.Contract(CONTRACT_ADDRESS, contractInterface, provider);

      // Get the latest block number
      const latestBlock = await provider.getBlockNumber();

      // Fetch events from Basescan API
      const response = await fetch(`${BASESCAN_API}?module=logs&action=getLogs&fromBlock=0&toBlock=${latestBlock}&address=${CONTRACT_ADDRESS}&topic0=${ethers.utils.id("PrizeAwarded(address,uint256)")}&apikey=${BASESCAN_API_KEY}`);
      const data: BasescanResponse = await response.json();

      if (data.status === '1' && data.result) {
        const events = data.result.map((log: BasescanLog) => {
          const parsedLog = contractInterface.parseLog({
            topics: log.topics,
            data: log.data
          });
          
          return {
            player: parsedLog.args.player,
            prize: ethers.utils.formatEther(parsedLog.args.prize),
            timestamp: parseInt(log.timeStamp, 16),
            transactionHash: log.transactionHash,
          };
        });

        // Sort by timestamp, most recent first
        events.sort((a, b) => b.timestamp - a.timestamp);
        setPrizeEvents(events);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
    const interval = setInterval(fetchTransactions, 30000);
    return () => clearInterval(interval);
  }, []);

  // Filter and limit to 100 most recent events for the selected tier
  const filteredEvents = prizeEvents
    .filter(event => {
      if (selectedTier === 'All') return true;
      const prizeEth = Number(event.prize);
      const tier = PRIZE_TIERS.find(t => t.name === selectedTier);
      const nextTier = PRIZE_TIERS.find(t => t.minValue > (tier?.minValue || 0));
      return prizeEth >= (tier?.minValue || 0) && (!nextTier || prizeEth < nextTier.minValue);
    })
    .slice(0, MAX_ITEMS);

  const totalPages = Math.ceil(filteredEvents.length / ITEMS_PER_PAGE);
  const paginatedEvents = filteredEvents.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const formatUsdValue = (ethAmount: string) => {
    if (!ethPrice) return '';
    const usdValue = Number(ethAmount) * ethPrice;
    return `(≈$${usdValue.toFixed(2)})`;
  };

  const formatTimeAgo = (timestamp: number) => {
    const seconds = Math.floor(Date.now() / 1000) - timestamp;
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getPrizeClass = (prize: string) => {
    const prizeEth = Number(prize);
    if (prizeEth >= 0.1) return 'text-amber-300'; // Legendary
    if (prizeEth >= 0.04) return 'text-purple-300'; // Epic
    if (prizeEth >= 0.015) return 'text-blue-300'; // Rare
    if (prizeEth >= 0.008) return 'text-green-300'; // Uncommon
    return 'text-gray-300'; // Common
  };

  const PaginationButton = ({ page, active }: { page: number, active: boolean }) => (
    <button
      onClick={() => setCurrentPage(page)}
      className={`px-3 py-1 rounded-md transition-colors ${
        active 
          ? 'bg-amber-600/80 text-white' 
          : 'text-amber-300 hover:bg-amber-600/40'
      }`}
    >
      {page}
    </button>
  );

  const Pagination = () => {
    if (totalPages <= 1) return null;

    let pages = [];
    for (let i = 1; i <= totalPages; i++) {
      // Show first page, last page, current page, and one page before and after current
      if (
        i === 1 ||
        i === totalPages ||
        i === currentPage ||
        i === currentPage - 1 ||
        i === currentPage + 1
      ) {
        pages.push(i);
      } else if (
        i === currentPage - 2 ||
        i === currentPage + 2
      ) {
        pages.push('...');
      }
    }

    // Remove duplicates and ellipsis next to each other
    pages = pages.filter((page, index, array) => 
      page !== array[index - 1] || page !== '...'
    );

    return (
      <div className="flex justify-center items-center space-x-2 mt-6">
        <button
          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
          disabled={currentPage === 1}
          className="px-3 py-1 text-amber-300 hover:bg-amber-600/40 rounded-md disabled:opacity-50 disabled:hover:bg-transparent"
        >
          ��
        </button>
        
        {pages.map((page, index) => (
          typeof page === 'number' 
            ? <PaginationButton key={index} page={page} active={page === currentPage} />
            : <span key={index} className="text-amber-300">...</span>
        ))}

        <button
          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages}
          className="px-3 py-1 text-amber-300 hover:bg-amber-600/40 rounded-md disabled:opacity-50 disabled:hover:bg-transparent"
        >
          →
        </button>
      </div>
    );
  };

  return (
    <div className="backdrop-blur-md bg-black/20 rounded-lg border border-amber-900/30 shadow-xl p-6">
      <h3 className="text-2xl font-pirata mb-6 text-center text-amber-300 drop-shadow-lg">
        Recent Treasures
      </h3>
      
      {/* Tier Filters */}
      <div className="mb-6">
        <div className="flex flex-wrap justify-center gap-2">
          {PRIZE_TIERS.map((tier) => (
            <button
              key={tier.name}
              onClick={() => {
                setSelectedTier(tier.name);
                setCurrentPage(1);
              }}
              className={`px-4 py-2 rounded-lg transition-all transform hover:scale-105 ${
                selectedTier === tier.name
                  ? 'bg-amber-600/80 text-white'
                  : 'bg-black/30 hover:bg-amber-600/40'
              }`}
            >
              <span className="flex items-center gap-2">
                <span>{tier.emoji}</span>
                <span className={tier.color}>{tier.name}</span>
              </span>
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center text-amber-200">
          <p>Loading treasure history... ⏳</p>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="text-center text-amber-200">
          <p>No {selectedTier !== 'All' ? selectedTier : ''} treasures found</p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {paginatedEvents.map((event) => (
              <div 
                key={event.transactionHash}
                className="flex items-center justify-between p-3 rounded-lg bg-black/30 border border-amber-900/20 hover:bg-black/40 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-amber-200">{formatAddress(event.player)}</span>
                  <span className="text-amber-200/50">found</span>
                  <span className={getPrizeClass(event.prize)}>
                    {event.prize} ETH
                    <span className="text-sm ml-2 opacity-75">
                      {formatUsdValue(event.prize)}
                    </span>
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-amber-200/50">{formatTimeAgo(event.timestamp)}</span>
                  <a
                    href={`https://sepolia.basescan.org/tx/${event.transactionHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber-400 hover:text-amber-300 transition-colors"
                  >
                    ↗
                  </a>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 text-center text-amber-200/60">
            Showing {Math.min(MAX_ITEMS, filteredEvents.length)} most recent {selectedTier !== 'All' ? selectedTier : ''} treasures
          </div>
          <Pagination />
        </>
      )}
    </div>
  );
} 