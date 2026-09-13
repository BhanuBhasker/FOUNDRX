import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { startupApi, projectApi } from '../api/startup.api.js';
import { applicationApi } from '../api/application.api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { PageSpinner } from '../components/ui/Spinner.jsx';
import { Avatar } from '../components/ui/Avatar.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { Modal } from '../components/ui/Modal.jsx';
import { Field } from '../components/ui/Field.jsx';
import { titleCase } from '../utils/format.js';
import { PROJECT_STATUS_OPTIONS } from '../constants/options.js';

export function StartupDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [startup, setStartup] = useState(null);
  const [members, setMembers] = useState([]);
  const [progress, setProgress] = useState(null);
  const [isMember, setIsMember] = useState(false);
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [showProjectModal, setShowProjectModal] = useState(false);
  const [projectForm, setProjectForm] = useState({ title: '', description: '', status: 'planning' });
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteUserId, setInviteUserId] = useState('');
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applyMessage, setApplyMessage] = useState('');

  const isOwner = startup?.owner_id === user.user_id;

  const load = async () => {
    setIsLoading(true);
    try {
      const [detailRes, projectsRes] = await Promise.all([startupApi.detail(id), startupApi.listProjects(id)]);
      setStartup(detailRes.data.startup);
      setMembers(detailRes.data.members);
      setProgress(detailRes.data.progress);
      setIsMember(detailRes.data.isMember);
      setProjects(projectsRes.data.projects);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleDeleteStartup = async () => {
    if (!window.confirm('Delete this startup permanently?')) return;
    try {
      await startupApi.remove(id);
      toast.success('Startup deleted');
      navigate('/startups');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    try {
      await projectApi.create({ startupId: Number(id), ...projectForm });
      toast.success('Project created');
      setShowProjectModal(false);
      setProjectForm({ title: '', description: '', status: 'planning' });
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    try {
      await applicationApi.send({ type: 'team_invitation', receiverId: Number(inviteUserId), startupId: Number(id) });
      toast.success('Invitation sent');
      setShowInviteModal(false);
      setInviteUserId('');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleApply = async () => {
    try {
      await applicationApi.send({ type: 'startup_application', receiverId: startup.owner_id, startupId: Number(id), message: applyMessage || undefined });
      toast.success('Application sent');
      setShowApplyModal(false);
      setApplyMessage('');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleRemoveMember = async (userId) => {
    try {
      await startupApi.removeMember(id, userId);
      toast.success('Member removed');
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleRoleChange = async (userId, teamRole) => {
    try {
      await startupApi.updateMemberRole(id, userId, teamRole);
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (isLoading) return <PageSpinner />;
  if (!startup) return <p className="text-sm text-slate-500">Startup not found.</p>;

  return (
    <div className="flex flex-col gap-6">
      <div className="card">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{startup.name}</h1>
            <p className="text-sm text-slate-500">{startup.tagline}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge variant="brand">{titleCase(startup.stage)}</Badge>
              <Badge>{startup.category}</Badge>
              <Badge>{startup.member_count}/{startup.max_team_size} members</Badge>
            </div>
          </div>
          <div className="flex gap-2">
            {isOwner && <button className="btn-secondary" onClick={() => setShowInviteModal(true)}>Invite member</button>}
            {!isOwner && !isMember && <button className="btn-primary" onClick={() => setShowApplyModal(true)}>Apply to Join</button>}
            {isOwner && <button className="btn-danger" onClick={handleDeleteStartup}>Delete</button>}
          </div>
        </div>
        {startup.description && <p className="mt-4 whitespace-pre-line text-sm text-slate-600">{startup.description}</p>}
        {startup.required_skills?.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-sm font-medium text-slate-700">Looking for</p>
            <div className="flex flex-wrap gap-1.5">
              {startup.required_skills.map((rs) => (
                <span key={rs.skill_id} className={`rounded-full px-2 py-1 text-xs ${rs.priority === 'required' ? 'bg-brand-50 text-brand-700' : 'bg-slate-100 text-slate-600'}`}>
                  {rs.skill_name}{rs.priority === 'nice_to_have' ? ' (nice to have)' : ''}
                </span>
              ))}
            </div>
          </div>
        )}
        {progress && Number(progress.total_milestones) > 0 && (
          <div className="mt-4">
            <div className="flex justify-between text-xs text-slate-500">
              <span>Milestone progress</span>
              <span>{progress.completion_pct}%</span>
            </div>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-emerald-500" style={{ width: `${progress.completion_pct}%` }} />
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="card lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">Projects</h2>
            {isOwner && <button className="btn-secondary" onClick={() => setShowProjectModal(true)}>+ New project</button>}
          </div>
          {projects.length === 0 ? (
            <p className="text-sm text-slate-400">No projects yet.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {projects.map((p) => (
                <Link key={p.project_id} to={`/projects/${p.project_id}`} className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3 hover:border-brand-300">
                  <div>
                    <p className="font-medium text-slate-900">{p.title}</p>
                    <p className="text-xs text-slate-500">{p.description}</p>
                  </div>
                  <Badge>{titleCase(p.status)}</Badge>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h2 className="mb-4 text-base font-semibold text-slate-900">Team</h2>
          <div className="flex flex-col gap-3">
            {members.map((m) => (
              <div key={m.user_id} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Avatar name={m.name} src={m.avatar_url} size="sm" />
                  <div>
                    <Link to={`/builders/${m.user_id}`} className="text-sm font-medium text-slate-900 hover:text-brand-700">{m.name}</Link>
                    {isOwner && m.user_id !== startup.owner_id ? (
                      <input
                        className="mt-0.5 block w-28 rounded border border-slate-200 px-1.5 py-0.5 text-xs"
                        defaultValue={m.team_role}
                        onBlur={(e) => e.target.value !== m.team_role && handleRoleChange(m.user_id, e.target.value)}
                      />
                    ) : (
                      <p className="text-xs text-slate-500">{m.team_role}</p>
                    )}
                  </div>
                </div>
                {isOwner && m.user_id !== startup.owner_id && (
                  <button className="text-xs text-red-500 hover:underline" onClick={() => handleRemoveMember(m.user_id)}>Remove</button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <Modal
        isOpen={showProjectModal}
        onClose={() => setShowProjectModal(false)}
        title="Create a project"
        footer={
          <>
            <button type="button" className="btn-secondary" onClick={() => setShowProjectModal(false)}>Cancel</button>
            <button type="submit" form="create-project-form" className="btn-primary">Create</button>
          </>
        }
      >
        <form id="create-project-form" onSubmit={handleCreateProject} className="flex flex-col gap-4">
          <Field label="Project title" htmlFor="project-title">
            <input id="project-title" required className="input" value={projectForm.title} onChange={(e) => setProjectForm((f) => ({ ...f, title: e.target.value }))} />
          </Field>
          <Field label="Description" htmlFor="project-description">
            <textarea id="project-description" className="input" value={projectForm.description} onChange={(e) => setProjectForm((f) => ({ ...f, description: e.target.value }))} />
          </Field>
          <Field label="Status" htmlFor="project-status">
            <select id="project-status" className="input" value={projectForm.status} onChange={(e) => setProjectForm((f) => ({ ...f, status: e.target.value }))}>
              {PROJECT_STATUS_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </Field>
        </form>
      </Modal>

      <Modal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        title="Invite a member"
        footer={
          <>
            <button type="button" className="btn-secondary" onClick={() => setShowInviteModal(false)}>Cancel</button>
            <button type="submit" form="invite-form" className="btn-primary">Send invite</button>
          </>
        }
      >
        <form id="invite-form" onSubmit={handleInvite}>
          <Field label="User ID" htmlFor="invite-user-id" hint="Find a builder's ID on their profile page, or via Discover">
            <input id="invite-user-id" type="number" required className="input" value={inviteUserId} onChange={(e) => setInviteUserId(e.target.value)} />
          </Field>
        </form>
      </Modal>

      <Modal
        isOpen={showApplyModal}
        onClose={() => setShowApplyModal(false)}
        title={`Apply to join ${startup.name}`}
        footer={
          <>
            <button type="button" className="btn-secondary" onClick={() => setShowApplyModal(false)}>Cancel</button>
            <button type="button" className="btn-primary" onClick={handleApply}>Send application</button>
          </>
        }
      >
        <textarea className="input min-h-[100px]" placeholder="Why would you be a great fit? (optional)" value={applyMessage} onChange={(e) => setApplyMessage(e.target.value)} />
      </Modal>
    </div>
  );
}
