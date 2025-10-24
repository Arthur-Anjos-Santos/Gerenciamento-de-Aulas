import { ReactNode, createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import apiClient, { setAuthHeader } from '../api/client';
import { getMe } from '../api/me';

export type Profile = {
  id: number;
  username: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  is_superuser?: boolean;
  groups?: string[];
  avatar_url?: string | null;
};

type AuthContextValue = {
  profile: Profile | null;
  token: string | null;
  refreshToken: string | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<Profile | null>;
  setProfile: (profile: Profile | null) => void;
  mergeProfile: (partial: Partial<Profile>) => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isInstructor: boolean;
  isAdminOrInstructor: boolean;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const clearStoredTokens = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('refresh');
  setAuthHeader(undefined);
};

type ProviderProps = {
  children: ReactNode;
};

export const AuthProvider = ({ children }: ProviderProps) => {
  const [profile, setProfileState] = useState<Profile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const bootstrap = async () => {
      const storedToken = localStorage.getItem('token');
      const storedRefresh = localStorage.getItem('refresh');
      if (!storedToken) {
        setLoading(false);
        return;
      }

      setAuthHeader(storedToken);
      setToken(storedToken);
      setRefreshToken(storedRefresh);
      try {
        const data = await getMe();
        if (mounted) {
          setProfileState(data);
        }
      } catch {
        if (mounted) {
          clearStoredTokens();
          setProfileState(null);
          setToken(null);
          setRefreshToken(null);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    bootstrap();
    return () => {
      mounted = false;
    };
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const response = await apiClient.post<{ access: string; refresh?: string }>('/api/auth/login/', {
      username,
      password,
    });
    const access = response.data.access;
    const refresh = response.data.refresh ?? null;

    localStorage.setItem('token', access);
    if (refresh) localStorage.setItem('refresh', refresh);
    else localStorage.removeItem('refresh');

    setAuthHeader(access);
    setToken(access);
    setRefreshToken(refresh);

    try {
      const data = await getMe();
      setProfileState(data);
    } catch (err) {
      clearStoredTokens();
      setProfileState(null);
      setToken(null);
      setRefreshToken(null);
      throw err;
    }
  }, []);

  const logout = useCallback(() => {
    clearStoredTokens();
    setProfileState(null);
    setToken(null);
    setRefreshToken(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!token) return null;
    const data = await getMe();
    setProfileState(data);
    return data;
  }, [token]);

  const setProfile = useCallback((value: Profile | null) => {
    setProfileState(value);
  }, []);

  const mergeProfile = useCallback((partial: Partial<Profile>) => {
    setProfileState((prev) => {
      if (prev) {
        return { ...prev, ...partial };
      }
      if (partial && ('id' in partial || 'username' in partial)) {
        return partial as Profile;
      }
      return prev;
    });
  }, []);

  const derived = useMemo(() => {
    const groups = profile?.groups || [];
    const isAdmin = Boolean(profile?.is_superuser || groups.includes('admin'));
    const isInstructor = Boolean(groups.includes('instructor'));
    const isAdminOrInstructor = isAdmin || isInstructor;

    return {
      profile,
      token,
      refreshToken,
      loading,
      login,
      logout,
      refreshProfile,
      setProfile,
      mergeProfile,
      isAuthenticated: Boolean(token),
      isAdmin,
      isInstructor,
      isAdminOrInstructor,
    };
  }, [
    profile,
    token,
    refreshToken,
    loading,
    login,
    logout,
    refreshProfile,
    setProfile,
    mergeProfile,
  ]);

  return <AuthContext.Provider value={derived}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
};
