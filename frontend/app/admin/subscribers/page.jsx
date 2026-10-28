'use client';

import { useEffect, useMemo, useState } from 'react';
import { Download, Newspaper } from 'lucide-react';
import { api } from '@/lib/api';
import { dateTime } from '@/lib/format';
import { useToast } from '@/context/ToastContext';
import { EmptyState, LoadingBlock, PageHeader, SearchInput, Table } from '@/components/admin/ui';

const csvCell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;

export default function SubscribersPage() {
  const toast = useToast();
  const [subscribers, setSubscribers] = useState(null);
  const [q, setQ] = useState('');

  useEffect(() => {
    api('/admin/subscribers')
      .then((d) => setSubscribers(d.subscribers))
      .catch((err) => {
        toast(err.message, 'error');
        setSubscribers([]);
      });
  }, [toast]);

  const shown = useMemo(() => (subscribers || []).filter((s) => s.email.toLowerCase().includes(q.toLowerCase())), [subscribers, q]);

  function exportCsv() {
    const rows = [['Email', 'Subscribed at'], ...shown.map((s) => [s.email, new Date(s.created_at).toISOString()])];
    const csv = `﻿${rows.map((r) => r.map(csvCell).join(',')).join('\r\n')}`;
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `madhuri-subscribers-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast(`Exported ${shown.length} subscriber${shown.length === 1 ? '' : 's'}`);
  }

  return (
    <>
      <PageHeader title="Subscribers" description={subscribers ? `${subscribers.length} newsletter subscriber${subscribers.length === 1 ? '' : 's'}` : 'Newsletter sign-ups'}>
        <button className="btn-primary btn-sm" onClick={exportCsv} disabled={!shown.length}>
          <Download className="h-4 w-4" /> Export CSV
        </button>
      </PageHeader>

      <div className="card overflow-hidden">
        <div className="border-b border-gold-100 p-4">
          <SearchInput className="md:max-w-md" value={q} onChange={setQ} placeholder="Filter by email" />
        </div>
        {!subscribers ? (
          <LoadingBlock />
        ) : shown.length === 0 ? (
          <EmptyState icon={Newspaper} title="No subscribers">
            {q ? 'No emails match your filter.' : 'Sign-ups from the newsletter form will appear here.'}
          </EmptyState>
        ) : (
          <Table head={['#', 'Email', 'Subscribed']}>
            {shown.map((s, i) => (
              <tr key={s.id} className="hover:bg-cream/50">
                <td className="w-16 px-4 py-3 text-xs text-ink-muted">{i + 1}</td>
                <td className="px-4 py-3">
                  <a href={`mailto:${s.email}`} className="text-ink hover:text-maroon-700">
                    {s.email}
                  </a>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-xs text-ink-soft">{dateTime(s.created_at)}</td>
              </tr>
            ))}
          </Table>
        )}
      </div>
    </>
  );
}
