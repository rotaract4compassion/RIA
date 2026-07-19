import React, { useState, useEffect, useCallback } from 'react';
import api from '../../lib/api';
import { useAdminAuth } from '../../store/adminAuth';
import LoadingSpinner from '../../components/LoadingSpinner';
import { X, Pin, Globe, ClipboardList, Users, Megaphone } from 'lucide-react';

const MAX_IMAGE_DIM = 1200;
const MAX_IMAGE_BYTES = 800 * 1024; // 800 KB cap

async function compressImage(file) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, MAX_IMAGE_DIM / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      canvas.toBlob(blob => { URL.revokeObjectURL(url); resolve(blob); }, 'image/webp', 0.82);
    };
    img.src = url;
  });
}

const AUDIENCE_OPTIONS = [
  { value: 'all', label: 'All users', description: 'Everyone on the platform' },
  { value: 'project', label: 'Project', description: 'Users affiliated with a specific project' },
  { value: 'club', label: 'Club', description: 'All users from a specific club' },
];

export default function AdminBroadcasts() {
  const { admin } = useAdminAuth();
  const [broadcasts, setBroadcasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [projects, setProjects] = useState([]);
  const [form, setForm] = useState({
    title: '', body: '', audience: 'all', project_id: '', club: '',
    is_priority: false, expires_days: '', scheduled_at: '',
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [bData, pData] = await Promise.all([
        api.get('/broadcasts/admin'),
        api.get('/projects/admin/all').catch(() => []),
      ]);
      setBroadcasts(bData || []);
      setProjects(pData || []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleImageChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError('Please select an image file'); return; }
    const compressed = await compressImage(file);
    if (compressed.size > MAX_IMAGE_BYTES) {
      setError('Image too large even after compression. Please use a smaller image.');
      return;
    }
    setImageFile(compressed);
    setImagePreview(URL.createObjectURL(compressed));
    setError('');
  }

  async function handleSend(e) {
    e.preventDefault();
    if (!form.title.trim() || !form.body.trim()) { setError('Title and body are required'); return; }
    if (form.audience === 'project' && !form.project_id) { setError('Select a project'); return; }
    if (form.audience === 'club' && !form.club.trim()) { setError('Enter a club name'); return; }

    setSending(true);
    setError('');
    try {
      let image_url = null;
      if (imageFile) {
        // TODO: upload imageFile to Supabase Storage bucket "ria-media" and get URL
        // image_url = await uploadToSupabase(imageFile, 'broadcasts');
        // For now, skip image_url (it's optional)
        console.warn('Image upload requires Supabase Storage setup — image skipped in this build.');
      }

      const expires_at = form.expires_days
        ? new Date(Date.now() + parseInt(form.expires_days) * 86400000).toISOString()
        : null;

      const scheduled_at = form.scheduled_at
        ? new Date(form.scheduled_at).toISOString()
        : null;

      await api.post('/broadcasts/admin', {
        title: form.title.trim(),
        body: form.body.trim(),
        image_url,
        audience: form.audience,
        project_id: form.audience === 'project' ? form.project_id : null,
        club: form.audience === 'club' ? form.club.trim() : null,
        is_priority: form.is_priority,
        expires_at,
        scheduled_at,
      });

      setForm({ title: '', body: '', audience: 'all', project_id: '', club: '', is_priority: false, expires_days: '' });
      setImageFile(null);
      setImagePreview(null);
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.message);
    }
    setSending(false);
  }

  async function handleDelete(id) {
    if (!confirm('Delete this broadcast? Users who haven\'t read it will no longer see it.')) return;
    await api.delete(`/broadcasts/admin/${id}`);
    setBroadcasts(prev => prev.filter(b => b.id !== id));
  }

  function timeAgo(d) {
    const min = Math.floor((Date.now() - new Date(d)) / 60000);
    if (min < 60) return `${min}m ago`;
    const hrs = Math.floor(min / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Announcements</h1>
          <p className="text-sm text-gray-500 mt-1">Broadcast messages to field users</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary w-auto px-5 py-2.5 text-sm"
        >
          + New Broadcast
        </button>
      </div>

      {/* Compose modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-gray-900 text-lg">New Broadcast</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 p-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {error && <p className="text-sm text-red-600 mb-3 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
            <form onSubmit={handleSend} className="flex flex-col gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Title</label>
                <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  className="input-field" placeholder="Important update…" maxLength={120} required />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Message Body</label>
                <textarea
                  value={form.body}
                  onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
                  className="input-field min-h-[120px] resize-y"
                  placeholder="Type your announcement here..."
                />
                <p className="text-xs text-gray-500 mt-1">Supports **bold**, *italic*, and - bullet lists.</p>
              </div>

              {/* Image */}
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">
                  Image <span className="text-gray-400 font-normal">(optional, compressed automatically)</span>
                </label>
                {imagePreview ? (
                  <div className="relative rounded-xl overflow-hidden">
                    <img src={imagePreview} alt="" className="w-full object-cover max-h-40" />
                    <button type="button" onClick={() => { setImageFile(null); setImagePreview(null); }}
                      className="absolute top-2 right-2 bg-white/80 rounded-full p-1 text-gray-600 text-xs"><X size={14} /></button>
                  </div>
                ) : (
                  <label className="flex items-center justify-center gap-2 py-6 rounded-xl border-2 border-dashed border-gray-200 text-gray-400 text-sm cursor-pointer hover:border-gray-300">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Add image
                    <input type="file" accept="image/*" className="sr-only" onChange={handleImageChange} />
                  </label>
                )}
              </div>

              {/* Audience */}
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Audience</label>
                <div className="flex flex-col gap-2">
                  {AUDIENCE_OPTIONS.filter(o => admin?.scope === 'global' || o.value !== 'all').map(opt => (
                    <label key={opt.value} className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${form.audience === opt.value ? 'border-[var(--color-primary)] bg-[var(--color-primary-light)]' : 'border-gray-200'}`}>
                      <input type="radio" name="audience" value={opt.value} checked={form.audience === opt.value}
                        onChange={() => setForm(f => ({ ...f, audience: opt.value }))}
                        className="mt-0.5 accent-[var(--color-primary)]" />
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{opt.label}</p>
                        <p className="text-xs text-gray-500">{opt.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
                {form.audience === 'project' && (
                  <select value={form.project_id} onChange={e => setForm(f => ({ ...f, project_id: e.target.value }))}
                    className="input-field mt-2 text-sm" required>
                    <option value="">Select a project…</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                )}
                {form.audience === 'club' && (
                  <input type="text" value={form.club} onChange={e => setForm(f => ({ ...f, club: e.target.value }))}
                    className="input-field mt-2 text-sm" placeholder="Club name" required />
                )}
              </div>

              {/* Options */}
              <div className="flex flex-col gap-3 p-3 bg-gray-50 rounded-xl">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.is_priority}
                    onChange={e => setForm(f => ({ ...f, is_priority: e.target.checked }))}
                    className="accent-[var(--color-primary)]" />
                  <span className="text-sm font-medium text-gray-700 flex items-center gap-1.5"><Pin size={14} /> Priority / Pinned</span>
                </label>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Auto-expire after</label>
                  <select value={form.expires_days} onChange={e => setForm(f => ({ ...f, expires_days: e.target.value }))}
                    className="input-field text-sm">
                    <option value="">Never expires</option>
                    <option value="3">3 days</option>
                    <option value="7">7 days</option>
                    <option value="14">14 days</option>
                    <option value="30">30 days</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Schedule for later (optional)</label>
                  <input 
                    type="datetime-local" 
                    value={form.scheduled_at} 
                    onChange={e => setForm(f => ({ ...f, scheduled_at: e.target.value }))}
                    className="input-field text-sm"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowForm(false)} className="btn-ghost flex-1 border border-gray-200">Cancel</button>
                <button type="submit" disabled={sending} className="btn-primary flex-1">
                  {sending ? <LoadingSpinner size={18} color="white" /> : <><Megaphone size={16} className="inline mr-1" /> Send Broadcast</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-12"><LoadingSpinner /></div>
      ) : broadcasts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <div className="text-gray-300 mb-3 flex justify-center"><Megaphone size={48} strokeWidth={1.5} /></div>
          <p className="text-gray-500">No broadcasts yet. Send your first announcement to field users.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {broadcasts.map(b => (
            <div key={b.id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  {b.is_priority && <span className="badge bg-pink-100 text-pink-700 text-xs flex items-center gap-1"><Pin size={12} /> Priority</span>}
                  <span className={`badge text-xs ${b.audience === 'all' ? 'bg-blue-100 text-blue-700' : b.audience === 'project' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                    {b.audience === 'all' ? <><Globe size={12} className="inline" /> All</> : b.audience === 'project' ? <><ClipboardList size={12} className="inline" /> Project</> : <><Users size={12} className="inline" /> {b.club}</>}
                  </span>
                  {b.is_priority && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[var(--color-primary)] text-white ml-2 uppercase tracking-wide">
                      Pinned
                    </span>
                  )}
                  {b.scheduled_at && new Date(b.scheduled_at) > new Date() && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-gray-600 text-white ml-2 uppercase tracking-wide">
                      Scheduled
                    </span>
                  )}
                  {b.expires_at && (
                    <span className="badge bg-amber-100 text-amber-700 text-xs">
                      Expires {new Date(b.expires_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs text-gray-400">{timeAgo(b.created_at)}</span>
                  <button onClick={() => handleDelete(b.id)} className="text-red-400 p-1 hover:bg-red-50 rounded-lg">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">{b.title}</h3>
              <p className="text-sm text-gray-600 whitespace-pre-line line-clamp-3">{b.body}</p>
              {b.image_url && (
                <div className="mt-3 rounded-xl overflow-hidden">
                  <img src={b.image_url} alt="" className="w-full object-cover max-h-32" loading="lazy" />
                </div>
              )}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50 text-xs text-gray-400">
                <span>By {b.created_by_name || 'Admin'}</span>
                <span>{b.read_count} read</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
