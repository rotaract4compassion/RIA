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
    <div className="h-full bg-gray-50 flex flex-col safe-top overflow-x-hidden">
      {/* Navigation Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex items-center justify-between bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="flex items-center gap-2">
          <img src="/icons/ria-app-icon-whitebg-192.png" alt="Ria Logo" className="w-8 h-8 rounded-lg shadow-sm" />
          <span className="font-bold text-lg text-gray-900 tracking-tight">Ria</span>
        </div>
        <LangToggle />
      </div>

      <div className="flex-1 scroll-area pb-12 pt-20">
        
        {/* Hero Section */}
        <section className="px-6 py-12 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-bold uppercase tracking-wider mb-8 animate-fade-in-up">
            Built for Impact
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight mb-6 animate-fade-in-up animation-delay-100">
            Ria isn't a platform.<br />
            <span style={{ color: 'var(--color-primary)' }}>It's proof.</span>
          </h1>
          <p className="text-base text-gray-500 max-w-md mx-auto leading-relaxed mb-10 animate-fade-in-up animation-delay-200">
            {getLang() === 'sw' 
              ? 'Rotary na Rotaract wanafanya kazi halisi. Sasa unaweza kuthibitisha.' 
              : 'Rotary and Rotaract clubs across Tanzania do real work. Boreholes, health screenings, hygiene programs. Now, you can prove it.'}
          </p>
          <div className="w-full flex flex-col gap-3 max-w-xs mx-auto animate-fade-in-up animation-delay-300">
            <button className="btn-primary py-4 text-lg shadow-lg shadow-primary/30" onClick={() => navigate('/register')}>
              {t('register')}
            </button>
            <button className="btn-secondary py-4" onClick={() => navigate('/login')}>
              {t('login')}
            </button>
          </div>
        </section>

        {/* Dynamic Image Grid */}
        <section className="px-4 py-8">
          <div className="grid grid-cols-2 gap-3 animate-fade-in-up animation-delay-400">
            <div className="flex flex-col gap-3">
              <div className="rounded-2xl overflow-hidden shadow-md h-40">
                <img src="/images/wash.png" alt="WASH Initiative" className="w-full h-full object-cover" />
              </div>
              <div className="rounded-2xl overflow-hidden shadow-md h-32">
                <img src="/images/education.png" alt="Education Support" className="w-full h-full object-cover" />
              </div>
            </div>
            <div className="flex flex-col gap-3 pt-8">
              <div className="rounded-2xl overflow-hidden shadow-md h-32">
                <img src="/images/women.png" alt="Women Empowerment" className="w-full h-full object-cover" />
              </div>
              <div className="rounded-2xl overflow-hidden shadow-md h-40">
                <img src="/images/action.png" alt="Rotaract in Action" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>
        </section>

        {/* Feature Highlights */}
        <section className="px-6 py-12">
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-5">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Works offline</h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              No signal? No problem. Collect field data anywhere. It automatically syncs when you reconnect.
            </p>
          </div>
          
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
            <div className="w-12 h-12 rounded-2xl bg-pink-50 text-pink-500 flex items-center justify-center mb-5">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path></svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Earn achievements</h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              Log minutes of impact, unlock regions, and climb the leaderboard. Showing up should feel like something.
            </p>
          </div>
        </section>

        {/* The Story / Partners */}
        <section className="px-6 py-8 text-center">
          <p className="text-sm text-gray-400 leading-relaxed max-w-sm mx-auto mb-8">
            Built by Nama Labs as a promise to Rotaract Muhimbili. Infrastructure, not a product.
          </p>
          
          <div className="flex flex-wrap items-center justify-center gap-6 opacity-60 grayscale">
            <img src="/logos/rotary-international.svg" alt="Rotary International" className="h-8 object-contain max-w-[120px]" />
            <img src="/logos/rotaract-tanzania.svg" alt="Rotaract Tanzania" className="h-8 object-contain max-w-[120px]" />
            <img src="/logos/rotaract-muhimbili.svg" alt="Rotaract Muhimbili" className="h-8 object-contain max-w-[120px]" />
          </div>
        </section>

        {/* Admin Link */}
        <section className="px-6 pb-6 pt-12 text-center">
          <button onClick={() => navigate('/admin/login')} className="text-xs font-semibold text-gray-400 hover:text-gray-600 transition-colors">
            Admin? Sign in here &rarr;
          </button>
        </section>

      </div>
    </div>
  );
}
