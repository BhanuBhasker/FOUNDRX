import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { projectApi, milestoneApi } from '../api/startup.api.js';
import { useToast } from '../context/ToastContext.jsx';
import { PageSpinner } from '../components/ui/Spinner.jsx';
import { StatusBadge } from '../components/ui/Badge.jsx';
import { Modal } from '../components/ui/Modal.jsx';
import { Field } from '../components/ui/Field.jsx';
import { formatDate, titleCase } from '../utils/format.js';
import { MILESTONE_STATUS_OPTIONS } from '../constants/options.js';

const EMPTY_MILESTONE = { title: '', description: '', dueDate: '', status: 'not_started' };

export function ProjectDetailPage() {
  const { id } = useParams();
  const toast = useToast();

  const [project, setProject] = useState(null);
  const [members, setMembers] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_MILESTONE);

  const load = async () => {
    setIsLoading(true);
    try {
      const { data } = await projectApi.detail(id);
      setProject(data.project);
      setMembers(data.members);
      setMilestones(data.milestones);
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

  const handleCreateMilestone = async (e) => {
    e.preventDefault();
    try {
      await milestoneApi.create({ projectId: Number(id), ...form, dueDate: form.dueDate || null });
      toast.success('Milestone added');
      setShowModal(false);
      setForm(EMPTY_MILESTONE);
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const cycleStatus = async (milestone) => {
    const order = ['not_started', 'in_progress', 'completed'];
    const next = order[(order.indexOf(milestone.status) + 1) % order.length];
    try {
      await milestoneApi.update(milestone.milestone_id, {
        title: milestone.title,
        description: milestone.description,
        dueDate: milestone.due_date,
        status: next,
      });
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const removeMilestone = async (milestoneId) => {
    try {
      await milestoneApi.remove(milestoneId);
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (isLoading) return <PageSpinner />;
  if (!project) return <p className="text-sm text-slate-500">Project not found.</p>;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link to={`/startups/${project.startup_id}`} className="text-sm text-brand-700">← Back to {project.startup_name}</Link>
        <div className="mt-2 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900">{project.title}</h1>
          <StatusBadge status={project.status} />
        </div>
        {project.description && <p className="mt-2 text-sm text-slate-600">{project.description}</p>}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="card lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">Milestones</h2>
            <button className="btn-secondary" onClick={() => setShowModal(true)}>+ Add milestone</button>
          </div>
          {milestones.length === 0 ? (
            <p className="text-sm text-slate-400">No milestones yet.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {milestones.map((m) => (
                <li key={m.milestone_id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-4 py-3">
                  <div>
                    <p className="font-medium text-slate-900">{m.title}</p>
                    {m.description && <p className="text-xs text-slate-500">{m.description}</p>}
                    <p className="text-xs text-slate-400">Due {formatDate(m.due_date)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => cycleStatus(m)} title="Click to advance status">
                      <StatusBadge status={m.status} />
                    </button>
                    <button className="text-xs text-red-500 hover:underline" onClick={() => removeMilestone(m.milestone_id)}>Remove</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card">
          <h2 className="mb-4 text-base font-semibold text-slate-900">Project members</h2>
          {members.length === 0 ? (
            <p className="text-sm text-slate-400">No members assigned yet.</p>
          ) : (
            <ul className="flex flex-col gap-2 text-sm">
              {members.map((m) => (
                <li key={m.user_id} className="flex justify-between">
                  <span>{m.name}</span>
                  <span className="text-slate-400">{m.project_role}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Add milestone"
        footer={
          <>
            <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button type="submit" form="milestone-form" className="btn-primary">Add</button>
          </>
        }
      >
        <form id="milestone-form" onSubmit={handleCreateMilestone} className="flex flex-col gap-4">
          <Field label="Title" htmlFor="milestone-title">
            <input id="milestone-title" required className="input" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
          </Field>
          <Field label="Description" htmlFor="milestone-description">
            <textarea id="milestone-description" className="input" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Due date" htmlFor="milestone-due">
              <input id="milestone-due" type="date" className="input" value={form.dueDate} onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))} />
            </Field>
            <Field label="Status" htmlFor="milestone-status">
              <select id="milestone-status" className="input" value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
                {MILESTONE_STATUS_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{titleCase(opt.label)}</option>)}
              </select>
            </Field>
          </div>
        </form>
      </Modal>
    </div>
  );
}
