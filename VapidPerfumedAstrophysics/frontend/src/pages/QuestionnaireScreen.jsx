import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { t } from '../lib/i18n';
import api from '../lib/api';
import { offlineDb } from '../lib/db';
import { syncPendingSubmissions } from '../lib/sync';
import LoadingSpinner from '../components/LoadingSpinner';
import { Check, AlertTriangle, MapPin } from 'lucide-react';

const DRAFT_KEY = (id) => `draft_questionnaire_${id}`;

function LocationCapture({ required, onCapture }) {
  const [status, setStatus] = useState('idle');
  const [coords, setCoords] = useState(null);

  const capture = () => {
    if (!navigator.geolocation) { setStatus('denied'); return; }
    setStatus('capturing');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const data = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        };
        setCoords(data);
        setStatus('captured');
        onCapture(data);
      },
      () => { setStatus('denied'); onCapture(null); },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  useEffect(() => { capture(); }, []);

  return (
    <div className="flex flex-col gap-3">
      <div className="card">
        {status === 'capturing' && (
          <div className="flex items-center gap-3 py-2">
            <LoadingSpinner size={20} />
            <span className="text-sm text-gray-600">{t('capturing_location')}</span>
          </div>
        )}
        {status === 'captured' && coords && (
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium text-green-700 flex items-center gap-1"><Check size={16} /> {t('location_captured')}</p>
            <p className="text-xs text-gray-500">
              {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
            </p>
            <p className="text-xs text-gray-400">
              {t('gps_accuracy')}: ±{Math.round(coords.accuracy)}m
            </p>
          </div>
        )}
        {status === 'denied' && (
          <div className="flex flex-col gap-1">
            <p className="text-sm text-gray-500 flex items-center gap-1"><AlertTriangle size={16} /> {t('location_denied')}</p>
            <p className="text-xs text-gray-400">{required ? t('location_required') : t('location_optional')}</p>
            <button onClick={capture} className="text-xs font-medium mt-2" style={{ color: 'var(--color-primary)' }}>
              {t('retry')}
            </button>
          </div>
        )}
        {status === 'idle' && (
          <div className="flex items-center gap-3 py-2">
            <LoadingSpinner size={20} />
            <span className="text-sm text-gray-600">{t('capturing_location')}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function QuestionField({ question, value, onChange, lang }) {
  const label = lang === 'sw' && question.label_sw ? question.label_sw : question.label;
  const placeholder = lang === 'sw' && question.placeholder_sw ? question.placeholder_sw : question.placeholder;

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-gray-800">
        {label}
        {question.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {question.hint && (
        <p className="text-xs text-gray-400">{lang === 'sw' && question.hint_sw ? question.hint_sw : question.hint}</p>
      )}
      {question.type === 'text' && (
        <textarea
          value={value || ''}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder || ''}
          rows={3}
          className="input-field resize-none"
        />
      )}
      {question.type === 'number' && (
        <input
          type="number"
          inputMode="numeric"
          value={value || ''}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder || '0'}
          className="input-field"
        />
      )}
      {question.type === 'select' && question.options && (
        <div className="flex flex-col gap-2">
          {question.options.map(opt => (
            <label key={opt.value} className="flex items-center gap-3 card cursor-pointer">
              <input
                type="radio"
                name={question.id}
                value={opt.value}
                checked={value === opt.value}
                onChange={() => onChange(opt.value)}
                className="accent-[var(--color-primary)]"
              />
              <span className="text-sm text-gray-700">
                {lang === 'sw' && opt.label_sw ? opt.label_sw : opt.label}
              </span>
            </label>
          ))}
        </div>
      )}
      {question.type === 'boolean' && (
        <div className="flex gap-3">
          {['Yes', 'No'].map(opt => (
            <button
              key={opt}
              onClick={() => onChange(opt === 'Yes')}
              className={`flex-1 py-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                (opt === 'Yes' ? value === true : value === false)
                  ? 'text-white border-transparent'
                  : 'border-gray-200 text-gray-600'
              }`}
              style={(opt === 'Yes' ? value === true : value === false)
                ? { backgroundColor: 'var(--color-primary)', borderColor: 'var(--color-primary)' }
                : {}}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function QuestionnaireScreen() {
  const { id: projectId } = useParams();
  const navigate = useNavigate();
  const [schema, setSchema] = useState(null);
  const [answers, setAnswers] = useState({});
  const [step, setStep] = useState(0);
  const [location, setLocation] = useState(null);
  const [submitState, setSubmitState] = useState('idle'); // idle | submitting | success
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const lang = localStorage.getItem('ria_lang') || 'en';

  // Load schema + restore draft
  useEffect(() => {
    async function init() {
      setLoading(true);
      try {
        let q = null;
        try {
          q = await api.get(`/questionnaires/${projectId}/current`);
          await offlineDb.cacheQuestionnaire(projectId, q);
        } catch {
          const cached = await offlineDb.getCachedQuestionnaire(projectId);
          if (cached) q = cached.schema;
        }
        setSchema(q);

        // Restore draft
        const draft = await offlineDb.getDraft(DRAFT_KEY(projectId));
        if (draft) {
          setAnswers(draft.answers || {});
          setStep(draft.step || 0);
        }
      } catch (e) {
        setError('Failed to load questionnaire');
      }
      setLoading(false);
    }
    init();
  }, [projectId]);

  // Auto-save draft on answer change
  useEffect(() => {
    if (!schema || submitState === 'success') return;
    offlineDb.saveDraft(DRAFT_KEY(projectId), { answers, step });
  }, [answers, step, projectId, schema, submitState]);

  // Compute visible fields with skip logic
  const visibleFields = schema?.fields ? schema.fields.filter(field => {
    if (!field.condition) return true;
    const { question_id, operator, value } = field.condition;
    const ans = answers[question_id];
    if (operator === 'eq') return String(ans) === String(value);
    if (operator === 'neq') return String(ans) !== String(value);
    if (operator === 'gt') return Number(ans) > Number(value);
    return true;
  }) : [];

  const steps = visibleFields;
  const currentField = steps[step];
  const hasLocation = schema?.location_enabled;
  const locationRequired = schema?.location_required;
  const totalSteps = steps.length + (hasLocation ? 1 : 0);
  const isLocationStep = hasLocation && step === steps.length;
  const isLast = step === totalSteps - 1;

  function answer(key, value) {
    setAnswers(a => ({ ...a, [key]: value }));
  }

  function canProceed() {
    if (isLocationStep) return !locationRequired || location;
    if (!currentField) return true;
    if (currentField.required) {
      const val = answers[currentField.id];
      return val !== undefined && val !== '' && val !== null;
    }
    return true;
  }

  async function handleSubmit() {
    setSubmitState('submitting');
    const localEntry = {
      local_id: `local_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      project_id: projectId,
      // schema.id is the questionnaire_version ID from the API response
      questionnaire_version_id: schema.id,
      answers,
      location_lat: location?.lat,
      location_lng: location?.lng,
      location_accuracy: location?.accuracy,
      region: null,
    };

    // Save to local queue immediately
    await offlineDb.queueSubmission(localEntry);
    await offlineDb.deleteDraft(DRAFT_KEY(projectId));

    // Mark briefing as viewed (won't gate again)
    localStorage.setItem(`briefing_viewed_${projectId}`, '1');

    // Try to sync immediately if online
    if (navigator.onLine) {
      syncPendingSubmissions();
    }

    setSubmitState('success');
  }

  function handleSubmitAnother() {
    // Reset form for another submission of the same project
    setAnswers({});
    setStep(0);
    setLocation(null);
    setSubmitState('idle');
  }

  if (loading) return <div className="h-full flex items-center justify-center"><LoadingSpinner /></div>;

  if (!schema) {
    return (
      <div className="h-full flex flex-col items-center justify-center px-6 gap-4">
        <p className="text-gray-500 text-center">{error || 'No questionnaire available'}</p>
        <button className="btn-secondary max-w-xs w-full" onClick={() => navigate(-1)}>{t('back')}</button>
      </div>
    );
  }

  // ---- Success state ----
  if (submitState === 'success') {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-white px-8 gap-6">
        {/* Success icon */}
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center"
          style={{ backgroundColor: 'var(--color-primary-light)' }}
        >
          <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">{t('submitted')}</h2>
          <p className="text-sm text-gray-500 mt-2">
            Your data has been saved and will sync automatically.
          </p>
          <p className="text-xs text-gray-400 mt-3 leading-relaxed max-w-xs">
            Your response stays private on your device for 30 minutes, then disappears from view — but it still syncs in the background.
          </p>
        </div>

        {/* Two actions */}
        <div className="w-full max-w-xs flex flex-col gap-3">
          <button
            className="btn-primary"
            onClick={handleSubmitAnother}
          >
            {t('submit_another')}
          </button>
          <button
            className="btn-secondary"
            onClick={() => navigate('/home')}
          >
            {t('back_to_home')}
          </button>
        </div>
      </div>
    );
  }

  // ---- Questionnaire form ----
  return (
    <div className="h-full flex flex-col bg-white safe-top">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-gray-100">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => navigate(-1)} className="text-gray-500 p-1 -ml-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <p className="text-sm text-gray-500 flex-1">
            {Math.min(step + 1, totalSteps)} {t('step_of')} {totalSteps}
          </p>
        </div>
        {/* Progress bar */}
        <div className="h-1 bg-gray-100 rounded-full">
          <div
            className="progress-bar"
            style={{ width: `${((step + 1) / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 scroll-area px-5 py-6">
        {isLocationStep ? (
          <div className="flex flex-col gap-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2"><MapPin size={20} /> Capture your location</h2>
            <p className="text-sm text-gray-500">
              This helps track where community impact is happening.
              {!locationRequired && ' Location is optional for this questionnaire.'}
            </p>
            <LocationCapture required={locationRequired} onCapture={setLocation} />
          </div>
        ) : currentField ? (
          <div key={currentField.id}>
            <QuestionField
              question={currentField}
              value={answers[currentField.id]}
              onChange={(val) => answer(currentField.id, val)}
              lang={lang}
            />
          </div>
        ) : null}
      </div>

      {/* Navigation */}
      <div className="px-4 py-4 border-t border-gray-100 safe-bottom flex gap-3">
        {step > 0 && (
          <button
            onClick={() => setStep(s => s - 1)}
            className="btn-secondary flex-1"
          >
            {t('back')}
          </button>
        )}
        {isLast ? (
          <button
            onClick={handleSubmit}
            disabled={!canProceed() || submitState === 'submitting'}
            className="btn-primary flex-1 gap-2"
            style={!canProceed() ? { opacity: 0.5 } : {}}
          >
            {submitState === 'submitting' ? (
              <><LoadingSpinner size={18} color="white" />{t('submitting')}</>
            ) : t('submit')}
          </button>
        ) : (
          <button
            onClick={() => setStep(s => s + 1)}
            disabled={!canProceed()}
            className="btn-primary flex-1"
            style={!canProceed() ? { opacity: 0.5 } : {}}
          >
            {t('next')}
          </button>
        )}
      </div>
    </div>
  );
}
