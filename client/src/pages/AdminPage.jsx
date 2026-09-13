import { useEffect, useState } from 'react';
import { adminApi } from '../api/admin.api.js';
import { adminAnalyticsApi } from '../api/analytics.api.js';
import { useToast } from '../context/ToastContext.jsx';
import { Tabs } from '../components/ui/Tabs.jsx';
import { StatCard } from '../components/ui/StatCard.jsx';
import { PageSpinner } from '../components/ui/Spinner.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { SkillPopularityChart } from '../components/charts/SkillPopularityChart.jsx';
import { StatusPieChart } from '../components/charts/StatusPieChart.jsx';
import { CategoryBarChart } from '../components/charts/CategoryBarChart.jsx';
import { SignupsLineChart } from '../components/charts/SignupsLineChart.jsx';
import { formatDate } from '../utils/format.js';

const TABS = [
  { value: 'overview', label: 'Overview' },
  { value: 'users', label: 'Users' },
  { value: 'startups', label: 'Startups' },
  { value: 'skills', label: 'Skills' },
];

function OverviewTab() {
  const [analytics, setAnalytics] = useState(null);
  useEffect(() => {
    adminAnalyticsApi.platform().then(({ data }) => setAnalytics(data)).catch(() => {});
  }, []);
  if (!analytics) return <PageSpinner />;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total users" value={analytics.overview.totalUsers} />
        <StatCard label="Active startups" value={analytics.overview.activeStartups} />
        <StatCard label="Collaboration requests" value={analytics.overview.totalApplications} />
        <StatCard label="Projects" value={analytics.overview.totalProjects} />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card">
          <h3 className="mb-2 text-sm font-semibold text-slate-900">Top skills</h3>
          <SkillPopularityChart data={analytics.topSkills} />
        </div>
        <div className="card">
          <h3 className="mb-2 text-sm font-semibold text-slate-900">Application status</h3>
          <StatusPieChart data={analytics.statusBreakdown} />
        </div>
        <div className="card">
          <h3 className="mb-2 text-sm font-semibold text-slate-900">Startups by category</h3>
          <CategoryBarChart data={analytics.byCategory} />
        </div>
        <div className="card">
          <h3 className="mb-2 text-sm font-semibold text-slate-900">Signups (last 30 days)</h3>
          <SignupsLineChart data={analytics.signups} />
        </div>
      </div>
    </div>
  );
}

function UsersTab() {
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = () => {
    setIsLoading(true);
    adminApi.listUsers({ limit: 50 }).then(({ data }) => setUsers(data.users)).catch((err) => toast.error(err.message)).finally(() => setIsLoading(false));
  };
  useEffect(load, []); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleStatus = async (u) => {
    const next = u.status === 'active' ? 'suspended' : 'active';
    await adminApi.setUserStatus(u.user_id, next).catch((err) => toast.error(err.message));
    load();
  };

  const toggleRole = async (u) => {
    const next = u.role === 'admin' ? 'user' : 'admin';
    await adminApi.setUserRole(u.user_id, next).catch((err) => toast.error(err.message));
    load();
  };

  if (isLoading) return <PageSpinner />;

  return (
    <div className="card overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="text-xs uppercase text-slate-400">
          <tr>
            <th className="py-2">Name</th>
            <th className="py-2">Email</th>
            <th className="py-2">Role</th>
            <th className="py-2">Status</th>
            <th className="py-2">Joined</th>
            <th className="py-2 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {users.map((u) => (
            <tr key={u.user_id}>
              <td className="py-3 font-medium text-slate-900">{u.name}</td>
              <td className="py-3 text-slate-500">{u.email}</td>
              <td className="py-3"><Badge variant={u.role === 'admin' ? 'brand' : 'neutral'}>{u.role}</Badge></td>
              <td className="py-3"><Badge variant={u.status === 'active' ? 'success' : 'danger'}>{u.status}</Badge></td>
              <td className="py-3 text-slate-400">{formatDate(u.created_at)}</td>
              <td className="py-3 text-right">
                <button className="mr-3 text-xs text-brand-700 hover:underline" onClick={() => toggleRole(u)}>
                  {u.role === 'admin' ? 'Revoke admin' : 'Make admin'}
                </button>
                <button className="text-xs text-red-500 hover:underline" onClick={() => toggleStatus(u)}>
                  {u.status === 'active' ? 'Suspend' : 'Reactivate'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StartupsTab() {
  const toast = useToast();
  const [startups, setStartups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = () => {
    setIsLoading(true);
    adminApi.listStartups({ limit: 50 }).then(({ data }) => setStartups(data.startups)).catch((err) => toast.error(err.message)).finally(() => setIsLoading(false));
  };
  useEffect(load, []); // eslint-disable-line react-hooks/exhaustive-deps

  const remove = async (id) => {
    if (!window.confirm('Remove this startup?')) return;
    await adminApi.removeStartup(id).catch((err) => toast.error(err.message));
    load();
  };

  if (isLoading) return <PageSpinner />;

  return (
    <div className="card overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="text-xs uppercase text-slate-400">
          <tr>
            <th className="py-2">Name</th>
            <th className="py-2">Owner</th>
            <th className="py-2">Category</th>
            <th className="py-2">Members</th>
            <th className="py-2 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {startups.map((s) => (
            <tr key={s.startup_id}>
              <td className="py-3 font-medium text-slate-900">{s.name}</td>
              <td className="py-3 text-slate-500">{s.owner_name}</td>
              <td className="py-3 text-slate-500">{s.category}</td>
              <td className="py-3 text-slate-500">{s.member_count}</td>
              <td className="py-3 text-right">
                <button className="text-xs text-red-500 hover:underline" onClick={() => remove(s.startup_id)}>Remove</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SkillsTab() {
  const toast = useToast();
  const [skills, setSkills] = useState([]);
  const [form, setForm] = useState({ skillName: '', category: 'general' });
  const [isLoading, setIsLoading] = useState(true);

  const load = () => {
    setIsLoading(true);
    adminApi.listSkills().then(({ data }) => setSkills(data.skills)).catch((err) => toast.error(err.message)).finally(() => setIsLoading(false));
  };
  useEffect(load, []); // eslint-disable-line react-hooks/exhaustive-deps

  const addSkill = async (e) => {
    e.preventDefault();
    try {
      await adminApi.addSkill(form);
      setForm({ skillName: '', category: 'general' });
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const removeSkill = async (id) => {
    await adminApi.removeSkill(id).catch((err) => toast.error(err.message));
    load();
  };

  if (isLoading) return <PageSpinner />;

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={addSkill} className="card flex flex-wrap items-end gap-3">
        <div>
          <label className="label" htmlFor="skill-name">Skill name</label>
          <input id="skill-name" required className="input" value={form.skillName} onChange={(e) => setForm((f) => ({ ...f, skillName: e.target.value }))} />
        </div>
        <div>
          <label className="label" htmlFor="skill-category">Category</label>
          <input id="skill-category" className="input" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} />
        </div>
        <button type="submit" className="btn-primary">Add skill</button>
      </form>

      <div className="card flex flex-wrap gap-2">
        {skills.map((s) => (
          <span key={s.skill_id} className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">
            {s.skill_name}
            <button onClick={() => removeSkill(s.skill_id)} className="text-slate-400 hover:text-red-500" aria-label={`Remove ${s.skill_name}`}>✕</button>
          </span>
        ))}
      </div>
    </div>
  );
}

export function AdminPage() {
  const [tab, setTab] = useState('overview');

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Admin dashboard</h1>
        <p className="text-sm text-slate-500">Manage users, startups, skills, and platform analytics.</p>
      </div>
      <Tabs tabs={TABS} active={tab} onChange={setTab} />
      {tab === 'overview' && <OverviewTab />}
      {tab === 'users' && <UsersTab />}
      {tab === 'startups' && <StartupsTab />}
      {tab === 'skills' && <SkillsTab />}
    </div>
  );
}
