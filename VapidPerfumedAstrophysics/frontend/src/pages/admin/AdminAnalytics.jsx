import React, { useState, useEffect } from 'react';
import api from '../../lib/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { TrendingUp, Users, Clock, AlertTriangle, MapPin } from 'lucide-react';

const COLORS = ['#E91E8C', '#17458F', '#F7A81B', '#4CAF50', '#9C27B0', '#FF5722'];

export default function AdminAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  // Format data for Recharts
  const trendData = data.trends.map(t => ({
    date: new Date(t.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    count: parseInt(t.count)
  }));
  
  const regionData = data.regions.map(r => ({
    name: r.region,
    value: parseInt(r.count)
  }));

  const projectData = data.projects.map(p => ({
    name: p.name.length > 20 ? p.name.substring(0, 20) + '...' : p.name,
    count: parseInt(p.count)
  }));

  return (
    <div className="p-6 max-w-6xl mx-auto pb-24">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Deep Analytics</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="card border-l-4 border-[var(--color-primary)]">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-pink-50 text-[var(--color-primary)]"><TrendingUp /></div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Impact</p>
              <h2 className="text-2xl font-bold text-gray-900">{parseInt(data.totals.total_submissions).toLocaleString()}</h2>
            </div>
          </div>
        </div>
        
        <div className="card border-l-4 border-blue-500">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-blue-50 text-blue-600"><Users /></div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Active Vols</p>
              <h2 className="text-2xl font-bold text-gray-900">{parseInt(data.totals.total_users).toLocaleString()}</h2>
            </div>
          </div>
        </div>
        
        <div className="card border-l-4 border-amber-500">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-amber-50 text-amber-600"><Clock /></div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Minutes</p>
              <h2 className="text-2xl font-bold text-gray-900">{parseInt(data.totals.total_minutes).toLocaleString()}</h2>
            </div>
          </div>
        </div>
        
        <div className="card border-l-4 border-red-500">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-red-50 text-red-600"><AlertTriangle /></div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Flagged Dups</p>
              <h2 className="text-2xl font-bold text-gray-900">{parseInt(data.totals.flagged_submissions).toLocaleString()}</h2>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trend line */}
        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-6">Submissions (Last 30 Days)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} />
                <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                <Line type="monotone" dataKey="count" stroke="var(--color-primary)" strokeWidth={3} dot={{ r: 4, fill: 'var(--color-primary)' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Regions */}
        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-6 flex items-center gap-2"><MapPin size={18} className="text-gray-400" /> Top Regions</h3>
          <div className="h-64 flex">
            <ResponsiveContainer width="60%" height="100%">
              <PieChart>
                <Pie
                  data={regionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {regionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="w-[40%] flex flex-col justify-center gap-2 text-sm">
              {regionData.slice(0, 5).map((r, i) => (
                <div key={r.name} className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }}></span>
                  <span className="truncate text-gray-700">{r.name}</span>
                  <span className="ml-auto font-medium text-gray-900">{r.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Projects Bar Chart */}
        <div className="card lg:col-span-2">
          <h3 className="font-semibold text-gray-800 mb-6">Top Projects by Volume</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={projectData} margin={{ left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#888' }} interval={0} angle={-25} textAnchor="end" />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} />
                <RechartsTooltip cursor={{ fill: '#f9fafb' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                <Bar dataKey="count" fill="var(--color-gold)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
