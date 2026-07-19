import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import { ClipboardList } from 'lucide-react';

export default function AdminProjects() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/projects/admin/all')
      .then(setProjects)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-500 text-sm mt-1">{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          className="btn-primary w-auto px-5 py-2.5 text-sm"
          onClick={() => navigate('/admin/projects/new')}
        >
          + New Project
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><LoadingSpinner /></div>
      ) : projects.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <div className="text-gray-300 mb-3 flex justify-center"><ClipboardList size={48} strokeWidth={1.5} /></div>
          <p className="text-gray-500">No projects yet. Create your first one!</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Project</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Status</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Submissions</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Last activity</th>
              </tr>
            </thead>
            <tbody>
              {projects.map(p => (
                <tr
                  key={p.id}
                  className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/admin/projects/${p.id}`)}
                >
                  <td className="px-5 py-4">
                    <p className="font-medium text-gray-900 text-sm">{p.name}</p>
                    {p.club_org && <p className="text-xs text-gray-400 mt-0.5">{p.club_org}</p>}
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell">
                    <span className={`badge ${p.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right text-sm text-gray-700 font-medium">
                    {p.submission_count || 0}
                  </td>
                  <td className="px-5 py-4 text-right text-xs text-gray-400 hidden lg:table-cell">
                    {p.last_activity ? new Date(p.last_activity).toLocaleDateString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
