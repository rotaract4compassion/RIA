import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { t, getLang } from '../lib/i18n';
import { logos } from '../lib/logos';
import LangToggle from '../components/LangToggle';
import LoadingSpinner from '../components/LoadingSpinner';

function Reveal({ children, delay = 0 }) {
  const [ref, setRef] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!ref) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisible(true);
        observer.unobserve(ref);
      }
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
    observer.observe(ref);
    return () => observer.disconnect();
  }, [ref]);

  return (
    <div
      ref={setRef}
      className={`transition-all duration-1000 transform ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

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
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center fixed inset-0 z-50">
        <LoadingSpinner color="white" />
        <p className="text-gray-400 text-sm mt-4 tracking-widest uppercase animate-pulse">Loading Ria</p>
      </div>
    );
  }

  const isSw = getLang() === 'sw';

  return (
    <div className="bg-gray-900 relative overflow-x-hidden h-full w-full" style={{ overflowY: 'auto' }}>
      {/* Fixed Background Image with Dark Overlay */}
      <div 
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat transition-opacity duration-1000"
        style={{ 
          backgroundImage: 'url(/images/hero-bg.png)',
          opacity: bgLoaded ? 1 : 0
        }}
      />
      {/* Lightened gradient so the background image pops through clearly */}
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-gray-900/60 via-gray-900/40 to-gray-900/80" />

      {/* Navigation Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex items-center justify-between bg-gradient-to-b from-gray-900/80 to-transparent">
        <div className="flex items-center gap-2">
          <img src="/icons/ria-app-icon-whitebg-192.png" alt="Ria Logo" className="w-8 h-8 rounded-lg shadow-sm" />
          <span className="font-bold text-lg text-white tracking-tight drop-shadow-md">Ria</span>
        </div>
        <div>
           <LangToggle />
        </div>
      </div>

      <div className="relative z-10 flex flex-col">
        
        {/* Hero Section (Full Viewport Height) */}
        <div className="min-h-[100dvh] flex flex-col justify-end px-6 pb-12 pt-24 max-w-md mx-auto w-full">
          <div className="mb-8">
            <Reveal delay={100}>
              <h1 className="text-5xl font-extrabold text-white leading-tight mb-6 drop-shadow-lg">
                Proof of impact.
              </h1>
            </Reveal>
            <Reveal delay={200}>
              <div className="w-12 h-1.5 bg-pink-500 rounded-full mb-6"></div>
            </Reveal>
            <Reveal delay={300}>
              <p className="text-lg text-gray-300 leading-relaxed drop-shadow-md font-medium">
                {isSw ? 'Ria, tutengeneze athari pamoja.' : 'Ria, let us create impact.'}
              </p>
            </Reveal>
          </div>

          <Reveal delay={400}>
            {/* Action Card */}
            <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl mb-8">
              <div className="flex flex-col gap-3">
                <button className="btn-primary py-4 text-lg shadow-lg" onClick={() => navigate('/register')}>
                  {t('register')}
                </button>
                <button className="bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold rounded-2xl py-4 transition-colors" onClick={() => navigate('/login')}>
                  {t('login')}
                </button>
              </div>
            </div>
          </Reveal>

          <Reveal delay={500}>
            <div className="flex justify-center">
              <div className="animate-bounce flex flex-col items-center text-white/30 mt-4">
                <span className="text-xs font-semibold tracking-widest uppercase mb-2">Scroll for the story</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path></svg>
              </div>
            </div>
          </Reveal>
        </div>

        {/* Scrolling Story Sections */}
        <div className="px-6 py-20 flex flex-col gap-24 max-w-md mx-auto w-full">
          
          <Reveal>
            <h2 className="text-2xl font-bold text-white mb-4">The Gap</h2>
            <p className="text-lg text-gray-300 leading-relaxed">
              {isSw 
                ? 'Vilabu vya Rotary na Rotaract nchini Tanzania vinafanya kazi kubwa. Lakini ushahidi mara nyingi umetawanyika.' 
                : 'Rotary and Rotaract clubs across Tanzania do real work. Boreholes, health screenings, hygiene programs. But when it\'s time to show a funder what happened, the proof is usually gone.'}
            </p>
          </Reveal>

          <Reveal>
            <h2 className="text-2xl font-bold text-white mb-4">Built for the Field</h2>
            <p className="text-lg text-gray-300 leading-relaxed">
              {isSw 
                ? 'Inafanya kazi bila intaneti, inajisawazisha mtandao unaporudi, na ni rahisi kutumia.' 
                : 'Works offline. Syncs when signal comes back. Runs on free hosting so clubs only cover infrastructure costs. Simple enough that volunteers actually open it.'}
            </p>
          </Reveal>

          <Reveal>
            <h2 className="text-2xl font-bold text-white mb-4">Make it Count</h2>
            <p className="text-lg text-gray-300 leading-relaxed">
              {isSw 
                ? 'Rekodi dakika za mchango wako, fungua mikoa mipya, na upande kwenye ubao wa viongozi.' 
                : 'Track your minutes of impact. Reach new regions. Climb the leaderboard. Showing up should feel like something.'}
            </p>
          </Reveal>

          <Reveal>
            <h2 className="text-2xl font-bold text-white mb-4">One App, Two Identities</h2>
            <p className="text-lg text-gray-300 leading-relaxed">
              Navy and gold for Rotary. Hot pink and white for Rotaract. The app knows which one to show you based on your club.
            </p>
          </Reveal>

        </div>

        {/* Bottom CTA & Partners */}
        <div className="px-6 pb-20 pt-10 flex flex-col items-center text-center w-full relative z-10 bg-gradient-to-t from-gray-900 via-gray-900/80 to-transparent">
          <Reveal>
            <h2 className="text-3xl font-extrabold text-white mb-8">Ready to prove it?</h2>
            <div className="w-full flex flex-col gap-3 max-w-xs mx-auto mb-16">
              <button className="btn-primary py-4 text-lg shadow-lg" onClick={() => navigate('/register')}>
                {t('register')}
              </button>
              <button className="bg-white/10 hover:bg-white/20 border border-white/10 text-white font-semibold rounded-2xl py-4 transition-colors" onClick={() => navigate('/login')}>
                {t('login')}
              </button>
            </div>

            {/* Admin Link & Partner Logos */}
            <div className="flex flex-col items-center gap-8">
              <div className="flex flex-col items-center gap-4">
                <span className="text-[10px] text-gray-500 tracking-wider uppercase font-medium">Partners under R4C</span>
                <div className="flex items-center justify-center gap-6">
                  <img src={logos.nama_labs} alt="Nama Labs" className="h-8 object-contain rounded" />
                  <img src={logos.rotaract_tanzania} alt="Rotaract Tanzania" className="h-8 object-contain rounded" />
                  <img src={logos.rotaract_muhimbili} alt="Rotaract Muhimbili" className="h-8 object-contain rounded" />
                </div>
              </div>
              <button onClick={() => navigate('/admin/login')} className="text-xs font-semibold text-gray-500 hover:text-white transition-colors">
                Admin? Sign in here &rarr;
              </button>
            </div>
          </Reveal>
        </div>

      </div>
    </div>
  );
}
