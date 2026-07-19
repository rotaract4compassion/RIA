import React, { useState, useEffect } from 'react';
import { t, getLang } from '../lib/i18n';
import api from '../lib/api';
import BottomNav from '../components/BottomNav';

const MAX_CHARS = 1000;

export default function SuggestionsScreen() {
  const [content, setContent] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const h = () => forceUpdate(n => n + 1);
    window.addEventListener('lang-change', h);
    return () => window.removeEventListener('lang-change', h);
  }, []);

  async function handleSend() {
    if (!content.trim() || content.length < 5) { setError('Please write at least 5 characters'); return; }
    setSending(true);
    setError('');
    try {
      await api.post('/suggestions', { content: content.trim(), is_anonymous: isAnonymous });
      setSent(true);
      setContent('');
    } catch (e) {
      setError(e.message);
    }
    setSending(false);
  }

  return (
    <div className="h-full flex flex-col bg-gray-50 safe-top">
      {/* Header */}
      <div className="bg-white px-4 pt-5 pb-4 border-b border-gray-100">
        <h1 className="font-bold text-xl text-gray-900">💬 {t('suggestions')}</h1>
        <p className="text-sm text-gray-500 mt-1">Share feedback with project administrators</p>
      </div>

      <div className="flex-1 scroll-area px-4 py-5 pb-28 flex flex-col gap-5">
        {sent ? (
          <div className="card text-center flex flex-col items-center gap-4 py-8">
            <span className="text-5xl">✉️</span>
            <div>
              <p className="font-semibold text-gray-900">{t('suggestion_sent')}</p>
              <p className="text-sm text-gray-500 mt-1">Thank you for your feedback.</p>
            </div>
            <button
              className="btn-primary max-w-xs w-full"
              onClick={() => setSent(false)}
            >
              Send another
            </button>
          </div>
        ) : (
          <>
            {/* Anonymous toggle — clearly visible ABOVE input */}
            <div className="card flex items-center gap-3">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {isAnonymous ? t('anonymous') : t('attributed')}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {isAnonymous
                    ? 'Admins will not see your name or contact info'
                    : 'Admins will see your name'}
                </p>
              </div>
              <button
                onClick={() => setIsAnonymous(a => !a)}
                className={`relative w-12 h-6 rounded-full transition-colors ${isAnonymous ? 'bg-gray-800' : ''}`}
                style={!isAnonymous ? { backgroundColor: 'var(--color-primary)' } : {}}
              >
                <span
                  className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${isAnonymous ? 'translate-x-0.5' : 'translate-x-6'}`}
                />
              </button>
            </div>

            {/* Text area */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700">Your message</label>
              <textarea
                value={content}
                onChange={e => { if (e.target.value.length <= MAX_CHARS) setContent(e.target.value); }}
                placeholder={t('suggestion_placeholder')}
                rows={6}
                className="input-field resize-none"
              />
              <div className="flex justify-between">
                {error && <p className="text-xs text-red-500">{error}</p>}
                <p className="text-xs text-gray-400 ml-auto">
                  {MAX_CHARS - content.length} {t('character_limit')}
                </p>
              </div>
            </div>

            <button
              className="btn-primary"
              onClick={handleSend}
              disabled={sending || content.length < 5}
              style={content.length < 5 ? { opacity: 0.5 } : {}}
            >
              {sending ? '…' : t('send_suggestion')}
            </button>

            {/* Info note */}
            <div className="rounded-xl bg-gray-100 px-4 py-3 text-xs text-gray-500">
              Suggestions are reviewed by project admins and automatically deleted after 90 days.
            </div>
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
