interface StoredAuth {
  accessToken: string;
  user: {
    name: string;
    email: string;
    credits: number;
    avatar?: {
      url: string;
      alt: string;
    };
    bio?: string;
    banner?: {
      url: string;
      alt: string;
    };
  };
}

// Lagrer autentiseringsdata i localStorage
export function saveAuth(auth: StoredAuth): void {
  localStorage.setItem('auction_auth', JSON.stringify(auth));
}

// Henter autentiseringsdata fra localStorage
export function getAuth(): StoredAuth | null {
  const stored = localStorage.getItem('auction_auth');
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

// Fjerner autentiseringsdata (logger ut)
export function clearAuth(): void {
  localStorage.removeItem('auction_auth');
}

export function isAuthenticated(): boolean {
  return getAuth() !== null;
}

export { getUserProfile } from './api';