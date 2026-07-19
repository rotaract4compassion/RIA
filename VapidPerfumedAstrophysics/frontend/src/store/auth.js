// Simple auth state store (no external state library)
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { createElement as h } from 'react';
import api from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState('rotaract');

  const applyTheme = useCallback((identity) => {
    const t = identity === 'rotarian' ? 'rotary' : 'rotaract';
    setTheme(t);
    document.documentElement.dataset.theme = t;
    // Update theme-color meta
    const meta = document.getElementById('theme-color-meta');
    if (meta) meta.content = t === 'rotary' ? '#17458F' : '#E91E8C';
  }, []);

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem('ria_access_token');
    if (!token) { setLoading(false); return; }
    if (localStorage.getItem('ria_is_admin') === 'true') { setLoading(false); return; }
    try {
      const userData = await api.get('/auth/me');
      setUser(userData);
      applyTheme(userData.identity);
    } catch {
      // Token invalid — clear
      api.clearTokens();
    } finally {
      setLoading(false);
    }
  }, [applyTheme]);

  useEffect(() => { loadUser(); }, [loadUser]);

  const login = useCallback(async (identifier, password) => {
    const data = await api.post('/auth/login', { identifier, password });
    localStorage.setItem('ria_access_token', data.accessToken);
    localStorage.setItem('ria_refresh_token', data.refreshToken);
    localStorage.removeItem('ria_is_admin');
    setUser(data.user);
    applyTheme(data.user.identity);
    return data.user;
  }, [applyTheme]);

  const register = useCallback(async (fields) => {
    const data = await api.post('/auth/register', fields);
    localStorage.setItem('ria_access_token', data.accessToken);
    localStorage.setItem('ria_refresh_token', data.refreshToken);
    localStorage.removeItem('ria_is_admin');
    setUser(data.user);
    applyTheme(data.user.identity);
    return data.user;
  }, [applyTheme]);

  const logout = useCallback(async () => {
    const refreshToken = localStorage.getItem('ria_refresh_token');
    try { await api.post('/auth/logout', { refreshToken }); } catch {}
    api.clearTokens();
    setUser(null);
    setTheme('rotaract');
    document.documentElement.dataset.theme = 'rotaract';
  }, []);

  const updateUser = useCallback((updates) => {
    setUser(prev => ({ ...prev, ...updates }));
    if (updates.identity) applyTheme(updates.identity);
  }, [applyTheme]);

  return h(AuthContext.Provider, {
    value: { user, loading, theme, login, register, logout, updateUser, loadUser }
  }, children);
}

export function useAuth() {
  return useContext(AuthContext);
}
