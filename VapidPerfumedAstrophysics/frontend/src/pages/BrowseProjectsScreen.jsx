import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { t } from '../lib/i18n';
import api from '../lib/api';
import BottomNav from '../components/BottomNav';
import LoadingSpinner from '../components/LoadingSpinner';

export default function BrowseProjectsScreen() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [affiliating, setAffiliating] = useState(null);
  const [toast, setToast] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get(`/projects${search ? `?search=${encodeURIComponent(search)}` : ''}`);
      setProjects(data);
    } catch {}
    setLoading(false);
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(load, 300);
    return () => clearTimeout(timer);
  }, [load]);

  async function affiliate(project) {
    if (project.is_affiliated) return;
    setAffiliating(project.id);
    try {
      await api.post(`/projects/${project.id}/affiliate`);
      setProjects(ps => ps.map(p => p.id === project.id ? { ...p, is_affiliated: true } : p));
      setToast(`Joined "${project.name}"`);
      setTimeout(() => setToast(''), 2500);
    } catch {}
    setAffiliating(null);
  }

  return (
    <div className="h-full flex flex-col bg-gray-50 safe-top">
      {/* Header */}
      <div className="bg-white px-4 pt-4 pb-3 border-b border-gray-100">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => navigate(-1)} className="text-gray-500 p-1 -ml-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="font-bold text-gray-900">{t('browse_projects')}</h1>
        </div>
        <input
          type="search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search projects…"
          className="input-field"
        />
      </div>

      {/* Toast */}
      {toast && (
        <div className="mx-4 mt-3 bg-green-50 border border-green-200 rounded-xl px-4 py-2.5 text-sm text-green-700 font-medium animate-fade-in">
          ✓ {toast}
        </div>
      )}

      {/* List */}
      <div className="flex-1 scroll-area px-4 py-4 pb-24 flex flex-col gap-3">
        {loading ? (
          <div className="flex justify-center py-8"><LoadingSpinner /></div>
        ) : projects.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">No projects found</div>
        ) : (
          projects.map(p => (
            <div key={p.id} className="card flex items-center gap-3">
              <div className="flex-1 min-w-0" onClick={() => navigate(`/projects/${p.id}`)}>
                <h3 className="font-semibold text-gray-900 text-sm">{p.name}</h3>
                {p.description && <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{p.description}</p>}
                <p className="text-xs text-gray-400 mt-1">{p.member_count} members</p>
              </div>
              <button
                onClick={() => affiliate(p)}
                disabled={p.is_affiliated || affiliating === p.id}
                className={`flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
                  p.is_affiliated
                    ? 'bg-gray-100 text-gray-400'
                    : 'text-white'
                }`}
                style={p.is_affiliated ? {} : { backgroundColor: 'var(--color-primary)' }}
              >
                {affiliating === p.id ? '…' : p.is_affiliated ? 'Joined ✓' : 'Join'}
              </button>
            </div>
          ))
        )}
      </div>

      <BottomNav />
    </div>
  );
}
