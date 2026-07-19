import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { t } from '../lib/i18n';
import api from '../lib/api';
import { offlineDb } from '../lib/db';
import BottomNav from '../components/BottomNav';
import LoadingSpinner from '../components/LoadingSpinner';

export default function ProjectDetailScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [briefingViewed, setBriefingViewed] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [proj, pending] = await Promise.all([
        api.get(`/projects/${id}`),
        offlineDb.getVisibleSubmissions(id),
      ]);
      setProject(proj);
      const unsyncedCount = pending.filter(s => !s.synced).length;
      setPendingCount(unsyncedCount);

      // Check if user has already viewed the briefing for this project
      const viewedKey = `briefing_viewed_${id}`;
      setBriefingViewed(localStorage.getItem(viewedKey) === '1');
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  function handleStartSubmission() {
    const hasBriefing = project?.briefing_content?.trim();
    const viewedKey = `briefing_viewed_${id}`;
    const alreadyViewed = localStorage.getItem(viewedKey) === '1';

    if (hasBriefing && !alreadyViewed) {
      navigate(`/projects/${id}/briefing`);
    } else {
      navigate(`/projects/${id}/submit`);
    }
  }

  function markBriefingViewed() {
    localStorage.setItem(`briefing_viewed_${id}`, '1');
    setBriefingViewed(true);
    navigate(`/projects/${id}/briefing`);
  }

  if (loading) return <div className="h-full flex items-center justify-center"><LoadingSpinner /></div>;
  if (!project) return <div className="h-full flex items-center justify-center text-gray-400">Project not found</div>;

  const hasBriefing = project.briefing_content?.trim();

  return (
    <div className="h-full flex flex-col bg-gray-50 safe-top">
      {/* Header */}
      <div className="bg-white px-4 pt-4 pb-4 border-b border-gray-100">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => navigate(-1)} className="text-gray-500 p-1 -ml-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="font-bold text-gray-900 flex-1 truncate">{project.name}</h1>
        </div>
        {project.club_org && (
          <span className="badge bg-gray-100 text-gray-500">{project.club_org}</span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 scroll-area px-4 py-4 pb-24 flex flex-col gap-4">
        {/* Description */}
        {project.description && (
          <div className="card">
            <p className="text-sm text-gray-700 leading-relaxed">{project.description}</p>
          </div>
        )}

        {/* Admin instructions */}
        {project.instructions && (
          <div className="rounded-2xl p-4 border-l-4" style={{ borderColor: 'var(--color-primary)', backgroundColor: 'var(--color-primary-light)' }}>
            <p className="text-xs font-semibold mb-1" style={{ color: 'var(--color-primary)' }}>Instructions</p>
            <p className="text-sm text-gray-700">{project.instructions}</p>
          </div>
        )}

        {/* Project Briefing link (shown after first view) */}
        {hasBriefing && briefingViewed && (
          <button
            onClick={markBriefingViewed}
            className="flex items-center gap-2 text-sm font-medium py-2"
            style={{ color: 'var(--color-primary)' }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {t('view_project_info')}
          </button>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="card text-center">
            <p className="text-2xl font-bold text-gray-900">{project.my_submission_count}</p>
            <p className="text-xs text-gray-500">{t('submission_count')}</p>
          </div>
          <div className="card text-center">
            <p className="text-2xl font-bold" style={{ color: pendingCount > 0 ? '#F7A81B' : '#10B981' }}>
              {pendingCount}
            </p>
            <p className="text-xs text-gray-500">{t('pending_sync')}</p>
          </div>
        </div>

        {/* Questionnaire status */}
        {!project.current_questionnaire ? (
          <div className="card text-center py-6 text-gray-400 text-sm">
            No questionnaire configured for this project yet.
          </div>
        ) : null}

        {/* CTA — inside scroll area, always visible */}
        {project.current_questionnaire && (
          <div className="mt-4">
            <button
              className="btn-primary text-lg py-4 shadow-lg"
              onClick={handleStartSubmission}
            >
              {t('start_submission')}
            </button>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
