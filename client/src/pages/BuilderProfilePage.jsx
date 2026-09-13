import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { profileApi } from '../api/profile.api.js';
import { api } from '../api/axios.js';
import { applicationApi } from '../api/application.api.js';
import { useAsync } from '../hooks/useAsync.js';
import { useToast } from '../context/ToastContext.jsx';
import { PageSpinner } from '../components/ui/Spinner.jsx';
import { Avatar } from '../components/ui/Avatar.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { Modal } from '../components/ui/Modal.jsx';
import { formatRelativeTime, titleCase } from '../utils/format.js';

/** Builder Profile — Blueprint §5, page 5-6 (route /builders/:userId). */
export function BuilderProfilePage() {
  const { userId } = useParams();
  const toast = useToast();
  const { data, isLoading, refetch } = useAsync(() => profileApi.getByUserId(userId), [userId]);
  const { data: reviewData } = useAsync(() => api.get(`/reviews/${userId}`).then((r) => r.data), [userId]);

  const [showRequestModal, setShowRequestModal] = useState(false);
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  if (isLoading) return <PageSpinner />;
  const profile = data?.data?.profile;
  const reviews = reviewData?.data?.reviews || [];
  const summary = reviewData?.data?.summary;

  if (!profile) return <p className="text-sm text-slate-500">Profile not found.</p>;

  const sendRequest = async () => {
    setIsSending(true);
    try {
      await applicationApi.send({ type: 'cofounder_request', receiverId: profile.user_id, message: message || undefined });
      toast.success(`Request sent to ${profile.name}`);
      setShowRequestModal(false);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsSending(false);
    }
  };

  const toggleSave = async () => {
    setIsSaving(true);
    try {
      if (profile.isSaved) {
        await profileApi.unsave(profile.user_id);
        toast.success('Removed from saved profiles');
      } else {
        await profileApi.save(profile.user_id);
        toast.success('Profile saved');
      }
      refetch();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="card">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar name={profile.name} src={profile.avatar_url} size="lg" />
            <div>
              <h1 className="text-xl font-bold text-slate-900">{profile.name}</h1>
              <p className="text-sm text-slate-500">{profile.headline || titleCase(profile.primary_role)}</p>
              {summary?.review_count > 0 && (
                <p className="mt-1 text-xs text-amber-600">★ {summary.avg_rating} ({summary.review_count} review{summary.review_count === 1 ? '' : 's'})</p>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <button type="button" className="btn-secondary" disabled={isSaving} onClick={toggleSave}>
              {profile.isSaved ? '★ Saved' : '☆ Save'}
            </button>
            <button type="button" className="btn-primary" onClick={() => setShowRequestModal(true)}>Connect</button>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <Badge variant="brand">{titleCase(profile.primary_role)}</Badge>
          <Badge>{titleCase(profile.experience_level)}</Badge>
          <Badge>{titleCase(profile.availability_hours)}</Badge>
          <Badge>{titleCase(profile.startup_goal)}</Badge>
          {profile.location && <Badge>{profile.location}</Badge>}
        </div>

        {profile.bio && <p className="mt-6 whitespace-pre-line text-sm text-slate-600">{profile.bio}</p>}

        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <h3 className="mb-2 text-sm font-semibold text-slate-900">Skills</h3>
            <div className="flex flex-wrap gap-1.5">
              {profile.skills?.map((s) => (
                <span key={s.skill_id} className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">{s.skill_name}</span>
              ))}
            </div>
          </div>
          <div>
            <h3 className="mb-2 text-sm font-semibold text-slate-900">Interests</h3>
            <div className="flex flex-wrap gap-1.5">
              {profile.interests?.map((i) => (
                <span key={i.interest_id} className="rounded-full bg-brand-50 px-2 py-1 text-xs text-brand-700">{i.interest_name}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {reviews.length > 0 && (
        <div className="card mt-6">
          <h3 className="mb-4 text-sm font-semibold text-slate-900">Feedback from collaborators</h3>
          <div className="flex flex-col gap-4">
            {reviews.map((review) => (
              <div key={review.review_id} className="border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-800">{review.reviewer_name}</p>
                  <span className="text-xs text-amber-600">{'★'.repeat(review.rating)}</span>
                </div>
                {review.comment && <p className="mt-1 text-sm text-slate-500">{review.comment}</p>}
                <p className="mt-1 text-xs text-slate-400">{formatRelativeTime(review.created_at)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <Modal
        isOpen={showRequestModal}
        onClose={() => setShowRequestModal(false)}
        title={`Connect with ${profile.name}`}
        footer={
          <>
            <button type="button" className="btn-secondary" onClick={() => setShowRequestModal(false)}>Cancel</button>
            <button type="button" className="btn-primary" disabled={isSending} onClick={sendRequest}>
              {isSending ? 'Sending…' : 'Send request'}
            </button>
          </>
        }
      >
        <textarea className="input min-h-[100px]" placeholder="Add a short note (optional)" value={message} onChange={(e) => setMessage(e.target.value)} />
      </Modal>
    </div>
  );
}
