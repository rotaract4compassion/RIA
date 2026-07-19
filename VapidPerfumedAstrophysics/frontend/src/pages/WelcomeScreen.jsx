import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { t, getLang } from '../lib/i18n';
import LangToggle from '../components/LangToggle';

export default function WelcomeScreen() {
  const navigate = useNavigate();
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const handler = () => forceUpdate(n => n + 1);
    window.addEventListener('lang-change', handler);
    return () => window.removeEventListener('lang-change', handler);
  }, []);

  return (
    <div className="h-full flex flex-col bg-white safe-top safe-bottom">
      {/* Language toggle top-right */}
      <div className="flex justify-end p-4">
        <LangToggle />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 pb-16 gap-8">
        {/* Logo */}
        <div className="w-40 h-40">
          <img
            src="/icons/ria-app-icon-whitebg-192.png"
            alt="Ria"
            className="w-full h-full object-contain rounded-3xl shadow-lg"
          />
        </div>

        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('app_name')}</h1>
          <p className="text-gray-500 text-base leading-relaxed">{t('tagline')}</p>
          <p className="text-gray-400 text-sm mt-3 leading-relaxed max-w-xs">
            {getLang() === 'sw'
              ? 'Zana ya kukusanya data ya miradi ya jamii katika Afrika'
              : 'Field data collection for community action projects across Africa'}
          </p>
        </div>

        <div className="w-full flex flex-col gap-3 mt-4">
          <button className="btn-primary" onClick={() => navigate('/register')}>
            {t('register')}
          </button>
          <button className="btn-secondary" onClick={() => navigate('/login')}>
            {t('login')}
          </button>
        </div>

        <p className="text-xs text-gray-400 text-center mt-4">
          {getLang() === 'sw'
            ? 'Zana ya kusaidia Rotary na Rotaract Africa'
            : 'A tool for Rotary and Rotaract Africa'}
        </p>
      </div>
    </div>
  );
}
