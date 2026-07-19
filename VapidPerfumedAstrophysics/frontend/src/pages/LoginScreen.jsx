import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../store/auth';
import { t } from '../lib/i18n';
import LangToggle from '../components/LangToggle';

export default function LoginScreen() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const h = () => forceUpdate(n => n + 1);
    window.addEventListener('lang-change', h);
    return () => window.removeEventListener('lang-change', h);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!identifier || !password) { setError('Please fill all fields'); return; }
    setLoading(true);
    setError('');
    try {
      await login(identifier, password);
      const installSeen = localStorage.getItem('ria_install_seen');
      const tutorialDone = localStorage.getItem('ria_tutorial_done');
      if (!installSeen) navigate('/add-to-home');
      else if (!tutorialDone) navigate('/tutorial');
      else navigate('/home');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-white safe-top safe-bottom">
      <div className="flex items-center justify-between p-4">
        <button onClick={() => navigate(-1)} className="text-gray-500 p-2 -ml-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <LangToggle />
      </div>

      <div className="flex-1 flex flex-col justify-center px-6 pb-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">{t('login')}</h1>
          <p className="text-gray-500 text-sm">Welcome back to Ria</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">{t('email_or_phone')}</label>
            <input
              type="text"
              value={identifier}
              onChange={e => setIdentifier(e.target.value)}
              placeholder="jane@example.com or +255 712 345 678"
              className="input-field"
              autoComplete="username"
              autoCapitalize="none"
            />
          </div>

          <div>
            <div className="flex justify-between mb-1.5">
              <label className="text-sm font-medium text-gray-700">{t('password')}</label>
              <button type="button" className="text-xs text-gray-400" onClick={() => alert('Password reset: contact your project admin')}>
                {t('forgot_password')}
              </button>
            </div>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Your password"
              className="input-field"
              autoComplete="current-password"
            />
          </div>

          <button type="submit" className="btn-primary mt-2" disabled={loading}>
            {loading ? t('logging_in') : t('login')}
          </button>

          <p className="text-center text-sm text-gray-500">
            {t('no_account')}{' '}
            <Link to="/register" className="font-semibold" style={{ color: 'var(--color-primary)' }}>
              {t('register')}
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
