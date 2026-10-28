'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { useToast } from '@/context/ToastContext';

const EMPTY = { name: '', email: '', phone: '', subject: '', message: '' };

export default function ContactForm() {
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState('');
  const toast = useToast();
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const d = await api('/contact', { method: 'POST', body: form });
      setSent(d.message);
      setForm(EMPTY);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  if (sent) {
    return (
      <div className="card flex flex-col items-center justify-center p-10 text-center">
        <p className="font-display text-3xl text-maroon-900">Message sent ✦</p>
        <p className="mt-2 text-ink-soft">{sent}</p>
        <button onClick={() => setSent('')} className="btn-outline mt-6">Send another</button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="card grid gap-4 p-6 sm:grid-cols-2 sm:p-8">
      <h2 className="font-display text-3xl sm:col-span-2">Send us a message</h2>
      <div><label className="label" htmlFor="c-name">Name</label><input id="c-name" required className="input" value={form.name} onChange={set('name')} /></div>
      <div><label className="label" htmlFor="c-email">Email</label><input id="c-email" type="email" required className="input" value={form.email} onChange={set('email')} /></div>
      <div><label className="label" htmlFor="c-phone">Phone</label><input id="c-phone" className="input" value={form.phone} onChange={set('phone')} /></div>
      <div><label className="label" htmlFor="c-subject">Subject</label><input id="c-subject" className="input" value={form.subject} onChange={set('subject')} /></div>
      <div className="sm:col-span-2"><label className="label" htmlFor="c-msg">Message</label><textarea id="c-msg" required rows={5} className="input" value={form.message} onChange={set('message')} /></div>
      <button disabled={busy} className="btn-primary sm:col-span-2 sm:justify-self-start">{busy ? 'Sending…' : 'Send Message'}</button>
    </form>
  );
}
