import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../lib/api';
import { X, AlertTriangle, ChevronUp, ChevronDown, Plus } from 'lucide-react';
import LoadingSpinner from '../../components/LoadingSpinner';

const FIELD_TYPES = ['text', 'number', 'select', 'boolean'];

const TEMPLATES = [
  {
    name: 'Community Health',
    icon: '🏥',
    description: 'Track health outreach activities, beneficiaries, and outcomes',
    fields: [
      { id: 'activity', label: 'Activity / Service Provided', label_sw: 'Shughuli / Huduma Iliyotolewa', type: 'text', required: true, placeholder: 'e.g. Blood pressure screening' },
      { id: 'beneficiaries', label: 'Number of Beneficiaries', label_sw: 'Idadi ya Wanufaika', type: 'number', required: true, placeholder: '0' },
      { id: 'gender_split', label: 'Gender split (approx. % female)', label_sw: 'Mgawanyo wa jinsia (% ya kike)', type: 'number', required: false, placeholder: '50' },
      { id: 'health_area', label: 'Health Area', label_sw: 'Eneo la Afya', type: 'select', required: true, options: [
        { value: 'maternal', label: 'Maternal & Child Health' },
        { value: 'disease_prevention', label: 'Disease Prevention' },
        { value: 'mental_health', label: 'Mental Health' },
        { value: 'nutrition', label: 'Nutrition' },
        { value: 'other', label: 'Other' },
      ]},
      { id: 'challenges', label: 'Challenges Encountered', label_sw: 'Changamoto Zilizojitokeza', type: 'text', required: false, placeholder: 'Any difficulties during this activity' },
      { id: 'minutes_of_impact', label: 'Duration (minutes)', label_sw: 'Muda (dakika)', type: 'number', required: true, placeholder: '60' },
    ],
  },
  {
    name: 'Education & Literacy',
    icon: '📚',
    description: 'Document learning sessions, tutoring, and school support',
    fields: [
      { id: 'session_topic', label: 'Session Topic', label_sw: 'Mada ya Kipindi', type: 'text', required: true, placeholder: 'e.g. Mathematics tutoring' },
      { id: 'students_reached', label: 'Students Reached', label_sw: 'Wanafunzi Waliofikiwa', type: 'number', required: true, placeholder: '0' },
      { id: 'education_level', label: 'Education Level', label_sw: 'Kiwango cha Elimu', type: 'select', required: true, options: [
        { value: 'primary', label: 'Primary School' },
        { value: 'secondary', label: 'Secondary School' },
        { value: 'university', label: 'University / College' },
        { value: 'adult', label: 'Adult Education' },
      ]},
      { id: 'materials_provided', label: 'Were materials provided?', label_sw: 'Je, vifaa vilitolewa?', type: 'boolean', required: true },
      { id: 'notes', label: 'Notes / Observations', label_sw: 'Maelezo / Uchunguzi', type: 'text', required: false, placeholder: '' },
      { id: 'minutes_of_impact', label: 'Duration (minutes)', label_sw: 'Muda (dakika)', type: 'number', required: true, placeholder: '60' },
    ],
  },
  {
    name: 'WASH (Water, Sanitation & Hygiene)',
    icon: '🚰',
    description: 'Log water, sanitation, and hygiene interventions',
    fields: [
      { id: 'intervention_type', label: 'Intervention Type', label_sw: 'Aina ya Uingiliaji', type: 'select', required: true, options: [
        { value: 'water_supply', label: 'Water Supply' },
        { value: 'sanitation', label: 'Sanitation Facilities' },
        { value: 'hygiene_education', label: 'Hygiene Education' },
        { value: 'cleanup', label: 'Community Cleanup' },
      ]},
      { id: 'people_served', label: 'People Served', label_sw: 'Watu Waliohudumiwa', type: 'number', required: true, placeholder: '0' },
      { id: 'description', label: 'Activity Description', label_sw: 'Maelezo ya Shughuli', type: 'text', required: true, placeholder: 'Describe what was done' },
      { id: 'sustainable', label: 'Is this intervention sustainable?', label_sw: 'Je, uingiliaji huu ni endelevu?', type: 'boolean', required: false },
      { id: 'minutes_of_impact', label: 'Duration (minutes)', label_sw: 'Muda (dakika)', type: 'number', required: true, placeholder: '60' },
    ],
  },
  {
    name: 'Environmental',
    icon: '🌱',
    description: 'Track tree planting, cleanups, and sustainability efforts',
    fields: [
      { id: 'activity_type', label: 'Activity', label_sw: 'Shughuli', type: 'select', required: true, options: [
        { value: 'tree_planting', label: 'Tree Planting' },
        { value: 'cleanup', label: 'Environmental Cleanup' },
        { value: 'awareness', label: 'Awareness Campaign' },
        { value: 'recycling', label: 'Recycling Initiative' },
      ]},
      { id: 'participants', label: 'Volunteers Involved', label_sw: 'Watu Walioshiriki', type: 'number', required: true, placeholder: '0' },
      { id: 'items_count', label: 'Items count (trees planted, bags collected, etc.)', label_sw: 'Idadi ya vitu (miti, mifuko, nk)', type: 'number', required: false, placeholder: '0' },
      { id: 'notes', label: 'Notes', label_sw: 'Maelezo', type: 'text', required: false, placeholder: '' },
      { id: 'minutes_of_impact', label: 'Duration (minutes)', label_sw: 'Muda (dakika)', type: 'number', required: true, placeholder: '60' },
    ],
  },
  {
    name: 'Event Feedback',
    icon: '🎤',
    description: 'Collect attendee feedback after events or workshops',
    fields: [
      { id: 'event_name', label: 'Event Name', label_sw: 'Jina la Tukio', type: 'text', required: true, placeholder: 'e.g. Youth Leadership Workshop' },
      { id: 'attendees', label: 'Number of Attendees', label_sw: 'Idadi ya Washiriki', type: 'number', required: true, placeholder: '0' },
      { id: 'rating', label: 'Overall Rating', label_sw: 'Ukadiriaji wa Jumla', type: 'select', required: true, options: [
        { value: '5', label: '⭐ Excellent' },
        { value: '4', label: '⭐ Good' },
        { value: '3', label: '⭐ Average' },
        { value: '2', label: '⭐ Below Average' },
        { value: '1', label: '⭐ Poor' },
      ]},
      { id: 'would_attend_again', label: 'Would you attend again?', label_sw: 'Ungeshiriki tena?', type: 'boolean', required: true },
      { id: 'feedback', label: 'Open Feedback', label_sw: 'Maoni ya Ziada', type: 'text', required: false, placeholder: 'What could be improved?' },
      { id: 'minutes_of_impact', label: 'Duration (minutes)', label_sw: 'Muda (dakika)', type: 'number', required: true, placeholder: '90' },
    ],
  },
  {
    name: 'General Survey',
    icon: '📋',
    description: 'A simple starting point with basic fields',
    fields: [
      { id: 'description', label: 'Description of Activity', label_sw: 'Maelezo ya Shughuli', type: 'text', required: true, placeholder: 'What did you do?' },
      { id: 'people_reached', label: 'People Reached', label_sw: 'Watu Waliofikiwa', type: 'number', required: true, placeholder: '0' },
      { id: 'outcome', label: 'Outcome / Impact', label_sw: 'Matokeo / Athari', type: 'text', required: false, placeholder: 'What was the result?' },
      { id: 'minutes_of_impact', label: 'Duration (minutes)', label_sw: 'Muda (dakika)', type: 'number', required: true, placeholder: '60' },
    ],
  },
];

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
        <div key={q.id} className="bg-white rounded-xl p-5 flex flex-col gap-4 shadow-sm border border-gray-100 relative group transition-all hover:shadow-md">
          {/* Header Row */}
          <div className="flex items-center justify-between border-b border-gray-50 pb-2">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest bg-gray-50 px-2 py-1 rounded">Q{i + 1}</span>
              <select
                value={q.type}
                onChange={e => updateQuestion(i, { type: e.target.value })}
                className="text-sm font-semibold bg-transparent border-none text-gray-900 focus:ring-0 p-0 cursor-pointer"
              >
                {FIELD_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
              <button onClick={() => moveQuestion(i, -1)} disabled={i === 0} className="p-1.5 hover:bg-gray-100 rounded text-gray-500 disabled:opacity-30"><ChevronUp size={16} /></button>
              <button onClick={() => moveQuestion(i, 1)} disabled={i === questions.length - 1} className="p-1.5 hover:bg-gray-100 rounded text-gray-500 disabled:opacity-30"><ChevronDown size={16} /></button>
              <button onClick={() => removeQuestion(i)} className="p-1.5 hover:bg-red-50 rounded text-red-500"><X size={16} /></button>
            </div>
          </div>

          {/* Text Inputs */}
          <div className="flex flex-col gap-2">
            <input
              type="text"
              value={q.label}
              onChange={e => updateQuestion(i, { label: e.target.value })}
              placeholder="Question text in English..."
              className="w-full text-base font-medium text-gray-900 bg-transparent border-0 border-b border-transparent hover:border-gray-200 focus:border-[var(--color-primary)] focus:ring-0 px-0 py-1 transition-colors placeholder-gray-300"
            />
            <input
              type="text"
              value={q.label_sw || ''}
              onChange={e => updateQuestion(i, { label_sw: e.target.value })}
              placeholder="Maandishi ya swali kwa Kiswahili..."
              className="w-full text-sm italic text-gray-600 bg-transparent border-0 border-b border-transparent hover:border-gray-200 focus:border-[var(--color-primary)] focus:ring-0 px-0 py-1 transition-colors placeholder-gray-300"
            />
          </div>

          {/* Options (if select) */}
          {q.type === 'select' && (
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 flex flex-col gap-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">Multiple Choice Options</label>
              {(q.options || []).map((opt, optIdx) => (
                <div key={optIdx} className="flex items-center gap-2">
                  <input 
                    type="text" 
                    value={opt.value} 
                    onChange={e => {
                      const newOpts = [...(q.options || [])];
                      // For simplicity, we keep value and label the same for user-defined options
                      newOpts[optIdx] = { value: e.target.value, label: e.target.value }; 
                      updateQuestion(i, { options: newOpts });
                    }}
                    placeholder={`Option ${optIdx + 1}...`}
                    className="flex-1 text-sm bg-white border border-gray-200 rounded-md px-3 py-1.5 focus:border-[var(--color-primary)] focus:ring-0 placeholder-gray-300"
                  />
                  <button 
                    onClick={() => {
                      const newOpts = [...(q.options || [])];
                      newOpts.splice(optIdx, 1);
                      updateQuestion(i, { options: newOpts });
                    }}
                    className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
                    title="Remove option"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
              <button 
                onClick={() => {
                  const newOpts = [...(q.options || []), { value: '', label: '' }];
                  updateQuestion(i, { options: newOpts });
                }}
                className="text-xs font-semibold text-[var(--color-primary)] flex items-center gap-1 mt-1 hover:underline w-max"
              >
                <Plus size={14} /> Add Option
              </button>
            </div>
          )}

          {/* Footer Controls */}
          <div className="flex items-center gap-4 pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={q.required}
                onChange={e => updateQuestion(i, { required: e.target.checked })}
                className="accent-[var(--color-primary)] w-4 h-4 rounded"
              />
              <span className="text-xs font-medium text-gray-600">Required</span>
            </label>
          </div>

          {/* Conditional Logic — clean expandable */}
          {i > 0 && (
            <div className="border-t border-gray-100 pt-3 mt-1">
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="checkbox"
                  checked={!!q.condition}
                  onChange={e => {
                    if (e.target.checked) {
                      updateQuestion(i, { condition: { question_id: questions[0].id, operator: 'eq', value: '' } });
                    } else {
                      updateQuestion(i, { condition: null });
                    }
                  }}
                  className="accent-[var(--color-primary)] w-3.5 h-3.5 rounded"
                />
                <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Conditional (show only if...)</span>
              </div>
              {q.condition && (
                <div className="flex flex-wrap items-center gap-2 text-sm bg-gray-50 p-2.5 rounded-lg">
                  <span className="text-xs text-gray-500 font-medium">If</span>
                  <select
                    value={q.condition.question_id || ''}
                    onChange={e => updateQuestion(i, { condition: { ...q.condition, question_id: e.target.value } })}
                    className="text-xs bg-white border border-gray-200 rounded-md px-2 py-1 focus:border-[var(--color-primary)] focus:ring-0 max-w-[140px]"
                  >
                    {questions.slice(0, i).map(prev => (
                      <option key={prev.id} value={prev.id}>Q{questions.indexOf(prev) + 1}: {prev.label?.slice(0, 25) || prev.id}</option>
                    ))}
                  </select>
                  <select
                    value={q.condition.operator || 'eq'}
                    onChange={e => updateQuestion(i, { condition: { ...q.condition, operator: e.target.value } })}
                    className="text-xs bg-white border border-gray-200 rounded-md px-2 py-1 focus:border-[var(--color-primary)] focus:ring-0"
                  >
                    <option value="eq">equals</option>
                    <option value="neq">does not equal</option>
                    <option value="gt">greater than</option>
                    <option value="lt">less than</option>
                    <option value="contains">contains</option>
                  </select>
                  <input
                    type="text"
                    value={q.condition.value || ''}
                    onChange={e => updateQuestion(i, { condition: { ...q.condition, value: e.target.value } })}
                    placeholder="value..."
                    className="text-xs bg-white border border-gray-200 rounded-md px-2 py-1 focus:border-[var(--color-primary)] focus:ring-0 w-24"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      ))}
      <button
        onClick={addQuestion}
        className="w-full py-4 border-2 border-dashed border-gray-200 rounded-xl text-gray-500 font-medium text-sm hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors flex items-center justify-center gap-2"
      >
        <Plus size={20} /> Add Question
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
          <p className="font-semibold mb-1 flex items-center gap-1.5"><AlertTriangle size={16} className="text-amber-500" /> Questionnaire has {existingSubmissionCount} submissions</p>
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
