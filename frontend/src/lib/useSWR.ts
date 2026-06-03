'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { api, ApiError } from './api';

/**
 * Tiny SWR-like hook so we don't pull in another dependency.
 * Fetches once on mount and exposes refetch().
 */
export default function useSWR<T>(path: string | null, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(!!path);
  const [error, setError] = useState<ApiError | null>(null);
  const mountedRef = useRef(true);

  const fetcher = useCallback(async () => {
    if (!path) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api<T>(path);
      if (mountedRef.current) setData(res);
    } catch (e) {
      if (mountedRef.current) setError(e as ApiError);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [path]);

  useEffect(() => {
    mountedRef.current = true;
    fetcher();
    return () => {
      mountedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, ...deps]);

  return { data, loading, error, refetch: fetcher, setData };
}
