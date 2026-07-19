import { createContext, useContext, useState, useEffect, useCallback, createElement as h } from 'react';
import api from '../lib/api';

const AdminAuthContext = createContext(null);

export function AdminAuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('ria_access_token');
    const isAdmin = localStorage.getItem('ria_is_admin') === 'true';
    if (!token || !isAdmin) { setLoading(false); return; }
    api.get('/admin/auth/me')
      .then(a => setAdmin(a))
      .catch(() => api.clearTokens())
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await api.post('/admin/auth/login', { email, password });
    localStorage.setItem('ria_access_token', data.accessToken);
    localStorage.setItem('ria_refresh_token', data.refreshToken);
    localStorage.setItem('ria_is_admin', 'true');
    setAdmin(data.admin);
    return data.admin;
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = localStorage.getItem('ria_refresh_token');
    try { await api.post('/admin/auth/logout', { refreshToken }); } catch {}
    api.clearTokens();
    setAdmin(null);
  }, []);

  return h(AdminAuthContext.Provider, { value: { admin, loading, login, logout } }, children);
}

export function useAdminAuth() {
  return useContext(AdminAuthContext);
}
