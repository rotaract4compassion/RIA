import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { t } from '../lib/i18n';
import api from '../lib/api';

const HomeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);
const ProjectsIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
    <line x1="8" y1="21" x2="16" y2="21" />
    <line x1="12" y1="17" x2="12" y2="21" />
  </svg>
);
const SuggestionIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);
const AnnouncementsIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);
const ProfileIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

export default function BottomNav() {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let mounted = true;
    async function fetchCount() {
      try {
        const data = await api.get('/broadcasts/unread-count');
        if (mounted) setUnreadCount(data.count || 0);
      } catch { /* offline — skip */ }
    }
    fetchCount();
    // Refresh count when app comes online
    const onOnline = () => fetchCount();
    window.addEventListener('online', onOnline);
    // Also refresh every 5 minutes
    const interval = setInterval(fetchCount, 5 * 60 * 1000);
    return () => {
      mounted = false;
      window.removeEventListener('online', onOnline);
      clearInterval(interval);
    };
  }, []);

  const navItems = [
    { to: '/home', label: 'home', Icon: HomeIcon },
    { to: '/projects', label: 'projects', Icon: ProjectsIcon },
    { to: '/suggestions', label: 'suggestions', Icon: SuggestionIcon },
    {
      to: '/announcements', label: 'announcements', Icon: AnnouncementsIcon,
      badge: unreadCount > 0 ? unreadCount : null,
    },
    { to: '/profile', label: 'profile', Icon: ProfileIcon },
  ];

  return (
    <nav className="bottom-nav">
      <div className="flex">
        {navItems.map(({ to, label, Icon, badge }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-xs font-medium transition-colors min-h-[56px] ${
                isActive ? 'text-[var(--color-primary)]' : 'text-gray-400'
              }`
            }
          >
            <span className="relative">
              <Icon />
              {badge && (
                <span
                  className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 flex items-center justify-center rounded-full text-white text-[9px] font-bold px-1"
                  style={{ backgroundColor: 'var(--color-primary)' }}
                >
                  {badge > 99 ? '99+' : badge}
                </span>
              )}
            </span>
            <span>{t(label)}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
