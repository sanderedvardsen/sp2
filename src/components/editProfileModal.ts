import { updateProfile } from '../lib/api';
import { getAuth, saveAuth } from '../lib/auth';
import { createIcon } from './icons';

interface EditProfileModalProps {
  user: {
    name: string;
    email: string;
    credits: number;
    avatar?: { url: string; alt: string };
    bio?: string;
    banner?: { url: string; alt: string };
  };
  onClose: () => void;
  onSuccess: () => void;
}

export function showEditProfileModal(props: EditProfileModalProps): void {
  const modalRoot = document.getElementById('modal-root');
  if (!modalRoot) return;

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  const modal = document.createElement('div');
  modal.className = 'modal';

  // Header
  const header = document.createElement('div');
  header.className = 'modal-header';

  const title = document.createElement('h2');
  title.className = 'modal-title';
  title.textContent = 'Edit Profile';

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

  const form = document.createElement('form');
  form.className = 'form';

  const errorDiv = document.createElement('div');
  errorDiv.className = 'form-error hidden';

  // Bio field
  const bioGroup = document.createElement('div');
  bioGroup.className = 'form-group';
  const bioLabel = document.createElement('label');
  bioLabel.className = 'form-label';
  bioLabel.textContent = 'Bio';
  const bioInput = document.createElement('textarea');
  bioInput.className = 'form-textarea';
  bioInput.placeholder = 'Tell us about yourself...';
  bioInput.value = props.user.bio || '';
  bioGroup.appendChild(bioLabel);
  bioGroup.appendChild(bioInput);

  // Avatar URL field
  const avatarGroup = document.createElement('div');
  avatarGroup.className = 'form-group';
  const avatarLabel = document.createElement('label');
  avatarLabel.className = 'form-label';
  avatarLabel.textContent = 'Avatar URL';
  const avatarInput = document.createElement('input');
  avatarInput.type = 'url';
  avatarInput.className = 'form-input';
  avatarInput.placeholder = 'https://example.com/avatar.jpg';
  avatarInput.value = props.user.avatar?.url || '';
  avatarGroup.appendChild(avatarLabel);
  avatarGroup.appendChild(avatarInput);

  // Banner URL field
  const bannerGroup = document.createElement('div');
  bannerGroup.className = 'form-group';
  const bannerLabel = document.createElement('label');
  bannerLabel.className = 'form-label';
  bannerLabel.textContent = 'Banner URL';
  const bannerInput = document.createElement('input');
  bannerInput.type = 'url';
  bannerInput.className = 'form-input';
  bannerInput.placeholder = 'https://example.com/banner.jpg';
  bannerInput.value = props.user.banner?.url || '';
  bannerGroup.appendChild(bannerLabel);
  bannerGroup.appendChild(bannerInput);

  // Submit button
  const submitBtn = document.createElement('button');
  submitBtn.type = 'submit';
  submitBtn.className = 'form-button';
  submitBtn.textContent = 'Save Changes';

  form.onsubmit = async (e) => {
    e.preventDefault();
    errorDiv.classList.add('hidden');

    const auth = getAuth();
    if (!auth) {
      errorDiv.textContent = 'You must be logged in to edit your profile';
      errorDiv.classList.remove('hidden');
      return;
    }

    try {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Saving...';

      const updates: any = {};
      
      if (bioInput.value) updates.bio = bioInput.value;
      if (avatarInput.value) updates.avatar = { url: avatarInput.value, alt: props.user.name };
      if (bannerInput.value) updates.banner = { url: bannerInput.value, alt: 'Profile banner' };

      const response = await updateProfile(auth.accessToken, props.user.name, updates);
      
      // Update stored auth
      auth.user = {
        ...auth.user,
        bio: response.data.bio,
        avatar: response.data.avatar,
        banner: response.data.banner,
      };
      saveAuth(auth);

      props.onSuccess();
      overlay.remove();
    } catch (err) {
      errorDiv.textContent = err instanceof Error ? err.message : 'Failed to update profile';
      errorDiv.classList.remove('hidden');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Save Changes';
    }
  };

  form.appendChild(errorDiv);
  form.appendChild(bioGroup);
  form.appendChild(avatarGroup);
  form.appendChild(bannerGroup);
  form.appendChild(submitBtn);

  content.appendChild(form);

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
