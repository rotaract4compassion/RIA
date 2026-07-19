import React, { useState, useEffect } from 'react';
import { t, getLang } from '../lib/i18n';
import BottomNav from '../components/BottomNav';
import { HelpCircle } from 'lucide-react';

const faqs = [
  {
    q: 'How do I join a project?',
    qSw: 'Jinsi ya kujiunga na mradi?',
    a: 'From the Home screen, tap "Browse Projects" (the + button), find your project, and tap Join. You\'ll see it on your home dashboard immediately.',
    aSw: 'Kutoka skrini ya Nyumbani, gonga "Tafuta Miradi" (kitufe +), tafuta mradi wako, na gonga Jiunge.',
  },
  {
    q: 'How does offline mode work?',
    qSw: 'Jinsi hali ya nje ya mtandao inavyofanya kazi?',
    a: 'You can fill and submit questionnaires without internet. Your answers are saved on your phone. When you reconnect, they automatically sync to the server.',
    aSw: 'Unaweza kujaza na kuwasilisha dodoso bila mtandao. Majibu yako yanabaki kwenye simu yako. Ukiunganika tena, yanasawazishwa otomatiki.',
  },
  {
    q: 'Why do my submissions disappear after 30 minutes?',
    qSw: 'Kwa nini mawasilisho yangu yanashuka baada ya dakika 30?',
    a: 'This is by design to protect your privacy. After 30 minutes, your submission disappears from view on your phone — but it has been (or will be) sent to the server. You\'re not losing any data.',
    aSw: 'Hii ni muundo wa kulinda faragha yako. Baada ya dakika 30, uwasilishaji wako hutoweka kutoka kwenye simu yako — lakini umepelekwa (au utapelekwa) kwa seva.',
  },
  {
    q: 'How do I add Ria to my home screen?',
    qSw: 'Jinsi ya kuongeza Ria kwenye skrini ya nyumbani?',
    a: 'On iOS Safari: tap the Share button (⎙) then "Add to Home Screen". On Android Chrome: tap Install when prompted, or tap ⋮ then "Add to Home Screen".',
    aSw: 'Kwenye iOS Safari: gonga kitufe cha Kushiriki (⎙) kisha "Ongeza kwenye Skrini ya Nyumbani". Kwenye Android Chrome: gonga Sakinisha au ⋮ kisha "Ongeza kwenye Skrini ya Nyumbani".',
  },
  {
    q: 'Can I change my language?',
    qSw: 'Je, ninaweza kubadilisha lugha yangu?',
    a: 'Yes! Tap the language toggle (🇬🇧 EN / 🇹🇿 SW) on the Welcome screen, or go to Profile → Settings and change it there.',
    aSw: 'Ndio! Gonga ubadilishaji wa lugha (🇬🇧 EN / 🇹🇿 SW) kwenye skrini ya Karibu, au nenda kwenye Wasifu → Mipangilio.',
  },
  {
    q: 'What are achievements?',
    qSw: 'Mafanikio ni nini?',
    a: 'Achievements are badges you earn by contributing data — submitting your first form, working in multiple regions, or staying active. View them from the Home screen.',
    aSw: 'Mafanikio ni beji unazopata kwa kuchangia data — kuwasilisha fomu yako ya kwanza, kufanya kazi katika mikoa mingi, au kubaki amilifu.',
  },
  {
    q: 'My data isn\'t syncing. What do I do?',
    qSw: 'Data yangu haijasawazishwa. Nifanye nini?',
    a: 'Check your internet connection. Ria will retry automatically when you\'re online. If the problem persists, contact your project admin.',
    aSw: 'Angalia muunganiko wako wa mtandao. Ria itajaribu tena otomatiki ukiwa mtandaoni. Tatizo likiendelea, wasiliana na msimamizi wa mradi wako.',
  },
];

export default function HelpScreen() {
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState(null);
  const lang = getLang();
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const h = () => forceUpdate(n => n + 1);
    window.addEventListener('lang-change', h);
    return () => window.removeEventListener('lang-change', h);
  }, []);

  const filtered = faqs.filter(f => {
    const q = search.toLowerCase();
    const question = (lang === 'sw' ? f.qSw : f.q).toLowerCase();
    const answer = (lang === 'sw' ? f.aSw : f.a).toLowerCase();
    return !q || question.includes(q) || answer.includes(q);
  });

  return (
    <div className="h-full flex flex-col bg-gray-50 safe-top">
      {/* Header */}
      <div className="bg-white px-4 pt-5 pb-4 border-b border-gray-100">
        <h1 className="font-bold text-xl text-gray-900 flex items-center gap-2"><HelpCircle size={22} /> {t('help')}</h1>
        <p className="text-sm text-gray-500 mt-1">{t('faq')}</p>
        <input
          type="search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search help topics…"
          className="input-field mt-3"
        />
      </div>

      <div className="flex-1 scroll-area px-4 py-4 pb-28 flex flex-col gap-2">
        {filtered.map((faq, i) => (
          <div key={i} className="card">
            <button
              className="w-full flex items-center justify-between text-left gap-3"
              onClick={() => setExpanded(expanded === i ? null : i)}
            >
              <p className="text-sm font-medium text-gray-900 flex-1">
                {lang === 'sw' ? faq.qSw : faq.q}
              </p>
              <span className="text-gray-400 flex-shrink-0 transition-transform" style={{
                transform: expanded === i ? 'rotate(180deg)' : 'none'
              }}>▾</span>
            </button>
            {expanded === i && (
              <p className="text-sm text-gray-600 mt-3 pt-3 border-t border-gray-100 leading-relaxed">
                {lang === 'sw' ? faq.aSw : faq.a}
              </p>
            )}
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-8 text-gray-400 text-sm">No results found</div>
        )}

        {/* Contact/escalation */}
        <div className="mt-4 card">
          <p className="text-sm font-medium text-gray-700 mb-2">Still need help?</p>
          <p className="text-xs text-gray-500 mb-3">Contact your project administrator, or send a suggestion to the Ria team.</p>
          <a
            href="mailto:support@riaproject.org"
            className="text-xs font-semibold"
            style={{ color: 'var(--color-primary)' }}
          >
            support@riaproject.org →
          </a>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
