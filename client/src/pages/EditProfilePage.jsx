import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { profileApi } from '../api/profile.api.js';
import { skillApi } from '../api/skill.api.js';
import { useToast } from '../context/ToastContext.jsx';
import { PageSpinner } from '../components/ui/Spinner.jsx';
import { Field } from '../components/ui/Field.jsx';
import { ChipMultiSelect } from '../components/ui/ChipMultiSelect.jsx';
import { PRIMARY_ROLE_OPTIONS, EXPERIENCE_LEVEL_OPTIONS, AVAILABILITY_OPTIONS, STARTUP_GOAL_OPTIONS, PROFILE_VISIBILITY_OPTIONS } from '../constants/options.js';

const EMPTY_FORM = {
  headline: '',
  bio: '',
  primaryRole: 'other',
  experienceLevel: 'beginner',
  availabilityHours: 'not_available',
  startupGoal: 'explore_ideas',
  profileVisibility: 'public',
  location: '',
  linkedinUrl: '',
  githubUrl: '',
  skillIds: [],
  interestIds: [],
};

export function EditProfilePage() {
  const toast = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState(EMPTY_FORM);
  const [skills, setSkills] = useState([]);
  const [interests, setInterests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    Promise.all([profileApi.getMine(), skillApi.listSkills(), skillApi.listInterests()])
      .then(([profileRes, skillsRes, interestsRes]) => {
        setSkills(skillsRes.data.skills);
        setInterests(interestsRes.data.interests);
        const profile = profileRes.data.profile;
        if (profile) {
          setForm({
            headline: profile.headline || '',
            bio: profile.bio || '',
            primaryRole: profile.primary_role || 'other',
            experienceLevel: profile.experience_level || 'beginner',
            availabilityHours: profile.availability_hours || 'not_available',
            startupGoal: profile.startup_goal || 'explore_ideas',
            profileVisibility: profile.profile_visibility || 'public',
            location: profile.location || '',
            linkedinUrl: profile.linkedin_url || '',
            githubUrl: profile.github_url || '',
            skillIds: (profile.skills || []).map((s) => s.skill_id),
            interestIds: (profile.interests || []).map((i) => i.interest_id),
          });
        }
      })
      .catch((err) => toast.error(err.message))
      .finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await profileApi.update({
        ...form,
        linkedinUrl: form.linkedinUrl || null,
        githubUrl: form.githubUrl || null,
      });
      toast.success('Profile saved');
      navigate('/profile');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <PageSpinner />;

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Edit your profile</h1>
      <form onSubmit={handleSubmit} className="card flex flex-col gap-5">
        <Field label="Headline" htmlFor="headline" hint="A one-line summary shown on your profile card">
          <input id="headline" name="headline" className="input" maxLength={160} value={form.headline} onChange={handleChange} placeholder="Full-stack developer building fintech tools" />
        </Field>

        <Field label="Bio" htmlFor="bio">
          <textarea id="bio" name="bio" className="input min-h-[120px]" maxLength={2000} value={form.bio} onChange={handleChange} />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Primary role" htmlFor="primaryRole">
            <select id="primaryRole" name="primaryRole" className="input" value={form.primaryRole} onChange={handleChange}>
              {PRIMARY_ROLE_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </Field>
          <Field label="Experience level" htmlFor="experienceLevel">
            <select id="experienceLevel" name="experienceLevel" className="input" value={form.experienceLevel} onChange={handleChange}>
              {EXPERIENCE_LEVEL_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </Field>
          <Field label="Availability" htmlFor="availabilityHours">
            <select id="availabilityHours" name="availabilityHours" className="input" value={form.availabilityHours} onChange={handleChange}>
              {AVAILABILITY_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </Field>
          <Field label="Location" htmlFor="location">
            <input id="location" name="location" className="input" value={form.location} onChange={handleChange} placeholder="Bengaluru, India" />
          </Field>
        </div>

        <Field label="Startup goal" htmlFor="startupGoal">
          <select id="startupGoal" name="startupGoal" className="input" value={form.startupGoal} onChange={handleChange}>
            {STARTUP_GOAL_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        </Field>

        <Field label="Profile visibility" htmlFor="profileVisibility" hint="Private profiles are hidden from Discover but still visible to people you're already collaborating with">
          <select id="profileVisibility" name="profileVisibility" className="input" value={form.profileVisibility} onChange={handleChange}>
            {PROFILE_VISIBILITY_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="LinkedIn URL" htmlFor="linkedinUrl">
            <input id="linkedinUrl" name="linkedinUrl" type="url" className="input" value={form.linkedinUrl} onChange={handleChange} placeholder="https://linkedin.com/in/you" />
          </Field>
          <Field label="GitHub URL" htmlFor="githubUrl">
            <input id="githubUrl" name="githubUrl" type="url" className="input" value={form.githubUrl} onChange={handleChange} placeholder="https://github.com/you" />
          </Field>
        </div>

        <Field label="Skills">
          <ChipMultiSelect
            options={skills}
            valueKey="skill_id"
            labelKey="skill_name"
            selectedIds={form.skillIds}
            onChange={(skillIds) => setForm((f) => ({ ...f, skillIds }))}
          />
        </Field>

        <Field label="Interests">
          <ChipMultiSelect
            options={interests}
            valueKey="interest_id"
            labelKey="interest_name"
            selectedIds={form.interestIds}
            onChange={(interestIds) => setForm((f) => ({ ...f, interestIds }))}
          />
        </Field>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-secondary" onClick={() => navigate(-1)}>Cancel</button>
          <button type="submit" disabled={isSaving} className="btn-primary">{isSaving ? 'Saving…' : 'Save profile'}</button>
        </div>
      </form>
    </div>
  );
}
