import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../store/auth';
import { t, getLang } from '../lib/i18n';
import api from '../lib/api';
import { manualRefresh } from '../lib/sync';
import BottomNav from '../components/BottomNav';
import LoadingSpinner from '../components/LoadingSpinner';
import { BarChart2, Map, Trophy, FolderOpen, Smartphone, RefreshCw } from 'lucide-react';

function ProjectCard({ project, onClick }) {
  return (
    <button
      onClick={onClick}
      className="card w-full text-left flex flex-col gap-2 active:scale-95 transition-transform"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-gray-900 text-sm leading-tight">{project.name}</h3>
        {project.club_org && (
          <span className="badge bg-gray-100 text-gray-500 flex-shrink-0">{project.club_org}</span>
        )}
      </div>
      {project.description && (
        <p className="text-xs text-gray-500 line-clamp-2">{project.description}</p>
      )}
      <div className="flex items-center gap-3 mt-1">
        <span className="text-xs text-gray-400">
          {project.my_submission_count || 0} {t('submissions')}
        </span>
        {project.recent_count > 0 && (
          <span className="badge" style={{ backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)' }}>
            {project.recent_count} this month
          </span>
        )}
      </div>
    </button>
  );
}

function ImpactStrip({ impact }) {
  if (!impact) return null;
  return (
    <div className="card">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">{t('impact_summary')}</h3>
      <div className="flex justify-around">
        {[
          { value: impact.total_submissions, label: t('submissions'), icon: <BarChart2 size={24} /> },
          { value: impact.region_count, label: t('regions'), icon: <Map size={24} /> },
          { value: impact.achievement_count, label: t('achievements'), icon: <Trophy size={24} /> },
        ].map(({ value, label, icon }) => (
          <div key={label} className="text-center flex flex-col items-center">
            <div className="text-gray-400 mb-1">{icon}</div>
            <div className="text-xl font-bold text-gray-900">{value}</div>
            <div className="text-xs text-gray-500">{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function HomeScreen({ tab = 'home' }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [impact, setImpact] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const h = () => forceUpdate(n => n + 1);
    window.addEventListener('lang-change', h);
    return () => window.removeEventListener('lang-change', h);
  }, []);

  const load = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      const [projectsRes, impactRes, leaderRes] = await Promise.all([
        api.get('/projects/mine'),
        api.get('/achievements/impact'),
        api.get('/leaderboard?metric=submissions&scope=global&view=individual')
      ]);
      setProjects(projectsRes);
      setImpact(impactRes);
      setLeaderboard(leaderRes);
    } catch (e) {
      console.error('Load error:', e);
    } finally {
      if (!isRefresh) setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      await manualRefresh();
      await load(true);
    } finally {
      setRefreshing(false);
    }
  };

  const isInstalled = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;

  return (
    <div className="h-full flex flex-col bg-gray-50 safe-top">
      {/* Header */}
      <div className="bg-white px-5 pt-5 pb-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm text-gray-500">{t('hello')}, {user?.name?.split(' ')[0]}</p>
              <button 
                onClick={handleRefresh} 
                disabled={refreshing}
                className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
              </button>
            </div>
            <h1 className="text-xl font-bold text-gray-900">{user?.club}</h1>
          </div>
          <div className="flex items-center gap-2">
            {/* Identity badge */}
            <span
              className="text-xs font-semibold px-2.5 py-1 rounded-full text-white"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              {user?.identity === 'rotarian' ? (
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span> Rotarian</span>
              ) : (
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-pink-500"></span> Rotaractor</span>
              )}
            </span>
          </div>
        </div>

        {/* Install reminder if not installed */}
        {!isInstalled && (
          <button
            onClick={() => navigate('/add-to-home')}
            className="mt-3 w-full text-xs flex items-center justify-center gap-2 py-2 rounded-xl border border-dashed border-gray-300 text-gray-400"
          >
            <Smartphone size={16} /> Add Ria to your home screen for offline access
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 scroll-area px-4 py-4 pb-24 flex flex-col gap-4">
        {tab === 'home' ? (
          <>
            {/* Impact strip */}
            <ImpactStrip impact={impact} />

            {/* Leaderboard teaser */}
            <button
              className="card text-left flex items-center justify-between active:scale-95 transition-transform bg-gradient-to-r from-indigo-50 to-white border-indigo-100"
              onClick={() => navigate('/leaderboard')}
            >
              <div className="flex items-center gap-3">
                <span className="text-indigo-500 bg-white p-2 rounded-xl shadow-sm"><Trophy size={24} /></span>
                <div>
                  <p className="font-semibold text-sm text-gray-900">Leaderboard Rank</p>
                  <p className="text-xs text-gray-500">Global Submissions</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-extrabold text-indigo-600">
                  {leaderboard.find(r => r.is_me) ? `#${leaderboard.find(r => r.is_me).rank}` : '50+'}
                </p>
              </div>
            </button>

            {/* Achievements teaser */}
            {impact?.achievement_count > 0 && (
              <button
                className="card text-left flex items-center gap-3 active:scale-95 transition-transform"
                onClick={() => navigate('/achievements')}
              >
                <span className="text-amber-500"><Trophy size={32} /></span>
                <div>
                  <p className="font-semibold text-sm text-gray-900">
                    {impact.achievement_count} Achievement{impact.achievement_count !== 1 ? 's' : ''} unlocked
                  </p>
                  <p className="text-xs text-gray-400">Tap to see your badges →</p>
                </div>
              </button>
            )}

            {/* Recent Projects */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-gray-900">{t('my_projects')}</h2>
                <button
                  onClick={() => navigate('/projects')}
                  className="text-sm font-medium text-gray-500 hover:text-gray-700"
                >
                  View all →
                </button>
              </div>

              {loading ? (
                <div className="flex justify-center py-4"><LoadingSpinner /></div>
              ) : projects.length === 0 ? (
                <div className="card text-center py-6 flex flex-col items-center gap-2">
                  <span className="text-gray-300"><FolderOpen size={32} strokeWidth={1.5} /></span>
                  <p className="text-gray-500 text-sm">{t('no_projects')}</p>
                  <button className="btn-primary max-w-[200px] mt-2 text-xs py-2" onClick={() => navigate('/projects/browse')}>
                    {t('browse_projects')}
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {projects.slice(0, 3).map(p => (
                    <ProjectCard
                      key={p.id}
                      project={p}
                      onClick={() => navigate(`/projects/${p.id}`)}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Projects Tab */}
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl font-bold text-gray-900">My Projects</h1>
              <button
                onClick={() => navigate('/projects/browse')}
                className="flex items-center gap-1 text-sm font-medium rounded-lg px-3 py-1.5"
                style={{ color: 'var(--color-primary)', backgroundColor: 'var(--color-primary-light)' }}
              >
                <span className="text-lg leading-none">+</span> Browse
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center py-12"><LoadingSpinner /></div>
            ) : projects.length === 0 ? (
              <div className="card text-center py-12 flex flex-col items-center gap-4">
                <span className="text-gray-300"><FolderOpen size={48} strokeWidth={1.5} /></span>
                <p className="text-gray-500 text-sm">{t('no_projects')}</p>
                <p className="text-gray-400 text-xs max-w-[200px]">{t('join_project')}</p>
                <button className="btn-primary max-w-[200px] mt-2" onClick={() => navigate('/projects/browse')}>
                  {t('browse_projects')}
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {projects.map(p => (
                  <ProjectCard
                    key={p.id}
                    project={p}
                    onClick={() => navigate(`/projects/${p.id}`)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
