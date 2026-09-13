import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { discoverApi } from '../api/discover.api.js';
import { applicationApi } from '../api/application.api.js';
import { useDebounce } from '../hooks/useDebounce.js';
import { useToast } from '../context/ToastContext.jsx';
import { ProfileCard } from '../components/profile/ProfileCard.jsx';
import { PageSpinner } from '../components/ui/Spinner.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { Pagination } from '../components/ui/Pagination.jsx';
import { Modal } from '../components/ui/Modal.jsx';
import { PRIMARY_ROLE_OPTIONS, AVAILABILITY_OPTIONS, SORT_OPTIONS } from '../constants/options.js';

const INITIAL_FILTERS = { search: '', primaryRole: '', availabilityHours: '', sortBy: 'compatibility' };

export function DiscoverBuildersPage() {
  const toast = useToast();
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const debouncedSearch = useDebounce(filters.search);
  const [page, setPage] = useState(1);

  const [builders, setBuilders] = useState([]);
  const [meta, setMeta] = useState({ totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);

  const [target, setTarget] = useState(null);
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, filters.primaryRole, filters.availabilityHours, filters.sortBy]);

  useEffect(() => {
    let ignore = false;
    setIsLoading(true);
    discoverApi
      .builders({
        search: debouncedSearch || undefined,
        primaryRole: filters.primaryRole || undefined,
        availabilityHours: filters.availabilityHours || undefined,
        sortBy: filters.sortBy,
        page,
        limit: 9,
      })
      .then(({ data, meta: responseMeta }) => {
        if (ignore) return;
        setBuilders(data.builders);
        setMeta(responseMeta);
      })
      .catch((err) => !ignore && toast.error(err.message))
      .finally(() => !ignore && setIsLoading(false));
    return () => {
      ignore = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, filters.primaryRole, filters.availabilityHours, filters.sortBy, page]);

  const openRequestModal = (builder) => {
    setTarget(builder);
    setMessage('');
  };

  const sendRequest = async () => {
    setIsSending(true);
    try {
      await applicationApi.send({ type: 'cofounder_request', receiverId: target.user_id, message: message || undefined });
      toast.success(`Request sent to ${target.name}`);
      setTarget(null);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Discover builders</h1>
          <p className="text-sm text-slate-500">Search, filter, and connect with people who complement your skills.</p>
        </div>
        <Link to="/discover/startups" className="btn-secondary shrink-0">Discover startups →</Link>
      </div>

      <div className="card grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <input
          type="search"
          placeholder="Search by name, headline, or role"
          className="input lg:col-span-2"
          value={filters.search}
          onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
        />
        <select className="input" value={filters.primaryRole} onChange={(e) => setFilters((f) => ({ ...f, primaryRole: e.target.value }))}>
          <option value="">All roles</option>
          {PRIMARY_ROLE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <select className="input" value={filters.availabilityHours} onChange={(e) => setFilters((f) => ({ ...f, availabilityHours: e.target.value }))}>
          <option value="">Any availability</option>
          {AVAILABILITY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <select className="input sm:col-span-2 lg:col-span-1" value={filters.sortBy} onChange={(e) => setFilters((f) => ({ ...f, sortBy: e.target.value }))}>
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <PageSpinner />
      ) : builders.length === 0 ? (
        <EmptyState icon="🧑‍💻" title="No matching builders yet" description="Try widening your filters, or check back once more builders join." />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {builders.map((builder) => (
              <ProfileCard key={builder.user_id} profile={builder} onRequestCollaboration={openRequestModal} />
            ))}
          </div>
          <Pagination page={page} totalPages={meta.totalPages} onPageChange={setPage} />
        </>
      )}

      <Modal
        isOpen={Boolean(target)}
        onClose={() => setTarget(null)}
        title={`Connect with ${target?.name ?? ''}`}
        footer={
          <>
            <button type="button" className="btn-secondary" onClick={() => setTarget(null)}>Cancel</button>
            <button type="button" className="btn-primary" disabled={isSending} onClick={sendRequest}>
              {isSending ? 'Sending…' : 'Send request'}
            </button>
          </>
        }
      >
        <label className="label" htmlFor="request-message">Add a short note (optional)</label>
        <textarea
          id="request-message"
          className="input min-h-[100px]"
          placeholder="Introduce yourself and explain why you'd make a great team."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </Modal>
    </div>
  );
}
