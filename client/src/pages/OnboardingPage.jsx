import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { profileApi } from '../api/profile.api.js';
import { skillApi } from '../api/skill.api.js';
import { useToast } from '../context/ToastContext.jsx';
import { PageSpinner } from '../components/ui/Spinner.jsx';
import { Field } from '../components/ui/Field.jsx';
import { ChipMultiSelect } from '../components/ui/ChipMultiSelect.jsx';
import { PRIMARY_ROLE_OPTIONS, EXPERIENCE_LEVEL_OPTIONS, AVAILABILITY_OPTIONS, STARTUP_GOAL_OPTIONS } from '../constants/options.js';

const STEPS = ['Basic profile', 'Skills', 'Interests', 'Startup goal', 'All set'];

const EMPTY_FORM = {
  headline: '',
  bio: '',
  primaryRole: 'developer',
  experienceLevel: 'beginner',
  availabilityHours: 'part_time',
  startupGoal: 'find_cofounder',
  profileVisibility: 'public',
  skillIds: [],
  interestIds: [],
};

/**
 * Profile Onboarding — Blueprint §5, page 4: a 5-step wizard shown right
 * after registration (basic profile → skills → interests → startup goal →
 * completion indicator).
 */
export function OnboardingPage() {
  const toast = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [form, setForm] = useState(EMPTY_FORM);
  const [skills, setSkills] = useState([]);
  const [interests, setInterests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [completion, setCompletion] = useState(0);

  useEffect(() => {
    Promise.all([skillApi.listSkills(), skillApi.listInterests()])
      .then(([skillsRes, interestsRes]) => {
        setSkills(skillsRes.data.skills);
        setInterests(interestsRes.data.interests);
      })
      .catch((err) => toast.error(err.message))
      .finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const update = (patch) => setForm((f) => ({ ...f, ...patch }));

  const finish = async () => {
    setIsSaving(true);
    try {
      const { data } = await profileApi.update(form);
      setCompletion(data.profile.profile_completion);
      setStep(4);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const goNext = () => {
    if (step === STEPS.length - 2) {
      finish();
    } else {
      setStep((s) => s + 1);
    }
  };

  if (isLoading) return <PageSpinner />;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <p className="text-sm font-medium text-brand-700">Step {Math.min(step + 1, STEPS.length)} of {STEPS.length}</p>
        <h1 className="text-2xl font-bold text-slate-900">{STEPS[step]}</h1>
        <div className="mt-3 flex gap-1.5">
          {STEPS.map((label, i) => (
            <div key={label} className={`h-1.5 flex-1 rounded-full ${i <= step ? 'bg-brand-600' : 'bg-slate-200'}`} />
          ))}
        </div>
      </div>

      <div className="card">
        {step === 0 && (
          <div className="flex flex-col gap-4">
            <Field label="Bio" htmlFor="bio">
              <textarea id="bio" className="input min-h-[100px]" value={form.bio} onChange={(e) => update({ bio: e.target.value })} placeholder="Tell other builders about yourself" />
            </Field>
            <Field label="Headline" htmlFor="headline">
              <input id="headline" className="input" maxLength={160} value={form.headline} onChange={(e) => update({ headline: e.target.value })} placeholder="Full-stack developer building fintech tools" />
            </Field>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Primary role" htmlFor="primaryRole">
                <select id="primaryRole" className="input" value={form.primaryRole} onChange={(e) => update({ primaryRole: e.target.value })}>
                  {PRIMARY_ROLE_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              </Field>
              <Field label="Experience level" htmlFor="experienceLevel">
                <select id="experienceLevel" className="input" value={form.experienceLevel} onChange={(e) => update({ experienceLevel: e.target.value })}>
                  {EXPERIENCE_LEVEL_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              </Field>
              <Field label="Availability" htmlFor="availabilityHours">
                <select id="availabilityHours" className="input" value={form.availabilityHours} onChange={(e) => update({ availabilityHours: e.target.value })}>
                  {AVAILABILITY_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              </Field>
            </div>
          </div>
        )}

        {step === 1 && (
          <div>
            <p className="mb-4 text-sm text-slate-500">Select every skill you bring to a team.</p>
            <ChipMultiSelect options={skills} valueKey="skill_id" labelKey="skill_name" selectedIds={form.skillIds} onChange={(skillIds) => update({ skillIds })} />
          </div>
        )}

        {step === 2 && (
          <div>
            <p className="mb-4 text-sm text-slate-500">Which startup domains interest you?</p>
            <ChipMultiSelect options={interests} valueKey="interest_id" labelKey="interest_name" selectedIds={form.interestIds} onChange={(interestIds) => update({ interestIds })} />
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col gap-3">
            <p className="mb-1 text-sm text-slate-500">What are you here to do?</p>
            {STARTUP_GOAL_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 text-sm ${
                  form.startupGoal === opt.value ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-slate-200 text-slate-600'
                }`}
              >
                <input
                  type="radio"
                  name="startupGoal"
                  value={opt.value}
                  checked={form.startupGoal === opt.value}
                  onChange={() => update({ startupGoal: opt.value })}
                  className="accent-brand-600"
                />
                {opt.label}
              </label>
            ))}
          </div>
        )}

        {step === 4 && (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <div className="text-4xl">🎉</div>
            <h2 className="text-lg font-semibold text-slate-900">Profile {completion}% complete</h2>
            <p className="max-w-sm text-sm text-slate-500">
              You can keep refining it any time from your profile page. Ready to find your co-founder?
            </p>
            <button type="button" className="btn-primary mt-2" onClick={() => navigate('/discover/builders')}>
              Start discovering
            </button>
          </div>
        )}

        {step < 4 && (
          <div className="mt-6 flex justify-between border-t border-slate-100 pt-4">
            <button type="button" className="btn-ghost" disabled={step === 0} onClick={() => setStep((s) => Math.max(0, s - 1))}>
              Back
            </button>
            <button type="button" className="btn-primary" disabled={isSaving} onClick={goNext}>
              {step === STEPS.length - 2 ? (isSaving ? 'Saving…' : 'Finish') : 'Next'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
