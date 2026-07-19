import React, { useState, useEffect } from 'react';
import api from '../../lib/api';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function AdminSuggestions() {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    api.get('/suggestions/admin')
      .then(setSuggestions)
      .catch(console.error)
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function markRead(id) {
    await api.patch(`/suggestions/admin/${id}/read`);
    setSuggestions(ss => ss.map(s => s.id === id ? { ...s, is_read: true } : s));
  }

  const unread = suggestions.filter(s => !s.is_read);
  const read = suggestions.filter(s => s.is_read);

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Suggestions</h1>
        <p className="text-gray-500 text-sm mt-1">
          {unread.length} unread · {suggestions.length} total
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><LoadingSpinner /></div>
      ) : suggestions.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400">
          <p className="text-4xl mb-3">💬</p>
          <p>No suggestions yet</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* Unread */}
          {unread.length > 0 && (
            <div>
              <h2 className="font-semibold text-gray-700 text-sm mb-3">Unread ({unread.length})</h2>
              <div className="flex flex-col gap-3">
                {unread.map(s => <SuggestionCard key={s.id} suggestion={s} onRead={markRead} />)}
              </div>
            </div>
          )}

          {/* Read */}
          {read.length > 0 && (
            <div>
              <h2 className="font-semibold text-gray-500 text-sm mb-3">Read ({read.length})</h2>
              <div className="flex flex-col gap-3 opacity-70">
                {read.map(s => <SuggestionCard key={s.id} suggestion={s} onRead={markRead} />)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SuggestionCard({ suggestion: s, onRead }) {
  const daysUntilExpiry = Math.ceil(
    (new Date(s.expires_at) - Date.now()) / (1000 * 60 * 60 * 24)
  );
  return (
    <div className={`bg-white rounded-2xl border p-5 shadow-sm ${!s.is_read ? 'border-[var(--color-primary)] border-opacity-30' : 'border-gray-100'}`}>
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          {s.is_anonymous ? (
            <span className="badge bg-gray-100 text-gray-500 text-xs">🔒 Anonymous</span>
          ) : (
            <div>
              <p className="text-sm font-medium text-gray-900">{s.user_name}</p>
              <p className="text-xs text-gray-400">{s.user_email}</p>
            </div>
          )}
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="text-xs text-gray-400">{new Date(s.created_at).toLocaleDateString()}</span>
          <span className={`text-xs ${daysUntilExpiry < 14 ? 'text-amber-500' : 'text-gray-400'}`}>
            {daysUntilExpiry > 0 ? `Expires in ${daysUntilExpiry}d` : 'Expired'}
          </span>
        </div>
      </div>

      {s.project_name && (
        <p className="text-xs text-gray-400 mb-2">Project: {s.project_name}</p>
      )}

      <p className="text-sm text-gray-700 leading-relaxed">{s.content}</p>

      {!s.is_read && (
        <button
          onClick={() => onRead(s.id)}
          className="mt-3 text-xs font-medium"
          style={{ color: 'var(--color-primary)' }}
        >
          Mark as read
        </button>
      )}
    </div>
  );
}
