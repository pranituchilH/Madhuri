'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Check, EyeOff, Star, Trash } from 'lucide-react';
import { api } from '@/lib/api';
import { dateTime } from '@/lib/format';
import { useToast } from '@/context/ToastContext';
import { EmptyState, LoadingBlock, PageHeader, Pill } from '@/components/admin/ui';

const TABS = [
  { value: '', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
];

function Stars({ rating }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${rating} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={`h-4 w-4 ${n <= rating ? 'fill-gold-500 text-gold-500' : 'text-gold-200'}`} />
      ))}
    </span>
  );
}

export default function ReviewsPage() {
  const toast = useToast();
  const [tab, setTab] = useState('pending');
  const [reviews, setReviews] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(() => {
    setReviews(null);
    return api(`/admin/reviews${tab ? `?status=${tab}` : ''}`)
      .then((d) => setReviews(d.reviews))
      .catch((err) => {
        toast(err.message, 'error');
        setReviews([]);
      });
  }, [tab, toast]);

  useEffect(() => {
    load();
  }, [load]);

  async function setApproved(r, approved) {
    setBusyId(r.id);
    try {
      await api(`/admin/reviews/${r.id}`, { method: 'PUT', body: { is_approved: approved } });
      toast(approved ? 'Review approved and published' : 'Review hidden');
      setReviews((list) =>
        tab && (tab === 'pending') === approved ? list.filter((x) => x.id !== r.id) : list.map((x) => (x.id === r.id ? { ...x, is_approved: approved ? 1 : 0 } : x)),
      );
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusyId(null);
    }
  }

  async function remove(r) {
    if (!window.confirm('Delete this review permanently?')) return;
    setBusyId(r.id);
    try {
      await api(`/admin/reviews/${r.id}`, { method: 'DELETE' });
      toast('Review deleted');
      setReviews((list) => list.filter((x) => x.id !== r.id));
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <PageHeader title="Reviews" description="Moderate customer reviews before they appear on product pages" />

      <div className="mb-4 inline-flex rounded-full border border-gold-200 bg-white p-1">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={`rounded-full px-4 py-1.5 text-sm transition ${tab === t.value ? 'bg-maroon-700 text-cream-light' : 'text-ink-soft hover:text-maroon-700'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {!reviews ? (
        <div className="card">
          <LoadingBlock />
        </div>
      ) : reviews.length === 0 ? (
        <div className="card">
          <EmptyState icon={Star} title={tab === 'pending' ? 'No reviews waiting' : 'No reviews'}>
            {tab === 'pending' ? 'You are all caught up.' : 'Reviews will appear here when customers leave them.'}
          </EmptyState>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <article key={r.id} className="card p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Stars rating={r.rating} />
                    {r.is_approved ? <Pill tone="green">Approved</Pill> : <Pill tone="gold">Pending</Pill>}
                  </div>
                  {r.title && <h3 className="mt-2 font-display text-lg font-semibold text-maroon-900">{r.title}</h3>}
                  {r.comment && <p className="mt-1 whitespace-pre-line text-sm text-ink-soft">{r.comment}</p>}
                  <p className="mt-3 text-xs text-ink-muted">
                    <span className="font-medium text-ink">{r.user_name}</span> ({r.user_email}) on{' '}
                    <Link href={`/product/${r.product_slug}`} target="_blank" className="text-maroon-700 hover:underline">
                      {r.product_name}
                    </Link>{' '}
                    · {dateTime(r.created_at)}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  {r.is_approved ? (
                    <button className="btn-outline btn-sm" disabled={busyId === r.id} onClick={() => setApproved(r, false)}>
                      <EyeOff className="h-4 w-4" /> Unapprove
                    </button>
                  ) : (
                    <button className="btn-primary btn-sm" disabled={busyId === r.id} onClick={() => setApproved(r, true)}>
                      <Check className="h-4 w-4" /> Approve
                    </button>
                  )}
                  <button className="btn btn-sm text-rose-600 hover:bg-rose-50" disabled={busyId === r.id} onClick={() => remove(r)} aria-label="Delete review">
                    <Trash className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
