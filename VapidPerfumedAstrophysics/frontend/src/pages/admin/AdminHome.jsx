import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import LoadingSpinner from '../../components/LoadingSpinner';

function KpiCard({ value, label, icon }) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-2xl font-bold text-gray-900">{value ?? '—'}</p>
          <p className="text-sm text-gray-500 mt-1">{label}</p>
        </div>
        <span className="text-2xl">{icon}</span>
      </div>
    </div>
  );
}

function SystemHealthWidget({ health }) {
  if (!health) return null;
  const { database, counts } = health;
  const isWarning = database.warning;
  return (
    <div className={`rounded-2xl p-5 border ${isWarning ? 'bg-amber-50 border-amber-200' : 'bg-white border-gray-100'} shadow-sm`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="font-semibold text-gray-900">System Health</p>
          <p className="text-xs text-gray-500 mt-0.5">Database & hosting limits</p>
        </div>
        <span className="text-xl">{isWarning ? '⚠️' : '✅'}</span>
      </div>

      <div className="mb-3">
        <div className="flex justify-between text-xs text-gray-600 mb-1">
          <span>Database ({database.size_mb} MB used)</span>
          <span>{database.usage_percent}% of {database.free_tier_cap_mb}MB free tier</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full">
          <div
            className={`h-2 rounded-full transition-all ${isWarning ? 'bg-amber-400' : 'bg-green-400'}`}
            style={{ width: `${Math.min(database.usage_percent, 100)}%` }}
          />
        </div>
        {isWarning && (
          <p className="text-xs text-amber-600 mt-1 font-medium">
            ⚠️ Over 80% of free tier used — consider upgrading to avoid service disruption.
          </p>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 text-center mt-4 pt-4 border-t border-gray-100">
        <div>
          <p className="text-lg font-bold text-gray-900">{counts.users}</p>
          <p className="text-xs text-gray-500">Users</p>
        </div>
        <div>
          <p className="text-lg font-bold text-gray-900">{counts.submissions}</p>
          <p className="text-xs text-gray-500">Submissions</p>
        </div>
        <div>
          <p className="text-lg font-bold text-gray-900">{counts.tables}</p>
          <p className="text-xs text-gray-500">DB Tables</p>
        </div>
      </div>
    </div>
  );
}

export default function AdminHome() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/projects/admin/all'),
      api.get('/health/admin'),
      api.get('/users/admin'),
      api.get('/suggestions/admin'),
    ]).then(([projects, healthData, users, suggestions]) => {
      const activeProjects = (projects || []).filter(p => p.status === 'active').length;
      const totalSubs = (projects || []).reduce((a, p) => a + parseInt(p.submission_count || 0), 0);
      const unreadSuggestions = (suggestions || []).filter(s => !s.is_read).length;
      setStats({
        activeProjects,
        totalSubmissions: totalSubs,
        registeredUsers: (users || []).length,
        pendingSuggestions: unreadSuggestions,
      });
      setHealth(healthData);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const quickLinks = [
    { label: 'Projects', icon: '📋', to: '/admin/projects' },
    { label: 'Users', icon: '👥', to: '/admin/users' },
    { label: 'Admins', icon: '🔑', to: '/admin/admins' },
    { label: 'Suggestions', icon: '💬', to: '/admin/suggestions' },
    { label: 'Broadcasts', icon: '📣', to: '/admin/broadcasts' },
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Overview and system status</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><LoadingSpinner /></div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard value={stats?.activeProjects} label="Active Projects" icon="📋" />
            <KpiCard value={stats?.totalSubmissions} label="Total Submissions" icon="📊" />
            <KpiCard value={stats?.registeredUsers} label="Registered Users" icon="👥" />
            <KpiCard value={stats?.pendingSuggestions} label="Unread Suggestions" icon="💬" />
          </div>

          {/* System health */}
          <SystemHealthWidget health={health} />

          {/* Quick links */}
          <div>
            <h2 className="font-semibold text-gray-700 text-sm mb-3">Quick access</h2>
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
              {quickLinks.map(({ label, icon, to }) => (
                <button
                  key={to}
                  onClick={() => navigate(to)}
                  className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:border-[var(--color-primary)] transition-colors text-left flex items-center gap-3"
                >
                  <span className="text-2xl">{icon}</span>
                  <span className="text-sm font-medium text-gray-700">{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
