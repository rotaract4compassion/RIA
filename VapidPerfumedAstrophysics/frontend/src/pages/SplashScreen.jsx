import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../store/auth';

export default function SplashScreen() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    const timer = setTimeout(() => {
      if (user) {
        const tutorialDone = localStorage.getItem('ria_tutorial_done');
        const installSeen = localStorage.getItem('ria_install_seen');
        // Check if already running as installed PWA (standalone mode)
        const isInstalled =
          window.matchMedia('(display-mode: standalone)').matches ||
          window.navigator.standalone === true;
        if (!installSeen && !isInstalled) {
          navigate('/add-to-home');
        } else if (!tutorialDone) {
          navigate('/tutorial');
        } else {
          navigate('/home');
        }
      } else {
        navigate('/welcome');
      }
    }, 1400);
    return () => clearTimeout(timer);
  }, [loading, user, navigate]);

  return (
    <div className="h-full flex flex-col items-center justify-center bg-white relative overflow-hidden">
      {/* Dual-identity crossfade — sub-1.5s branding beat */}
      <div className="relative w-64 h-64 flex items-center justify-center">
        <img
          src="/splash/ria-rotaract-splash-lockup.png"
          alt="Rotaract in Action"
          className="absolute inset-0 w-full h-full object-contain splash-a"
        />
        <img
          src="/splash/ria-rotary-splash-lockup.png"
          alt="Rotary in Action"
          className="absolute inset-0 w-full h-full object-contain splash-b"
        />
      </div>
    </div>
  );
}
