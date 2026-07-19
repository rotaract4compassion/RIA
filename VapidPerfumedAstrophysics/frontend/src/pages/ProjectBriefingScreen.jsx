import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { t } from '../lib/i18n';
import api from '../lib/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { ClipboardList } from 'lucide-react';

export default function ProjectBriefingScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const proj = await api.get(`/projects/${id}`);
      setProject(proj);
      // Mark briefing as viewed via API (non-blocking)
      api.post(`/projects/${id}/mark-briefing-viewed`, {}).catch(() => {});
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  function handleContinue() {
    navigate(`/projects/${id}/submit`);
  }

  if (loading) return <div className="h-full flex items-center justify-center"><LoadingSpinner /></div>;

  if (!project || !project.briefing_content) {
    // No briefing — bounce straight to questionnaire
    navigate(`/projects/${id}/submit`, { replace: true });
    return null;
  }

  return (
    <div className="h-full flex flex-col bg-white safe-top">
      {/* Header */}
      <div className="px-4 pt-4 pb-4 border-b border-gray-100 flex items-center gap-3">
        <button onClick={() => navigate(`/projects/${id}`)} className="text-gray-500 p-1 -ml-1">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <p className="text-xs text-gray-400 font-medium">{t('briefing_first_time')}</p>
          <h1 className="font-bold text-gray-900 text-base leading-tight">{project.name}</h1>
        </div>
      </div>

      {/* Briefing content */}
      <div className="flex-1 scroll-area px-5 py-5 pb-28">
        {/* Section label */}
        <div
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-5"
          style={{ backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)' }}
        >
          <ClipboardList size={20} className="inline mr-2" /> {t('project_briefing')}
        </div>

        {/* Render briefing content (markdown-like plain text) */}
        <div className="prose-ria">
          {project.briefing_content.split('\n').map((line, i) => {
            if (!line.trim()) return <div key={i} className="h-3" />;
            // Simple heading detection
            if (line.startsWith('# ')) return (
              <h2 key={i} className="text-lg font-bold text-gray-900 mb-2 mt-4 first:mt-0">
                {line.slice(2)}
              </h2>
            );
            if (line.startsWith('## ')) return (
              <h3 key={i} className="text-base font-semibold text-gray-800 mb-1.5 mt-3">
                {line.slice(3)}
              </h3>
            );
            if (line.startsWith('- ') || line.startsWith('• ')) return (
              <div key={i} className="flex gap-2 mb-1.5">
                <span className="text-gray-400 mt-0.5 flex-shrink-0">•</span>
                <p className="text-sm text-gray-700 leading-relaxed">{line.slice(2)}</p>
              </div>
            );
            return (
              <p key={i} className="text-sm text-gray-700 leading-relaxed mb-2">{line}</p>
            );
          })}
        </div>
      </div>

      {/* CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 safe-bottom z-30">
        <button className="btn-primary" onClick={handleContinue}>
          {t('continue_to_questionnaire')}
        </button>
      </div>
    </div>
  );
}
