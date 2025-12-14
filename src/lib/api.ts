// API konfigurasjon
const API_BASE = 'https://v2.api.noroff.dev';

// Henter API-nøkkel fra localStorage
function getApiKey(): string {
  const stored = localStorage.getItem('auction_api_key');
  return stored || '4f4ad3d0-630b-4ef4-8913-849fe798fe69';
}

// Oppretter ny API-nøkkel for brukeren
export async function createApiKey(accessToken: string, name: string = 'Auction House App'): Promise<string> {
  const response = await fetch(`${API_BASE}/auth/create-api-key`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ name }),
  });

  if (!response.ok) {
    throw new Error('Failed to create API key');
  }

  const data = await response.json();
  const apiKey = data.data.key;
  
  localStorage.setItem('auction_api_key', apiKey);
  
  return apiKey;
}

export interface User {
  name: string;
  email: string;
  bio?: string;
  avatar?: {
    url: string;
    alt: string;
  };
  banner?: {
    url: string;
    alt: string;
  };
  credits: number;
}

export interface AuctionListing {
  id: string;
  title: string;
  description: string;
  media: Array<{
    url: string;
    alt: string;
  }>;
  tags: string[];
  created: string;
  updated: string;
  endsAt: string;
  _count: {
    bids: number;
  };
  bids?: Array<{
    id: string;
    amount: number;
    bidder: {
      name: string;
      email: string;
      avatar?: {
        url: string;
        alt: string;
      };
    };
    created: string;
  }>;
}

export interface AuthResponse {
  data: {
    name: string;
    email: string;
    bio?: string;
    avatar?: {
      url: string;
      alt: string;
    };
    banner?: {
      url: string;
      alt: string;
    };
    credits?: number;
    accessToken: string;
  };
}

export interface ListingsResponse {
  data: AuctionListing[];
  meta: {
    isFirstPage: boolean;
    isLastPage: boolean;
    currentPage: number;
    previousPage: number | null;
    nextPage: number | null;
    pageCount: number;
    totalCount: number;
  };
}

export interface ProfileResponse {
  data: User & {
    _count: {
      listings: number;
      wins: number;
    };
  };
}

// Registrerer ny bruker
export async function registerUser(name: string, email: string, password: string): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name, email, password }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.errors?.[0]?.message || 'Registration failed');
  }

  return response.json();
}

// Logger inn bruker
export async function loginUser(email: string, password: string): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.errors?.[0]?.message || 'Login failed');
  }

  return response.json();
}

// Henter alle aktive auksjoner
export async function getAuctionListings(accessToken?: string): Promise<ListingsResponse> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'X-Noroff-API-Key': getApiKey(),
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const response = await fetch(
    `${API_BASE}/auction/listings?_bids=true&_active=true&sort=endsAt&sortOrder=asc`,
    {
      headers,
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch listings');
  }

  return response.json();
}

// Legger inn bud på auksjon
export async function placeBid(listingId: string, amount: number, accessToken: string): Promise<void> {
  const response = await fetch(`${API_BASE}/auction/listings/${listingId}/bids`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
      'X-Noroff-API-Key': getApiKey(),
    },
    body: JSON.stringify({ amount }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.errors?.[0]?.message || 'Failed to place bid');
  }
}

export async function getUserProfile(accessToken: string, username: string): Promise<{ data: User }> {
  const response = await fetch(`${API_BASE}/auction/profiles/${username}`, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
      'X-Noroff-API-Key': getApiKey(),
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.errors?.[0]?.message || 'Failed to fetch user profile');
  }

  return response.json();
}

export async function getProfileWithDetails(accessToken: string, username: string): Promise<ProfileResponse> {
  const response = await fetch(`${API_BASE}/auction/profiles/${username}?_listings=true&_wins=true`, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
      'X-Noroff-API-Key': getApiKey(),
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch profile details');
  }

  return response.json();
}

export async function getUserBids(accessToken: string, username: string): Promise<{ data: Array<{ id: string; amount: number; created: string; listing: AuctionListing }> }> {
  const response = await fetch(`${API_BASE}/auction/profiles/${username}/bids?_listings=true&_bids=true&_seller=true`, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
      'X-Noroff-API-Key': getApiKey(),
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch user bids');
  }

  return response.json();
}

// Henter auksjoner brukeren har budt på
export async function getUserBidListings(accessToken: string, username: string): Promise<{ listings: AuctionListing[], userBids: Map<string, { amount: number, created: string }> }> {
  const bidsResponse = await fetch(`${API_BASE}/auction/profiles/${username}/bids?_listings=true`, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
      'X-Noroff-API-Key': getApiKey(),
    },
  });

  if (!bidsResponse.ok) {
    throw new Error('Failed to fetch user bids');
  }

  const bidsData = await bidsResponse.json();
  const userBidsMap = new Map<string, { amount: number, created: string }>();
  
  bidsData.data.forEach((bid: any) => {
    if (!userBidsMap.has(bid.listing.id) || bid.amount > userBidsMap.get(bid.listing.id)!.amount) {
      userBidsMap.set(bid.listing.id, { amount: bid.amount, created: bid.created });
    }
  });

  const listingIds = Array.from(userBidsMap.keys());

  if (listingIds.length === 0) {
    return { listings: [], userBids: userBidsMap };
  }

  const listingsPromises = listingIds.map(async (id: string) => {
    const response = await fetch(`${API_BASE}/auction/listings/${id}?_bids=true&_seller=true`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'X-Noroff-API-Key': getApiKey(),
      },
    });
    
    if (!response.ok) {
      return null;
    }
    
    const result = await response.json();
    return result.data;
  });

  const listings = (await Promise.all(listingsPromises)).filter(listing => listing !== null);
  
  return { listings, userBids: userBidsMap };
}

export async function getUserListings(accessToken: string, username: string): Promise<ListingsResponse> {
  const response = await fetch(`${API_BASE}/auction/profiles/${username}/listings?_bids=true`, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
      'X-Noroff-API-Key': getApiKey(),
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch user listings');
  }

  return response.json();
}

export async function getUserWins(accessToken: string, username: string): Promise<ListingsResponse> {
  const response = await fetch(`${API_BASE}/auction/profiles/${username}/wins?_bids=true`, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
      'X-Noroff-API-Key': getApiKey(),
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch user wins');
  }

  return response.json();
}

export async function updateProfile(
  accessToken: string,
  username: string,
  updates: {
    bio?: string;
    avatar?: { url: string; alt?: string };
    banner?: { url: string; alt?: string };
  }
): Promise<{ data: User }> {
  const response = await fetch(`${API_BASE}/auction/profiles/${username}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
      'X-Noroff-API-Key': getApiKey(),
    },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.errors?.[0]?.message || 'Failed to update profile');
  }

  return response.json();
}

// Oppretter ny auksjon
export async function createListing(
  accessToken: string,
  listing: {
    title: string;
    description: string;
    media?: Array<{ url: string; alt?: string }>;
    endsAt: string;
  }
): Promise<{ data: AuctionListing }> {
  const response = await fetch(`${API_BASE}/auction/listings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
      'X-Noroff-API-Key': getApiKey(),
    },
    body: JSON.stringify(listing),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.errors?.[0]?.message || 'Failed to create listing');
  }

  return response.json();
}

// Oppdaterer eksisterende auksjon
export async function updateListing(
  accessToken: string,
  listingId: string,
  updates: {
    title?: string;
    description?: string;
    media?: Array<{ url: string; alt?: string }>;
  }
): Promise<{ data: AuctionListing }> {
  const response = await fetch(`${API_BASE}/auction/listings/${listingId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
      'X-Noroff-API-Key': getApiKey(),
    },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.errors?.[0]?.message || 'Failed to update listing');
  }

  return response.json();
}

// Sletter auksjon
export async function deleteListing(
  accessToken: string,
  listingId: string
): Promise<void> {
  const response = await fetch(`${API_BASE}/auction/listings/${listingId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
      'X-Noroff-API-Key': getApiKey(),
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.errors?.[0]?.message || 'Failed to delete listing');
  }
}
