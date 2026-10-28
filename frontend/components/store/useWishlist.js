'use client';

import { useCallback, useEffect, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

// Tiny shared store so every card reflects wishlist changes without refetching.
let ids = new Set();
let loadedFor = null;
const listeners = new Set();
const emit = () => listeners.forEach((l) => l());
const subscribe = (l) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
const snapshot = () => ids;

export function useWishlist() {
  const { user } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const current = useSyncExternalStore(subscribe, snapshot, snapshot);

  useEffect(() => {
    if (!user) {
      if (loadedFor !== null) {
        ids = new Set();
        loadedFor = null;
        emit();
      }
      return;
    }
    if (loadedFor === user.id) return;
    loadedFor = user.id;
    api('/account/wishlist')
      .then((d) => {
        ids = new Set(d.products.map((p) => p.id));
        emit();
      })
      .catch(() => {});
  }, [user]);

  const toggle = useCallback(
    async (productId) => {
      if (!user) {
        toast('Please log in to save sarees to your wishlist', 'info');
        router.push('/login');
        return;
      }
      const had = ids.has(productId);
      ids = new Set(ids);
      had ? ids.delete(productId) : ids.add(productId);
      emit();
      try {
        await api(`/account/wishlist/${productId}`, { method: had ? 'DELETE' : 'POST' });
        toast(had ? 'Removed from wishlist' : 'Saved to your wishlist');
      } catch (err) {
        ids = new Set(ids);
        had ? ids.add(productId) : ids.delete(productId);
        emit();
        toast(err.message, 'error');
      }
    },
    [user, toast, router],
  );

  return { isWished: (id) => current.has(id), toggle };
}
