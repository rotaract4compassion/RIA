import React, { useState, useEffect } from 'react';
import api from '../../lib/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import MapHeatmap from '../../components/MapHeatmap';

export default function AdminMap() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedProject, setSelectedProject] = useState('all');

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get('/submissions/admin/analytics/global');
        setData(res);
      } catch (err) {
        setError(err.message);
      }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <div className="p-12 flex justify-center"><LoadingSpinner /></div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;
  if (!data) return null;

  // Extract unique projects from heatmap data for the filter
  const projectsInMap = Array.from(new Set(data.heatmap.map(p => JSON.stringify({ id: p.project_id, name: p.project_name }))))
    .map(str => JSON.parse(str));

  const filteredPoints = selectedProject === 'all' 
    ? data.heatmap 
    : data.heatmap.filter(p => p.project_id === selectedProject);

  return (
    <div className="p-6 max-w-6xl mx-auto h-[calc(100vh-4rem)] flex flex-col pb-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Geospatial Insights</h1>
        
        <select 
          className="input-field max-w-xs text-sm py-2"
          value={selectedProject}
          onChange={e => setSelectedProject(e.target.value)}
        >
          <option value="all">All Projects (Heatmap)</option>
          {projectsInMap.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      <div className="flex-1 card p-2 bg-white relative">
        <MapHeatmap 
          data={filteredPoints} 
          height="100%"
          options={selectedProject === 'all' ? { radius: 25, blur: 15, maxZoom: 12 } : { radius: 35, blur: 20, maxZoom: 15 }}
        />
        
        <div className="absolute bottom-6 left-6 z-[1000] bg-white px-4 py-2 rounded-xl shadow-lg border border-gray-100 flex flex-col gap-1">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Visible Points</span>
          <span className="text-lg font-bold text-gray-900">{filteredPoints.length.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}
