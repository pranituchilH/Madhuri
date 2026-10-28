'use client';

import { Suspense, useEffect, useState } from 'react';
import { Users } from 'lucide-react';
import { api } from '@/lib/api';
import { date, inr } from '@/lib/format';
import { useToast } from '@/context/ToastContext';
import useListQuery from '@/components/admin/useListQuery';
import { EmptyState, LoadingBlock, PageHeader, Pagination, SearchInput, Table, Toggle } from '@/components/admin/ui';

function CustomersList() {
  const toast = useToast();
  const { params, set, qs } = useListQuery(['q']);
  const [data, setData] = useState(null);
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    let alive = true;
    setData(null);
    api(`/admin/customers?${qs}`)
      .then((d) => alive && setData(d))
      .catch((err) => {
        if (!alive) return;
        toast(err.message, 'error');
        setData({ customers: [], total: 0, page: 1, pages: 0 });
      });
    return () => {
      alive = false;
    };
  }, [qs, toast]);

  async function toggle(c) {
    if (c.is_active && !window.confirm(`Deactivate ${c.name}? They will no longer be able to sign in.`)) return;
    setBusyId(c.id);
    try {
      await api(`/admin/customers/${c.id}`, { method: 'PUT', body: { is_active: !c.is_active } });
      setData((d) => ({ ...d, customers: d.customers.map((x) => (x.id === c.id ? { ...x, is_active: c.is_active ? 0 : 1 } : x)) }));
      toast(c.is_active ? 'Customer deactivated' : 'Customer activated');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <PageHeader title="Customers" description="Registered shoppers and their lifetime value" />
      <div className="card overflow-hidden">
        <div className="border-b border-gold-100 p-4">
          <SearchInput className="md:max-w-md" value={params.q} onChange={(q) => set({ q })} placeholder="Search name, email or phone" />
        </div>
        {!data ? (
          <LoadingBlock />
        ) : data.customers.length === 0 ? (
          <EmptyState icon={Users} title="No customers found">
            {params.q ? 'Try a different search.' : 'Customers appear here once they register.'}
          </EmptyState>
        ) : (
          <>
            <Table head={['Customer', 'Phone', 'Orders', 'Spent', 'Last order', 'Joined', 'Active']}>
              {data.customers.map((c) => (
                <tr key={c.id} className={`transition hover:bg-cream/50 ${c.is_active ? '' : 'opacity-60'}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-maroon-50 font-display text-lg font-semibold text-maroon-700">
                        {(c.name || '?').charAt(0).toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <p className="font-medium text-ink">{c.name}</p>
                        <a href={`mailto:${c.email}`} className="text-xs text-ink-muted hover:text-maroon-700">
                          {c.email}
                        </a>
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-ink-soft">{c.phone || '—'}</td>
                  <td className="px-4 py-3 text-ink">{c.orders}</td>
                  <td className="whitespace-nowrap px-4 py-3 font-medium">{inr(c.spent)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-ink-soft">{c.last_order ? date(c.last_order) : '—'}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-ink-soft">{date(c.created_at)}</td>
                  <td className="px-4 py-3">
                    <Toggle checked={!!c.is_active} disabled={busyId === c.id} onChange={() => toggle(c)} label="Active" />
                  </td>
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

export default function CustomersPage() {
  return (
    <Suspense fallback={<LoadingBlock />}>
      <CustomersList />
    </Suspense>
  );
}
