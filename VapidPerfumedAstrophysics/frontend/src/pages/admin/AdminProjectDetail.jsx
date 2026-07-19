import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../lib/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import MapHeatmap from '../../components/MapHeatmap';
import { downloadCSV } from '../../lib/exportUtils';
import { AlertTriangle, MapPin, Printer, Download } from 'lucide-react';

// Simple heatmap component
function RegionHeatmap({ data }) {
  if (!data?.length) return (
    <div className="text-center py-8 text-gray-400 text-sm">No region data collected yet</div>
  );
  const max = Math.max(...data.map(r => parseInt(r.count)));
  return (
    <div className="flex flex-col gap-2">
      {data.map(({ region, count }) => (
        <div key={region} className="flex items-center gap-3">
          <span className="text-sm text-gray-600 w-40 flex-shrink-0 truncate">{region}</span>
          <div className="flex-1 h-6 bg-gray-100 rounded-lg overflow-hidden">
            <div
              className="h-full rounded-lg transition-all"
              style={{
                width: `${(parseInt(count) / max) * 100}%`,
                backgroundColor: 'var(--color-primary)',
                opacity: 0.7 + (parseInt(count) / max) * 0.3,
              }}
            />
          </div>
          <span className="text-sm font-medium text-gray-700 w-8 text-right">{count}</span>
        </div>
      ))}
    </div>
  );
}

// Volume chart (simple bar)
function VolumeChart({ data }) {
  if (!data?.length) return <div className="text-center py-8 text-gray-400 text-sm">No submissions yet</div>;
  const max = Math.max(...data.map(r => parseInt(r.count)));
  const recent = data.slice(-30);
  return (
    <div className="flex items-end gap-1 h-24">
      {recent.map(({ date, count }) => (
        <div key={date} className="flex-1 flex flex-col items-center gap-1 group relative">
          <div
            className="w-full rounded-t transition-all"
            style={{
              height: `${(parseInt(count) / max) * 100}%`,
              backgroundColor: 'var(--color-primary)',
              opacity: 0.8,
              minHeight: 2,
            }}
          />
          <div className="absolute bottom-full mb-1 hidden group-hover:block bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
            {date}: {count}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AdminProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState('submissions');
  const [project, setProject] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [projects, subs, anal] = await Promise.all([
        api.get('/projects/admin/all'),
        api.get(`/submissions/admin/${id}`),
        api.get(`/submissions/admin/${id}/analytics`),
      ]);
      const p = (projects || []).find(proj => proj.id === id);
      setProject(p);
      setSubmissions(subs || []);
      setAnalytics(anal);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function loadReport() {
    try {
      const r = await api.get(`/submissions/admin/${id}/impact-report`);
      setReport(r);
    } catch (e) {
      console.error(e);
    }
  }

  async function archiveProject() {
    if (!confirm('Archive this project? Field users will no longer see it.')) return;
    await api.patch(`/projects/admin/${id}`, { status: 'archived' });
    load();
  }

  async function flagSubmission(subId, flagged) {
    // No direct endpoint but noted for future extension
  }

  if (loading) return <div className="flex justify-center py-12"><LoadingSpinner /></div>;
  if (!project) return <div className="p-6 text-gray-500">Project not found</div>;

  const tabs = ['submissions', 'analytics', 'geospatial', 'impact-report', 'settings'];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-start gap-3">
          <button onClick={() => navigate('/admin/projects')} className="text-gray-500 p-1 mt-0.5">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
            {project.club_org && <p className="text-gray-500 text-sm mt-0.5">{project.club_org}</p>}
            <span className={`badge mt-2 ${project.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
              {project.status}
            </span>
          </div>
        </div>
        <button
          onClick={() => navigate(`/admin/projects/${id}/edit`)}
          className="btn-primary w-auto px-4 py-2 text-sm"
        >
          Edit
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 mb-6 overflow-x-auto">
        {tabs.map(t => (
          <button
            key={t}
            onClick={() => { setTab(t); if (t === 'impact-report' && !report) loadReport(); }}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
              tab === t ? 'border-[var(--color-primary)] text-[var(--color-primary)]' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase())}
          </button>
        ))}
      </div>

      {/* Submissions tab */}
      {tab === 'submissions' && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">{submissions.length} submission{submissions.length !== 1 ? 's' : ''}</p>
            <div className="flex gap-2">
              <button
                onClick={() => downloadCSV(submissions, `${project.name}-submissions.csv`)}
                className="text-xs font-medium px-3 py-1.5 rounded-lg border border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-[var(--color-primary-light)] flex items-center gap-1.5"
              >
                <Download size={14} /> Export CSV
              </button>
              <button
                onClick={() => window.print()}
                className="text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 flex items-center gap-1.5"
              >
                <Printer size={14} /> Export PDF
              </button>
            </div>
          </div>

          {submissions.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400">
              No submissions yet
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">User</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Date</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Region</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Version</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Flag</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submissions.map(s => (
                      <tr key={s.id} className={`border-b border-gray-50 ${s.is_duplicate_flag ? 'bg-amber-50' : ''}`}>
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900">{s.user_name}</p>
                          <p className="text-xs text-gray-400">{s.user_club}</p>
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {new Date(s.submitted_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-gray-600">{s.region || '—'}</td>
                        <td className="px-4 py-3">
                          <span className="badge bg-gray-100 text-gray-500">v{s.version_number}</span>
                        </td>
                        <td className="px-4 py-3">
                          {s.is_duplicate_flag && (
                            <span className="badge bg-amber-100 text-amber-700 flex items-center gap-1"><AlertTriangle size={12} /> Dup?</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'geospatial' && (
        <div className="flex flex-col gap-4">
          <div className="card p-2 h-[500px]">
            <MapHeatmap
              data={submissions.filter(s => s.location_lat && s.location_lng).map(s => ({
                lat: s.location_lat,
                lng: s.location_lng
              }))}
              height="100%"
            />
          </div>
          <p className="text-xs text-gray-400 text-center">
            {submissions.filter(s => s.location_lat).length} out of {submissions.length} submissions have geospatial data.
          </p>
        </div>
      )}

      {/* Analytics tab */}
      {tab === 'analytics' && analytics && (
        <div className="flex flex-col gap-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <h2 className="font-semibold text-gray-900 mb-4">Submission volume (last 30 days)</h2>
            <VolumeChart data={analytics.volume} />
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><MapPin size={20} className="text-gray-500" /> Region activity heatmap</h2>
            <RegionHeatmap data={analytics.regions} />
          </div>
          {analytics.versions && analytics.versions.length > 1 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <h2 className="font-semibold text-gray-900 mb-4">By questionnaire version</h2>
              {analytics.versions.map(v => (
                <div key={v.version_number} className="flex justify-between py-2 border-b border-gray-50 last:border-0">
                  <span className="text-sm text-gray-600">Version {v.version_number}</span>
                  <span className="text-sm font-medium text-gray-900">{v.count} submissions</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Impact report tab */}
      {tab === 'impact-report' && (
        <div className="flex flex-col gap-6">
          {!report ? (
            <div className="flex justify-center py-12"><LoadingSpinner /></div>
          ) : (
            <>
              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{report.project?.name}</h2>
                    <p className="text-gray-500 text-sm mt-1">{report.project?.description}</p>
                  </div>
                  <img src="/icons/ria-app-icon-whitebg-192.png" alt="Ria" className="w-10 h-10 rounded-xl" />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  {[
                    { v: report.stats?.total_submissions, l: 'Submissions' },
                    { v: report.stats?.unique_participants, l: 'Participants' },
                    { v: report.regions?.length, l: 'Regions' },
                    { v: Math.round(report.stats?.total_minutes || 0), l: 'Minutes of impact' },
                  ].map(({ v, l }) => (
                    <div key={l} className="text-center bg-gray-50 rounded-xl p-4">
                      <p className="text-2xl font-bold text-gray-900">{v ?? '—'}</p>
                      <p className="text-xs text-gray-500 mt-1">{l}</p>
                    </div>
                  ))}
                </div>

                {report.regions?.length > 0 && (
                  <div className="mb-4">
                    <h3 className="font-semibold text-sm text-gray-700 mb-2">Regions covered</h3>
                    <div className="flex flex-wrap gap-2">
                      {report.regions.map(r => (
                        <span key={r.region} className="badge bg-gray-100 text-gray-600">{r.region} ({r.count})</span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-gray-100 text-xs text-gray-400">
                  <span>In partnership with Rotary International, Rotaract Tanzania, Rotaract Muhimbili, Nama Labs</span>
                  <span>Generated {new Date(report.generated_at).toLocaleDateString()}</span>
                </div>
              </div>

              <button
                onClick={() => window.print()}
                className="btn-primary w-auto self-end px-6"
              >
                Print / Download PDF
              </button>
            </>
          )}
        </div>
      )}

      {/* Settings tab */}
      {tab === 'settings' && (
        <div className="flex flex-col gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <h2 className="font-semibold text-gray-900 mb-4">Project settings</h2>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => navigate(`/admin/projects/${id}/edit`)}
                className="flex items-center justify-between py-3 px-4 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <span className="text-sm font-medium text-gray-700">Edit questionnaire & details</span>
                <span className="text-gray-400">→</span>
              </button>
              {project.status === 'active' && (
                <button
                  onClick={archiveProject}
                  className="flex items-center justify-between py-3 px-4 rounded-xl border border-red-200 hover:bg-red-50 transition-colors"
                >
                  <span className="text-sm font-medium text-red-600">Archive project</span>
                  <span className="text-red-400">→</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
