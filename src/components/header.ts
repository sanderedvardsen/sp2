import { createIcon } from './icons';

interface HeaderProps {
  user: { name: string; email: string; credits: number; avatar?: { url: string; alt: string } } | null;
  onSignInClick: () => void;
  onSignUpClick: () => void;
  onProfileClick: () => void;
  onLogout: () => void;
  onSearch: (query: string) => void;
  onHomeClick: () => void;
}

export function renderHeader(props: HeaderProps): HTMLElement {
  const header = document.createElement('header');
  header.className = 'header';

  const container = document.createElement('div');
  container.className = 'header-container';

  const content = document.createElement('div');
  content.className = 'header-content';

  // Logo
  const logo = document.createElement('button');
  logo.className = 'header-logo';
  logo.onclick = props.onHomeClick;
  logo.appendChild(createIcon('gavel', 'header-logo-icon'));
  const logoText = document.createElement('span');
  logoText.className = 'header-logo-text';
  logoText.textContent = 'AuctionHouse';
  logo.appendChild(logoText);

  // Actions container
  const actions = document.createElement('div');
  actions.className = 'header-actions';

  // Search button and form
  const searchBtn = document.createElement('button');
  searchBtn.className = 'header-search-btn';
  searchBtn.title = 'Search auctions';
  searchBtn.appendChild(createIcon('search', 'icon'));

  const searchForm = document.createElement('form');
  searchForm.className = 'header-search-form hidden';
  searchForm.onsubmit = (e) => {
    e.preventDefault();
    const input = searchForm.querySelector('input') as HTMLInputElement;
    props.onSearch(input.value);
    searchForm.classList.add('hidden');
    searchBtn.classList.remove('hidden');
  };

  const searchInputWrapper = document.createElement('div');
  searchInputWrapper.className = 'header-search-input-wrapper';

  const searchInput = document.createElement('input');
  searchInput.type = 'text';
  searchInput.placeholder = 'Search auctions...';
  searchInput.className = 'header-search-input';

  const clearSearchBtn = document.createElement('button');
  clearSearchBtn.type = 'button';
  clearSearchBtn.className = 'header-search-clear';
  clearSearchBtn.appendChild(createIcon('x', 'icon-sm'));
  clearSearchBtn.onclick = () => {
    searchInput.value = '';
    props.onSearch('');
    searchForm.classList.add('hidden');
    searchBtn.classList.remove('hidden');
  };

  searchInputWrapper.appendChild(searchInput);
  searchInputWrapper.appendChild(clearSearchBtn);
  searchForm.appendChild(searchInputWrapper);

  searchBtn.onclick = () => {
    searchForm.classList.remove('hidden');
    searchBtn.classList.add('hidden');
    searchInput.focus();
  };

  content.appendChild(logo);
  content.appendChild(searchForm);
  
  // Add search button to actions
  actions.appendChild(searchBtn);

  if (props.user) {
    // User is logged in - show credits, profile, and logout
    const credits = document.createElement('div');
    credits.className = 'header-credits';
    credits.appendChild(createIcon('coins', 'icon-sm'));
    const creditsText = document.createElement('span');
    creditsText.textContent = `${props.user.credits} credits`;
    credits.appendChild(creditsText);
    actions.appendChild(credits);

    const userSection = document.createElement('div');
    userSection.className = 'header-user';

    const profileBtn = document.createElement('button');
    profileBtn.className = 'header-profile-btn';
    profileBtn.onclick = props.onProfileClick;

    if (props.user.avatar?.url) {
      const avatar = document.createElement('img');
      avatar.src = props.user.avatar.url;
      avatar.alt = props.user.avatar.alt || props.user.name;
      avatar.className = 'header-avatar';
      profileBtn.appendChild(avatar);
    } else {
      const avatarFallback = document.createElement('div');
      avatarFallback.className = 'header-avatar-fallback';
      avatarFallback.textContent = props.user.name[0].toUpperCase();
      profileBtn.appendChild(avatarFallback);
    }

    const username = document.createElement('span');
    username.className = 'header-username';
    username.textContent = props.user.name;
    profileBtn.appendChild(username);

    userSection.appendChild(profileBtn);

    const logoutBtn = document.createElement('button');
    logoutBtn.className = 'header-logout-btn';
    logoutBtn.title = 'Logout';
    logoutBtn.onclick = props.onLogout;
    logoutBtn.appendChild(createIcon('logout', 'icon'));
    userSection.appendChild(logoutBtn);

    actions.appendChild(userSection);
  } else {
    // User not logged in - show sign in and sign up buttons
    const signInBtn = document.createElement('button');
    signInBtn.className = 'header-signin-btn';
    signInBtn.textContent = 'Sign In';
    signInBtn.onclick = props.onSignInClick;
    actions.appendChild(signInBtn);

    const signUpBtn = document.createElement('button');
    signUpBtn.className = 'header-signup-btn';
    signUpBtn.textContent = 'Sign Up';
    signUpBtn.onclick = props.onSignUpClick;
    actions.appendChild(signUpBtn);
  }

  content.appendChild(actions);
  container.appendChild(content);
  header.appendChild(container);

  return header;
}
