import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../store/auth';
import { t, getLang, setLang } from '../lib/i18n';
import api from '../lib/api';
import BottomNav from '../components/BottomNav';

const MAX_PIC_DIM = 512; // resize profile pic to max 512px before upload
const MAX_PIC_BYTES = 300 * 1024; // 300 KB size cap (Supabase free tier friendly)

async function compressImage(file) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, MAX_PIC_DIM / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      canvas.toBlob(blob => {
        URL.revokeObjectURL(url);
        resolve(blob);
      }, 'image/webp', 0.78);
    };
    img.src = url;
  });
}

export default function ProfileScreen() {
  const navigate = useNavigate();
  const { user, logout, updateUser } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || '',
    club: user?.club || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [lang, setCurrentLang] = useState(getLang());
  const [leaderboardVisible, setLeaderboardVisible] = useState(user?.leaderboard_visible ?? true);
  const [profilePicUrl, setProfilePicUrl] = useState(user?.profile_picture_url || null);
  const [picUploading, setPicUploading] = useState(false);
  const fileInputRef = useRef(null);
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const h = () => { setCurrentLang(getLang()); forceUpdate(n => n + 1); };
    window.addEventListener('lang-change', h);
    return () => window.removeEventListener('lang-change', h);
  }, []);

  async function handleSave() {
    setSaving(true);
    setError('');
    try {
      const updated = await api.patch('/auth/me', {
        ...form,
        leaderboard_visible: leaderboardVisible,
      });
      updateUser(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      setError(e.message);
    }
    setSaving(false);
  }

  async function handleLogout() {
    if (!confirm('Log out of Ria?')) return;
    await logout();
    navigate('/welcome');
  }

  function handleLangToggle(l) {
    setLang(l);
    setCurrentLang(l);
    window.dispatchEvent(new CustomEvent('lang-change', { detail: l }));
  }

  async function handlePicChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError('Please select an image file'); return; }
    setPicUploading(true);
    setError('');
    try {
      // Compress client-side before any upload
      const compressed = await compressImage(file);
      if (compressed.size > MAX_PIC_BYTES) {
        setError('Image is too large even after compression. Please choose a smaller image.');
        setPicUploading(false);
        return;
      }
      // For now: create an object URL as a local preview (Supabase upload integration point)
      // In production, upload `compressed` to Supabase Storage bucket "ria-media" here
      // and get back the public URL. Placeholder shows the local preview:
      const localUrl = URL.createObjectURL(compressed);
      setProfilePicUrl(localUrl);
      // TODO: replace with real Supabase Storage upload when SUPABASE_URL is configured
      // const url = await uploadToSupabase(compressed, user.id);
      // await api.patch('/auth/me', { profile_picture_url: url });
      // updateUser({ profile_picture_url: url });
    } catch {
      setError('Failed to process image');
    }
    setPicUploading(false);
  }

  const isInstalled = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
  const lastSync = localStorage.getItem('ria_last_sync');

  return (
    <div className="h-full flex flex-col bg-gray-50 safe-top">
      {/* Header */}
      <div className="bg-white px-4 pt-5 pb-4 border-b border-gray-100">
        <h1 className="font-bold text-xl text-gray-900">👤 {t('profile')}</h1>
      </div>

      <div className="flex-1 scroll-area px-4 py-4 pb-28 flex flex-col gap-4">

        {/* Profile picture */}
        <div className="card flex flex-col items-center gap-3 py-5">
          <div className="relative">
            <div className="w-20 h-20 rounded-full overflow-hidden border-2"
                 style={{ borderColor: 'var(--color-primary)' }}>
              {profilePicUrl ? (
                <img src={profilePicUrl} alt={user?.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-white"
                     style={{ backgroundColor: 'var(--color-primary)' }}>
                  {user?.name?.[0]?.toUpperCase() || '?'}
                </div>
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={picUploading}
              className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-white border-2 flex items-center justify-center shadow-sm"
              style={{ borderColor: 'var(--color-primary)' }}
              aria-label={t('profile_picture')}
            >
              {picUploading ? (
                <span className="w-3 h-3 border-2 border-t-transparent rounded-full animate-spin"
                      style={{ borderColor: 'var(--color-primary)' }} />
              ) : (
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2.5">
                  <path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
                </svg>
              )}
            </button>
          </div>
          <p className="text-sm font-semibold text-gray-800">{user?.name}</p>
          <p className="text-xs text-gray-400">{user?.club}</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={handlePicChange}
          />
        </div>

        {/* Edit account details */}
        <div className="card flex flex-col gap-4">
          <h2 className="font-semibold text-gray-900 text-sm">Account details</h2>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1.5">{t('name')}</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="input-field"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1.5">{t('club')}</label>
            <input
              type="text"
              value={form.club}
              onChange={e => setForm(f => ({ ...f, club: e.target.value }))}
              className="input-field"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1.5">{t('email')}</label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              className="input-field"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1.5">{t('phone')}</label>
            <input
              type="tel"
              value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              className="input-field"
            />
          </div>
          <button
            className={`btn-primary ${saved ? 'opacity-75' : ''}`}
            onClick={handleSave}
            disabled={saving}
          >
            {saved ? 'Saved ✓' : saving ? '…' : t('save')}
          </button>
        </div>

        {/* Language */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 text-sm mb-3">{t('language')}</h2>
          <div className="flex gap-2">
            {[{ code: 'en', label: '🇬🇧 English' }, { code: 'sw', label: '🇹🇿 Kiswahili' }].map(({ code, label }) => (
              <button
                key={code}
                onClick={() => handleLangToggle(code)}
                className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${
                  lang === code ? 'text-white border-transparent' : 'border-gray-200 text-gray-600'
                }`}
                style={lang === code ? { backgroundColor: 'var(--color-primary)', borderColor: 'var(--color-primary)' } : {}}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Privacy / Leaderboard */}
        <div className="card flex flex-col gap-3">
          <h2 className="font-semibold text-gray-900 text-sm">Privacy</h2>
          <div className="flex items-center justify-between py-1">
            <div className="flex-1 pr-4">
              <p className="text-sm text-gray-800 font-medium">{t('leaderboard_visibility')}</p>
              <p className="text-xs text-gray-400 mt-0.5">{t('leaderboard_visibility_hint')}</p>
            </div>
            <button
              role="switch"
              aria-checked={leaderboardVisible}
              onClick={() => setLeaderboardVisible(v => !v)}
              className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${leaderboardVisible ? '' : 'bg-gray-200'}`}
              style={leaderboardVisible ? { backgroundColor: 'var(--color-primary)' } : {}}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${leaderboardVisible ? 'translate-x-5' : ''}`}
              />
            </button>
          </div>
          <button
            className="text-sm font-medium text-gray-600 py-1 text-left"
            onClick={() => navigate('/leaderboard')}
          >
            🏆 View Leaderboard →
          </button>
        </div>

        {/* App status */}
        <div className="card flex flex-col gap-3">
          <h2 className="font-semibold text-gray-900 text-sm">App status</h2>
          <div className="flex items-center justify-between py-1">
            <span className="text-sm text-gray-600">Install status</span>
            {isInstalled ? (
              <span className="text-xs font-medium text-green-600">{t('installed')}</span>
            ) : (
              <button
                className="text-xs font-medium"
                style={{ color: 'var(--color-primary)' }}
                onClick={() => navigate('/add-to-home')}
              >
                Add to home screen →
              </button>
            )}
          </div>
          <div className="flex items-center justify-between py-1 border-t border-gray-100">
            <span className="text-sm text-gray-600">App version</span>
            <span className="text-xs text-gray-400">1.0.0</span>
          </div>
          {lastSync && (
            <div className="flex items-center justify-between py-1 border-t border-gray-100">
              <span className="text-sm text-gray-600">Last sync</span>
              <span className="text-xs text-gray-400">{new Date(lastSync).toLocaleString()}</span>
            </div>
          )}
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full py-3.5 rounded-2xl border-2 border-red-200 text-red-500 font-semibold text-sm transition-all active:scale-95"
        >
          {t('logout')}
        </button>
      </div>

      <BottomNav />
    </div>
  );
}
