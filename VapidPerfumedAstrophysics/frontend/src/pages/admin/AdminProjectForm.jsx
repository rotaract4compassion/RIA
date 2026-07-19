import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../lib/api';
import LoadingSpinner from '../../components/LoadingSpinner';

const FIELD_TYPES = ['text', 'number', 'select', 'boolean'];

function QuestionBuilder({ questions, onChange }) {
  function addQuestion() {
    onChange([...questions, {
      id: `q_${Date.now()}`,
      label: '',
      label_sw: '',
      type: 'text',
      required: false,
      placeholder: '',
      condition: null,
    }]);
  }

  function updateQuestion(i, updates) {
    const next = questions.map((q, idx) => idx === i ? { ...q, ...updates } : q);
    onChange(next);
  }

  function removeQuestion(i) {
    onChange(questions.filter((_, idx) => idx !== i));
  }

  function moveQuestion(i, dir) {
    const next = [...questions];
    const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  }

  return (
    <div className="flex flex-col gap-4">
      {questions.map((q, i) => (
        <div key={q.id} className="bg-gray-50 rounded-xl p-4 flex flex-col gap-3 border border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500">Question {i + 1}</span>
            <div className="flex items-center gap-1">
              <button onClick={() => moveQuestion(i, -1)} disabled={i === 0} className="p-1 text-gray-400 disabled:opacity-30">▲</button>
              <button onClick={() => moveQuestion(i, 1)} disabled={i === questions.length - 1} className="p-1 text-gray-400 disabled:opacity-30">▼</button>
              <button onClick={() => removeQuestion(i)} className="p-1 text-red-400">✕</button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Label (EN)</label>
              <input
                type="text"
                value={q.label}
                onChange={e => updateQuestion(i, { label: e.target.value })}
                placeholder="Question text in English"
                className="input-field text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Label (SW)</label>
              <input
                type="text"
                value={q.label_sw || ''}
                onChange={e => updateQuestion(i, { label_sw: e.target.value })}
                placeholder="Maandishi ya swali kwa Kiswahili"
                className="input-field text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Type</label>
              <select
                value={q.type}
                onChange={e => updateQuestion(i, { type: e.target.value })}
                className="input-field text-sm"
              >
                {FIELD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={q.required}
                  onChange={e => updateQuestion(i, { required: e.target.checked })}
                  className="accent-[var(--color-primary)]"
                />
                <span className="text-xs font-medium text-gray-600">Required</span>
              </label>
            </div>
          </div>

          {q.type === 'select' && (
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Options (one per line: value|label)</label>
              <textarea
                rows={3}
                value={(q.options || []).map(o => `${o.value}|${o.label}`).join('\n')}
                onChange={e => {
                  const opts = e.target.value.split('\n').filter(Boolean).map(line => {
                    const [value, label] = line.split('|');
                    return { value: value?.trim(), label: (label || value)?.trim() };
                  });
                  updateQuestion(i, { options: opts });
                }}
                placeholder="yes|Yes&#10;no|No"
                className="input-field resize-none text-sm font-mono"
              />
            </div>
          )}

          {/* Skip logic */}
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Conditional logic (optional)</label>
            <div className="grid grid-cols-3 gap-2">
              <select
                value={q.condition?.question_id || ''}
                onChange={e => updateQuestion(i, { condition: e.target.value ? { ...q.condition, question_id: e.target.value } : null })}
                className="input-field text-xs"
              >
                <option value="">Always show</option>
                {questions.slice(0, i).map(prev => (
                  <option key={prev.id} value={prev.id}>{prev.label || prev.id}</option>
                ))}
              </select>
              {q.condition && (
                <>
                  <select
                    value={q.condition?.operator || 'eq'}
                    onChange={e => updateQuestion(i, { condition: { ...q.condition, operator: e.target.value } })}
                    className="input-field text-xs"
                  >
                    <option value="eq">equals</option>
                    <option value="neq">not equals</option>
                    <option value="gt">greater than</option>
                  </select>
                  <input
                    type="text"
                    value={q.condition?.value || ''}
                    onChange={e => updateQuestion(i, { condition: { ...q.condition, value: e.target.value } })}
                    placeholder="value"
                    className="input-field text-xs"
                  />
                </>
              )}
            </div>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addQuestion}
        className="flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-gray-300 text-gray-500 text-sm font-medium hover:border-[var(--color-primary)] transition-colors"
      >
        + Add Question
      </button>
    </div>
  );
}

export default function AdminProjectForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const [project, setProject] = useState({
    name: '', description: '', instructions: '', club_org: '', briefing_content: ''
  });
  const [questions, setQuestions] = useState([]);
  const [locationEnabled, setLocationEnabled] = useState(true);
  const [locationRequired, setLocationRequired] = useState(false);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [existingSubmissionCount, setExistingSubmissionCount] = useState(0);

  useEffect(() => {
    if (!isEdit) return;
    Promise.all([
      api.get(`/projects/admin/all`),
      api.get(`/questionnaires/${id}/current`).catch(() => null),
      api.get(`/submissions/admin/${id}`).catch(() => ({ length: 0 })),
    ]).then(([projects, questionnaire, submissions]) => {
      const p = (projects || []).find(proj => proj.id === id);
      if (p) setProject({
        name: p.name,
        description: p.description || '',
        instructions: p.instructions || '',
        club_org: p.club_org || '',
        briefing_content: p.briefing_content || '',
      });
      if (questionnaire?.schema?.fields) {
        setQuestions(questionnaire.schema.fields);
        setLocationEnabled(questionnaire.schema.location_enabled ?? true);
        setLocationRequired(questionnaire.schema.location_required ?? false);
      }
      setExistingSubmissionCount(Array.isArray(submissions) ? submissions.length : 0);
    }).catch(console.error).finally(() => setLoading(false));
  }, [id, isEdit]);

  async function handleSave() {
    if (!project.name.trim()) { setError('Project name is required'); return; }
    setSaving(true);
    setError('');
    try {
      let projectId = id;
      if (!isEdit) {
        const created = await api.post('/projects/admin', project);
        projectId = created.id;
      } else {
        await api.patch(`/projects/admin/${id}`, project);
      }
      // Save questionnaire if questions exist
      if (questions.length > 0) {
        await api.post(`/questionnaires/${projectId}`, {
          schema: {
            fields: questions,
            location_enabled: locationEnabled,
            location_required: locationRequired,
          }
        });
      }
      navigate(`/admin/projects/${projectId}`);
    } catch (e) {
      setError(e.message);
    }
    setSaving(false);
  }

  if (loading) return <div className="flex justify-center py-12"><LoadingSpinner /></div>;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="text-gray-500 p-1">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-2xl font-bold text-gray-900">{isEdit ? 'Edit Project' : 'New Project'}</h1>
      </div>

      {/* Version warning */}
      {isEdit && existingSubmissionCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-6 text-sm text-amber-800">
          <p className="font-semibold mb-1">⚠️ Questionnaire has {existingSubmissionCount} submissions</p>
          <p>Saving a changed questionnaire will create a new version. Existing submissions keep their original questions.</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-5 text-sm text-red-700">{error}</div>
      )}

      <div className="flex flex-col gap-6">
        {/* Basic info */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col gap-4 shadow-sm">
          <h2 className="font-semibold text-gray-900">Project Info</h2>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">Project Name *</label>
            <input type="text" value={project.name} onChange={e => setProject(p => ({ ...p, name: e.target.value }))} className="input-field" placeholder="Community Health Survey" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">Description</label>
            <textarea rows={3} value={project.description} onChange={e => setProject(p => ({ ...p, description: e.target.value }))} className="input-field resize-none" placeholder="Brief description…" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">Field Instructions</label>
            <textarea rows={2} value={project.instructions} onChange={e => setProject(p => ({ ...p, instructions: e.target.value }))} className="input-field resize-none" placeholder="Instructions shown on the project detail screen…" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">Club / Organization</label>
            <input type="text" value={project.club_org} onChange={e => setProject(p => ({ ...p, club_org: e.target.value }))} className="input-field" placeholder="Rotaract Club of Dar es Salaam" />
          </div>
        </div>

        {/* Project Briefing */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col gap-4 shadow-sm">
          <div>
            <h2 className="font-semibold text-gray-900">Project Briefing</h2>
            <p className="text-xs text-gray-500 mt-1">
              Shown to field users the first time they open a project, before they start the questionnaire.
              Supports basic Markdown: # Heading, ## Subheading, - bullet point. Leave empty to skip.
            </p>
          </div>
          <textarea
            rows={8}
            value={project.briefing_content}
            onChange={e => setProject(p => ({ ...p, briefing_content: e.target.value }))}
            className="input-field resize-none font-mono text-sm"
            placeholder="# Project Background&#10;&#10;What this project is about...&#10;&#10;## What you'll be collecting&#10;&#10;- Participant counts&#10;- Region data&#10;- Impact minutes"
          />
        </div>

        {/* Questionnaire builder */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col gap-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Questionnaire Builder</h2>
            <span className="badge bg-gray-100 text-gray-500 text-xs">{questions.length} questions</span>
          </div>

          {/* Location settings */}
          <div className="flex flex-col gap-2 p-3 bg-gray-50 rounded-xl">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={locationEnabled} onChange={e => setLocationEnabled(e.target.checked)} className="accent-[var(--color-primary)]" />
              <span className="text-sm font-medium text-gray-700">Enable location capture</span>
            </label>
            {locationEnabled && (
              <label className="flex items-center gap-2 cursor-pointer ml-5">
                <input type="checkbox" checked={locationRequired} onChange={e => setLocationRequired(e.target.checked)} className="accent-[var(--color-primary)]" />
                <span className="text-sm text-gray-600">Location required (blocks submit if denied)</span>
              </label>
            )}
          </div>

          <QuestionBuilder questions={questions} onChange={setQuestions} />
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <button onClick={() => navigate(-1)} className="btn-ghost border border-gray-200">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary w-auto px-8">
            {saving ? <LoadingSpinner size={18} color="white" /> : (isEdit ? 'Save Changes' : 'Create Project')}
          </button>
        </div>
      </div>
    </div>
  );
}
