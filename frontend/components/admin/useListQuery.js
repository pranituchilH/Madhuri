'use client';

import { useCallback, useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

/**
 * Keeps list filters (q, status, page, …) in the URL so they survive reloads and back-navigation.
 * Must be used inside a <Suspense> boundary (useSearchParams requirement).
 * Returns { params, set, qs } — `set({ status: 'paid' })` resets page to 1 unless page is given.
 */
export default function useListQuery(keys) {
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const spString = sp.toString();

  const params = useMemo(() => {
    const out = {};
    for (const k of keys) out[k] = sp.get(k) || '';
    out.page = Number(sp.get('page')) || 1;
    return out;
  }, [spString]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = useCallback(
    (patch) => {
      const next = new URLSearchParams(spString);
      const merged = { ...patch };
      if (!('page' in merged)) merged.page = 1;
      for (const [k, v] of Object.entries(merged)) {
        if (v === '' || v == null || (k === 'page' && Number(v) <= 1)) next.delete(k);
        else next.set(k, String(v));
      }
      const s = next.toString();
      router.replace(s ? `${pathname}?${s}` : pathname, { scroll: false });
    },
    [spString, pathname, router],
  );

  const qs = useMemo(() => {
    const u = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v !== '' && v != null) u.set(k, String(v));
    return u.toString();
  }, [params]);

  return { params, set, qs };
}
