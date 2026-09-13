import { Link } from 'react-router-dom';
import { profileApi } from '../api/profile.api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useAsync } from '../hooks/useAsync.js';
import { PageSpinner } from '../components/ui/Spinner.jsx';
import { Avatar } from '../components/ui/Avatar.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { titleCase } from '../utils/format.js';

export function ProfilePage() {
  const { user } = useAuth();
  const { data, isLoading } = useAsync(() => profileApi.getMine(), [user?.user_id]);

  if (isLoading) return <PageSpinner />;
  const profile = data?.data?.profile;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="card">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar name={user.name} src={user.avatar_url} size="lg" />
            <div>
              <h1 className="text-xl font-bold text-slate-900">{user.name}</h1>
              <p className="text-sm text-slate-500">{profile?.headline || 'Add a headline to stand out'}</p>
            </div>
          </div>
          <Link to="/profile/edit" className="btn-secondary">Edit profile</Link>
        </div>

        {profile && (
          <div className="mt-6 flex items-center gap-3">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-brand-600" style={{ width: `${profile.profile_completion}%` }} />
            </div>
            <span className="text-xs font-medium text-slate-500">{profile.profile_completion}% complete</span>
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-2">
          {profile?.primary_role && <Badge variant="brand">{titleCase(profile.primary_role)}</Badge>}
          {profile?.experience_level && <Badge>{titleCase(profile.experience_level)}</Badge>}
          {profile?.availability_hours && <Badge>{titleCase(profile.availability_hours)}</Badge>}
          {profile?.startup_goal && <Badge>{titleCase(profile.startup_goal)}</Badge>}
          {profile?.location && <Badge>{profile.location}</Badge>}
          {profile?.profile_visibility === 'private' && <Badge variant="warning">Private profile</Badge>}
        </div>

        {profile?.bio && <p className="mt-6 whitespace-pre-line text-sm text-slate-600">{profile.bio}</p>}

        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <h3 className="mb-2 text-sm font-semibold text-slate-900">Skills</h3>
            <div className="flex flex-wrap gap-1.5">
              {profile?.skills?.length ? (
                profile.skills.map((s) => (
                  <span key={s.skill_id} className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">{s.skill_name}</span>
                ))
              ) : (
                <p className="text-xs text-slate-400">No skills added yet.</p>
              )}
            </div>
          </div>
          <div>
            <h3 className="mb-2 text-sm font-semibold text-slate-900">Interests</h3>
            <div className="flex flex-wrap gap-1.5">
              {profile?.interests?.length ? (
                profile.interests.map((i) => (
                  <span key={i.interest_id} className="rounded-full bg-brand-50 px-2 py-1 text-xs text-brand-700">{i.interest_name}</span>
                ))
              ) : (
                <p className="text-xs text-slate-400">No interests added yet.</p>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 flex gap-4 text-sm">
          {profile?.linkedin_url && <a href={profile.linkedin_url} target="_blank" rel="noreferrer" className="text-brand-700 hover:underline">LinkedIn</a>}
          {profile?.github_url && <a href={profile.github_url} target="_blank" rel="noreferrer" className="text-brand-700 hover:underline">GitHub</a>}
        </div>
      </div>
    </div>
  );
}
