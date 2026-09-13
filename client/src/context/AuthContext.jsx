import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authApi } from '../api/auth.api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadSession = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await authApi.me();
      setUser(data.user);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  const persistSession = (payload) => {
    if (payload.token) localStorage.setItem('foundrx_token', payload.token);
    setUser(payload.user);
  };

  const register = async (form) => {
    const { data } = await authApi.register(form);
    persistSession(data);
    return data.user;
  };

  const login = async (form) => {
    const { data } = await authApi.login(form);
    persistSession(data);
    return data.user;
  };

  const loginWithGoogle = async (credential) => {
    const { data } = await authApi.loginWithGoogle(credential);
    persistSession(data);
    return data.user;
  };

  const logout = async () => {
    await authApi.logout().catch(() => {});
    localStorage.removeItem('foundrx_token');
    setUser(null);
  };

  const value = useMemo(
    () => ({ user, isLoading, isAuthenticated: Boolean(user), register, login, loginWithGoogle, logout, refresh: loadSession }),
    [user, isLoading, loadSession]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
