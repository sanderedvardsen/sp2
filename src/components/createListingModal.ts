import { createListing, updateListing } from '../lib/api';
import { getAuth } from '../lib/auth';
import { createIcon } from './icons';
import type { AuctionListing } from '../lib/api';

interface CreateListingModalProps {
  onClose: () => void;
  onSuccess: () => void;
  editListing?: AuctionListing;
}

export function showCreateListingModal(props: CreateListingModalProps): void {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.onclick = (e) => {
    if (e.target === modal) {
      modal.remove();
      props.onClose();
    }
  };

  const modalContent = document.createElement('div');
  modalContent.className = 'modal-content modal-lg';

  // Header
  const header = document.createElement('div');
  header.className = 'modal-header';

  const title = document.createElement('h2');
  title.textContent = props.editListing ? 'Edit Listing' : 'Create New Listing';

  const closeBtn = document.createElement('button');
  closeBtn.className = 'modal-close';
  closeBtn.appendChild(createIcon('x', 'icon'));
  closeBtn.onclick = () => {
    modal.remove();
    props.onClose();
  };

  header.appendChild(title);
  header.appendChild(closeBtn);

  // Form
  const form = document.createElement('form');
  form.className = 'listing-form';

  // Title field
  const titleGroup = document.createElement('div');
  titleGroup.className = 'form-group';

  const titleLabel = document.createElement('label');
  titleLabel.textContent = 'Title';
  titleLabel.className = 'form-label';

  const titleInput = document.createElement('input');
  titleInput.type = 'text';
  titleInput.className = 'form-input';
  titleInput.placeholder = 'Enter auction title';
  titleInput.required = true;
  titleInput.value = props.editListing?.title || '';

  titleGroup.appendChild(titleLabel);
  titleGroup.appendChild(titleInput);

  // Description field
  const descGroup = document.createElement('div');
  descGroup.className = 'form-group';

  const descLabel = document.createElement('label');
  descLabel.textContent = 'Description';
  descLabel.className = 'form-label';

  const descTextarea = document.createElement('textarea');
  descTextarea.className = 'form-input';
  descTextarea.placeholder = 'Describe your auction item';
  descTextarea.rows = 4;
  descTextarea.value = props.editListing?.description || '';

  descGroup.appendChild(descLabel);
  descGroup.appendChild(descTextarea);

  // Media URLs field
  const mediaGroup = document.createElement('div');
  mediaGroup.className = 'form-group';

  const mediaLabel = document.createElement('label');
  mediaLabel.textContent = 'Media URLs (one per line)';
  mediaLabel.className = 'form-label';

  const mediaTextarea = document.createElement('textarea');
  mediaTextarea.className = 'form-input';
  mediaTextarea.placeholder = 'https://example.com/image1.jpg\nhttps://example.com/image2.jpg';
  mediaTextarea.rows = 3;
  if (props.editListing?.media) {
    mediaTextarea.value = props.editListing.media.map(m => m.url).join('\n');
  }

  const mediaHelp = document.createElement('p');
  mediaHelp.className = 'form-help';
  mediaHelp.textContent = 'Enter image URLs, one per line';

  mediaGroup.appendChild(mediaLabel);
  mediaGroup.appendChild(mediaTextarea);
  mediaGroup.appendChild(mediaHelp);

  // End date field (only for new listings)
  let endsAtGroup: HTMLDivElement | null = null;
  let endsAtInput: HTMLInputElement | null = null;
  
  if (!props.editListing) {
    endsAtGroup = document.createElement('div');
    endsAtGroup.className = 'form-group';

    const endsAtLabel = document.createElement('label');
    endsAtLabel.textContent = 'Auction End Date';
    endsAtLabel.className = 'form-label';

    endsAtInput = document.createElement('input');
    endsAtInput.type = 'datetime-local';
    endsAtInput.className = 'form-input';
    endsAtInput.required = true;
    
    // Set minimum date to now
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    endsAtInput.min = now.toISOString().slice(0, 16);

    const endsAtHelp = document.createElement('p');
    endsAtHelp.className = 'form-help';
    endsAtHelp.textContent = 'Select when the auction should end';

    endsAtGroup.appendChild(endsAtLabel);
    endsAtGroup.appendChild(endsAtInput);
    endsAtGroup.appendChild(endsAtHelp);
  }

  // Error message
  const errorDiv = document.createElement('div');
  errorDiv.className = 'error-message';
  errorDiv.style.display = 'none';

  // Buttons
  const buttonGroup = document.createElement('div');
  buttonGroup.className = 'modal-actions';

  const cancelBtn = document.createElement('button');
  cancelBtn.type = 'button';
  cancelBtn.className = 'btn btn-secondary';
  cancelBtn.textContent = 'Cancel';
  cancelBtn.onclick = () => {
    modal.remove();
    props.onClose();
  };

  const submitBtn = document.createElement('button');
  submitBtn.type = 'submit';
  submitBtn.className = 'btn btn-primary';
  submitBtn.textContent = props.editListing ? 'Save Changes' : 'Create Listing';

  buttonGroup.appendChild(cancelBtn);
  buttonGroup.appendChild(submitBtn);

  // Append fields to form
  form.appendChild(titleGroup);
  form.appendChild(descGroup);
  form.appendChild(mediaGroup);
  if (endsAtGroup) {
    form.appendChild(endsAtGroup);
  }
  form.appendChild(errorDiv);
  form.appendChild(buttonGroup);

  // Handle form submission
  form.onsubmit = async (e) => {
    e.preventDefault();
    
    const auth = getAuth();
    if (!auth) {
      errorDiv.textContent = 'You must be logged in to create a listing';
      errorDiv.style.display = 'block';
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = props.editListing ? 'Saving...' : 'Creating...';
    errorDiv.style.display = 'none';

    try {
      // Parse media URLs
      const mediaUrls = mediaTextarea.value
        .split('\n')
        .map(url => url.trim())
        .filter(url => url.length > 0)
        .map(url => ({ url, alt: '' }));

      if (props.editListing) {
        // Update existing listing
        await updateListing(auth.accessToken, props.editListing.id, {
          title: titleInput.value.trim(),
          description: descTextarea.value.trim(),
          media: mediaUrls.length > 0 ? mediaUrls : undefined,
        });
      } else {
        // Create new listing
        if (!endsAtInput) {
          throw new Error('End date is required');
        }

        const endsAt = new Date(endsAtInput.value).toISOString();

        await createListing(auth.accessToken, {
          title: titleInput.value.trim(),
          description: descTextarea.value.trim(),
          media: mediaUrls.length > 0 ? mediaUrls : undefined,
          endsAt,
        });
      }

      modal.remove();
      props.onSuccess();
    } catch (error) {
      errorDiv.textContent = error instanceof Error ? error.message : 'Failed to save listing';
      errorDiv.style.display = 'block';
      submitBtn.disabled = false;
      submitBtn.textContent = props.editListing ? 'Save Changes' : 'Create Listing';
    }
  };

  modalContent.appendChild(header);
  modalContent.appendChild(form);
  modal.appendChild(modalContent);

  const modalRoot = document.getElementById('modal-root');
  if (modalRoot) {
    modalRoot.appendChild(modal);
  }
}
