import React, { useState } from 'react';
import { getLang, setLang } from '../lib/i18n';

export default function LangToggle({ className = '' }) {
  const [lang, setCurrentLang] = useState(getLang());

  const toggle = () => {
    const next = lang === 'en' ? 'sw' : 'en';
    setLang(next);
    setCurrentLang(next);
    // Trigger re-render of parent via a custom event
    window.dispatchEvent(new CustomEvent('lang-change', { detail: next }));
  };

  return (
    <button
      onClick={toggle}
      className={`text-sm font-semibold px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors ${className}`}
      aria-label="Toggle language"
    >
      {lang === 'en' ? '🇹🇿 SW' : '🇬🇧 EN'}
    </button>
  );
}
