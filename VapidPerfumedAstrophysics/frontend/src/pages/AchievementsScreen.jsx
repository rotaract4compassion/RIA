import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { t, getLang } from '../lib/i18n';
import api from '../lib/api';
import BottomNav from '../components/BottomNav';
import LoadingSpinner from '../components/LoadingSpinner';
import { Trophy, Lock, Sparkles, BarChart2, Map, ClipboardList, Star } from 'lucide-react';

export default function AchievementsScreen() {
  const navigate = useNavigate();
  const [achievements, setAchievements] = useState([]);
  const [impact, setImpact] = useState(null);
  const [loading, setLoading] = useState(true);
  const lang = getLang();

  useEffect(() => {
    Promise.all([api.get('/achievements'), api.get('/achievements/impact')])
      .then(([ach, imp]) => { setAchievements(ach); setImpact(imp); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const unlocked = achievements.filter(a => a.is_unlocked);
  const locked = achievements.filter(a => !a.is_unlocked);

  return (
    <div className="h-full flex flex-col bg-gray-50 safe-top">
      {/* Header */}
      <div className="bg-white px-4 pt-4 pb-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-gray-500 p-1 -ml-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="font-bold text-gray-900">{t('achievements')}</h1>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 scroll-area px-4 py-4 pb-24 flex flex-col gap-5">
        {loading ? (
          <div className="flex justify-center py-8"><LoadingSpinner /></div>
        ) : (
          <>
            {/* Impact summary */}
            {impact && (
              <div className="card">
                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">{t('impact_summary')}</h2>
                <div className="grid grid-cols-3 gap-4 text-center">
                  {[
                    { v: impact.total_submissions, l: t('submissions'), icon: <BarChart2 size={20} /> },
                    { v: impact.region_count, l: t('regions'), icon: <Map size={20} /> },
                    { v: unlocked.length, l: t('achievements'), icon: <Trophy size={20} /> },
                  ].map(({ v, l, icon }) => (
                    <div key={l} className="text-center flex flex-col items-center">
                      <div className="text-gray-400 mb-1">{icon}</div>
                      <div className="text-xl font-bold text-gray-900">{v}</div>
                      <div className="text-xs text-gray-500">{l}</div>
                    </div>
                  ))}
                </div>
                {impact.regions.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-gray-100">
                    <p className="text-xs font-medium text-gray-500 mb-2">Regions worked in:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {impact.regions.map(r => (
                        <span key={r} className="badge bg-gray-100 text-gray-600">{r}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Unlocked */}
            {unlocked.length > 0 && (
              <div>
                <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><Trophy size={18} className="text-amber-500" /> {t('unlocked')} ({unlocked.length})</h2>
                <div className="grid grid-cols-2 gap-3">
                  {unlocked.map(a => (
                    <div key={a.id} className="card text-center flex flex-col items-center gap-2 py-4">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-gray-700"
                           style={{ backgroundColor: 'var(--color-primary-light)' }}>
                        {a.type.includes('project') ? <ClipboardList size={20} /> :
                         a.type.includes('region') ? <Map size={20} /> : <Star size={20} />}
                      </div>
                      <p className="text-sm font-semibold text-gray-900">
                        {lang === 'sw' ? a.name_sw : a.name_en}
                      </p>
                      <p className="text-xs text-gray-400">
                        {lang === 'sw' ? a.description_sw : a.description_en}
                      </p>
                      {a.unlocked_at && (
                        <p className="text-xs text-green-500">
                          {new Date(a.unlocked_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Locked */}
            {locked.length > 0 && (
              <div>
                <h2 className="font-semibold text-gray-500 mb-3 flex items-center gap-2"><Lock size={18} /> {t('locked')} ({locked.length})</h2>
                <div className="grid grid-cols-2 gap-3">
                  {locked.map(a => (
                    <div key={a.id} className="card text-center flex flex-col items-center gap-2 py-4 opacity-60">
                      <span className="text-3xl grayscale">{a.icon}</span>
                      <p className="text-sm font-semibold text-gray-600">
                        {lang === 'sw' ? a.name_sw : a.name_en}
                      </p>
                      <p className="text-xs text-gray-400">
                        {a.threshold} {a.type.replace('_', ' ')} {t('unlock_hint')}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {achievements.length === 0 && (
              <div className="text-center py-8 flex flex-col items-center gap-3">
                <span className="text-amber-300"><Sparkles size={48} strokeWidth={1.5} /></span>
                <p className="text-gray-500 text-sm">Submit data to earn your first achievement!</p>
              </div>
            )}
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
