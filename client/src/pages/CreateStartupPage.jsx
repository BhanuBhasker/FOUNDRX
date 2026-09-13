import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { startupApi } from '../api/startup.api.js';
import { skillApi } from '../api/skill.api.js';
import { useToast } from '../context/ToastContext.jsx';
import { Field } from '../components/ui/Field.jsx';
import { STARTUP_STAGE_OPTIONS, REQUIRED_SKILL_PRIORITY_OPTIONS } from '../constants/options.js';

const EMPTY_FORM = { name: '', tagline: '', description: '', category: 'general', stage: 'idea', maxTeamSize: 5 };

export function CreateStartupPage() {
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY_FORM);
  const [skills, setSkills] = useState([]);
  const [requiredSkills, setRequiredSkills] = useState([]); // [{ skillId, priority }]
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    skillApi.listSkills().then(({ data }) => setSkills(data.skills)).catch(() => {});
  }, []);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const toggleRequiredSkill = (skillId) => {
    setRequiredSkills((prev) =>
      prev.some((r) => r.skillId === skillId)
        ? prev.filter((r) => r.skillId !== skillId)
        : [...prev, { skillId, priority: 'required' }]
    );
  };

  const setPriority = (skillId, priority) => {
    setRequiredSkills((prev) => prev.map((r) => (r.skillId === skillId ? { ...r, priority } : r)));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const { data } = await startupApi.create({ ...form, requiredSkills });
      toast.success('Startup created');
      navigate(`/startups/${data.startup.startup_id}`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Create a startup</h1>
      <form onSubmit={handleSubmit} className="card flex flex-col gap-5">
        <Field label="Startup name" htmlFor="name">
          <input id="name" name="name" required className="input" value={form.name} onChange={handleChange} />
        </Field>
        <Field label="Tagline" htmlFor="tagline" hint="A short, punchy one-liner">
          <input id="tagline" name="tagline" className="input" maxLength={200} value={form.tagline} onChange={handleChange} />
        </Field>
        <Field label="Description" htmlFor="description">
          <textarea id="description" name="description" className="input min-h-[120px]" value={form.description} onChange={handleChange} />
        </Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Category" htmlFor="category">
            <input id="category" name="category" className="input" value={form.category} onChange={handleChange} placeholder="FinTech, HealthTech, SaaS..." />
          </Field>
          <Field label="Stage" htmlFor="stage">
            <select id="stage" name="stage" className="input" value={form.stage} onChange={handleChange}>
              {STARTUP_STAGE_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </Field>
          <Field label="Max team size" htmlFor="maxTeamSize">
            <input id="maxTeamSize" name="maxTeamSize" type="number" min="1" max="50" className="input" value={form.maxTeamSize} onChange={handleChange} />
          </Field>
        </div>

        <Field label="Required skills" hint="Pick the skills this startup needs, and mark which are must-haves">
          <div className="flex flex-col gap-2">
            {skills.map((skill) => {
              const selected = requiredSkills.find((r) => r.skillId === skill.skill_id);
              return (
                <div key={skill.skill_id} className="flex items-center gap-3">
                  <label className="flex flex-1 items-center gap-2 text-sm text-slate-700">
                    <input type="checkbox" className="accent-brand-600" checked={Boolean(selected)} onChange={() => toggleRequiredSkill(skill.skill_id)} />
                    {skill.skill_name}
                  </label>
                  {selected && (
                    <select
                      className="input w-40 py-1 text-xs"
                      value={selected.priority}
                      onChange={(e) => setPriority(skill.skill_id, e.target.value)}
                    >
                      {REQUIRED_SKILL_PRIORITY_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                  )}
                </div>
              );
            })}
          </div>
        </Field>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-secondary" onClick={() => navigate(-1)}>Cancel</button>
          <button type="submit" disabled={isSubmitting} className="btn-primary">{isSubmitting ? 'Creating…' : 'Create startup'}</button>
        </div>
      </form>
    </div>
  );
}
