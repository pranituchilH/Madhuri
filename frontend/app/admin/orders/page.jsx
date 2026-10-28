'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingBag } from 'lucide-react';
import { api } from '@/lib/api';
import { dateTime, inr } from '@/lib/format';
import { useToast } from '@/context/ToastContext';
import StatusBadge from '@/components/ui/StatusBadge';
import useListQuery from '@/components/admin/useListQuery';
import { EmptyState, LoadingBlock, PageHeader, Pagination, SearchInput, Select, Table } from '@/components/admin/ui';

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  ...['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].map((s) => ({ value: s, label: s[0].toUpperCase() + s.slice(1) })),
];
const PAYMENT_OPTIONS = [
  { value: '', label: 'All payments' },
  ...['pending', 'paid', 'failed', 'refunded'].map((s) => ({ value: s, label: `Payment: ${s}` })),
];

function OrdersList() {
  const router = useRouter();
  const toast = useToast();
  const { params, set, qs } = useListQuery(['q', 'status', 'payment']);
  const [data, setData] = useState(null);

  useEffect(() => {
    let alive = true;
    setData(null);
    api(`/admin/orders?${qs}`)
      .then((d) => alive && setData(d))
      .catch((err) => {
        if (!alive) return;
        toast(err.message, 'error');
        setData({ orders: [], total: 0, page: 1, pages: 0 });
      });
    return () => {
      alive = false;
    };
  }, [qs, toast]);

  return (
    <>
      <PageHeader title="Orders" description="Track, update and fulfil customer orders" />

      <div className="card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-gold-100 p-4 md:flex-row md:items-center">
          <SearchInput className="md:flex-1" value={params.q} onChange={(q) => set({ q })} placeholder="Search order #, name, phone or email" />
          <div className="flex gap-2">
            <Select value={params.status} onChange={(status) => set({ status })} options={STATUS_OPTIONS} />
            <Select value={params.payment} onChange={(payment) => set({ payment })} options={PAYMENT_OPTIONS} />
          </div>
        </div>

        {!data ? (
          <LoadingBlock />
        ) : data.orders.length === 0 ? (
          <EmptyState icon={ShoppingBag} title="No orders found">
            {params.q || params.status || params.payment ? 'Try changing the filters.' : 'Orders will appear here once customers check out.'}
          </EmptyState>
        ) : (
          <>
            <Table head={['Order #', 'Customer', 'City', 'Items', 'Total', 'Payment', 'Status', 'Date']}>
              {data.orders.map((o) => (
                <tr key={o.id} onClick={() => router.push(`/admin/orders/${o.id}`)} className="cursor-pointer transition hover:bg-cream/50">
                  <td className="whitespace-nowrap px-4 py-3 font-medium text-maroon-700">{o.order_number}</td>
                  <td className="px-4 py-3">
                    <p className="text-ink">{o.ship_name}</p>
                    <p className="text-xs text-ink-muted">{o.ship_phone}</p>
                  </td>
                  <td className="px-4 py-3 text-ink-soft">{o.ship_city}</td>
                  <td className="px-4 py-3 text-ink-soft">{Number(o.item_count) || 0}</td>
                  <td className="whitespace-nowrap px-4 py-3 font-medium">{inr(o.total)}</td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span className="mr-1.5 text-xs uppercase text-ink-muted">{o.payment_method}</span>
                    <StatusBadge status={o.payment_status} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={o.status} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-ink-soft">{dateTime(o.created_at)}</td>
                </tr>
              ))}
            </Table>
            <Pagination page={data.page} pages={data.pages} total={data.total} onChange={(page) => set({ page })} />
          </>
        )}
      </div>
    </>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={<LoadingBlock />}>
      <OrdersList />
    </Suspense>
  );
}
