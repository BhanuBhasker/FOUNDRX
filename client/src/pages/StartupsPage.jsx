import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { startupApi } from '../api/startup.api.js';
import { useDebounce } from '../hooks/useDebounce.js';
import { useToast } from '../context/ToastContext.jsx';
import { StartupCard } from '../components/startup/StartupCard.jsx';
import { PageSpinner } from '../components/ui/Spinner.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { Pagination } from '../components/ui/Pagination.jsx';

export function StartupsPage() {
  const toast = useToast();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);
  const [page, setPage] = useState(1);
  const [startups, setStartups] = useState([]);
  const [meta, setMeta] = useState({ totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => setPage(1), [debouncedSearch]);

  useEffect(() => {
    let ignore = false;
    setIsLoading(true);
    startupApi
      .list({ search: debouncedSearch || undefined, page, limit: 9 })
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
  }, [debouncedSearch, page]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Startups</h1>
          <p className="text-sm text-slate-500">Browse active startups looking for collaborators.</p>
        </div>
        <Link to="/startups/new" className="btn-primary">+ Create startup</Link>
      </div>

      <input
        type="search"
        placeholder="Search startups by name or description"
        className="input max-w-md"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {isLoading ? (
        <PageSpinner />
      ) : startups.length === 0 ? (
        <EmptyState icon="🏗️" title="No startups yet" description="Be the first to create one." action={<Link to="/startups/new" className="btn-primary">Create startup</Link>} />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {startups.map((s) => <StartupCard key={s.startup_id} startup={s} />)}
          </div>
          <Pagination page={page} totalPages={meta.totalPages} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
