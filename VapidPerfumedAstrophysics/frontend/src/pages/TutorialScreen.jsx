import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, FileText, Lock, Trophy, MessageSquare } from 'lucide-react';
import { t } from '../lib/i18n';

const slides = [
  {
    icon: <ClipboardList className="text-primary" size={64} strokeWidth={1.5} />,
    titleKey: 'Find your project',
    titleSw: 'Tafuta mradi wako',
    bodyEn: 'Browse projects you\'ve been added to, or use "+" to search and join new ones.',
    bodySw: 'Angalia miradi uliyongezwa, au tumia "+" kutafuta na kujiunga na miradi mipya.',
  },
  {
    icon: <FileText className="text-primary" size={64} strokeWidth={1.5} />,
    titleKey: 'Fill it out, even offline',
    titleSw: 'Jaza, hata bila mtandao',
    bodyEn: 'You can fill and submit questionnaires even without internet. Your data syncs automatically when you reconnect.',
    bodySw: 'Unaweza kujaza na kuwasilisha dodoso hata bila mtandao. Data yako itasawazishwa otomatiki unapounganika tena.',
  },
  {
    icon: <Lock className="text-primary" size={64} strokeWidth={1.5} />,
    titleKey: 'Your data, protected',
    titleSw: 'Data yako, inalindwa',
    bodyEn: 'After you submit, your answers stay private on your phone and disappear from view after 30 minutes — but don\'t worry, they still sync.',
    bodySw: 'Baada ya kuwasilisha, majibu yako yanabaki faragha kwenye simu yako na kutoweka baada ya dakika 30 — lakini usijali, bado yanasawazishwa.',
  },
  {
    icon: <Trophy className="text-primary" size={64} strokeWidth={1.5} />,
    titleKey: 'Track your impact',
    titleSw: 'Fuatilia mchango wako',
    bodyEn: 'Earn achievements as you contribute data. See your impact in minutes, regions, and badges.',
    bodySw: 'Pata mafanikio unapotoa data. Ona mchango wako kwa dakika, mikoa, na beji.',
  },
  {
    icon: <MessageSquare className="text-primary" size={64} strokeWidth={1.5} />,
    titleKey: 'Got something to say?',
    titleSw: 'Una kitu cha kusema?',
    bodyEn: 'Use the Suggestions tab to share feedback with project admins — anonymously if you prefer.',
    bodySw: 'Tumia kichupo cha Maoni kushiriki maoni na wasimamizi wa mradi — bila jina ikiwa unataka.',
  },
];

export default function TutorialScreen() {
  const navigate = useNavigate();
  const [current, setCurrent] = useState(0);
  const [lang] = useState(localStorage.getItem('ria_lang') || 'en');
  const touchStart = useRef(null);

  function finish() {
    localStorage.setItem('ria_tutorial_done', 'true');
    navigate('/home');
  }

  function handleTouchStart(e) {
    touchStart.current = e.touches[0].clientX;
  }

  function handleTouchEnd(e) {
    if (touchStart.current === null) return;
    const diff = touchStart.current - e.changedTouches[0].clientX;
    if (diff > 50 && current < slides.length - 1) setCurrent(c => c + 1);
    if (diff < -50 && current > 0) setCurrent(c => c - 1);
    touchStart.current = null;
  }

  const slide = slides[current];
  const isLast = current === slides.length - 1;

  return (
    <div
      className="h-full flex flex-col bg-white safe-top safe-bottom select-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Skip */}
      <div className="flex justify-end p-4">
        <button onClick={finish} className="text-sm font-medium text-gray-400 px-3 py-1.5">
          {t('tutorial_skip')}
        </button>
      </div>

      {/* Slide content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 gap-6 animate-fade-in" key={current}>
        <div className="flex justify-center text-primary">{slide.icon || slide.emoji}</div>
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            {lang === 'sw' ? slide.titleSw : slide.titleKey}
          </h2>
          <p className="text-gray-500 text-sm leading-relaxed max-w-xs">
            {lang === 'sw' ? slide.bodySw : slide.bodyEn}
          </p>
        </div>
      </div>

      {/* Dots + nav */}
      <div className="pb-10 px-8 flex flex-col items-center gap-6">
        <div className="flex gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`h-2 rounded-full transition-all ${
                i === current ? 'w-6' : 'w-2 bg-gray-200'
              }`}
              style={i === current ? { backgroundColor: 'var(--color-primary)' } : {}}
            />
          ))}
        </div>

        <div className="w-full flex gap-3">
          {current > 0 && (
            <button
              onClick={() => setCurrent(c => c - 1)}
              className="btn-secondary flex-1"
            >
              {t('back')}
            </button>
          )}
          <button
            onClick={isLast ? finish : () => setCurrent(c => c + 1)}
            className="btn-primary flex-1"
          >
            {isLast ? t('tutorial_done') : t('tutorial_next')}
          </button>
        </div>
      </div>
    </div>
  );
}
