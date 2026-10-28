'use client';

import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, Package, Truck } from 'lucide-react';
import Spinner from '@/components/ui/Spinner';
import StatusBadge from '@/components/ui/StatusBadge';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { api, img } from '@/lib/api';
import { dateTime, inr } from '@/lib/format';
import { openRazorpay } from '@/lib/razorpay';

const STEPS = ['confirmed', 'processing', 'shipped', 'delivered'];

export default function OrderPage() {
  const { id } = useParams();
  const placed = useSearchParams().get('placed');
  const { user, loading } = useAuth();
  const toast = useToast();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => api(`/orders/${id}`).then((d) => setOrder(d.order)).catch((e) => setError(e.message)), [id]);

  useEffect(() => {
    if (user) load();
  }, [user, load]);

  const retryPayment = async () => {
    setBusy(true);
    try {
      const d = await api(`/orders/${id}/pay`, { method: 'POST' });
      const resp = await openRazorpay(d.razorpay);
      const v = await api('/payments/verify', { method: 'POST', body: resp });
      setOrder(v.order);
      toast('Payment successful — thank you!');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const cancel = async () => {
    if (!confirm('Cancel this order?')) return;
    try {
      const d = await api(`/orders/${id}/cancel`, { method: 'POST' });
      setOrder(d.order);
      toast('Order cancelled', 'info');
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  if (!loading && !user) {
    return (
      <div className="container py-28 text-center">
        <p className="font-display text-3xl">Please log in to view this order</p>
        <Link href="/login" className="btn-primary mt-6">Log in</Link>
      </div>
    );
  }
  if (error) return <div className="container py-28 text-center font-display text-3xl">{error}</div>;
  if (!order) return <div className="flex justify-center py-32 text-maroon-700"><Spinner className="h-8 w-8" /></div>;

  const unpaid = order.payment_method === 'razorpay' && order.payment_status !== 'paid' && order.status !== 'cancelled';
  const stepIdx = STEPS.indexOf(order.status);

  return (
    <div className="container max-w-4xl py-12 lg:py-16">
      {placed && !unpaid && (
        <div className="mb-10 rounded-3xl border border-gold-200 bg-cream p-8 text-center">
          <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-600" />
          <h1 className="mt-4 font-display text-4xl font-semibold">Thank you for your order!</h1>
          <p className="mt-2 text-ink-soft">We have received your order and will send updates to {order.ship_email}.</p>
        </div>
      )}

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Order</p>
          <h2 className="mt-2 font-display text-3xl font-semibold">#{order.order_number}</h2>
          <p className="mt-1 text-sm text-ink-muted">Placed on {dateTime(order.created_at)}</p>
        </div>
        <div className="flex gap-2">
          <StatusBadge status={order.status} />
          <StatusBadge status={order.payment_status} />
        </div>
      </div>

      {unpaid && (
        <div className="mt-6 flex flex-col items-start justify-between gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-5 sm:flex-row sm:items-center">
          <p className="text-sm text-amber-800">Payment for this order is pending. Complete the payment to confirm your order.</p>
          <button onClick={retryPayment} disabled={busy} className="btn-primary btn-sm">{busy ? 'Opening…' : `Pay ${inr(order.total)}`}</button>
        </div>
      )}

      {order.status !== 'cancelled' && stepIdx >= 0 && (
        <ol className="mt-10 grid grid-cols-4">
          {STEPS.map((s, idx) => (
            <li key={s} className="relative flex flex-col items-center text-center">
              {idx > 0 && <span className={`absolute right-1/2 top-4 h-0.5 w-full ${idx <= stepIdx ? 'bg-maroon-600' : 'bg-gold-200'}`} />}
              <span className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${idx <= stepIdx ? 'bg-maroon-700 text-cream-light' : 'border border-gold-300 bg-white text-ink-muted'}`}>{idx + 1}</span>
              <span className="mt-2 text-xs capitalize text-ink-soft">{s}</span>
            </li>
          ))}
        </ol>
      )}
      {order.tracking_number && order.status !== 'cancelled' && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gold-200 bg-cream/60 px-5 py-4 text-sm">
          <p className="flex items-center gap-2">
            <Truck className="h-4 w-4 text-gold-600" />
            <span>
              {order.courier_name ? `${order.courier_name} · ` : ''}AWB <b>{order.tracking_number}</b>
              {order.shipment_status && <span className="capitalize text-ink-muted"> · {order.shipment_status.toLowerCase()}</span>}
            </span>
          </p>
          <a href={`https://shiprocket.co/tracking/${encodeURIComponent(order.tracking_number)}`} target="_blank" rel="noreferrer" className="btn-outline btn-sm">
            Track shipment
          </a>
        </div>
      )}

      <div className="mt-10 grid gap-6 md:grid-cols-[1fr_300px]">
        <div className="card divide-y divide-gold-100 px-6">
          {order.items.map((i) => (
            <div key={i.id} className="flex gap-4 py-5">
              <img src={img(i.image)} alt="" className="h-24 w-20 rounded-lg object-cover object-top" />
              <div className="flex-1">
                <p className="font-display text-lg text-maroon-900">{i.name}</p>
                <p className="text-xs text-ink-muted">Code {i.sku} · Qty {i.qty}</p>
              </div>
              <p className="font-medium">{inr(i.price * i.qty)}</p>
            </div>
          ))}
        </div>
        <div className="space-y-6">
          <div className="card p-6 text-sm">
            <h3 className="font-display text-xl">Summary</h3>
            <dl className="mt-4 space-y-2">
              <div className="flex justify-between"><dt className="text-ink-soft">Subtotal</dt><dd>{inr(order.subtotal)}</dd></div>
              {order.discount > 0 && <div className="flex justify-between text-emerald-700"><dt>Discount {order.coupon_code && `(${order.coupon_code})`}</dt><dd>− {inr(order.discount)}</dd></div>}
              <div className="flex justify-between"><dt className="text-ink-soft">Shipping</dt><dd>{order.shipping ? inr(order.shipping) : 'Free'}</dd></div>
              <div className="flex justify-between border-t border-gold-100 pt-2 font-semibold"><dt>Total</dt><dd>{inr(order.total)}</dd></div>
            </dl>
            <p className="mt-4 text-xs text-ink-muted">Paid via {order.payment_method === 'cod' ? 'Cash on Delivery' : 'Razorpay'}</p>
          </div>
          <div className="card p-6 text-sm">
            <h3 className="flex items-center gap-2 font-display text-xl"><Package className="h-5 w-5 text-gold-600" /> Shipping to</h3>
            <p className="mt-3 font-medium">{order.ship_name}</p>
            <p className="text-ink-soft">{order.ship_line1}{order.ship_line2 ? `, ${order.ship_line2}` : ''}</p>
            <p className="text-ink-soft">{order.ship_city}, {order.ship_state} – {order.ship_pincode}</p>
            <p className="mt-1 text-ink-muted">{order.ship_phone}</p>
          </div>
        </div>
      </div>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link href="/shop" className="btn-primary">Continue Shopping</Link>
        <Link href="/account?tab=orders" className="btn-outline">All Orders</Link>
        {['pending', 'confirmed'].includes(order.status) && <button onClick={cancel} className="btn-ghost text-rose-600">Cancel order</button>}
      </div>
    </div>
  );
}
