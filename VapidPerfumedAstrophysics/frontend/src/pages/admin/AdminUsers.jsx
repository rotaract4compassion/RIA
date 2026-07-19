import React, { useState, useEffect, useCallback } from 'react';
import api from '../../lib/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import { AlertTriangle } from 'lucide-react';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionUser, setActionUser] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get(`/users/admin${search ? `?search=${encodeURIComponent(search)}` : ''}`);
      setUsers(data);
    } catch {}
    setLoading(false);
  }, [search]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  async function flag(user) {
    if (!confirm(`${user.is_flagged ? 'Unflag' : 'Flag'} ${user.name}?`)) return;
    await api.patch(`/users/admin/${user.id}/flag`, { flagged: !user.is_flagged });
    load();
  }

  async function revoke(user) {
    if (!confirm(`${user.is_revoked ? 'Restore access for' : 'Revoke access from'} ${user.name}? ${!user.is_revoked ? 'They will be immediately logged out.' : ''}`)) return;
    await api.patch(`/users/admin/${user.id}/revoke`, { revoked: !user.is_revoked });
    load();
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="text-gray-500 text-sm mt-1">{users.length} registered users</p>
        </div>
      </div>

      <input
        type="search"
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search by name, email, or club…"
        className="input-field mb-4"
      />

      {loading ? (
        <div className="flex justify-center py-12"><LoadingSpinner /></div>
      ) : users.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400">
          No users found
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">User</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 hidden md:table-cell">Club</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 hidden lg:table-cell">Contact</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">Submissions</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">Status</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className={`border-b border-gray-50 ${u.is_revoked ? 'opacity-50' : ''}`}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{u.name}</p>
                      <p className="text-xs text-gray-400 capitalize">{u.identity}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{u.club}</td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <p className="text-xs text-gray-500">{u.email}</p>
                      <p className="text-xs text-gray-400">{u.phone}</p>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-700">{u.submission_count}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        {u.is_flagged && <span className="badge bg-amber-100 text-amber-700 flex items-center gap-1 w-max"><AlertTriangle size={12} /> Flagged</span>}
                        {u.is_revoked && <span className="badge bg-red-100 text-red-700">Revoked</span>}
                        {!u.is_flagged && !u.is_revoked && <span className="badge bg-green-100 text-green-700">Active</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => flag(u)}
                          className="text-xs px-2.5 py-1 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
                        >
                          {u.is_flagged ? 'Unflag' : 'Flag'}
                        </button>
                        <button
                          onClick={() => revoke(u)}
                          className={`text-xs px-2.5 py-1 rounded-lg border ${u.is_revoked ? 'border-green-200 text-green-600' : 'border-red-200 text-red-600'}`}
                        >
                          {u.is_revoked ? 'Restore' : 'Revoke'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
