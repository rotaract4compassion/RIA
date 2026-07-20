import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../lib/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import MapHeatmap from '../../components/MapHeatmap';
import { downloadCSV } from '../../lib/exportUtils';
import { AlertTriangle, MapPin, Printer, Download, Upload, Edit3, Tag } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

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
  const [csvPreview, setCsvPreview] = useState(null); // {headers, rows} for editable CSV
  const reportStartRef = useRef('');
  const reportEndRef = useRef('');

  // Locally-persisted report text fields
  const storageKey = `report_edits_${id}`;
  const getSavedEdits = () => {
    try { return JSON.parse(localStorage.getItem(storageKey)) || {}; } catch { return {}; }
  };
  const [reportEdits, setReportEdits] = useState(getSavedEdits);
  const updateEdit = (key, value) => {
    const next = { ...reportEdits, [key]: value };
    setReportEdits(next);
    localStorage.setItem(storageKey, JSON.stringify(next));
  };

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
                onClick={() => {
                  if (csvPreview) {
                    // Export edited data
                    downloadCSV(csvPreview.rows.map(r => {
                      const obj = {};
                      csvPreview.headers.forEach((h, i) => { obj[h] = r[i]; });
                      return obj;
                    }), `${project.name}-submissions.csv`);
                  } else {
                    downloadCSV(submissions, `${project.name}-submissions.csv`);
                  }
                }}
                className="text-xs font-medium px-3 py-1.5 rounded-lg border border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-[var(--color-primary-light)] flex items-center gap-1.5"
              >
                <Download size={14} /> Export CSV
              </button>
              <button
                onClick={() => {
                  if (csvPreview) { setCsvPreview(null); return; }
                  // Build editable table from submissions
                  if (!submissions.length) return;
                  const allKeys = new Set();
                  const baseKeys = ['user_name', 'user_club', 'region', 'submitted_at'];
                  baseKeys.forEach(k => allKeys.add(k));
                  submissions.forEach(s => {
                    if (s.answers && typeof s.answers === 'object') Object.keys(s.answers).forEach(k => allKeys.add(k));
                  });
                  const headers = Array.from(allKeys);
                  const rows = submissions.map(s => headers.map(h => baseKeys.includes(h) ? (s[h] ?? '') : (s.answers?.[h] ?? '')));
                  setCsvPreview({ headers, rows });
                }}
                className="text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 flex items-center gap-1.5"
              >
                <Edit3 size={14} /> {csvPreview ? 'Close Editor' : 'Edit Before Export'}
              </button>
              <button
                onClick={async () => {
                  const element = document.getElementById('impact-report-printable');
                  if (!element) return;
                  
                  // Dynamically load html2pdf if not present
                  if (!window.html2pdf) {
                    await new Promise((resolve, reject) => {
                      const script = document.createElement('script');
                      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
                      script.onload = resolve;
                      script.onerror = reject;
                      document.head.appendChild(script);
                    });
                  }
                  
                  const opt = {
                    margin:       [0.5, 0.5, 0.5, 0.5],
                    filename:     `${project.name.replace(/[^a-z0-9]/gi, '_')}_Impact_Report.pdf`,
                    image:        { type: 'jpeg', quality: 0.98 },
                    html2canvas:  { scale: 2, useCORS: true, logging: false },
                    jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
                  };
                  
                  // Hide elements that shouldn't be in the PDF
                  const noPrintElements = element.querySelectorAll('.no-print');
                  noPrintElements.forEach(el => el.style.display = 'none');
                  
                  // Generate PDF
                  window.html2pdf().set(opt).from(element).save().then(() => {
                    // Restore hidden elements
                    noPrintElements.forEach(el => el.style.display = '');
                  });
                }}
                className="text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 flex items-center gap-1.5"
              >
                <Printer size={14} /> Download PDF
              </button>
            </div>
          </div>

          {/* Editable CSV Table */}
          {csvPreview && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-auto max-h-[400px] shadow-sm">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    {csvPreview.headers.map((h, i) => (
                      <th key={i} className="px-2 py-2 text-left font-semibold text-gray-500 whitespace-nowrap border-b">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {csvPreview.rows.map((row, ri) => (
                    <tr key={ri} className="border-b border-gray-50 hover:bg-gray-50">
                      {row.map((cell, ci) => (
                        <td key={ci} className="px-2 py-1">
                          <input
                            type="text"
                            value={String(cell ?? '')}
                            onChange={e => {
                              const newRows = [...csvPreview.rows];
                              newRows[ri] = [...newRows[ri]];
                              newRows[ri][ci] = e.target.value;
                              setCsvPreview({ ...csvPreview, rows: newRows });
                            }}
                            className="w-full min-w-[80px] bg-transparent border-0 focus:ring-1 focus:ring-[var(--color-primary)] rounded px-1 py-0.5 text-gray-700"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

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
          {/* Season / Round filter */}
          <div className="flex items-center gap-3 flex-wrap no-print">
            <label className="text-xs font-medium text-gray-500">Date range (season/round):</label>
            <input type="date" className="input-field py-1.5 text-sm w-auto"
              onChange={e => { reportStartRef.current = e.target.value; }} />
            <span className="text-gray-400 text-xs">to</span>
            <input type="date" className="input-field py-1.5 text-sm w-auto"
              onChange={e => { reportEndRef.current = e.target.value; }} />
            <button onClick={() => {
              const qs = new URLSearchParams();
              if (reportStartRef.current) qs.set('start_date', reportStartRef.current);
              if (reportEndRef.current) qs.set('end_date', reportEndRef.current);
              api.get(`/submissions/admin/${id}/impact-report?${qs}`).then(setReport);
            }} className="btn-primary w-auto px-4 py-1.5 text-xs">Generate</button>
          </div>

          {!report ? (
            <div className="flex justify-center py-12"><LoadingSpinner /></div>
          ) : (
            <>
              {/* ===== PRINTABLE REPORT ===== */}
              <div id="impact-report-printable" className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Report Header */}
                <div className="px-8 pt-8 pb-6 border-b border-gray-100" style={{ background: 'linear-gradient(135deg, #fdf2f8 0%, #ede9fe 100%)' }}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-2">Impact Report</p>
                      <h2
                        className="text-2xl font-extrabold text-gray-900 outline-none focus:ring-2 focus:ring-[var(--color-primary)] rounded px-1 -mx-1"
                        contentEditable suppressContentEditableWarning
                        onBlur={e => updateEdit('title', e.target.textContent)}
                      >{reportEdits.title || report.project?.name}</h2>
                      {report.project?.club_org && <p className="text-sm text-gray-500 mt-1">{report.project.club_org}</p>}
                      <p
                        className="text-sm text-gray-600 mt-2 max-w-lg leading-relaxed outline-none focus:ring-2 focus:ring-[var(--color-primary)] rounded px-1 -mx-1 min-h-[1.5em]"
                        contentEditable suppressContentEditableWarning
                        onBlur={e => updateEdit('description', e.target.textContent)}
                      >{reportEdits.description || report.project?.description || 'Click to add a description...'}</p>
                    </div>
                    <img src="/icons/ria-app-icon-whitebg-192.png" alt="Ria" className="w-14 h-14 rounded-2xl shadow-sm" />
                  </div>
                  <div className="flex items-center gap-4 mt-4 text-[10px] text-gray-400 font-medium uppercase tracking-wider">
                    {report.stats?.first_submission && <span>From: {new Date(report.stats.first_submission).toLocaleDateString()}</span>}
                    {report.stats?.last_submission && <span>To: {new Date(report.stats.last_submission).toLocaleDateString()}</span>}
                    <span>Generated: {new Date(report.generated_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="px-8 py-6 flex flex-col gap-8">
                  {/* Executive Summary — editable */}
                  <div>
                    <h3 className="font-bold text-sm text-gray-700 mb-2">Executive Summary</h3>
                    <textarea
                      className="w-full text-sm text-gray-600 leading-relaxed bg-gray-50 rounded-lg p-3 border border-gray-100 focus:border-[var(--color-primary)] focus:ring-0 resize-none min-h-[80px] outline-none"
                      placeholder="Write a brief executive summary for this report... (saved locally)"
                      value={reportEdits.summary || ''}
                      onChange={e => updateEdit('summary', e.target.value)}
                      rows={3}
                    />
                  </div>

                  {/* KPI Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { v: report.stats?.total_submissions, l: 'Total Submissions', color: '#E91E8C' },
                      { v: report.stats?.unique_participants, l: 'Volunteers', color: '#17458F' },
                      { v: report.regions?.length || 0, l: 'Regions Reached', color: '#F7A81B' },
                      { v: report.stats?.active_days || 0, l: 'Active Days', color: '#10B981' },
                    ].map(({ v, l, color }) => (
                      <div key={l} className="text-center rounded-xl p-4 border" style={{ borderColor: color + '30', backgroundColor: color + '08' }}>
                        <p className="text-3xl font-extrabold" style={{ color }}>{parseInt(v || 0).toLocaleString()}</p>
                        <p className="text-[11px] text-gray-500 mt-1 font-medium">{l}</p>
                      </div>
                    ))}
                  </div>

                  {/* Trend Chart (Recharts) */}
                  {report.trend?.length > 0 && (
                    <div className="h-48 w-full mt-4">
                      <h3 className="font-bold text-sm text-gray-700 mb-3">Submissions Over Time</h3>
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={report.trend} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                          <XAxis 
                            dataKey="date" 
                            tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            tick={{ fontSize: 10, fill: '#9ca3af' }}
                            axisLine={false}
                            tickLine={false}
                            minTickGap={20}
                          />
                          <YAxis 
                            tick={{ fontSize: 10, fill: '#9ca3af' }}
                            axisLine={false}
                            tickLine={false}
                            allowDecimals={false}
                          />
                          <Tooltip 
                            labelFormatter={(val) => new Date(val).toLocaleDateString()}
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            cursor={{ stroke: '#e5e7eb', strokeWidth: 1, strokeDasharray: '4 4' }}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="count" 
                            stroke="var(--color-primary)" 
                            strokeWidth={2}
                            fillOpacity={1} 
                            fill="url(#colorCount)" 
                            activeDot={{ r: 4, strokeWidth: 0, fill: 'var(--color-primary)' }}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {/* Regions */}
                  {report.regions?.length > 0 && (
                    <div>
                      <h3 className="font-bold text-sm text-gray-700 mb-3">Regional Distribution</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {report.regions.map(r => (
                          <div key={r.region} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                            <span className="text-sm text-gray-700 truncate">{r.region}</span>
                            <span className="text-sm font-bold text-gray-900 ml-2">{r.count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Field Answer Distributions */}
                  {report.field_aggregates && Object.keys(report.field_aggregates).length > 0 && (
                    <div>
                      <h3 className="font-bold text-sm text-gray-700 mb-3">Response Breakdown</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(report.field_aggregates)
                          .filter(([, vals]) => Object.keys(vals).length <= 10 && Object.keys(vals).length > 1)
                          .slice(0, 6)
                          .map(([field, vals]) => {
                            const total = Object.values(vals).reduce((a, b) => a + b, 0);
                            const sorted = Object.entries(vals).sort((a, b) => b[1] - a[1]);
                            const COLORS = ['#E91E8C', '#17458F', '#F7A81B', '#10B981', '#9C27B0', '#FF5722'];
                            return (
                              <div key={field} className="bg-gray-50 rounded-lg p-3">
                                <p className="text-[11px] font-bold uppercase text-gray-400 tracking-wide mb-2">{field.replace(/_/g, ' ')}</p>
                                <div className="flex flex-col gap-1.5">
                                  {sorted.map(([val, count], ci) => (
                                    <div key={val} className="flex items-center gap-2">
                                      <div className="flex-1 h-4 bg-gray-200 rounded-full overflow-hidden">
                                        <div className="h-full rounded-full" style={{ width: `${(count / total) * 100}%`, backgroundColor: COLORS[ci % COLORS.length] }} />
                                      </div>
                                      <span className="text-[10px] text-gray-600 w-20 truncate">{val}</span>
                                      <span className="text-[10px] font-bold text-gray-800 w-6 text-right">{count}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  )}

                  {/* Participants */}
                  {report.participants?.length > 0 && (
                    <div>
                      <h3 className="font-bold text-sm text-gray-700 mb-3">Contributors ({report.participants.length})</h3>
                      <div className="flex flex-wrap gap-1.5">
                        {report.participants.map((p, i) => (
                          <span key={i} className="text-[11px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md">{p.name}{p.club ? ` (${p.club})` : ''}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Signoff — editable */}
                  {(reportEdits.signoff || true) && (
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                      <h3 className="font-bold text-sm text-gray-700 mb-2">Prepared By</h3>
                      <input
                        className="w-full text-sm text-gray-700 bg-transparent border-0 border-b border-gray-200 focus:border-[var(--color-primary)] focus:ring-0 outline-none pb-1 mb-1"
                        placeholder="Your name / title"
                        value={reportEdits.signoff || ''}
                        onChange={e => updateEdit('signoff', e.target.value)}
                      />
                      <input
                        className="w-full text-xs text-gray-500 bg-transparent border-0 border-b border-gray-200 focus:border-[var(--color-primary)] focus:ring-0 outline-none pb-1"
                        placeholder="Organization / role (optional)"
                        value={reportEdits.signoffOrg || ''}
                        onChange={e => updateEdit('signoffOrg', e.target.value)}
                      />
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100 text-[10px] text-gray-400">
                    <div className="flex items-center gap-3">
                      <span>In partnership with Rotary International, Rotaract Tanzania, Rotaract Muhimbili, Nama Labs</span>
                    </div>
                    <span>Powered by Ria</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 no-print mt-6">
                <button onClick={async () => {
                  const element = document.getElementById('impact-report-printable');
                  if (!element) return;
                  
                  // Dynamically load html2pdf if not present
                  if (!window.html2pdf) {
                    await new Promise((resolve, reject) => {
                      const script = document.createElement('script');
                      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
                      script.onload = resolve;
                      script.onerror = reject;
                      document.head.appendChild(script);
                    });
                  }
                  
                  const opt = {
                    margin:       [0.5, 0.5, 0.5, 0.5],
                    filename:     `${report.project?.name.replace(/[^a-z0-9]/gi, '_')}_Impact_Report.pdf`,
                    image:        { type: 'jpeg', quality: 0.98 },
                    html2canvas:  { scale: 2, useCORS: true, logging: false },
                    jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
                  };
                  
                  window.html2pdf().set(opt).from(element).save();
                }} className="btn-primary w-auto px-6 flex items-center gap-2">
                  <Printer size={16} /> Download PDF
                </button>
              </div>
            </>
          )}

          {/* CSV Import */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm no-print mt-8">
            <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2"><Upload size={18} /> Import Historical Data (CSV)</h3>
            <p className="text-xs text-gray-500 mb-4">
              Upload a CSV file to bulk-import historical data into this project. <strong>It does not need to be uniform.</strong> Old data with different column names will be safely archived and stored as-is without data loss.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center bg-gray-50 p-4 rounded-xl border border-gray-100 mb-4">
              <div className="flex-1 w-full">
                <label className="text-xs font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                  <Tag size={14} /> Assign to Season / Round (Optional)
                </label>
                <input 
                  type="text" 
                  id="csv-import-tag"
                  placeholder="e.g. Historical 2023, Season 1..." 
                  className="input-field py-1.5 text-sm w-full bg-white"
                />
              </div>
              <div className="flex-1 w-full">
                <label className="text-xs font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                  <Upload size={14} /> Select CSV File
                </label>
                <input type="file" accept=".csv" className="text-sm text-gray-600 file:mr-4 file:py-1.5 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-[var(--color-primary-light)] file:text-[var(--color-primary)] hover:file:bg-[var(--color-primary)] hover:file:text-white transition-colors cursor-pointer w-full" onChange={async (e) => {
                  const file = e.target.files[0];
                  if (!file) return;
                  const tagInput = document.getElementById('csv-import-tag').value.trim();
                  
                  const text = await file.text();
                  const lines = text.split('\n').filter(Boolean);
                  if (lines.length < 2) { alert('CSV must have a header row and at least one data row.'); e.target.value = null; return; }
                  
                  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
                  const rows = lines.slice(1).map(line => {
                    // Match commas not inside quotes (simple CSV parser)
                    const vals = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => v.trim().replace(/^"|"$/g, ''));
                    const obj = {};
                    headers.forEach((h, i) => { if (vals[i]) obj[h] = vals[i]; });
                    return { answers: obj, region: obj.region || null, submitted_at: obj.submitted_at || null };
                  });
                  
                  if (!confirm(`Import ${rows.length} rows into "${project.name}"${tagInput ? ` assigned to [${tagInput}]` : ''}?`)) {
                    e.target.value = null;
                    return;
                  }
                  
                  try {
                    const res = await api.post(`/submissions/admin/${id}/import`, { rows, importTag: tagInput });
                    alert(`Imported ${res.imported} of ${res.total} rows. ${res.errors ? res.errors + ' errors.' : ''}`);
                    load();
                    e.target.value = null;
                    document.getElementById('csv-import-tag').value = '';
                  } catch (err) {
                    alert('Import failed: ' + err.message);
                    e.target.value = null;
                  }
                }} />
              </div>
            </div>
          </div>
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
