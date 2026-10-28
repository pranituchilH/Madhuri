'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, CreditCard, ExternalLink, FileDown, MapPin, Package, Printer, RefreshCw, Save, Truck, User, XCircle } from 'lucide-react';
import { api, img } from '@/lib/api';
import { dateTime, inr } from '@/lib/format';
import { useToast } from '@/context/ToastContext';
import StatusBadge from '@/components/ui/StatusBadge';
import Spinner from '@/components/ui/Spinner';
import { EmptyState, Field, LoadingBlock } from '@/components/admin/ui';

const STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
const PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'refunded'];

function InfoCard({ icon: Icon, title, children }) {
  return (
    <section className="card p-5 print:rounded-none print:border-0 print:p-0 print:shadow-none">
      <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-semibold text-maroon-900">
        <Icon className="h-4 w-4 text-gold-600 print:hidden" />
        {title}
      </h2>
      <div className="space-y-1 text-sm text-ink-soft">{children}</div>
    </section>
  );
}

function Row({ label, children, strong }) {
  return (
    <div className={`flex justify-between gap-4 ${strong ? 'border-t border-gold-200 pt-3 text-base font-semibold text-maroon-900' : 'text-ink-soft'}`}>
      <span>{label}</span>
      <span className={strong ? '' : 'text-ink'}>{children}</span>
    </div>
  );
}

function ShiprocketCard({ order, busy, onAction }) {
  const shipped = ['shipped', 'delivered'].includes(order.status);
  const canShip = ['confirmed', 'processing'].includes(order.status) && (order.payment_method === 'cod' || order.payment_status === 'paid');
  const complete = order.tracking_number && order.label_url;
  const btn = (action, Icon, label, cls = 'btn-outline') => (
    <button type="button" onClick={() => onAction(action)} disabled={Boolean(busy)} className={`${cls} btn-sm w-full`}>
      {busy === action ? <Spinner className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
      {label}
    </button>
  );

  return (
    <section className="card space-y-3 p-5 print:hidden">
      <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-maroon-900">
        <Package className="h-4 w-4 text-gold-600" /> Shiprocket
      </h2>
      {order.shiprocket_shipment_id ? (
        <div className="space-y-1 text-sm text-ink-soft">
          {order.courier_name && <Row label="Courier">{order.courier_name}</Row>}
          {order.tracking_number && <Row label="AWB"><span className="font-mono text-xs">{order.tracking_number}</span></Row>}
          {order.shipment_status && <Row label="Status"><span className="capitalize">{order.shipment_status.toLowerCase()}</span></Row>}
          <Row label="Shipment ID"><span className="font-mono text-xs">{order.shiprocket_shipment_id}</span></Row>
        </div>
      ) : (
        <p className="text-sm text-ink-soft">
          {canShip ? 'Creates the shipment, assigns the recommended courier, schedules pickup and generates the label.' : 'Available once the order is confirmed and paid (or COD).'}
        </p>
      )}
      <div className="space-y-2">
        {canShip && !complete && btn('ship', Truck, order.shiprocket_shipment_id ? 'Resume shipping' : 'Ship with Shiprocket', 'btn-primary')}
        {order.label_url && (
          <a href={order.label_url} target="_blank" rel="noreferrer" className="btn-outline btn-sm w-full">
            <FileDown className="h-4 w-4" /> Download label
          </a>
        )}
        {order.tracking_number && (
          <a href={`https://shiprocket.co/tracking/${encodeURIComponent(order.tracking_number)}`} target="_blank" rel="noreferrer" className="btn-outline btn-sm w-full">
            <ExternalLink className="h-4 w-4" /> Tracking page
          </a>
        )}
        {order.tracking_number && btn('track', RefreshCw, 'Refresh tracking')}
        {order.shiprocket_order_id && !shipped && order.status !== 'cancelled' && btn('cancel', XCircle, 'Cancel shipment', 'btn-ghost text-red-700')}
      </div>
    </section>
  );
}

export default function OrderDetailPage() {
  const { id } = useParams();
  const toast = useToast();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ status: '', payment_status: '', tracking_number: '' });
  const [saving, setSaving] = useState(false);
  const [shipBusy, setShipBusy] = useState('');

  function hydrate(o) {
    setOrder(o);
    setForm({ status: o.status, payment_status: o.payment_status, tracking_number: o.tracking_number || '' });
  }

  useEffect(() => {
    api(`/admin/orders/${id}`)
      .then((d) => hydrate(d.order))
      .catch((err) => {
        setError(err.message);
        toast(err.message, 'error');
      });
  }, [id, toast]);

  async function save(e) {
    e.preventDefault();
    if (form.status === 'cancelled' && order.status !== 'cancelled' && !window.confirm('Cancel this order? Reserved stock will be released.')) return;
    setSaving(true);
    try {
      const d = await api(`/admin/orders/${id}`, { method: 'PUT', body: form });
      hydrate({ ...d.order, customer: order.customer });
      toast('Order updated');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  async function shiprocket(action) {
    if (action === 'cancel' && !window.confirm('Cancel this Shiprocket shipment? The order stays open so you can ship it again.')) return;
    setShipBusy(action);
    try {
      const path = action === 'ship' ? '' : `/${action}`;
      const d = await api(`/admin/orders/${id}/shiprocket${path}`, { method: 'POST' });
      hydrate({ ...d.order, customer: order.customer });
      toast({ ship: 'Shipment created and pickup scheduled', track: 'Tracking refreshed', cancel: 'Shipment cancelled' }[action]);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setShipBusy('');
    }
  }

  if (error) {
    return (
      <div className="card">
        <EmptyState title="Order not available">
          {error}{' '}
          <Link href="/admin/orders" className="text-maroon-700 underline">
            Back to orders
          </Link>
        </EmptyState>
      </div>
    );
  }
  if (!order) return <LoadingBlock />;

  const dirty = form.status !== order.status || form.payment_status !== order.payment_status || form.tracking_number !== (order.tracking_number || '');

  return (
    <div className="print:text-black">
      {/* Screen header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between print:hidden">
        <div>
          <Link href="/admin/orders" className="mb-2 inline-flex items-center gap-1 text-xs font-medium text-ink-muted hover:text-maroon-700">
            <ArrowLeft className="h-3.5 w-3.5" /> All orders
          </Link>
          <h1 className="flex flex-wrap items-center gap-3 font-display text-3xl font-semibold text-maroon-900">
            {order.order_number}
            <StatusBadge status={order.status} />
          </h1>
          <p className="mt-1 text-sm text-ink-soft">Placed {dateTime(order.created_at)}</p>
        </div>
        <button onClick={() => window.print()} className="btn-outline btn-sm">
          <Printer className="h-4 w-4" /> Print invoice
        </button>
      </div>

      {/* Print-only invoice header */}
      <div className="mb-8 hidden items-start justify-between border-b-2 border-maroon-700 pb-6 print:flex">
        <div className="flex items-center gap-3">
          <img src="/brand/logo.png" alt="" className="h-16 w-16 object-contain" />
          <div>
            <p className="font-display text-2xl font-semibold text-maroon-900">Madhuri Sarees</p>
            <p className="text-xs text-ink-soft">Elegance woven in every thread</p>
          </div>
        </div>
        <div className="text-right text-sm">
          <p className="font-display text-2xl font-semibold text-maroon-900">Invoice</p>
          <p>Order {order.order_number}</p>
          <p>{dateTime(order.created_at)}</p>
          <p className="capitalize">
            Payment: {order.payment_method === 'cod' ? 'Cash on delivery' : 'Online'} ({order.payment_status})
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 print:block">
        <div className="space-y-6 lg:col-span-2 print:space-y-8">
          {/* Items */}
          <section className="card overflow-hidden print:rounded-none print:border-0 print:shadow-none">
            <h2 className="border-b border-gold-100 px-5 py-4 font-display text-lg font-semibold text-maroon-900 print:px-0">
              Items ({order.items.reduce((s, i) => s + i.qty, 0)})
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead>
                  <tr className="bg-cream/60 text-[11px] uppercase tracking-wider text-ink-muted print:bg-transparent">
                    <th className="px-5 py-2.5 font-medium print:px-0">Product</th>
                    <th className="px-3 py-2.5 text-right font-medium">Price</th>
                    <th className="px-3 py-2.5 text-right font-medium">Qty</th>
                    <th className="px-5 py-2.5 text-right font-medium print:px-0">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gold-100/70">
                  {order.items.map((it) => (
                    <tr key={it.id}>
                      <td className="px-5 py-3 print:px-0">
                        <div className="flex items-center gap-3">
                          <img src={img(it.image)} alt="" className="h-14 w-11 shrink-0 rounded-md object-cover print:hidden" />
                          <div>
                            {it.product_id ? (
                              <Link href={`/admin/products/${it.product_id}`} className="font-medium text-ink hover:text-maroon-700">
                                {it.name}
                              </Link>
                            ) : (
                              <p className="font-medium text-ink">{it.name}</p>
                            )}
                            {it.sku && <p className="text-xs text-ink-muted">SKU {it.sku}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-right">{inr(it.price)}</td>
                      <td className="px-3 py-3 text-right">{it.qty}</td>
                      <td className="px-5 py-3 text-right font-medium print:px-0">{inr(Number(it.price) * it.qty)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="ml-auto max-w-sm space-y-2 border-t border-gold-100 px-5 py-4 text-sm print:px-0">
              <Row label="Subtotal">{inr(order.subtotal)}</Row>
              {Number(order.discount) > 0 && (
                <Row label={`Discount${order.coupon_code ? ` (${order.coupon_code})` : ''}`}>
                  <span className="text-emerald-700">− {inr(order.discount)}</span>
                </Row>
              )}
              <Row label="Shipping">{Number(order.shipping) > 0 ? inr(order.shipping) : 'Free'}</Row>
              <Row label="Total" strong>
                {inr(order.total)}
              </Row>
            </div>
          </section>

          {order.notes && (
            <section className="card p-5 print:border-0 print:p-0 print:shadow-none">
              <h2 className="mb-2 font-display text-lg font-semibold text-maroon-900">Customer notes</h2>
              <p className="whitespace-pre-line text-sm text-ink-soft">{order.notes}</p>
            </section>
          )}
        </div>

        <div className="space-y-6 print:mt-8 print:grid print:grid-cols-2 print:gap-8 print:space-y-0">
          {/* Update controls */}
          <form onSubmit={save} className="card space-y-4 p-5 print:hidden">
            <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-maroon-900">
              <Truck className="h-4 w-4 text-gold-600" /> Fulfilment
            </h2>
            <Field label="Order status">
              <select className="input capitalize" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Payment status">
              <select className="input capitalize" value={form.payment_status} onChange={(e) => setForm({ ...form, payment_status: e.target.value })}>
                {PAYMENT_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Tracking number">
              <input
                className="input"
                value={form.tracking_number}
                placeholder="e.g. Delhivery AWB"
                onChange={(e) => setForm({ ...form, tracking_number: e.target.value })}
              />
            </Field>
            <button type="submit" className="btn-primary w-full" disabled={saving || !dirty}>
              {saving ? <Spinner className="h-4 w-4" /> : <Save className="h-4 w-4" />}
              Save changes
            </button>
          </form>

          <ShiprocketCard order={order} busy={shipBusy} onAction={shiprocket} />

          <InfoCard icon={MapPin} title="Ship to">
            <p className="font-medium text-ink">{order.ship_name}</p>
            <p>{order.ship_line1}</p>
            {order.ship_line2 && <p>{order.ship_line2}</p>}
            <p>
              {order.ship_city}, {order.ship_state} – {order.ship_pincode}
            </p>
            <p className="pt-1">{order.ship_phone}</p>
            {order.ship_email && <p>{order.ship_email}</p>}
            {order.tracking_number && <p className="pt-1 text-ink">Tracking: {order.tracking_number}</p>}
          </InfoCard>

          <InfoCard icon={User} title="Customer">
            {order.customer ? (
              <>
                <p className="font-medium text-ink">{order.customer.name}</p>
                <p>
                  <a href={`mailto:${order.customer.email}`} className="hover:text-maroon-700">
                    {order.customer.email}
                  </a>
                </p>
                {order.customer.phone && <p>{order.customer.phone}</p>}
              </>
            ) : (
              <p>Guest checkout</p>
            )}
          </InfoCard>

          <InfoCard icon={CreditCard} title="Payment">
            <div className="flex items-center justify-between">
              <span>Method</span>
              <span className="text-ink">{order.payment_method === 'cod' ? 'Cash on delivery' : 'Razorpay'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Status</span>
              <StatusBadge status={order.payment_status} />
            </div>
            {order.razorpay_order_id && (
              <div className="pt-1">
                <p className="text-xs text-ink-muted">Razorpay order ID</p>
                <p className="break-all font-mono text-xs text-ink">{order.razorpay_order_id}</p>
              </div>
            )}
            {order.razorpay_payment_id && (
              <div className="pt-1">
                <p className="text-xs text-ink-muted">Razorpay payment ID</p>
                <p className="break-all font-mono text-xs text-ink">{order.razorpay_payment_id}</p>
              </div>
            )}
          </InfoCard>
        </div>
      </div>

      <p className="mt-10 hidden border-t border-gold-200 pt-4 text-center text-xs text-ink-soft print:block">Thank you for shopping with Madhuri Sarees.</p>
    </div>
  );
}
