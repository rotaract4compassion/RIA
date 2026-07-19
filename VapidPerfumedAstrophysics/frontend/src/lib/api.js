const API_BASE = import.meta.env.VITE_API_URL || '/api';

async function request(path, options = {}) {
  const token = localStorage.getItem('ria_access_token');
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  // Try token refresh on 401
  if (res.status === 401 && localStorage.getItem('ria_refresh_token')) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      headers['Authorization'] = `Bearer ${localStorage.getItem('ria_access_token')}`;
      res = await fetch(`${API_BASE}${path}`, { ...options, headers });
    }
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

async function tryRefresh() {
  const refreshToken = localStorage.getItem('ria_refresh_token');
  if (!refreshToken) return false;
  try {
    const isAdmin = localStorage.getItem('ria_is_admin') === 'true';
    const endpoint = isAdmin ? '/admin/auth/refresh' : '/auth/refresh';
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) { clearTokens(); return false; }
    const data = await res.json();
    localStorage.setItem('ria_access_token', data.accessToken);
    localStorage.setItem('ria_refresh_token', data.refreshToken);
    return true;
  } catch {
    clearTokens();
    return false;
  }
}

function clearTokens() {
  localStorage.removeItem('ria_access_token');
  localStorage.removeItem('ria_refresh_token');
  localStorage.removeItem('ria_is_admin');
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body: JSON.stringify(body) }),
  patch: (path, body) => request(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (path) => request(path, { method: 'DELETE' }),
  clearTokens,
};

export default api;
