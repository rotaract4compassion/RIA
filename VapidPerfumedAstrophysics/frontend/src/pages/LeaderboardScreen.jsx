import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { t, getLang } from '../lib/i18n';
import { useAuth } from '../store/auth';
import api from '../lib/api';
import BottomNav from '../components/BottomNav';
import LoadingSpinner from '../components/LoadingSpinner';
import { BarChart2, Clock, Map, Trophy, Medal } from 'lucide-react';

const METRICS = [
  { key: 'submissions', labelKey: 'metric_submissions', icon: <BarChart2 size={16} /> },
  { key: 'minutes', labelKey: 'metric_minutes', icon: <Clock size={16} /> },
  { key: 'regions', labelKey: 'metric_regions', icon: <Map size={16} /> },
];

const UNIT_LABELS = {
  submissions: 'submissions',
  minutes: 'min',
  regions: 'regions',
};

export default function LeaderboardScreen() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [view, setView] = useState('individual'); // individual | club
  const [metric, setMetric] = useState('submissions');
  const [scope, setScope] = useState('global'); // global | project
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [celebration, setCelebration] = useState(null);
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const h = () => forceUpdate(n => n + 1);
    window.addEventListener('lang-change', h);
    return () => window.removeEventListener('lang-change', h);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ metric, scope, view });
      const rows = await api.get(`/leaderboard?${params}`);
      setData(rows);

      const me = rows.find(r => r.is_me);
      if (me) {
        const cacheKey = `ria_rank_${view}_${metric}_${scope}`;
        const prevRank = parseInt(localStorage.getItem(cacheKey) || '999999');
        if (me.rank < prevRank && prevRank !== 999999) {
          setCelebration({ from: prevRank, to: me.rank });
          // Auto-hide celebration after 5 seconds
          setTimeout(() => setCelebration(null), 5000);
        }
        localStorage.setItem(cacheKey, me.rank);
      }
    } catch (e) {
      console.error(e);
      setData([]);
    }
    setLoading(false);
  }, [metric, scope, view]);

  useEffect(() => { load(); }, [load]);

  function rankBadge(rank) {
    if (rank === 1) return <Medal className="text-yellow-500" size={24} />;
    if (rank === 2) return <Medal className="text-gray-400" size={24} />;
    if (rank === 3) return <Medal className="text-amber-600" size={24} />;
    return <span className="text-sm font-bold text-gray-500">#{rank}</span>;
  }

  const myEntry = data.find(r => r.is_me);

  return (
    <div className="h-full flex flex-col bg-gray-50 safe-top">
      {/* Header */}
      <div className="bg-white px-5 pt-5 pb-4 border-b border-gray-100">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate(-1)} className="text-gray-500 p-1 -ml-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="font-bold text-xl text-gray-900 flex items-center gap-2">
            <Trophy className="text-amber-500" size={24} /> {t('leaderboard')}
          </h1>
        </div>

        {/* View toggle: Individual / Club */}
        <div className="flex gap-2 mb-3">
          {[['individual', t('by_individual')], ['club', t('by_club')]].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setView(key)}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${
                view === key ? 'text-white' : 'bg-gray-100 text-gray-600'
              }`}
              style={view === key ? { backgroundColor: 'var(--color-primary)' } : {}}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Scope toggle: Global / Project */}
        <div className="flex gap-2">
          {[['global', t('global_ranking')], ['project', t('project_ranking')]].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setScope(key)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-medium border-2 transition-all ${
                scope === key ? 'border-transparent text-white' : 'border-gray-200 text-gray-500 bg-white'
              }`}
              style={scope === key ? { backgroundColor: 'var(--color-primary)', borderColor: 'var(--color-primary)' } : {}}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Metric selector */}
      <div className="bg-white border-b border-gray-100 px-4 py-2 flex gap-2 overflow-x-auto">
        {METRICS.map(({ key, labelKey, icon }) => (
          <button
            key={key}
            onClick={() => setMetric(key)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              metric === key
                ? 'text-white border-transparent'
                : 'border-gray-200 text-gray-600 bg-gray-50'
            }`}
            style={metric === key ? { backgroundColor: 'var(--color-primary)', borderColor: 'var(--color-primary)' } : {}}
          >
            {icon} {t(labelKey)}
          </button>
        ))}
      </div>

      {/* My rank banner (if in view) */}
      {myEntry && !celebration && (
        <div
          className="mx-4 mt-3 px-4 py-2.5 rounded-xl flex items-center justify-between"
          style={{ backgroundColor: 'var(--color-primary-light)' }}
        >
          <span className="text-xs font-semibold" style={{ color: 'var(--color-primary)' }}>
            {t('your_rank')}
          </span>
          <span className="text-sm font-bold flex items-center gap-1" style={{ color: 'var(--color-primary)' }}>
            {rankBadge(myEntry.rank)} — {myEntry.score} {UNIT_LABELS[metric]}
          </span>
        </div>
      )}

      {celebration && (
        <>
          {Array.from({ length: 30 }).map((_, i) => (
            <div key={i} className="confetti" style={{
              left: `${Math.random() * 100}vw`,
              animationDelay: `${Math.random() * 2}s`,
              backgroundColor: ['#F7A81B', '#E91E8C', '#4CAF50', '#2196F3'][Math.floor(Math.random() * 4)]
            }}></div>
          ))}
          <div
            className="mx-4 mt-3 px-4 py-3 rounded-xl flex flex-col items-center justify-center animate-celebrate text-center"
            style={{ backgroundColor: 'var(--color-gold)', color: 'white' }}
          >
            <span className="text-sm font-bold drop-shadow">Rank Up! 🎉</span>
            <span className="text-xs font-medium opacity-90 drop-shadow">
              You moved from #{celebration.from} to #{celebration.to}
            </span>
          </div>
        </>
      )}

      {/* List */}
      <div className="flex-1 scroll-area px-4 py-3 pb-24 flex flex-col gap-2">
        {loading ? (
          <div className="flex justify-center py-12"><LoadingSpinner /></div>
        ) : data.length === 0 ? (
          <div className="card text-center py-10 flex flex-col items-center gap-2">
            <span className="text-amber-500"><Trophy size={48} strokeWidth={1.5} /></span>
            <p className="text-gray-500 text-sm">No data yet — be the first!</p>
          </div>
        ) : (
          data.map(row => {
            const isMe = row.is_me;
            return (
              <div
                key={row.rank}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all ${
                  isMe
                    ? 'border-[var(--color-primary)] shadow-sm'
                    : 'bg-white border-gray-100'
                }`}
                style={isMe ? { backgroundColor: 'var(--color-primary-light)' } : {}}
              >
                {/* Rank */}
                <div className="w-8 text-center flex-shrink-0">
                  {row.rank <= 3 ? (
                    <div className="flex justify-center">{rankBadge(row.rank)}</div>
                  ) : (
                    rankBadge(row.rank)
                  )}
                </div>

                {/* Avatar / initial (individual view only) */}
                {view === 'individual' && (
                  <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden"
                       style={{ backgroundColor: isMe ? 'var(--color-primary)' : '#E5E7EB' }}>
                    {row.profile_picture_url ? (
                      <img src={row.profile_picture_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-sm font-bold" style={{ color: isMe ? '#fff' : '#6B7280' }}>
                        {row.name?.[0]?.toUpperCase() || '?'}
                      </span>
                    )}
                  </div>
                )}

                {/* Name / Club */}
                <div className="flex-1 min-w-0">
                  <p className={`font-semibold text-sm truncate ${isMe ? '' : 'text-gray-900'}`}
                     style={isMe ? { color: 'var(--color-primary)' } : {}}>
                    {row.name}{isMe ? ' (you)' : ''}
                  </p>
                  {view === 'individual' && row.club && (
                    <p className="text-xs text-gray-400 truncate">{row.club}</p>
                  )}
                </div>

                {/* Score */}
                <div className="text-right flex-shrink-0">
                  <span className="text-sm font-bold text-gray-900">{row.score.toLocaleString()}</span>
                  <p className="text-xs text-gray-400">{UNIT_LABELS[metric]}</p>
                </div>
              </div>
            );
          })
        )}
      </div>

      <BottomNav />
    </div>
  );
}
