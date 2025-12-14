import { AuctionListing, placeBid } from '../lib/api';
import { getAuth, saveAuth, getUserProfile } from '../lib/auth';
import { createIcon } from './icons';

interface AuctionModalProps {
  auction: AuctionListing;
  user: { name: string; email: string; credits: number } | null;
  onClose: () => void;
  onBidSuccess: () => void;
  onAuthRequired: () => void;
}

function formatTimeRemaining(endTime: string): string {
  const now = new Date();
  const end = new Date(endTime);
  const diff = end.getTime() - now.getTime();

  if (diff <= 0) return 'Auction ended';

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days} days ${hours % 24} hours`;
  }

  return `${hours} hours ${minutes} minutes`;
}

function getCurrentBid(auction: AuctionListing): number {
  if (!auction.bids || auction.bids.length === 0) return 0;
  return Math.max(...auction.bids.map(bid => bid.amount));
}

export function showAuctionModal(props: AuctionModalProps): void {
  const modalRoot = document.getElementById('modal-root');
  if (!modalRoot) return;

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  const modal = document.createElement('div');
  modal.className = 'modal modal-large';

  // Header
  const header = document.createElement('div');
  header.className = 'modal-header';

  const title = document.createElement('h2');
  title.className = 'modal-title';
  title.textContent = props.auction.title;

  const closeBtn = document.createElement('button');
  closeBtn.className = 'modal-close';
  closeBtn.appendChild(createIcon('x', 'icon'));
  closeBtn.onclick = () => {
    overlay.remove();
    props.onClose();
  };

  header.appendChild(title);
  header.appendChild(closeBtn);

  // Content
  const content = document.createElement('div');
  content.className = 'modal-content';

  // Image
  const imageUrl = props.auction.media?.[0]?.url || 'https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=800';
  const image = document.createElement('img');
  image.src = imageUrl;
  image.alt = props.auction.title;
  image.className = 'auction-modal-image';
  image.onerror = () => {
    image.src = 'https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=800';
  };

  content.appendChild(image);

  // Details
  const details = document.createElement('div');
  details.className = 'auction-modal-details';

  // Description
  const descSection = document.createElement('div');
  descSection.className = 'auction-modal-section';
  const descLabel = document.createElement('div');
  descLabel.className = 'auction-modal-label';
  descLabel.textContent = 'Description';
  const descValue = document.createElement('div');
  descValue.className = 'auction-modal-value';
  descValue.textContent = props.auction.description || 'No description provided';
  descSection.appendChild(descLabel);
  descSection.appendChild(descValue);
  details.appendChild(descSection);

  // Time remaining
  const timeSection = document.createElement('div');
  timeSection.className = 'auction-modal-section';
  const timeLabel = document.createElement('div');
  timeLabel.className = 'auction-modal-label';
  timeLabel.textContent = 'Time Remaining';
  const timeValue = document.createElement('div');
  timeValue.className = 'auction-modal-value';
  timeValue.textContent = formatTimeRemaining(props.auction.endsAt);
  timeSection.appendChild(timeLabel);
  timeSection.appendChild(timeValue);
  details.appendChild(timeSection);

  // Current bid
  const currentBid = getCurrentBid(props.auction);
  const bidSection = document.createElement('div');
  bidSection.className = 'auction-modal-section';
  const bidLabel = document.createElement('div');
  bidLabel.className = 'auction-modal-label';
  bidLabel.textContent = 'Current Bid';
  const bidValue = document.createElement('div');
  bidValue.className = 'auction-modal-bid-amount';
  bidValue.textContent = currentBid > 0 ? `${currentBid.toLocaleString()} credits` : 'No bids yet';
  bidSection.appendChild(bidLabel);
  bidSection.appendChild(bidValue);
  details.appendChild(bidSection);

  // Bid form (only if user is logged in)
  if (props.user) {
    const bidFormSection = document.createElement('div');
    bidFormSection.className = 'auction-modal-section';
    
    const bidFormLabel = document.createElement('div');
    bidFormLabel.className = 'auction-modal-label';
    bidFormLabel.textContent = 'Place a Bid';
    bidFormSection.appendChild(bidFormLabel);

    const bidForm = document.createElement('form');
    bidForm.className = 'bid-form';
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'form-error hidden';
    
    const bidInputGroup = document.createElement('div');
    bidInputGroup.className = 'form-group bid-input';
    const bidInput = document.createElement('input');
    bidInput.type = 'number';
    bidInput.className = 'form-input';
    bidInput.placeholder = `Minimum: ${currentBid + 1}`;
    bidInput.min = (currentBid + 1).toString();
    bidInputGroup.appendChild(bidInput);
    
    const submitBtn = document.createElement('button');
    submitBtn.type = 'submit';
    submitBtn.className = 'form-button';
    submitBtn.textContent = 'Place Bid';
    
    bidForm.onsubmit = async (e) => {
      e.preventDefault();
      const amount = parseInt(bidInput.value);
      
      if (amount <= currentBid) {
        errorDiv.textContent = `Bid must be higher than current bid (${currentBid} credits)`;
        errorDiv.classList.remove('hidden');
        return;
      }
      
      if (amount > props.user!.credits) {
        errorDiv.textContent = 'Insufficient credits';
        errorDiv.classList.remove('hidden');
        return;
      }
      
      try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Placing bid...';
        
        const auth = getAuth();
        if (!auth) {
          props.onAuthRequired();
          overlay.remove();
          return;
        }
        
        await placeBid(props.auction.id, amount, auth.accessToken);
        
        // Update user credits and refresh auction data
        try {
          const profileResponse = await getUserProfile(auth.accessToken, auth.user.name);
          auth.user.credits = profileResponse.data.credits;
        } catch (err) {
          // If profile fetch fails, manually deduct credits
          auth.user.credits -= amount;
        }
        saveAuth(auth);
        
        props.onBidSuccess();
        overlay.remove();
      } catch (err) {
        errorDiv.textContent = err instanceof Error ? err.message : 'Failed to place bid';
        errorDiv.classList.remove('hidden');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Place Bid';
      }
    };
    
    bidForm.appendChild(bidInputGroup);
    bidForm.appendChild(submitBtn);
    bidFormSection.appendChild(bidForm);
    bidFormSection.appendChild(errorDiv);
    details.appendChild(bidFormSection);
  } else {
    const authPrompt = document.createElement('div');
    authPrompt.className = 'auction-modal-section text-center';
    const authText = document.createElement('p');
    authText.textContent = 'Please sign in to place a bid';
    const authBtn = document.createElement('button');
    authBtn.className = 'form-button';
    authBtn.textContent = 'Sign In';
    authBtn.onclick = () => {
      overlay.remove();
      props.onAuthRequired();
    };
    authPrompt.appendChild(authText);
    authPrompt.appendChild(authBtn);
    details.appendChild(authPrompt);
  }

  // Bid history
  if (props.auction.bids && props.auction.bids.length > 0) {
    const historySection = document.createElement('div');
    historySection.className = 'auction-modal-section';
    const historyLabel = document.createElement('div');
    historyLabel.className = 'auction-modal-label';
    historyLabel.textContent = 'Bid History';
    historySection.appendChild(historyLabel);

    const historyList = document.createElement('div');
    historyList.className = 'bid-history';

    const sortedBids = [...props.auction.bids].sort((a, b) => 
      new Date(b.created).getTime() - new Date(a.created).getTime()
    );

    sortedBids.forEach(bid => {
      const bidItem = document.createElement('div');
      bidItem.className = 'bid-item';

      const bidHeader = document.createElement('div');
      bidHeader.className = 'bid-item-header';

      const bidder = document.createElement('span');
      bidder.className = 'bid-bidder';
      bidder.textContent = bid.bidder.name;

      const amount = document.createElement('span');
      amount.className = 'bid-amount';
      amount.textContent = `${bid.amount.toLocaleString()} credits`;

      bidHeader.appendChild(bidder);
      bidHeader.appendChild(amount);

      const bidTime = document.createElement('div');
      bidTime.className = 'bid-time';
      bidTime.textContent = new Date(bid.created).toLocaleString();

      bidItem.appendChild(bidHeader);
      bidItem.appendChild(bidTime);
      historyList.appendChild(bidItem);
    });

    historySection.appendChild(historyList);
    details.appendChild(historySection);
  }

  content.appendChild(details);

  modal.appendChild(header);
  modal.appendChild(content);
  overlay.appendChild(modal);

  overlay.onclick = (e) => {
    if (e.target === overlay) {
      overlay.remove();
      props.onClose();
    }
  };

  modalRoot.appendChild(overlay);
}
