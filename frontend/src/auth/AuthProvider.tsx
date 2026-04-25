import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import apiClient from '../lib/api/client';
import refreshClient from '../lib/api/refreshClient';
import { tokenStore } from './tokenStore';

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  coachState: 0 | 1 | 2; // 0=Gentle, 1=Firm, 2=Blunt
  createdAt: string;
}

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (accessToken: string, userData: User) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUser = useCallback(async (): Promise<void> => {
    try {
      const { data } = await apiClient.get<{ success: boolean; data: User }>('/users/me');
      setUser(data.data);
    } catch {
      // Access token invalid — try refresh
      try {
        const { data: refreshData } = await refreshClient.post<{ success: boolean; data: { accessToken: string } }>(
          '/auth/refresh'
        );
        tokenStore.setToken(refreshData.data.accessToken);
        const { data: userData } = await apiClient.get<{ success: boolean; data: User }>('/users/me');
        setUser(userData.data);
      } catch {
        // Fully unauthenticated
        tokenStore.clearToken();
        setUser(null);
      }
    }
  }, []);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      if (tokenStore.hasToken()) {
        await fetchUser();
      } else {
        // Try silent refresh from httpOnly cookie
        try {
          const { data } = await refreshClient.post<{ success: boolean; data: { accessToken: string } }>('/auth/refresh');
          tokenStore.setToken(data.data.accessToken);
          await fetchUser();
        } catch {
          setUser(null);
        }
      }
      setIsLoading(false);
    })();
  }, [fetchUser]);

  const login = useCallback((accessToken: string, userData: User) => {
    tokenStore.setToken(accessToken);
    setUser(userData);
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Ignore logout API errors
    } finally {
      tokenStore.clearToken();
      setUser(null);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    await fetchUser();
  }, [fetchUser]);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
