import { getAuctionListings, AuctionListing } from './lib/api';
import { getAuth, clearAuth, saveAuth } from './lib/auth';
import { renderHeader } from './components/header';
import { renderHero } from './components/hero';
import { renderAuctionGrid } from './components/auctionGrid';
import { showAuctionModal } from './components/auctionModal';
import { showAuthModal } from './components/authModal';
import { renderSignUpPage } from './components/signUpPage';
import { renderProfilePage } from './components/profilePage';

export interface AppState {
  user: {
    name: string;
    email: string;
    credits: number;
    avatar?: { url: string; alt: string };
    bio?: string;
    banner?: { url: string; alt: string };
  } | null;
  auctions: AuctionListing[];
  searchQuery: string;
  loading: boolean;
  error: string | null;
  currentPage: 'home' | 'signup' | 'profile';
}

class App {
  private state: AppState = {
    user: null,
    auctions: [],
    searchQuery: '',
    loading: true,
    error: null,
    currentPage: 'home',
  };

  private appContainer: HTMLElement;

  constructor() {
    const container = document.getElementById('app');
    if (!container) throw new Error('App container not found');
    this.appContainer = container;
  }

  // Initialiserer applikasjonen
  async init() {
    const auth = getAuth();
    if (auth) {
      this.state.user = auth.user;
    }

    await this.loadAuctions();

    this.render();
  }

  // Laster inn auksjoner fra API
  private async loadAuctions() {
    try {
      this.setState({ loading: true, error: null });
      const auth = getAuth();
      const response = await getAuctionListings(auth?.accessToken);
      this.setState({ auctions: response.data, loading: false });
    } catch (err) {
      this.setState({
        error: err instanceof Error ? err.message : 'Failed to load auctions',
        loading: false,
      });
    }
  }

  private setState(updates: Partial<AppState>) {
    this.state = { ...this.state, ...updates };
    this.render();
  }

  private render() {
    if (this.state.currentPage === 'signup') {
      this.renderSignUpPage();
    } else if (this.state.currentPage === 'profile' && this.state.user) {
      this.renderProfilePage();
    } else {
      this.renderHomePage();
    }
  }

  private renderHomePage() {
    this.appContainer.innerHTML = '';
    this.appContainer.className = 'min-h-screen bg-neutral-50';

    // Render header
    const header = renderHeader({
      user: this.state.user,
      onSignInClick: () => this.showAuthModal(),
      onSignUpClick: () => this.navigateToSignUp(),
      onProfileClick: async () => {
        await this.refreshProfileData();
        this.navigateToProfile();
      },
      onLogout: () => this.handleLogout(),
      onSearch: (query) => this.handleSearch(query),
      onHomeClick: () => this.navigateToHome(),
    });
    this.appContainer.appendChild(header);

    // Render hero
    const hero = renderHero({
      onSignUpClick: () => this.navigateToSignUp(),
    });
    this.appContainer.appendChild(hero);

    // Render auction grid
    const grid = renderAuctionGrid({
      auctions: this.state.auctions,
      searchQuery: this.state.searchQuery,
      loading: this.state.loading,
      error: this.state.error,
      onSelectAuction: (auction) => this.showAuctionModal(auction),
    });
    this.appContainer.appendChild(grid);
  }

  private renderSignUpPage() {
    this.appContainer.innerHTML = '';
    this.appContainer.className = 'min-h-screen';

    const signUpPage = renderSignUpPage({
      onSuccess: (authData) => {
        this.state.user = authData.user;
        this.navigateToHome();
        this.loadAuctions();
      },
      onBackToHome: () => this.navigateToHome(),
    });
    this.appContainer.appendChild(signUpPage);
  }

  private renderProfilePage() {
    this.appContainer.innerHTML = '';
    this.appContainer.className = 'min-h-screen';

    const profilePage = renderProfilePage({
      user: this.state.user!,
      onBack: () => this.navigateToHome(),
      onSelectAuction: (auction) => {
        this.showAuctionModal(auction);
      },
      onProfileUpdate: async () => {
        // Refresh user data
        const auth = getAuth();
        if (auth) {
          this.state.user = auth.user;
          this.render();
        }
      },
    });
    this.appContainer.appendChild(profilePage);
  }

  private showAuthModal() {
    showAuthModal({
      onClose: () => {
        // Modal will remove itself
      },
      onSuccess: (authData) => {
        this.state.user = authData.user;
        this.loadAuctions();
      },
      onSignUpClick: () => {
        this.navigateToSignUp();
      },
    });
  }

  // Viser modal med auksjonsdetaljer
  private showAuctionModal(auction: AuctionListing) {
    showAuctionModal({
      auction,
      user: this.state.user,
      onClose: () => {},
      onBidSuccess: () => {
        this.loadAuctions();
        const auth = getAuth();
        if (auth) {
          this.state.user = auth.user;
          this.render();
        }
      },
      onAuthRequired: () => {
        this.showAuthModal();
      },
    });
  }

  private handleLogout() {
    clearAuth();
    this.setState({ user: null });
    this.loadAuctions();
  }

  private handleSearch(query: string) {
    this.setState({ searchQuery: query });
  }

  private navigateToHome() {
    this.setState({ currentPage: 'home', searchQuery: '' });
  }

  private navigateToSignUp() {
    this.setState({ currentPage: 'signup' });
  }

  private navigateToProfile() {
    if (this.state.user) {
      this.setState({ currentPage: 'profile' });
    }
  }

  private async refreshProfileData() {
    // Force refresh of user data when going to profile
    const auth = getAuth();
    if (auth) {
      try {
        const { getUserProfile } = await import('./lib/api');
        const profileResponse = await getUserProfile(auth.accessToken, auth.user.name);
        this.state.user = {
          ...auth.user,
          credits: profileResponse.data.credits,
          avatar: profileResponse.data.avatar || auth.user.avatar,
          bio: profileResponse.data.bio || auth.user.bio,
          banner: profileResponse.data.banner || auth.user.banner,
        };
        saveAuth({ ...auth, user: this.state.user });
      } catch (err) {
        console.warn('Could not refresh profile:', err);
      }
    }
  }
}

// Initialize the app
const app = new App();
app.init();
