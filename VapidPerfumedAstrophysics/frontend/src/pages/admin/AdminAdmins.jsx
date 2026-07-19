import React, { useState, useEffect } from 'react';
import { useAdminAuth } from '../../store/adminAuth';
import api from '../../lib/api';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function AdminAdmins() {
  const { admin } = useAdminAuth();
  const [admins, setAdmins] = useState([]);
  const [auditLog, setAuditLog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', scope: 'project' });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  function load() {
    setLoading(true);
    api.get('/admins')
      .then(data => { setAdmins(data.admins || []); setAuditLog(data.audit_log || []); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function createAdmin(e) {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) { setError('All fields required'); return; }
    setCreating(true);
    setError('');
    try {
      await api.post('/admin/auth/create-admin', form);
      setShowCreate(false);
      setForm({ name: '', email: '', password: '', scope: 'project' });
      load();
    } catch (err) {
      setError(err.message);
    }
    setCreating(false);
  }

  async function changeScope(adminId, newScope) {
    if (!confirm(`Change this admin to ${newScope} scope?`)) return;
    await api.patch(`/admins/${adminId}/scope`, { scope: newScope });
    load();
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admins</h1>
          <p className="text-gray-500 text-sm mt-1">Manage admin accounts and permissions</p>
        </div>
        <button
          className="btn-primary w-auto px-5 py-2.5 text-sm"
          onClick={() => setShowCreate(true)}
        >
          + Create Admin
        </button>
      </div>

      {/* Create admin modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h2 className="font-bold text-gray-900 mb-4">Create Admin Account</h2>
            {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
            <form onSubmit={createAdmin} className="flex flex-col gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Name</label>
                <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="input-field" required />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Email</label>
                <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="input-field" required />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Password</label>
                <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} className="input-field" required minLength={8} />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Scope</label>
                <select value={form.scope} onChange={e => setForm(f => ({ ...f, scope: e.target.value }))} className="input-field">
                  <option value="project">Project (default)</option>
                  {admin?.scope === 'global' && <option value="global">Global</option>}
                </select>
                <p className="text-xs text-gray-400 mt-1">
                  Project admins manage only their assigned projects. Global admins can manage everything.
                </p>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreate(false)} className="btn-ghost flex-1 border border-gray-200">Cancel</button>
                <button type="submit" disabled={creating} className="btn-primary flex-1">
                  {creating ? '…' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><LoadingSpinner /></div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* Admin list */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Admin accounts ({admins.length})</h2>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Name</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 hidden md:table-cell">Email</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Scope</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 hidden lg:table-cell">Created by</th>
                  {admin?.scope === 'global' && (
                    <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {admins.map(a => (
                  <tr key={a.id} className="border-b border-gray-50">
                    <td className="px-5 py-3 font-medium text-gray-900">
                      {a.name}
                      {a.id === admin?.id && <span className="ml-2 badge bg-gray-100 text-gray-500 text-xs">You</span>}
                    </td>
                    <td className="px-5 py-3 text-gray-500 hidden md:table-cell">{a.email}</td>
                    <td className="px-5 py-3">
                      <span className={`badge ${a.scope === 'global' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-500'}`}>
                        {a.scope}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-400 text-xs hidden lg:table-cell">
                      {a.created_by_name || 'System'}
                    </td>
                    {admin?.scope === 'global' && (
                      <td className="px-5 py-3 text-right">
                        {a.id !== admin?.id && (
                          <button
                            onClick={() => changeScope(a.id, a.scope === 'global' ? 'project' : 'global')}
                            className="text-xs px-2.5 py-1 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
                          >
                            {a.scope === 'global' ? 'Demote' : 'Promote to global'}
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Audit log */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Audit log</h2>
              <p className="text-xs text-gray-400 mt-0.5">Last 100 admin actions</p>
            </div>
            <div className="divide-y divide-gray-50 max-h-80 overflow-y-auto">
              {auditLog.length === 0 ? (
                <div className="px-5 py-8 text-center text-gray-400 text-sm">No audit log entries</div>
              ) : auditLog.map(entry => (
                <div key={entry.id} className="px-5 py-3 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">{entry.actor_name || 'System'}</span>{' '}
                      <span className="text-gray-500">{entry.action.replace(/_/g, ' ')}</span>
                    </p>
                    {entry.metadata && (
                      <p className="text-xs text-gray-400 mt-0.5">{JSON.stringify(entry.metadata)}</p>
                    )}
                  </div>
                  <span className="text-xs text-gray-400 flex-shrink-0">
                    {new Date(entry.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
