import { registerUser, loginUser, getUserProfile, createApiKey } from '../lib/api';
import { saveAuth } from '../lib/auth';
import { createIcon } from './icons';

interface SignUpPageProps {
  onSuccess: (authData: { accessToken: string; user: { name: string; email: string; credits: number } }) => void;
  onBackToHome: () => void;
}

export function renderSignUpPage(props: SignUpPageProps): HTMLElement {
  const page = document.createElement('div');
  page.className = 'min-h-screen bg-neutral-50 flex items-center justify-center';
  page.style.display = 'flex';
  page.style.alignItems = 'center';
  page.style.justifyContent = 'center';
  page.style.padding = '2rem 1rem';

  const container = document.createElement('div');
  container.style.maxWidth = '32rem';
  container.style.width = '100%';

  const card = document.createElement('div');
  card.style.backgroundColor = 'white';
  card.style.borderRadius = '0.75rem';
  card.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
  card.style.padding = '2rem';

  // Header
  const header = document.createElement('div');
  header.style.marginBottom = '2rem';

  const backBtn = document.createElement('button');
  backBtn.style.display = 'inline-flex';
  backBtn.style.alignItems = 'center';
  backBtn.style.gap = '0.5rem';
  backBtn.style.color = 'var(--color-neutral-600)';
  backBtn.style.border = 'none';
  backBtn.style.background = 'none';
  backBtn.style.cursor = 'pointer';
  backBtn.style.marginBottom = '1.5rem';
  backBtn.appendChild(createIcon('arrowLeft', 'icon'));
  const backText = document.createTextNode('Back to Home');
  backBtn.appendChild(backText);
  backBtn.onclick = props.onBackToHome;

  const title = document.createElement('h1');
  title.style.fontSize = '2rem';
  title.style.fontWeight = '700';
  title.style.marginBottom = '0.5rem';
  title.textContent = 'Create Account';

  const subtitle = document.createElement('p');
  subtitle.style.color = 'var(--color-neutral-600)';
  subtitle.textContent = 'Join the auction house and start bidding';

  header.appendChild(backBtn);
  header.appendChild(title);
  header.appendChild(subtitle);

  // Form
  const form = document.createElement('form');
  form.className = 'form';

  const errorDiv = document.createElement('div');
  errorDiv.className = 'form-error hidden';

  // Username field
  const usernameGroup = document.createElement('div');
  usernameGroup.className = 'form-group';
  const usernameLabel = document.createElement('label');
  usernameLabel.className = 'form-label';
  usernameLabel.textContent = 'Username';
  const usernameInput = document.createElement('input');
  usernameInput.type = 'text';
  usernameInput.className = 'form-input';
  usernameInput.required = true;
  const usernameHint = document.createElement('small');
  usernameHint.style.color = 'var(--color-neutral-600)';
  usernameHint.style.fontSize = '0.875rem';
  usernameHint.textContent = 'Only letters, numbers, and underscores';
  usernameGroup.appendChild(usernameLabel);
  usernameGroup.appendChild(usernameInput);
  usernameGroup.appendChild(usernameHint);

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
  const emailHint = document.createElement('small');
  emailHint.style.color = 'var(--color-neutral-600)';
  emailHint.style.fontSize = '0.875rem';
  emailHint.textContent = 'Must end with @stud.noroff.no';
  emailGroup.appendChild(emailLabel);
  emailGroup.appendChild(emailInput);
  emailGroup.appendChild(emailHint);

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
  passwordInput.minLength = 8;
  const passwordHint = document.createElement('small');
  passwordHint.style.color = 'var(--color-neutral-600)';
  passwordHint.style.fontSize = '0.875rem';
  passwordHint.textContent = 'At least 8 characters';
  passwordGroup.appendChild(passwordLabel);
  passwordGroup.appendChild(passwordInput);
  passwordGroup.appendChild(passwordHint);

  // Submit button
  const submitBtn = document.createElement('button');
  submitBtn.type = 'submit';
  submitBtn.className = 'form-button';
  submitBtn.textContent = 'Create Account';

  form.onsubmit = async (e) => {
    e.preventDefault();
    errorDiv.classList.add('hidden');

    // Validate email
    if (!emailInput.value.endsWith('@stud.noroff.no')) {
      errorDiv.textContent = 'Email must end with @stud.noroff.no';
      errorDiv.classList.remove('hidden');
      return;
    }

    // Validate username
    if (!/^[a-zA-Z0-9_]+$/.test(usernameInput.value)) {
      errorDiv.textContent = 'Username can only contain letters, numbers, and underscores';
      errorDiv.classList.remove('hidden');
      return;
    }

    try {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Creating account...';

      // First register the user
      await registerUser(
        usernameInput.value,
        emailInput.value,
        passwordInput.value
      );

      // Then login to get the access token
      submitBtn.textContent = 'Logging in...';
      const loginResponse = await loginUser(emailInput.value, passwordInput.value);

      // Create API key automatically
      try {
        await createApiKey(loginResponse.data.accessToken, 'Auction House App');
      } catch (err) {
        console.warn('Could not create API key, using default:', err);
      }

      // Try to fetch user profile to get credits, but fall back if it fails
      let credits = 1000; // Default for new users
      try {
        const profileResponse = await getUserProfile(loginResponse.data.accessToken, loginResponse.data.name);
        credits = profileResponse.data.credits;
      } catch (profileErr) {
        console.warn('Could not fetch profile, using default credits:', profileErr);
      }

      const authData = {
        accessToken: loginResponse.data.accessToken,
        user: {
          name: loginResponse.data.name,
          email: loginResponse.data.email,
          credits: credits,
          avatar: loginResponse.data.avatar,
          bio: loginResponse.data.bio,
          banner: loginResponse.data.banner,
        },
      };

      saveAuth(authData);
      props.onSuccess(authData);
    } catch (err) {
      errorDiv.textContent = err instanceof Error ? err.message : 'Registration failed';
      errorDiv.classList.remove('hidden');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Create Account';
    }
  };

  form.appendChild(errorDiv);
  form.appendChild(usernameGroup);
  form.appendChild(emailGroup);
  form.appendChild(passwordGroup);
  form.appendChild(submitBtn);

  card.appendChild(header);
  card.appendChild(form);
  container.appendChild(card);
  page.appendChild(container);

  return page;
}
