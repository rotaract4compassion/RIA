import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { t } from '../lib/i18n';

function detectPlatform() {
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return 'ios';
  if (/Android/.test(ua)) return 'android';
  return 'other';
}

function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true;
}

export default function AddToHomeScreen() {
  const navigate = useNavigate();
  const [platform] = useState(detectPlatform);
  const [installed, setInstalled] = useState(isStandalone);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    if (isStandalone()) {
      localStorage.setItem('ria_install_seen', 'true');
      goNext();
      return;
    }

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);

    const standbyCheck = setInterval(() => {
      if (isStandalone()) { setInstalled(true); clearInterval(standbyCheck); }
    }, 1000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      clearInterval(standbyCheck);
    };
  }, []);

  function goNext() {
    localStorage.setItem('ria_install_seen', 'true');
    const tutorialDone = localStorage.getItem('ria_tutorial_done');
    navigate(tutorialDone ? '/home' : '/tutorial');
  }

  async function handleInstall() {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setInstalled(true);
        setTimeout(goNext, 800);
      }
      setDeferredPrompt(null);
    }
  }

  if (installed) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-white px-8 gap-6 animate-fade-in">
        <div className="w-20 h-20 rounded-3xl bg-green-50 flex items-center justify-center text-5xl">✓</div>
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900">{t('installed')}</h2>
          <p className="text-gray-500 text-sm mt-1">Ria is ready to use from your home screen</p>
        </div>
        <button className="btn-primary max-w-xs w-full" onClick={goNext}>Continue</button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white safe-top safe-bottom">
      <div className="flex-1 flex flex-col items-center justify-center px-8 gap-6">
        <div className="w-24 h-24 rounded-3xl shadow-lg overflow-hidden">
          <img src="/icons/ria-app-icon-whitebg-192.png" alt="Ria icon" className="w-full h-full object-cover" />
        </div>

        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('add_to_home')}</h1>
          <p className="text-gray-500 text-sm leading-relaxed">
            Install Ria to your home screen to use it offline and get the best experience.
          </p>
        </div>

        {/* Platform-specific instructions */}
        <div className="w-full bg-gray-50 rounded-2xl p-5">
          {platform === 'ios' && (
            <div className="flex flex-col gap-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0" style={{ backgroundColor: 'var(--color-primary)' }}>1</div>
                <p className="text-sm text-gray-700 pt-1.5">
                  Tap the <span className="font-semibold">Share</span> button{' '}
                  <span className="inline-block">⎙</span> in the browser toolbar below
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0" style={{ backgroundColor: 'var(--color-primary)' }}>2</div>
                <p className="text-sm text-gray-700 pt-1.5">
                  Scroll down and tap <span className="font-semibold">"Add to Home Screen"</span>
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0" style={{ backgroundColor: 'var(--color-primary)' }}>3</div>
                <p className="text-sm text-gray-700 pt-1.5">Tap <span className="font-semibold">Add</span> to confirm</p>
              </div>
            </div>
          )}
          {platform === 'android' && (
            <div className="flex flex-col gap-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0" style={{ backgroundColor: 'var(--color-primary)' }}>1</div>
                <p className="text-sm text-gray-700 pt-1.5">
                  Tap <span className="font-semibold">Install</span> below, or tap <span className="font-semibold">⋮</span> and choose <span className="font-semibold">"Add to Home Screen"</span>
                </p>
              </div>
            </div>
          )}
          {platform === 'other' && (
            <p className="text-sm text-gray-600 text-center">
              Add this page to your home screen using your browser's share or menu options.
            </p>
          )}
        </div>

        <div className="w-full flex flex-col gap-3">
          {platform === 'android' && deferredPrompt && (
            <button className="btn-primary" onClick={handleInstall}>
              {t('install_now')}
            </button>
          )}
          <button className="btn-ghost text-gray-400" onClick={goNext}>
            {t('skip')}
          </button>
        </div>
      </div>

      {/* Persistent reminder note */}
      <p className="text-center text-xs text-gray-400 pb-6 px-4">
        You can always install Ria later from your Profile settings.
      </p>
    </div>
  );
}
