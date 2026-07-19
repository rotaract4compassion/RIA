import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { t } from '../lib/i18n';
import api from '../lib/api';
import BottomNav from '../components/BottomNav';
import LoadingSpinner from '../components/LoadingSpinner';

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const hrs = Math.floor(min / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function BroadcastCard({ broadcast, onRead }) {
  const [read, setRead] = useState(broadcast.is_read);

  async function handleRead() {
    if (read) return;
    try {
      await api.post(`/broadcasts/${broadcast.id}/read`, {});
      setRead(true);
      onRead();
    } catch { /* offline ok */ }
  }

  return (
    <div
      className={`card flex flex-col gap-3 ${!read ? 'border-[var(--color-primary)]' : 'border-gray-100'} cursor-pointer active:scale-98 transition-transform`}
      style={!read ? { borderWidth: '1.5px' } : {}}
      onClick={handleRead}
    >
      {/* Priority badge */}
      {broadcast.is_priority && (
        <div className="flex items-center gap-1.5">
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded-full text-white"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            📌 {t('pinned')}
          </span>
        </div>
      )}

      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <h3 className={`font-semibold text-sm leading-snug ${read ? 'text-gray-700' : 'text-gray-900'}`}>
          {!read && (
            <span
              className="inline-block w-2 h-2 rounded-full mr-2 mb-0.5 flex-shrink-0"
              style={{ backgroundColor: 'var(--color-primary)' }}
            />
          )}
          {broadcast.title}
        </h3>
        <span className="text-xs text-gray-400 flex-shrink-0 mt-0.5">{timeAgo(broadcast.created_at)}</span>
      </div>

      {/* Image */}
      {broadcast.image_url && (
        <div className="rounded-xl overflow-hidden -mx-0">
          <img
            src={broadcast.image_url}
            alt=""
            className="w-full object-cover max-h-40"
            loading="lazy"
          />
        </div>
      )}

      {/* Body */}
      <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{broadcast.body}</p>

      {/* Audience badge */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400">
          {broadcast.audience === 'all' ? '🌐 All users' :
           broadcast.audience === 'project' ? '📋 Project' :
           `👥 ${broadcast.club || 'Club'}`}
        </span>
        {!read && (
          <button
            className="text-xs font-medium"
            style={{ color: 'var(--color-primary)' }}
            onClick={e => { e.stopPropagation(); handleRead(); }}
          >
            {t('mark_read')}
          </button>
        )}
      </div>
    </div>
  );
}

export default function AnnouncementsScreen() {
  const navigate = useNavigate();
  const [broadcasts, setBroadcasts] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get('/broadcasts');
      // Sort: priority first, then by date
      const sorted = [...data].sort((a, b) => {
        if (a.is_priority !== b.is_priority) return a.is_priority ? -1 : 1;
        return new Date(b.created_at) - new Date(a.created_at);
      });
      setBroadcasts(sorted);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const unreadCount = broadcasts.filter(b => !b.is_read).length;

  return (
    <div className="h-full flex flex-col bg-gray-50 safe-top">
      {/* Header */}
      <div className="bg-white px-5 pt-5 pb-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-gray-500 p-1 -ml-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex-1">
            <h1 className="font-bold text-xl text-gray-900">
              🔔 {t('announcements')}
            </h1>
            {unreadCount > 0 && (
              <p className="text-xs text-gray-400 mt-0.5">
                {unreadCount} unread
              </p>
            )}
          </div>
          <button
            onClick={load}
            className="p-2 text-gray-400 rounded-xl hover:bg-gray-100 transition-colors"
            aria-label="Refresh"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 scroll-area px-4 py-4 pb-24 flex flex-col gap-3">
        {loading ? (
          <div className="flex justify-center py-12"><LoadingSpinner /></div>
        ) : broadcasts.length === 0 ? (
          <div className="card text-center py-12 flex flex-col items-center gap-3">
            <span className="text-5xl">🔕</span>
            <p className="font-semibold text-gray-700">{t('no_announcements')}</p>
            <p className="text-xs text-gray-400 max-w-xs">{t('announcements_empty')}</p>
          </div>
        ) : (
          broadcasts.map(b => (
            <BroadcastCard
              key={b.id}
              broadcast={b}
              onRead={() => {
                setBroadcasts(prev =>
                  prev.map(x => x.id === b.id ? { ...x, is_read: true } : x)
                );
              }}
            />
          ))
        )}
      </div>

      <BottomNav />
    </div>
  );
}
