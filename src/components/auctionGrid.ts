import { AuctionListing } from '../lib/api';
import { createIcon } from './icons';

interface AuctionGridProps {
  auctions: AuctionListing[];
  searchQuery: string;
  loading: boolean;
  error: string | null;
  onSelectAuction: (auction: AuctionListing) => void;
}

type SortOption = 'newest' | 'ending-soon' | 'price-desc' | 'price-asc';

function formatTimeRemaining(endTime: string): string {
  const now = new Date();
  const end = new Date(endTime);
  const diff = end.getTime() - now.getTime();

  if (diff <= 0) return 'Ended';

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  }

  return `${hours}h ${minutes}m`;
}

function getCurrentBid(auction: AuctionListing): number {
  if (!auction.bids || auction.bids.length === 0) return 0;
  return Math.max(...auction.bids.map(bid => bid.amount));
}

function createAuctionCard(auction: AuctionListing, onClick: () => void): HTMLElement {
  const card = document.createElement('div');
  card.className = 'auction-card';
  card.onclick = onClick;

  const imageUrl = auction.media?.[0]?.url || 'https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=800';
  
  const image = document.createElement('img');
  image.src = imageUrl;
  image.alt = auction.title;
  image.className = 'auction-card-image';
  image.onerror = () => {
    image.src = 'https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=800';
  };

  const content = document.createElement('div');
  content.className = 'auction-card-content';

  const title = document.createElement('h3');
  title.className = 'auction-card-title';
  title.textContent = auction.title;

  const description = document.createElement('p');
  description.className = 'auction-card-description';
  description.textContent = auction.description || 'No description';

  const info = document.createElement('div');
  info.className = 'auction-card-info';

  const bids = document.createElement('span');
  bids.className = 'auction-card-bids';
  bids.textContent = `${auction._count.bids} bids`;

  const time = document.createElement('span');
  time.className = 'auction-card-time';
  time.textContent = formatTimeRemaining(auction.endsAt);

  info.appendChild(bids);
  info.appendChild(time);

  const currentBid = getCurrentBid(auction);
  const bidAmount = document.createElement('div');
  bidAmount.className = 'auction-card-current-bid';
  bidAmount.textContent = currentBid > 0 ? `${currentBid.toLocaleString()} credits` : 'No bids yet';

  content.appendChild(title);
  content.appendChild(description);
  content.appendChild(info);
  content.appendChild(bidAmount);

  card.appendChild(image);
  card.appendChild(content);

  return card;
}

export function renderAuctionGrid(props: AuctionGridProps): HTMLElement {
  const section = document.createElement('section');
  section.className = 'auctions-section';

  // Track current sort option
  let currentSort: SortOption = 'ending-soon';

  const headerContainer = document.createElement('div');
  headerContainer.style.display = 'flex';
  headerContainer.style.justifyContent = 'space-between';
  headerContainer.style.alignItems = 'center';
  headerContainer.style.marginBottom = '2rem';
  headerContainer.style.flexWrap = 'wrap';
  headerContainer.style.gap = '1rem';

  const title = document.createElement('h2');
  title.className = 'auctions-title';
  title.style.margin = '0';
  title.textContent = props.searchQuery 
    ? `Search results for "${props.searchQuery}"` 
    : 'Live Auctions';

  // Sort dropdown
  const sortContainer = document.createElement('div');
  sortContainer.style.position = 'relative';

  const sortButton = document.createElement('button');
  sortButton.className = 'btn btn-secondary';
  sortButton.style.display = 'flex';
  sortButton.style.alignItems = 'center';
  sortButton.style.gap = '0.5rem';
  sortButton.innerHTML = '<span>Sort: Ending Soon</span>';
  sortButton.appendChild(createIcon('chevronDown', 'icon-sm'));

  const sortDropdown = document.createElement('div');
  sortDropdown.className = 'sort-dropdown';
  sortDropdown.style.display = 'none';

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: 'newest', label: 'Newest First' },
    { value: 'ending-soon', label: 'Ending Soon' },
    { value: 'price-desc', label: 'Price: High to Low' },
    { value: 'price-asc', label: 'Price: Low to High' },
  ];

  sortOptions.forEach(option => {
    const optionBtn = document.createElement('button');
    optionBtn.className = 'sort-option';
    optionBtn.textContent = option.label;
    optionBtn.onclick = () => {
      currentSort = option.value;
      sortButton.querySelector('span')!.textContent = `Sort: ${option.label}`;
      sortDropdown.style.display = 'none';
      renderContent();
    };
    sortDropdown.appendChild(optionBtn);
  });

  sortButton.onclick = () => {
    sortDropdown.style.display = sortDropdown.style.display === 'none' ? 'block' : 'none';
  };

  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!sortContainer.contains(e.target as Node)) {
      sortDropdown.style.display = 'none';
    }
  });

  sortContainer.appendChild(sortButton);
  sortContainer.appendChild(sortDropdown);

  headerContainer.appendChild(title);
  headerContainer.appendChild(sortContainer);
  section.appendChild(headerContainer);

  const contentContainer = document.createElement('div');
  section.appendChild(contentContainer);

  // Sorterer auksjoner basert på valgt sorteringsalternativ
  function sortAuctions(auctions: AuctionListing[], sortBy: SortOption): AuctionListing[] {
    const sorted = [...auctions];
    
    switch (sortBy) {
      case 'newest':
        return sorted.sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());
      case 'ending-soon':
        return sorted.sort((a, b) => new Date(a.endsAt).getTime() - new Date(b.endsAt).getTime());
      case 'price-desc':
        return sorted.sort((a, b) => getCurrentBid(b) - getCurrentBid(a));
      case 'price-asc':
        return sorted.sort((a, b) => getCurrentBid(a) - getCurrentBid(b));
      default:
        return sorted;
    }
  }

  function renderContent() {
    contentContainer.innerHTML = '';

    if (props.loading) {
      const loading = document.createElement('div');
      loading.className = 'loading-spinner';
      const spinner = document.createElement('div');
      spinner.className = 'spinner';
      loading.appendChild(spinner);
      contentContainer.appendChild(loading);
      return;
    }

    if (props.error) {
      const error = document.createElement('div');
      error.className = 'error-message';
      error.textContent = props.error;
      contentContainer.appendChild(error);
      return;
    }

    // Filter auctions by search query
    let filteredAuctions = props.auctions;
    if (props.searchQuery) {
      const query = props.searchQuery.toLowerCase();
      filteredAuctions = props.auctions.filter(auction =>
        auction.title.toLowerCase().includes(query) ||
        auction.description?.toLowerCase().includes(query) ||
        auction.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }

    if (filteredAuctions.length === 0) {
      const noAuctions = document.createElement('div');
      noAuctions.className = 'no-auctions';
      noAuctions.textContent = props.searchQuery
        ? `No auctions found for "${props.searchQuery}"`
        : 'No active auctions at the moment.';
      contentContainer.appendChild(noAuctions);
      return;
    }

    // Sort auctions
    const sortedAuctions = sortAuctions(filteredAuctions, currentSort);

    const grid = document.createElement('div');
    grid.className = 'auctions-grid';

    sortedAuctions.forEach(auction => {
      const card = createAuctionCard(auction, () => props.onSelectAuction(auction));
      grid.appendChild(card);
    });

    contentContainer.appendChild(grid);
  }

  renderContent();

  return section;
}
