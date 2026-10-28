'use client';

import { useCallback, useEffect, useState } from 'react';
import { Mail, MailOpen, MessageSquare, Phone, Reply, Trash } from 'lucide-react';
import { api } from '@/lib/api';
import { dateTime } from '@/lib/format';
import { useToast } from '@/context/ToastContext';
import { EmptyState, LoadingBlock, PageHeader, Pill } from '@/components/admin/ui';

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'unread', label: 'Unread' },
  { value: 'read', label: 'Read' },
];

export default function MessagesPage() {
  const toast = useToast();
  const [messages, setMessages] = useState(null);
  const [filter, setFilter] = useState('all');
  const [openId, setOpenId] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(
    () =>
      api('/admin/messages')
        .then((d) => setMessages(d.messages))
        .catch((err) => {
          toast(err.message, 'error');
          setMessages([]);
        }),
    [toast],
  );

  useEffect(() => {
    load();
  }, [load]);

  async function setRead(m, isRead, silent) {
    setBusyId(m.id);
    try {
      await api(`/admin/messages/${m.id}`, { method: 'PUT', body: { is_read: isRead } });
      setMessages((list) => list.map((x) => (x.id === m.id ? { ...x, is_read: isRead ? 1 : 0 } : x)));
      if (!silent) toast(isRead ? 'Marked as read' : 'Marked as unread');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusyId(null);
    }
  }

  async function remove(m) {
    if (!window.confirm(`Delete the message from ${m.name}?`)) return;
    setBusyId(m.id);
    try {
      await api(`/admin/messages/${m.id}`, { method: 'DELETE' });
      setMessages((list) => list.filter((x) => x.id !== m.id));
      toast('Message deleted');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusyId(null);
    }
  }

  function toggleOpen(m) {
    const next = openId === m.id ? null : m.id;
    setOpenId(next);
    if (next && !m.is_read) setRead(m, true, true);
  }

  const unread = messages?.filter((m) => !m.is_read).length || 0;
  const shown = (messages || []).filter((m) => (filter === 'unread' ? !m.is_read : filter === 'read' ? !!m.is_read : true));

  return (
    <>
      <PageHeader title="Messages" description={messages ? `${messages.length} message${messages.length === 1 ? '' : 's'} · ${unread} unread` : 'Contact form enquiries'} />

      <div className="mb-4 inline-flex rounded-full border border-gold-200 bg-white p-1">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`rounded-full px-4 py-1.5 text-sm transition ${filter === f.value ? 'bg-maroon-700 text-cream-light' : 'text-ink-soft hover:text-maroon-700'}`}
          >
            {f.label}
            {f.value === 'unread' && unread > 0 && <span className="ml-1.5 text-xs opacity-80">({unread})</span>}
          </button>
        ))}
      </div>

      <div className="card overflow-hidden">
        {!messages ? (
          <LoadingBlock />
        ) : shown.length === 0 ? (
          <EmptyState icon={MessageSquare} title="No messages">
            {filter === 'unread' ? 'You have read everything.' : 'Enquiries from the contact page will appear here.'}
          </EmptyState>
        ) : (
          <ul className="divide-y divide-gold-100/70">
            {shown.map((m) => {
              const open = openId === m.id;
              const subject = m.subject || 'Enquiry from Madhuri Sarees';
              return (
                <li key={m.id} className={m.is_read ? '' : 'bg-gold-50/40'}>
                  <button onClick={() => toggleOpen(m)} className="flex w-full items-start gap-3 px-5 py-4 text-left transition hover:bg-cream/50">
                    <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${m.is_read ? 'bg-transparent' : 'bg-maroon-600'}`} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                        <p className={`text-sm ${m.is_read ? 'text-ink' : 'font-semibold text-maroon-900'}`}>{m.name}</p>
                        <p className="text-xs text-ink-muted">{dateTime(m.created_at)}</p>
                      </div>
                      <p className={`text-sm ${m.is_read ? 'text-ink-soft' : 'font-medium text-ink'}`}>{m.subject || '(no subject)'}</p>
                      {!open && <p className="line-clamp-1 text-xs text-ink-muted">{m.message}</p>}
                    </div>
                  </button>

                  {open && (
                    <div className="px-5 pb-5 pl-10">
                      <div className="mb-3 flex flex-wrap gap-3 text-xs text-ink-soft">
                        <span className="inline-flex items-center gap-1">
                          <Mail className="h-3.5 w-3.5" /> {m.email}
                        </span>
                        {m.phone && (
                          <a href={`tel:${m.phone}`} className="inline-flex items-center gap-1 hover:text-maroon-700">
                            <Phone className="h-3.5 w-3.5" /> {m.phone}
                          </a>
                        )}
                        {m.is_read ? <Pill>Read</Pill> : <Pill tone="maroon">Unread</Pill>}
                      </div>
                      <p className="whitespace-pre-line rounded-xl bg-cream-light p-4 text-sm text-ink">{m.message}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <a
                          href={`mailto:${m.email}?subject=${encodeURIComponent(`Re: ${subject}`)}&body=${encodeURIComponent(`Dear ${m.name},\n\n\n\nWarm regards,\nMadhuri Sarees`)}`}
                          className="btn-primary btn-sm"
                        >
                          <Reply className="h-4 w-4" /> Reply by email
                        </a>
                        <button className="btn-outline btn-sm" disabled={busyId === m.id} onClick={() => setRead(m, !m.is_read)}>
                          {m.is_read ? <Mail className="h-4 w-4" /> : <MailOpen className="h-4 w-4" />}
                          {m.is_read ? 'Mark unread' : 'Mark read'}
                        </button>
                        <button className="btn btn-sm text-rose-600 hover:bg-rose-50" disabled={busyId === m.id} onClick={() => remove(m)}>
                          <Trash className="h-4 w-4" /> Delete
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}
