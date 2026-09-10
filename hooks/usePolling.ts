"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface UsePollingOptions {
  intervalMs?: number;
  enabled?: boolean;
  token?: string | null;
}

/**
 * Polls a URL at a given interval and returns the latest data.
 * Stops polling when `enabled` is false or the component unmounts.
 */
export function usePolling<T>(
  url: string,
  { intervalMs = 4000, enabled = true, token }: UsePollingOptions = {},
) {
  const [data, setData]       = useState<T | null>(null);
  const [error, setError]     = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchOnce = useCallback(async () => {
    if (!enabled) return;
    try {
      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Polling error");
    } finally {
      setLoading(false);
    }
  }, [url, enabled, token]);

  useEffect(() => {
    if (!enabled) return;
    setLoading(true);
    fetchOnce();
    timerRef.current = setInterval(fetchOnce, intervalMs);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [fetchOnce, enabled, intervalMs]);

  return { data, error, loading, refetch: fetchOnce };
}
