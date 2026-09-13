import { Link } from 'react-router-dom';
import { Avatar } from '../ui/Avatar.jsx';
import { Badge } from '../ui/Badge.jsx';
import { CompatibilityMeter } from './CompatibilityMeter.jsx';
import { titleCase } from '../../utils/format.js';

export function ProfileCard({ profile, onRequestCollaboration }) {
  return (
    <div className="card flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Avatar name={profile.name} src={profile.avatar_url} />
          <div>
            <Link to={`/builders/${profile.user_id}`} className="font-semibold text-slate-900 hover:text-brand-700">
              {profile.name}
            </Link>
            <p className="text-sm text-slate-500">{profile.headline || titleCase(profile.primary_role)}</p>
          </div>
        </div>
        {typeof profile.compatibilityScore === 'number' && <CompatibilityMeter score={profile.compatibilityScore} />}
      </div>

      <div className="flex flex-wrap gap-2 text-xs text-slate-500">
        <Badge variant="brand">{titleCase(profile.primary_role)}</Badge>
        <Badge>{titleCase(profile.availability_hours)}</Badge>
        <Badge>{titleCase(profile.experience_level)}</Badge>
        {profile.location && <Badge>{profile.location}</Badge>}
      </div>

      {profile.skills?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {profile.skills.slice(0, 6).map((skill) => (
            <span key={skill.skill_id} className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">
              {skill.skill_name}
            </span>
          ))}
        </div>
      )}

      <div className="mt-auto flex gap-2 pt-2">
        <Link to={`/builders/${profile.user_id}`} className="btn-secondary flex-1">
          View profile
        </Link>
        {onRequestCollaboration && (
          <button type="button" onClick={() => onRequestCollaboration(profile)} className="btn-primary flex-1">
            Connect
          </button>
        )}
      </div>
    </div>
  );
}
