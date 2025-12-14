import { loginUser, getUserProfile, createApiKey } from '../lib/api';
import { saveAuth } from '../lib/auth';
import { createIcon } from './icons';

interface AuthModalProps {
  onClose: () => void;
  onSuccess: (authData: { accessToken: string; user: { name: string; email: string; credits: number } }) => void;
  onSignUpClick: () => void;
}

export function showAuthModal(props: AuthModalProps): void {
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
  title.textContent = 'Sign In';

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

  // Email field
  const emailGroup = document.createElement('div');
  emailGroup.className = 'form-group';
  const emailLabel = document.createElement('label');
  emailLabel.className = 'form-label';
  emailLabel.textContent = 'Email';
  const emailInput = document.createElement('input');
  emailInput.type = 'email';
  emailInput.className = 'form-input';
  emailInput.required = true;
  emailGroup.appendChild(emailLabel);
  emailGroup.appendChild(emailInput);

  // Password field
  const passwordGroup = document.createElement('div');
  passwordGroup.className = 'form-group';
  const passwordLabel = document.createElement('label');
  passwordLabel.className = 'form-label';
  passwordLabel.textContent = 'Password';
  const passwordInput = document.createElement('input');
  passwordInput.type = 'password';
  passwordInput.className = 'form-input';
  passwordInput.required = true;
  passwordGroup.appendChild(passwordLabel);
  passwordGroup.appendChild(passwordInput);

  // Submit button
  const submitBtn = document.createElement('button');
  submitBtn.type = 'submit';
  submitBtn.className = 'form-button';
  submitBtn.textContent = 'Sign In';

  form.onsubmit = async (e) => {
    e.preventDefault();
    errorDiv.classList.add('hidden');

    try {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Signing in...';

      const response = await loginUser(emailInput.value, passwordInput.value);
      
      // Create API key if we don't have one
      if (!localStorage.getItem('auction_api_key')) {
        try {
          await createApiKey(response.data.accessToken, 'Auction House App');
        } catch (err) {
          console.warn('Could not create API key, using default:', err);
        }
      }
      
      // Try to fetch user profile to get credits, but fall back if it fails
      let credits = 1000; // Default
      try {
        const profileResponse = await getUserProfile(response.data.accessToken, response.data.name);
        credits = profileResponse.data.credits;
      } catch (profileErr) {
        console.warn('Could not fetch profile, using default credits:', profileErr);
      }
      
      const authData = {
        accessToken: response.data.accessToken,
        user: {
          name: response.data.name,
          email: response.data.email,
          credits: credits,
          avatar: response.data.avatar,
          bio: response.data.bio,
          banner: response.data.banner,
        },
      };

      saveAuth(authData);
      props.onSuccess(authData);
      overlay.remove();
    } catch (err) {
      errorDiv.textContent = err instanceof Error ? err.message : 'Sign in failed';
      errorDiv.classList.remove('hidden');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Sign In';
    }
  };

  form.appendChild(errorDiv);
  form.appendChild(emailGroup);
  form.appendChild(passwordGroup);
  form.appendChild(submitBtn);

  // Sign up link
  const signUpLink = document.createElement('div');
  signUpLink.className = 'form-link';
  const signUpText = document.createTextNode('Don\'t have an account? ');
  const signUpBtn = document.createElement('button');
  signUpBtn.type = 'button';
  signUpBtn.textContent = 'Sign Up';
  signUpBtn.onclick = () => {
    overlay.remove();
    props.onSignUpClick();
  };
  signUpLink.appendChild(signUpText);
  signUpLink.appendChild(signUpBtn);

  content.appendChild(form);
  content.appendChild(signUpLink);

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
