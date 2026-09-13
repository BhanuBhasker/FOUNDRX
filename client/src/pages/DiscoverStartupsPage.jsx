import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { discoverApi } from '../api/discover.api.js';
import { applicationApi } from '../api/application.api.js';
import { useDebounce } from '../hooks/useDebounce.js';
import { useToast } from '../context/ToastContext.jsx';
import { PageSpinner } from '../components/ui/Spinner.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { Pagination } from '../components/ui/Pagination.jsx';
import { Modal } from '../components/ui/Modal.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { STARTUP_STAGE_OPTIONS } from '../constants/options.js';
import { titleCase } from '../utils/format.js';

const INITIAL_FILTERS = { search: '', category: '', stage: '', hasOpenSeats: false };

/** Discover Startup Opportunities — the second half of Dual Discovery. */
export function DiscoverStartupsPage() {
  const toast = useToast();
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const debouncedSearch = useDebounce(filters.search);
  const [page, setPage] = useState(1);

  const [startups, setStartups] = useState([]);
  const [meta, setMeta] = useState({ totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);

  const [target, setTarget] = useState(null);
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => setPage(1), [debouncedSearch, filters.category, filters.stage, filters.hasOpenSeats]);

  useEffect(() => {
    let ignore = false;
    setIsLoading(true);
    discoverApi
      .startups({
        search: debouncedSearch || undefined,
        category: filters.category || undefined,
        stage: filters.stage || undefined,
        hasOpenSeats: filters.hasOpenSeats || undefined,
        page,
        limit: 9,
      })
      .then(({ data, meta: responseMeta }) => {
        if (ignore) return;
        setStartups(data.startups);
        setMeta(responseMeta);
      })
      .catch((err) => !ignore && toast.error(err.message))
      .finally(() => !ignore && setIsLoading(false));
    return () => {
      ignore = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, filters.category, filters.stage, filters.hasOpenSeats, page]);

  const openApplyModal = (startup) => {
    setTarget(startup);
    setMessage('');
  };

  const applyToJoin = async () => {
    setIsSending(true);
    try {
      await applicationApi.send({
        type: 'startup_application',
        receiverId: target.owner_id,
        startupId: target.startup_id,
        message: message || undefined,
      });
      toast.success(`Application sent to ${target.name}`);
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
          <h1 className="text-2xl font-bold text-slate-900">Discover startup opportunities</h1>
          <p className="text-sm text-slate-500">Which startup needs someone like you?</p>
        </div>
        <Link to="/discover/builders" className="btn-secondary shrink-0">Discover builders →</Link>
      </div>

      <div className="card grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <input
          type="search"
          placeholder="Search by name, category, or description"
          className="input lg:col-span-2"
          value={filters.search}
          onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
        />
        <input
          placeholder="Category (e.g. FinTech)"
          className="input"
          value={filters.category}
          onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))}
        />
        <select className="input" value={filters.stage} onChange={(e) => setFilters((f) => ({ ...f, stage: e.target.value }))}>
          <option value="">Any stage</option>
          {STARTUP_STAGE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm text-slate-600 lg:col-span-4">
          <input type="checkbox" className="accent-brand-600" checked={filters.hasOpenSeats} onChange={(e) => setFilters((f) => ({ ...f, hasOpenSeats: e.target.checked }))} />
          Only show startups with open team seats
        </label>
      </div>

      {isLoading ? (
        <PageSpinner />
      ) : startups.length === 0 ? (
        <EmptyState icon="🚀" title="No startup opportunities yet" description="Try widening your filters, or create your own startup to recruit for it." action={<Link to="/startups/new" className="btn-primary">Create a startup</Link>} />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {startups.map((s) => (
              <div key={s.startup_id} className="card flex flex-col gap-3">
                <div className="flex items-start justify-between">
                  <div>
                    <Link to={`/startups/${s.startup_id}`} className="font-semibold text-slate-900 hover:text-brand-700">{s.name}</Link>
                    <p className="text-sm text-slate-500">{s.tagline}</p>
                  </div>
                  <Badge variant="brand">{titleCase(s.stage)}</Badge>
                </div>
                <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                  <Badge>{s.category}</Badge>
                  <Badge variant={s.current_team_size < s.max_team_size ? 'success' : 'neutral'}>
                    {s.current_team_size}/{s.max_team_size} team seats filled
                  </Badge>
                </div>
                {s.required_skills?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {s.required_skills.map((rs) => (
                      <span key={rs.skill_id} className={`rounded-full px-2 py-1 text-xs ${rs.priority === 'required' ? 'bg-brand-50 text-brand-700' : 'bg-slate-100 text-slate-600'}`}>
                        {rs.skill_name}
                      </span>
                    ))}
                  </div>
                )}
                <p className="text-xs text-slate-400">Founded by {s.owner_name}</p>
                <div className="mt-auto flex gap-2 pt-2">
                  <Link to={`/startups/${s.startup_id}`} className="btn-secondary flex-1">View</Link>
                  <button type="button" className="btn-primary flex-1" onClick={() => openApplyModal(s)}>Apply to Join</button>
                </div>
              </div>
            ))}
          </div>
          <Pagination page={page} totalPages={meta.totalPages} onPageChange={setPage} />
        </>
      )}

      <Modal
        isOpen={Boolean(target)}
        onClose={() => setTarget(null)}
        title={`Apply to join ${target?.name ?? ''}`}
        footer={
          <>
            <button type="button" className="btn-secondary" onClick={() => setTarget(null)}>Cancel</button>
            <button type="button" className="btn-primary" disabled={isSending} onClick={applyToJoin}>
              {isSending ? 'Sending…' : 'Send application'}
            </button>
          </>
        }
      >
        <label className="label" htmlFor="apply-message">Why would you be a great fit? (optional)</label>
        <textarea
          id="apply-message"
          className="input min-h-[100px]"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </Modal>
    </div>
  );
}
