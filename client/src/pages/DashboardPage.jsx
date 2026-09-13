import { Link } from 'react-router-dom';
import { dashboardApi } from '../api/analytics.api.js';
import { notificationApi } from '../api/notification.api.js';
import { startupApi } from '../api/startup.api.js';
import { useAsync } from '../hooks/useAsync.js';
import { useAuth } from '../context/AuthContext.jsx';
import { PageSpinner } from '../components/ui/Spinner.jsx';
import { StatCard } from '../components/ui/StatCard.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { formatRelativeTime, titleCase } from '../utils/format.js';

export function DashboardPage() {
  const { user } = useAuth();
  const { data: statsRes, isLoading: statsLoading } = useAsync(() => dashboardApi.summary(), []);
  const { data: notifRes } = useAsync(() => notificationApi.list({ limit: 6 }), []);
  const { data: startupsRes } = useAsync(() => startupApi.mine(), []);

  if (statsLoading) return <PageSpinner />;

  const stats = statsRes?.data?.stats;
  const notifications = notifRes?.data?.notifications || [];
  const startups = startupsRes?.data?.startups || [];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Welcome back, {user.name.split(' ')[0]}</h1>
          <p className="text-sm text-slate-500">Here's what's happening with your co-founder search.</p>
        </div>
        <Link to="/dashboard/analytics" className="btn-secondary">View analytics →</Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Profile completion" value={`${stats?.profileCompletion ?? 0}%`} />
        <StatCard label="Requests received" value={stats?.applications?.received ?? 0} hint={`${stats?.applications?.pending_received ?? 0} pending`} />
        <StatCard label="High-compatibility matches" value={stats?.applications?.high_compatibility_count ?? 0} hint="70%+ compatibility" />
        <StatCard label="Startups joined" value={stats?.startupsJoined ?? 0} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="card lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">Your startups</h2>
            <Link to="/startups/new" className="text-sm font-medium text-brand-700">+ New startup</Link>
          </div>
          {startups.length === 0 ? (
            <EmptyState icon="🏗️" title="No startups yet" description="Create a startup or get accepted into one to see it here." />
          ) : (
            <div className="flex flex-col gap-3">
              {startups.map((s) => (
                <Link key={s.startup_id} to={`/startups/${s.startup_id}`} className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3 hover:border-brand-300">
                  <div>
                    <p className="font-medium text-slate-900">{s.name}</p>
                    <p className="text-xs text-slate-500">{titleCase(s.stage)} · {s.team_role}</p>
                  </div>
                  <span className="text-sm text-brand-700">View →</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h2 className="mb-4 text-base font-semibold text-slate-900">Recent activity</h2>
          {notifications.length === 0 ? (
            <p className="text-sm text-slate-400">No notifications yet.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {notifications.map((n) => (
                <li key={n.notification_id} className="text-sm">
                  <p className={n.is_read ? 'text-slate-600' : 'font-medium text-slate-900'}>{n.message}</p>
                  <p className="text-xs text-slate-400">{formatRelativeTime(n.created_at)}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
