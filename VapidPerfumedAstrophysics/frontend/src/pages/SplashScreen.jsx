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
    }, 3500);
    return () => clearTimeout(timer);
  }, [loading, user, navigate]);

  return (
    <div className="h-full flex flex-col items-center justify-center bg-white relative overflow-hidden">
      {/* Dual-identity crossfade — sub-1.5s branding beat */}
      <div className="relative w-72 h-72 flex items-center justify-center">
        {/* Rotaract lockup */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 splash-a">
          <img
            src="/partners/rotaract-muhimbili-icon.svg"
            alt="Rotaract wheel"
            className="w-28 h-28 drop-shadow-sm"
          />
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: '#E91E8C' }}>
              Rotaract in Action
            </h1>
            <p className="text-xs text-gray-400 mt-1 font-medium tracking-widest uppercase">Ria</p>
          </div>
        </div>
        {/* Rotary lockup */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 splash-b">
          <img
            src="/partners/rotary-international-icon.svg"
            alt="Rotary wheel"
            className="w-28 h-28 drop-shadow-sm"
          />
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: '#17458F' }}>
              Rotary in Action
            </h1>
            <p className="text-xs text-gray-400 mt-1 font-medium tracking-widest uppercase">Ria</p>
          </div>
        </div>
      </div>

      {/* Built by strip */}
      <div className="absolute bottom-8 flex flex-col items-center gap-2 opacity-50">
        <p className="text-[10px] text-gray-400 tracking-wider uppercase font-medium">Partners under R4C</p>
        <div className="flex items-center gap-4">
          <img src="/partners/nama-labs-icon.svg" alt="Nama Labs" className="h-5 object-contain" />
          <img src="/partners/rotaract-tanzania-icon.svg" alt="Rotaract Tanzania" className="h-5 object-contain" />
          <img src="/partners/rotaract-muhimbili-icon.svg" alt="Rotaract Muhimbili" className="h-5 object-contain" />
        </div>
      </div>
    </div>
  );
}
