import { Link } from 'react-router-dom';
import { Badge } from '../ui/Badge.jsx';
import { titleCase } from '../../utils/format.js';

export function StartupCard({ startup }) {
  return (
    <div className="card flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div>
          <Link to={`/startups/${startup.startup_id}`} className="font-semibold text-slate-900 hover:text-brand-700">
            {startup.name}
          </Link>
          <p className="text-sm text-slate-500">{startup.tagline}</p>
        </div>
        <Badge variant="brand">{titleCase(startup.stage)}</Badge>
      </div>
      <div className="flex flex-wrap gap-2 text-xs text-slate-500">
        <Badge>{startup.category}</Badge>
        <Badge>{startup.member_count}{startup.max_team_size ? `/${startup.max_team_size}` : ''} member{startup.member_count === 1 ? '' : 's'}</Badge>
      </div>
      <p className="text-xs text-slate-400">Founded by {startup.owner_name}</p>
      <Link to={`/startups/${startup.startup_id}`} className="btn-secondary mt-auto">
        View startup
      </Link>
    </div>
  );
}
