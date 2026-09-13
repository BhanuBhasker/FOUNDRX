import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { applicationApi } from '../api/application.api.js';
import { api } from '../api/axios.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { Tabs } from '../components/ui/Tabs.jsx';
import { Avatar } from '../components/ui/Avatar.jsx';
import { Badge, StatusBadge } from '../components/ui/Badge.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { PageSpinner } from '../components/ui/Spinner.jsx';
import { Modal } from '../components/ui/Modal.jsx';
import { formatRelativeTime } from '../utils/format.js';
import { APPLICATION_TYPE_LABELS } from '../constants/options.js';

/** Applications & Collaboration — Blueprint §5, page 5: Received / Sent /
 * Startup Applications tabs over one unified GET /api/applications. */
const TABS = [
  { value: 'received', label: 'Received' },
  { value: 'sent', label: 'Sent' },
  { value: 'startups', label: 'Startup Applications' },
];

export function ApplicationsPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [tab, setTab] = useState('received');
  const [applications, setApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [reviewTarget, setReviewTarget] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  const load = async () => {
    setIsLoading(true);
    try {
      const params =
        tab === 'startups'
          ? { direction: 'all', type: 'startup_application' }
          : { direction: tab };
      const { data } = await applicationApi.list(params);
      setApplications(data.applications);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const act = async (id, status) => {
    try {
      await applicationApi.updateStatus(id, status);
      toast.success('Updated');
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const submitReview = async () => {
    try {
      await api.post('/reviews', { reviewedId: reviewTarget.otherId, rating, comment: comment || undefined });
      toast.success('Review submitted');
      setReviewTarget(null);
      setComment('');
      setRating(5);
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Applications &amp; Collaboration</h1>
        <p className="text-sm text-slate-500">Track co-founder requests, startup applications, and team invitations.</p>
      </div>

      <Tabs tabs={TABS} active={tab} onChange={setTab} />

      {isLoading ? (
        <PageSpinner />
      ) : applications.length === 0 ? (
        <EmptyState icon="📭" title="Nothing here yet" description="Applications you send or receive will show up here." />
      ) : (
        <div className="flex flex-col gap-3">
          {applications.map((app) => {
            const isReceiver = app.receiver_id === user.user_id;
            const otherName = isReceiver ? app.sender_name : app.receiver_name;
            const otherAvatar = isReceiver ? app.sender_avatar : app.receiver_avatar;
            const otherId = isReceiver ? app.sender_id : app.receiver_id;
            return (
              <div key={app.application_id} className="card flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Avatar name={otherName} src={otherAvatar} />
                  <div>
                    <div className="flex items-center gap-2">
                      <Link to={`/builders/${otherId}`} className="font-medium text-slate-900 hover:text-brand-700">{otherName}</Link>
                      <Badge variant="neutral">{APPLICATION_TYPE_LABELS[app.type]}</Badge>
                    </div>
                    {app.message && <p className="max-w-md truncate text-sm text-slate-500">"{app.message}"</p>}
                    <p className="text-xs text-slate-400">
                      {app.compatibility_score > 0 && `${Math.round(app.compatibility_score)}% match · `}
                      {formatRelativeTime(app.created_at)}
                      {app.startup_name && ` · ${app.startup_name}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={app.status} />
                  {isReceiver && app.status === 'pending' && (
                    <>
                      <button className="btn-primary" onClick={() => act(app.application_id, 'accepted')}>Accept</button>
                      <button className="btn-secondary" onClick={() => act(app.application_id, 'rejected')}>Decline</button>
                    </>
                  )}
                  {!isReceiver && app.status === 'pending' && (
                    <button className="btn-secondary" onClick={() => act(app.application_id, 'cancelled')}>Cancel</button>
                  )}
                  {app.status === 'accepted' && (
                    <button className="btn-secondary" onClick={() => setReviewTarget({ otherId, otherName })}>Leave review</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        isOpen={Boolean(reviewTarget)}
        onClose={() => setReviewTarget(null)}
        title={`Review ${reviewTarget?.otherName ?? ''}`}
        footer={
          <>
            <button type="button" className="btn-secondary" onClick={() => setReviewTarget(null)}>Cancel</button>
            <button type="button" className="btn-primary" onClick={submitReview}>Submit review</button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <div>
            <label className="label">Rating</label>
            <div className="flex gap-1 text-2xl">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" onClick={() => setRating(n)} className={n <= rating ? 'text-amber-500' : 'text-slate-300'}>★</button>
              ))}
            </div>
          </div>
          <textarea className="input min-h-[100px]" placeholder="Share how the collaboration went (optional)" value={comment} onChange={(e) => setComment(e.target.value)} />
        </div>
      </Modal>
    </div>
  );
}
