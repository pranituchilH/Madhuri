'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Boxes, Clock, IndianRupee, MessageSquare, Package, ShoppingBag, Star, TrendingUp, TriangleAlert, Users } from 'lucide-react';
import { api, img } from '@/lib/api';
import { dateTime, inr } from '@/lib/format';
import { useToast } from '@/context/ToastContext';
import StatusBadge from '@/components/ui/StatusBadge';
import StatCard from '@/components/admin/StatCard';
import RevenueChart from '@/components/admin/RevenueChart';
import { EmptyState, LoadingBlock, PageHeader } from '@/components/admin/ui';

const STATUS_ORDER = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
const STATUS_BAR = {
  pending: 'bg-amber-400',
  confirmed: 'bg-sky-500',
  processing: 'bg-indigo-500',
  shipped: 'bg-violet-500',
  delivered: 'bg-emerald-500',
  cancelled: 'bg-rose-400',
};

function Panel({ title, action, children, className = '' }) {
  return (
    <section className={`card overflow-hidden ${className}`}>
      <div className="flex items-center justify-between border-b border-gold-100 px-5 py-4">
        <h2 className="font-display text-xl font-semibold text-maroon-900">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function ViewAll({ href }) {
  return (
    <Link href={href} className="inline-flex items-center gap-1 text-xs font-medium text-maroon-700 hover:text-maroon-900">
      View all <ArrowRight className="h-3.5 w-3.5" />
    </Link>
  );
}

export default function AdminDashboard() {
  const toast = useToast();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api('/admin/stats')
      .then(setStats)
      .catch((err) => toast(err.message, 'error'));
  }, [toast]);

  if (!stats) {
    return (
      <>
        <PageHeader title="Dashboard" description="An overview of your store" />
        <LoadingBlock />
      </>
    );
  }

  const { totals, today, counts, salesByDay, statusBreakdown, topProducts, recentOrders, lowStock } = stats;
  const statusMap = Object.fromEntries(statusBreakdown.map((s) => [s.status, Number(s.count)]));
  const statusTotal = Object.values(statusMap).reduce((a, b) => a + b, 0);

  return (
    <>
      <PageHeader title="Dashboard" description={new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}>
        <Link href="/admin/products/new" className="btn-primary btn-sm">
          <Package className="h-4 w-4" /> Add product
        </Link>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total revenue" value={inr(totals.revenue)} sub={`${totals.paid_orders} paid orders`} icon={IndianRupee} tone="maroon" />
        <StatCard label="Today" value={inr(today.revenue)} sub={`${today.orders} order${Number(today.orders) === 1 ? '' : 's'} today`} icon={TrendingUp} tone="gold" />
        <StatCard label="Total orders" value={counts.orders} sub="All time" icon={ShoppingBag} tone="teal" href="/admin/orders" />
        <StatCard label="Open orders" value={counts.open_orders} sub="Pending · confirmed · processing" icon={Clock} tone="gold" href="/admin/orders" />
        <StatCard label="Customers" value={counts.customers} sub="Registered accounts" icon={Users} tone="peacock" href="/admin/customers" />
        <StatCard label="Active products" value={counts.products} sub="Visible in store" icon={Boxes} tone="maroon" href="/admin/products" />
        <StatCard label="Pending reviews" value={counts.pending_reviews} sub="Awaiting approval" icon={Star} tone="gold" href="/admin/reviews" />
        <StatCard label="Unread messages" value={counts.unread_messages} sub="Contact form" icon={MessageSquare} tone="teal" href="/admin/messages" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <section className="card p-5 xl:col-span-2">
          <RevenueChart data={salesByDay} />
        </section>

        <Panel title="Order status">
          <div className="space-y-4 px-5 py-5">
            {statusTotal === 0 ? (
              <p className="py-8 text-center text-sm text-ink-muted">No orders yet</p>
            ) : (
              STATUS_ORDER.map((s) => {
                const n = statusMap[s] || 0;
                const pct = statusTotal ? (n / statusTotal) * 100 : 0;
                return (
                  <Link key={s} href={`/admin/orders?status=${s}`} className="block">
                    <div className="mb-1.5 flex items-center justify-between text-sm">
                      <span className="capitalize text-ink">{s}</span>
                      <span className="text-ink-soft">
                        {n} <span className="text-xs text-ink-muted">({Math.round(pct)}%)</span>
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-cream-dark">
                      <div className={`h-full rounded-full ${STATUS_BAR[s]}`} style={{ width: `${pct}%` }} />
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </Panel>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Panel title="Recent orders" action={<ViewAll href="/admin/orders" />} className="xl:col-span-2">
          {recentOrders.length === 0 ? (
            <EmptyState icon={ShoppingBag} title="No orders yet" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead>
                  <tr className="bg-cream/60 text-[11px] uppercase tracking-wider text-ink-muted">
                    <th className="px-5 py-2.5 font-medium">Order</th>
                    <th className="px-3 py-2.5 font-medium">Customer</th>
                    <th className="px-3 py-2.5 font-medium">Total</th>
                    <th className="px-3 py-2.5 font-medium">Payment</th>
                    <th className="px-5 py-2.5 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gold-100/70">
                  {recentOrders.map((o) => (
                    <tr key={o.id} className="hover:bg-cream/40">
                      <td className="px-5 py-3">
                        <Link href={`/admin/orders/${o.id}`} className="font-medium text-maroon-700 hover:underline">
                          {o.order_number}
                        </Link>
                        <p className="text-xs text-ink-muted">{dateTime(o.created_at)}</p>
                      </td>
                      <td className="px-3 py-3 text-ink">{o.ship_name}</td>
                      <td className="px-3 py-3 font-medium">{inr(o.total)}</td>
                      <td className="px-3 py-3">
                        <span className="mr-1.5 text-xs uppercase text-ink-muted">{o.payment_method}</span>
                        <StatusBadge status={o.payment_status} />
                      </td>
                      <td className="px-5 py-3">
                        <StatusBadge status={o.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>

        <div className="space-y-6">
          <Panel title="Top products">
            {topProducts.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-ink-muted">No sales yet</p>
            ) : (
              <ul className="divide-y divide-gold-100/70">
                {topProducts.map((p, i) => (
                  <li key={`${p.product_id}-${i}`} className="flex items-center gap-3 px-5 py-3">
                    <span className="w-4 font-display text-lg text-gold-600">{i + 1}</span>
                    <img src={img(p.image)} alt="" className="h-12 w-10 shrink-0 rounded-md object-cover" />
                    <div className="min-w-0 flex-1">
                      {p.product_id ? (
                        <Link href={`/admin/products/${p.product_id}`} className="line-clamp-1 text-sm font-medium text-ink hover:text-maroon-700">
                          {p.name}
                        </Link>
                      ) : (
                        <p className="line-clamp-1 text-sm font-medium text-ink">{p.name}</p>
                      )}
                      <p className="text-xs text-ink-muted">
                        {p.units} sold · {inr(p.revenue)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="Low stock" action={<ViewAll href="/admin/products?status=low" />}>
            {lowStock.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-ink-muted">All products are well stocked</p>
            ) : (
              <ul className="divide-y divide-gold-100/70">
                {lowStock.map((p) => (
                  <li key={p.id}>
                    <Link href={`/admin/products/${p.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-cream/40">
                      <TriangleAlert className={`h-4 w-4 shrink-0 ${p.stock === 0 ? 'text-rose-600' : 'text-amber-500'}`} />
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-1 text-sm text-ink">{p.name}</p>
                        <p className="text-xs text-ink-muted">{p.sku}</p>
                      </div>
                      <span className={`text-sm font-semibold ${p.stock === 0 ? 'text-rose-600' : 'text-amber-600'}`}>{p.stock === 0 ? 'Out' : `${p.stock} left`}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>
    </>
  );
}
