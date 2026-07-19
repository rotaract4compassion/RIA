import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../store/auth';
import { t } from '../lib/i18n';
import LangToggle from '../components/LangToggle';
import { Eye, EyeOff } from 'lucide-react';

function PasswordStrength({ password }) {
  const score = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^a-zA-Z0-9]/.test(password),
  ].filter(Boolean).length;
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const colors = ['', 'bg-red-400', 'bg-yellow-400', 'bg-blue-400', 'bg-green-400'];
  if (!password) return null;
  return (
    <div className="mt-1">
      <div className="flex gap-1">
        {[1,2,3,4].map(i => (
          <div key={i} className={`h-1 flex-1 rounded-full ${i <= score ? colors[score] : 'bg-gray-200'}`} />
        ))}
      </div>
      <p className="text-xs text-gray-500 mt-1">{labels[score]}</p>
    </div>
  );
}

export default function RegisterScreen() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [form, setForm] = useState({ name: '', club: '', email: '', phone: '', password: '', identity: 'unknown' });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const h = () => forceUpdate(n => n + 1);
    window.addEventListener('lang-change', h);
    return () => window.removeEventListener('lang-change', h);
  }, []);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.club.trim()) e.club = 'Club is required';
    if (!form.email.includes('@')) e.email = 'Valid email required';
    if (!/^\+?\d{7,15}$/.test(form.phone.replace(/\s/g, ''))) e.phone = 'Valid phone number required';
    if (form.password.length < 8) e.password = 'At least 8 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await register(form);
      localStorage.removeItem('ria_install_seen');
      localStorage.removeItem('ria_tutorial_done');
      navigate('/add-to-home');
    } catch (err) {
      setErrors({ general: err.message });
    } finally {
      setLoading(false);
    }
  };

  const field = (key) => ({
    value: form[key],
    onChange: (e) => { setForm(f => ({ ...f, [key]: e.target.value })); setErrors(er => ({ ...er, [key]: '' })); },
    className: `input-field ${errors[key] ? 'border-red-400' : ''}`,
  });

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

      <div className="flex-1 scroll-area px-6 pb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">{t('register')}</h1>
        <p className="text-gray-500 text-sm mb-6">Create your Ria account</p>

        {errors.general && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4 text-sm text-red-700">
            {errors.general}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Identity selector */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">I am a</label>
            <div className="flex gap-2">
              {[
                { value: 'rotaractor', label: 'Rotaractor', color: 'ra-pink' },
                { value: 'rotarian', label: 'Rotarian', color: 'ry-navy' },
              ].map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, identity: opt.value }))}
                  className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${
                    form.identity === opt.value
                      ? opt.value === 'rotaractor'
                        ? 'bg-ra-pink border-ra-pink text-white'
                        : 'bg-ry-navy border-ry-navy text-white'
                      : 'border-gray-200 text-gray-600'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">{t('name')}</label>
            <input {...field('name')} type="text" placeholder="Jane Doe" autoComplete="name" />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">{t('club')}</label>
            <input {...field('club')} type="text" placeholder="Rotaract Club of Dar es Salaam" autoComplete="organization" />
            {errors.club && <p className="text-xs text-red-500 mt-1">{errors.club}</p>}
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">{t('email')}</label>
            <input {...field('email')} type="email" placeholder="jane@example.com" autoComplete="email" />
            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">{t('phone')}</label>
            <input {...field('phone')} type="tel" placeholder="+255 712 345 678" autoComplete="tel" />
            {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">{t('password')}</label>
            <div className="relative">
              <input 
                {...field('password')} 
                type={showPassword ? 'text' : 'password'} 
                placeholder="Min. 8 characters" 
                autoComplete="new-password" 
                className={`${field('password').className} pr-10`}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            <PasswordStrength password={form.password} />
            {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
          </div>

          <button type="submit" className="btn-primary mt-2" disabled={loading}>
            {loading ? t('creating_account') : t('register')}
          </button>

          <p className="text-center text-sm text-gray-500">
            {t('already_have_account')}{' '}
            <Link to="/login" className="font-semibold" style={{ color: 'var(--color-primary)' }}>
              {t('login')}
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
