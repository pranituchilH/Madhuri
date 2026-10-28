'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, TOKEN_KEY } from '@/lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const setSession = useCallback(({ token, user: u }) => {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {}
    setUser(u);
  }, []);

  useEffect(() => {
    let token = null;
    try {
      token = localStorage.getItem(TOKEN_KEY);
    } catch {}
    if (!token) return setLoading(false);
    api('/auth/me')
      .then((d) => setUser(d.user))
      .catch(() => {
        try {
          localStorage.removeItem(TOKEN_KEY);
        } catch {}
      })
      .finally(() => setLoading(false));
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      isAdmin: user?.role === 'admin',
      async login(email, password) {
        const d = await api('/auth/login', { method: 'POST', body: { email, password } });
        setSession(d);
        return d.user;
      },
      async register(data) {
        const d = await api('/auth/register', { method: 'POST', body: data });
        setSession(d);
        return d.user;
      },
      logout() {
        try {
          localStorage.removeItem(TOKEN_KEY);
        } catch {}
        setUser(null);
      },
      setUser,
    }),
    [user, loading, setSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
