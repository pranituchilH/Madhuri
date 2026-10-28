'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Star } from 'lucide-react';
import { api } from '@/lib/api';
import { date } from '@/lib/format';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import Stars from './Stars';

export default function ProductReviews({ product }) {
  const { user } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({ rating: 0, title: '', comment: '' });
  const [hover, setHover] = useState(0);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const reviews = product.reviews || [];

  const counts = [5, 4, 3, 2, 1].map((n) => [n, reviews.filter((r) => r.rating === n).length]);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.rating) return toast('Please select a star rating', 'error');
    setBusy(true);
    try {
      const d = await api(`/products/${product.id}/reviews`, { method: 'POST', body: form });
      toast(d.message);
      setForm({ rating: 0, title: '', comment: '' });
      setOpen(false);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section id="reviews" className="border-t border-gold-200 bg-cream">
      <div className="container grid gap-12 py-16 lg:grid-cols-[320px_1fr]">
        <div>
          <h2 className="font-display text-3xl">Customer Reviews</h2>
          <div className="mt-4 flex items-center gap-3">
            <span className="font-display text-5xl font-semibold text-maroon-800">{product.rating || '—'}</span>
            <div>
              <Stars value={product.rating || 0} />
              <p className="mt-1 text-xs text-ink-muted">Based on {reviews.length} review{reviews.length === 1 ? '' : 's'}</p>
            </div>
          </div>
          <div className="mt-6 space-y-2">
            {counts.map(([n, c]) => (
              <div key={n} className="flex items-center gap-3 text-xs text-ink-soft">
                <span className="w-6">{n}★</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-gold-100">
                  <div className="h-full bg-gold-500" style={{ width: `${reviews.length ? (c / reviews.length) * 100 : 0}%` }} />
                </div>
                <span className="w-6 text-right">{c}</span>
              </div>
            ))}
          </div>
          {user ? (
            <button onClick={() => setOpen((o) => !o)} className="btn-primary mt-8 w-full">Write a Review</button>
          ) : (
            <Link href="/login" className="btn-outline mt-8 w-full">Log in to write a review</Link>
          )}
        </div>

        <div>
          {open && (
            <form onSubmit={submit} className="card mb-8 space-y-4 p-6">
              <div>
                <span className="label">Your rating</span>
                <div className="flex gap-1" onMouseLeave={() => setHover(0)}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button type="button" key={n} onMouseEnter={() => setHover(n)} onClick={() => setForm((f) => ({ ...f, rating: n }))} aria-label={`${n} stars`}>
                      <Star className={`h-7 w-7 ${n <= (hover || form.rating) ? 'fill-gold-500 text-gold-500' : 'text-gold-300'}`} />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="label" htmlFor="rv-title">Title</label>
                <input id="rv-title" className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Absolutely gorgeous!" />
              </div>
              <div>
                <label className="label" htmlFor="rv-comment">Review</label>
                <textarea id="rv-comment" rows={4} className="input" value={form.comment} onChange={(e) => setForm({ ...form, comment: e.target.value })} placeholder="Tell others about the fabric, colour and drape…" />
              </div>
              <button disabled={busy} className="btn-primary">{busy ? 'Submitting…' : 'Submit Review'}</button>
            </form>
          )}

          {reviews.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gold-300 p-10 text-center text-ink-soft">
              No reviews yet. Bought this saree? Share your experience!
            </div>
          ) : (
            <ul className="space-y-6">
              {reviews.map((r) => (
                <li key={r.id} className="card p-6">
                  <div className="flex items-center justify-between">
                    <Stars value={r.rating} />
                    <span className="text-xs text-ink-muted">{date(r.created_at)}</span>
                  </div>
                  {r.title && <p className="mt-3 font-display text-xl text-maroon-900">{r.title}</p>}
                  {r.comment && <p className="mt-2 text-sm leading-relaxed text-ink-soft">{r.comment}</p>}
                  <p className="mt-4 text-xs font-medium uppercase tracking-wider text-gold-700">{r.user_name}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
