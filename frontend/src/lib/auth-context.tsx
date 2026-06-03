'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { api, getToken, setToken } from './api';
import type { User } from './types';

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const PUBLIC_PREFIXES = [
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/verify',
];

function isPublicPath(pathname: string) {
  if (pathname === '/') return true;
  return PUBLIC_PREFIXES.some(
    (p) => p !== '/' && (pathname === p || pathname.startsWith(`${p}/`) || pathname.startsWith(`${p}?`))
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const refresh = async () => {
    const token = getToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const { user: u } = await api<{ user: User }>('/auth/me');
      setUser(u);
    } catch {
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (loading) return;
    const requiresAuth = !isPublicPath(pathname);
    if (requiresAuth && !user) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    if (pathname.startsWith('/admin') && user && user.role !== 'admin') router.replace('/dashboard');
  }, [loading, user, pathname, router]);

  const login = (token: string, u: User) => {
    setToken(token);
    setUser(u);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    router.replace('/login');
  };

  const value = useMemo(
    () => ({ user, loading, login, logout, refresh }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
