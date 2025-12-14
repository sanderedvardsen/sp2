import { getUserBidListings, getUserListings, getUserWins, deleteListing, AuctionListing } from '../lib/api';
import { getAuth } from '../lib/auth';
import { createIcon } from './icons';
import { showEditProfileModal } from './editProfileModal';
import { showCreateListingModal } from './createListingModal';

interface ProfilePageProps {
  user: {
    name: string;
    email: string;
    credits: number;
    avatar?: { url: string; alt: string };
    bio?: string;
    banner?: { url: string; alt: string };
  };
  onBack: () => void;
  onSelectAuction: (auction: AuctionListing) => void;
  onProfileUpdate: () => void;
}

type TabType = 'bids' | 'listings' | 'wins';

// Formaterer gjenværende tid for en auksjon
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

// Finner høyeste bud på en auksjon
function getCurrentBid(auction: AuctionListing): number {
  if (!auction.bids || auction.bids.length === 0) return 0;
  return Math.max(...auction.bids.map(bid => bid.amount));
}

// Oppretter et auksjons-kort for visning
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

  const info = document.createElement('div');
  info.className = 'auction-card-info';

  const bids = document.createElement('span');
  bids.className = 'auction-card-bids';
  bids.textContent = `${auction._count?.bids || 0} bids`;

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
  content.appendChild(info);
  content.appendChild(bidAmount);

  card.appendChild(image);
  card.appendChild(content);

  return card;
}

export function renderProfilePage(props: ProfilePageProps): HTMLElement {
  let activeTab: TabType = 'bids';
  let bids: AuctionListing[] = [];
  let userBids = new Map<string, { amount: number, created: string }>();
  let listings: AuctionListing[] = [];
  let wins: AuctionListing[] = [];
  let loading = true;

  const page = document.createElement('div');
  page.className = 'profile-page';

  // Banner
  const banner = document.createElement('div');
  banner.className = 'profile-header';
  if (props.user.banner?.url) {
    const bannerImg = document.createElement('img');
    bannerImg.src = props.user.banner.url;
    bannerImg.alt = props.user.banner.alt || 'Profile banner';
    bannerImg.className = 'profile-banner';
    banner.appendChild(bannerImg);
  }

  // Back button
  const backBtn = document.createElement('button');
  backBtn.style.position = 'absolute';
  backBtn.style.top = '1.5rem';
  backBtn.style.left = '1.5rem';
  backBtn.style.padding = '0.5rem';
  backBtn.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
  backBtn.style.borderRadius = '0.5rem';
  backBtn.style.border = 'none';
  backBtn.style.cursor = 'pointer';
  backBtn.appendChild(createIcon('arrowLeft', 'icon'));
  backBtn.onclick = props.onBack;
  banner.appendChild(backBtn);

  // Profile info section
  const infoSection = document.createElement('div');
  infoSection.className = 'profile-info';

  const avatarSection = document.createElement('div');
  avatarSection.className = 'profile-avatar-section';

  if (props.user.avatar?.url) {
    const avatar = document.createElement('img');
    avatar.src = props.user.avatar.url;
    avatar.alt = props.user.avatar.alt || props.user.name;
    avatar.className = 'profile-avatar';
    avatarSection.appendChild(avatar);
  } else {
    const avatarFallback = document.createElement('div');
    avatarFallback.className = 'profile-avatar-fallback';
    avatarFallback.textContent = props.user.name[0].toUpperCase();
    avatarSection.appendChild(avatarFallback);
  }

  const details = document.createElement('div');
  details.className = 'profile-details';

  const nameRow = document.createElement('div');
  nameRow.className = 'profile-name-row';

  const nameGroup = document.createElement('div');
  const name = document.createElement('h1');
  name.className = 'profile-name';
  name.textContent = props.user.name;
  const email = document.createElement('p');
  email.className = 'profile-email';
  email.textContent = props.user.email;
  nameGroup.appendChild(name);
  nameGroup.appendChild(email);

  const editBtn = document.createElement('button');
  editBtn.className = 'profile-edit-btn';
  editBtn.appendChild(createIcon('edit', 'icon-sm'));
  const editText = document.createTextNode(' Edit Profile');
  editBtn.appendChild(editText);
  editBtn.onclick = () => {
    showEditProfileModal({
      user: props.user,
      onClose: () => {},
      onSuccess: props.onProfileUpdate,
    });
  };

  nameRow.appendChild(nameGroup);
  nameRow.appendChild(editBtn);
  details.appendChild(nameRow);

  if (props.user.bio) {
    const bio = document.createElement('p');
    bio.className = 'profile-bio';
    bio.textContent = props.user.bio;
    details.appendChild(bio);
  }

  const credits = document.createElement('div');
  credits.className = 'profile-credits-display';
  credits.appendChild(createIcon('coins', 'icon'));
  const creditsText = document.createTextNode(` ${props.user.credits.toLocaleString()} credits`);
  credits.appendChild(creditsText);
  details.appendChild(credits);

  avatarSection.appendChild(details);
  infoSection.appendChild(avatarSection);

  // Tabs section
  const tabsSection = document.createElement('div');
  tabsSection.className = 'profile-tabs';

  const tabsHeader = document.createElement('div');
  tabsHeader.style.display = 'flex';
  tabsHeader.style.justifyContent = 'space-between';
  tabsHeader.style.alignItems = 'center';
  tabsHeader.style.marginBottom = '1rem';

  const tabs = document.createElement('div');
  tabs.className = 'tabs';
  tabs.style.borderBottom = 'none';
  tabs.style.marginBottom = '0';

  const createListingBtn = document.createElement('button');
  createListingBtn.className = 'btn btn-primary';
  createListingBtn.style.display = 'flex';
  createListingBtn.style.alignItems = 'center';
  createListingBtn.style.gap = '0.5rem';
  createListingBtn.appendChild(createIcon('plus', 'icon'));
  const btnText = document.createTextNode('Create Listing');
  createListingBtn.appendChild(btnText);
  createListingBtn.onclick = () => {
    showCreateListingModal({
      onClose: () => {},
      onSuccess: () => {
        if (activeTab === 'listings') {
          loadTabData();
        } else {
          switchTab('listings');
        }
      },
    });
  };

  const bidsTab = document.createElement('button');
  bidsTab.className = 'tab active';
  bidsTab.textContent = 'My Bids';
  bidsTab.onclick = () => switchTab('bids');

  const listingsTab = document.createElement('button');
  listingsTab.className = 'tab';
  listingsTab.textContent = 'My Listings';
  listingsTab.onclick = () => switchTab('listings');

  const winsTab = document.createElement('button');
  winsTab.className = 'tab';
  winsTab.textContent = 'My Wins';
  winsTab.onclick = () => switchTab('wins');

  tabs.appendChild(bidsTab);
  tabs.appendChild(listingsTab);
  tabs.appendChild(winsTab);

  tabsHeader.appendChild(tabs);
  tabsHeader.appendChild(createListingBtn);

  const tabsBorder = document.createElement('div');
  tabsBorder.style.borderBottom = '2px solid var(--color-neutral-200)';
  tabsBorder.style.marginBottom = '2rem';

  const tabContent = document.createElement('div');
  tabContent.id = 'tab-content';

  tabsSection.appendChild(tabsHeader);
  tabsSection.appendChild(tabsBorder);
  tabsSection.appendChild(tabContent);

  page.appendChild(banner);
  page.appendChild(infoSection);
  page.appendChild(tabsSection);

  function switchTab(tab: TabType) {
    activeTab = tab;
    
    bidsTab.classList.toggle('active', tab === 'bids');
    listingsTab.classList.toggle('active', tab === 'listings');
    winsTab.classList.toggle('active', tab === 'wins');

    loadTabData();
  }

  // Laster data for valgt fane (bud, oppføringer, gevinster)
  async function loadTabData() {
    loading = true;
    renderTabContent();

    const auth = getAuth();
    if (!auth) return;

    try {
      if (activeTab === 'bids') {
        const response = await getUserBidListings(auth.accessToken, props.user.name);
        bids = response.listings;
        userBids = response.userBids;
      } else if (activeTab === 'listings') {
        const response = await getUserListings(auth.accessToken, props.user.name);
        listings = response.data;
      } else if (activeTab === 'wins') {
        const response = await getUserWins(auth.accessToken, props.user.name);
        wins = response.data;
      }
    } catch (err) {
      console.error('Failed to load tab data:', err);
    } finally {
      loading = false;
      renderTabContent();
    }
  }

  // Rendrer innhold for valgt fane
  function renderTabContent() {
    tabContent.innerHTML = '';

    if (loading) {
      const loadingDiv = document.createElement('div');
      loadingDiv.className = 'loading-spinner';
      const spinner = document.createElement('div');
      spinner.className = 'spinner';
      loadingDiv.appendChild(spinner);
      tabContent.appendChild(loadingDiv);
      return;
    }

    if (activeTab === 'bids') {
      if (bids.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'no-auctions';
        empty.textContent = 'You haven\'t placed any bids yet.';
        tabContent.appendChild(empty);
      } else {
        const grid = document.createElement('div');
        grid.className = 'auctions-grid';
        bids.forEach(listing => {
          const cardWrapper = document.createElement('div');
          
          // Create card with full listing data (includes all bids like live auctions)
          const card = createAuctionCard(listing, () => props.onSelectAuction(listing));
          cardWrapper.appendChild(card);
          
          // Show user's specific bid if available
          const userBid = userBids.get(listing.id);
          if (userBid) {
            const bidInfo = document.createElement('div');
            bidInfo.style.marginTop = '0.5rem';
            bidInfo.style.padding = '0.75rem';
            bidInfo.style.backgroundColor = 'var(--color-blue-50)';
            bidInfo.style.borderRadius = '0.5rem';
            bidInfo.innerHTML = `
              <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.875rem;">
                <span style="color: var(--color-neutral-700);">Your bid:</span>
                <span style="color: var(--color-blue-700); font-weight: 600;">${userBid.amount.toLocaleString()} credits</span>
              </div>
              <div style="color: var(--color-neutral-600); font-size: 0.75rem; margin-top: 0.25rem;">
                Placed ${new Date(userBid.created).toLocaleString()}
              </div>
            `;
            cardWrapper.appendChild(bidInfo);
          }
          
          grid.appendChild(cardWrapper);
        });
        tabContent.appendChild(grid);
      }
    } else if (activeTab === 'listings') {
      if (listings.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'no-auctions';
        empty.textContent = 'You haven\'t created any listings yet.';
        tabContent.appendChild(empty);
      } else {
        const grid = document.createElement('div');
        grid.className = 'auctions-grid';
        listings.forEach(listing => {
          const cardWrapper = document.createElement('div');
          
          const card = createAuctionCard(listing, () => props.onSelectAuction(listing));
          cardWrapper.appendChild(card);
          
          // Add action buttons for user's listings
          const actions = document.createElement('div');
          actions.style.display = 'flex';
          actions.style.gap = '0.5rem';
          actions.style.marginTop = '0.5rem';
          
          const editBtn = document.createElement('button');
          editBtn.className = 'btn btn-secondary btn-sm';
          editBtn.style.flex = '1';
          editBtn.style.display = 'flex';
          editBtn.style.alignItems = 'center';
          editBtn.style.justifyContent = 'center';
          editBtn.style.gap = '0.5rem';
          editBtn.appendChild(createIcon('edit', 'icon-sm'));
          const editText = document.createTextNode('Edit');
          editBtn.appendChild(editText);
          editBtn.onclick = () => {
            showCreateListingModal({
              editListing: listing,
              onClose: () => {},
              onSuccess: () => loadTabData(),
            });
          };
          
          const deleteBtn = document.createElement('button');
          deleteBtn.className = 'btn btn-danger btn-sm';
          deleteBtn.style.flex = '1';
          deleteBtn.style.display = 'flex';
          deleteBtn.style.alignItems = 'center';
          deleteBtn.style.justifyContent = 'center';
          deleteBtn.style.gap = '0.5rem';
          deleteBtn.appendChild(createIcon('trash', 'icon-sm'));
          const deleteText = document.createTextNode('Delete');
          deleteBtn.appendChild(deleteText);
          deleteBtn.onclick = async () => {
            if (!confirm('Are you sure you want to delete this listing?')) {
              return;
            }
            
            const auth = getAuth();
            if (!auth) return;
            
            try {
              deleteBtn.disabled = true;
              deleteBtn.textContent = 'Deleting...';
              await deleteListing(auth.accessToken, listing.id);
              await loadTabData();
            } catch (error) {
              alert(error instanceof Error ? error.message : 'Failed to delete listing');
              deleteBtn.disabled = false;
              deleteBtn.textContent = 'Delete';
            }
          };
          
          actions.appendChild(editBtn);
          actions.appendChild(deleteBtn);
          cardWrapper.appendChild(actions);
          
          grid.appendChild(cardWrapper);
        });
        tabContent.appendChild(grid);
      }
    } else if (activeTab === 'wins') {
      if (wins.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'no-auctions';
        empty.textContent = 'You haven\'t won any auctions yet.';
        tabContent.appendChild(empty);
      } else {
        const grid = document.createElement('div');
        grid.className = 'auctions-grid';
        wins.forEach(win => {
          const card = createAuctionCard(win, () => props.onSelectAuction(win));
          grid.appendChild(card);
        });
        tabContent.appendChild(grid);
      }
    }
  }

  // Load initial data
  loadTabData();

  return page;
}
