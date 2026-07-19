import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { t, getLang } from '../lib/i18n';
import LangToggle from '../components/LangToggle';
import LoadingSpinner from '../components/LoadingSpinner';

export default function WelcomeScreen() {
  const navigate = useNavigate();
  const [, forceUpdate] = useState(0);
  const [bgLoaded, setBgLoaded] = useState(false);

  useEffect(() => {
    const handler = () => forceUpdate(n => n + 1);
    window.addEventListener('lang-change', handler);
    return () => window.removeEventListener('lang-change', handler);
  }, []);

  useEffect(() => {
    // Preload background image
    const img = new Image();
    img.src = '/images/hero-bg.png';
    img.onload = () => setBgLoaded(true);
    img.onerror = () => setBgLoaded(true); // Fallback to show screen anyway if it fails
  }, []);

  if (!bgLoaded) {
    return (
      <div className="h-full bg-gray-900 flex flex-col items-center justify-center">
        <LoadingSpinner color="white" />
        <p className="text-gray-400 text-sm mt-4 tracking-widest uppercase animate-pulse">Loading Ria</p>
      </div>
    );
  }

  return (
    <div className="h-full bg-gray-900 relative overflow-hidden flex flex-col">
      {/* Background Image with Dark Overlay */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat transition-opacity duration-1000"
        style={{ 
          backgroundImage: 'url(/images/hero-bg.png)',
          opacity: bgLoaded ? 0.6 : 0
        }}
      />
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-gray-900/80 via-gray-900/60 to-gray-900/95" />

      {/* Navigation Bar */}
      <div className="relative z-50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src="/icons/ria-app-icon-whitebg-192.png" alt="Ria Logo" className="w-8 h-8 rounded-lg shadow-sm" />
          <span className="font-bold text-lg text-white tracking-tight drop-shadow-md">Ria</span>
        </div>
        <div>
           <LangToggle />
        </div>
      </div>

      <div className="flex-1 relative z-10 flex flex-col justify-end px-6 pb-12 pt-8">
        
        {/* Text Content */}
        <div className="mb-8 animate-fade-in-up">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white leading-tight mb-4 drop-shadow-lg">
            Proof of impact.
          </h1>
          <div className="w-12 h-1 bg-pink-500 rounded-full mb-6"></div>
          <p className="text-base text-gray-200 max-w-md leading-relaxed mb-4 drop-shadow-md">
            {getLang() === 'sw' 
              ? 'Vilabu vya Rotary na Rotaract nchini Tanzania vinafanya kazi kubwa. Sasa tuna sehemu moja ya kuhifadhi ushahidi wote.' 
              : 'Rotary and Rotaract clubs across Tanzania do real work. Boreholes, health screenings, hygiene programs. But the proof is often scattered.'}
          </p>
          <p className="text-base text-gray-200 max-w-md leading-relaxed drop-shadow-md font-medium">
             {getLang() === 'sw' ? 'Ria imetengenezwa kutatua hilo. Sio jukwaa la kibiashara, ni miundombinu yetu.' : 'Ria is built to fix that. Infrastructure, not a product.'}
          </p>
        </div>

        {/* Action Card */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-6 shadow-2xl animate-fade-in-up animation-delay-200">
          <div className="flex flex-col gap-3">
            <button className="btn-primary py-4 text-lg shadow-lg" onClick={() => navigate('/register')}>
              {t('register')}
            </button>
            <button className="bg-white/10 hover:bg-white/20 border border-white/30 text-white font-semibold rounded-2xl py-4 transition-colors" onClick={() => navigate('/login')}>
              {t('login')}
            </button>
          </div>
        </div>

        {/* Admin Link & Partner Logos */}
        <div className="mt-8 flex flex-col items-center gap-6 animate-fade-in-up animation-delay-400">
          <div className="flex flex-col items-center gap-3 opacity-60">
            <span className="text-[10px] text-gray-400 tracking-wider uppercase font-medium">Partners under R4C</span>
            <div className="flex items-center gap-5 grayscale contrast-200 brightness-200">
              <img src="/partners/nama-labs-icon.svg" alt="Nama Labs" className="h-5" />
              <img src="/partners/rotaract-tanzania-icon.svg" alt="Rotaract Tanzania" className="h-5" />
              <img src="/partners/rotaract-muhimbili-icon.svg" alt="Rotaract Muhimbili" className="h-5" />
            </div>
          </div>
          <button onClick={() => navigate('/admin/login')} className="text-xs font-semibold text-gray-400 hover:text-white transition-colors">
            Admin? Sign in here &rarr;
          </button>
        </div>

      </div>
    </div>
  );
}
