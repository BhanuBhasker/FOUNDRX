import { Link } from 'react-router-dom';
import { dashboardApi } from '../api/analytics.api.js';
import { useAsync } from '../hooks/useAsync.js';
import { PageSpinner } from '../components/ui/Spinner.jsx';
import { StatCard } from '../components/ui/StatCard.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { SkillPopularityChart } from '../components/charts/SkillPopularityChart.jsx';
import { StatusPieChart } from '../components/charts/StatusPieChart.jsx';
import { SignupsLineChart } from '../components/charts/SignupsLineChart.jsx';

/** Analytics — Blueprint §5, page 15 (route /dashboard/analytics). */
export function AnalyticsPage() {
  const { data, isLoading } = useAsync(() => dashboardApi.analytics(), []);

  if (isLoading) return <PageSpinner />;
  const analytics = data?.data;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link to="/dashboard" className="text-sm text-brand-700">← Back to dashboard</Link>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">Analytics</h1>
        <p className="text-sm text-slate-500">Skill popularity, your application funnel, and startup activity.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Average compatibility" value={`${analytics?.compatibility?.avg_compatibility ?? 0}%`} />
        <StatCard label="Best match" value={`${analytics?.compatibility?.best_match ?? 0}%`} />
        <StatCard label="Total match interactions" value={analytics?.compatibility?.total ?? 0} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card">
          <h3 className="mb-2 text-sm font-semibold text-slate-900">Platform-wide skill popularity</h3>
          <SkillPopularityChart data={analytics?.topSkills || []} />
        </div>
        <div className="card">
          <h3 className="mb-2 text-sm font-semibold text-slate-900">Your application status distribution</h3>
          {analytics?.statusBreakdown?.length ? (
            <StatusPieChart data={analytics.statusBreakdown} />
          ) : (
            <EmptyState icon="📊" title="No applications yet" description="Send or receive a request to see this chart fill in." />
          )}
        </div>
        <div className="card lg:col-span-2">
          <h3 className="mb-2 text-sm font-semibold text-slate-900">Startup activity (milestones completed, last 30 days)</h3>
          {analytics?.activity?.length ? (
            <SignupsLineChart data={analytics.activity} />
          ) : (
            <EmptyState icon="📈" title="No completed milestones yet" description="Complete a milestone in one of your startups to see activity here." />
          )}
        </div>
      </div>
    </div>
  );
}
