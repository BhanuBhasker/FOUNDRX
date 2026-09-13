import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Runs an async fetcher, tracking loading/error/data state. Re-runs
 * whenever `deps` changes. Ignores results from stale, superseded calls.
 */
export function useAsync(fetcher, deps = []) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const requestId = useRef(0);

  const run = useCallback(async () => {
    const currentRequest = ++requestId.current;
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetcher();
      if (currentRequest === requestId.current) setData(result);
    } catch (err) {
      if (currentRequest === requestId.current) setError(err);
    } finally {
      if (currentRequest === requestId.current) setIsLoading(false);
    }
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    run();
  }, [run]);

  return { data, error, isLoading, refetch: run, setData };
}
