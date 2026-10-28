'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { useToast } from '@/context/ToastContext';

export default function NewsletterForm({ dark = false }) {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const d = await api('/newsletter', { method: 'POST', body: { email } });
      toast(d.message);
      setEmail('');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="flex w-full flex-col gap-3 sm:flex-row">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Your email address"
        aria-label="Email address"
        className={`flex-1 rounded-full px-5 py-3.5 text-sm outline-none ${dark ? 'border border-gold-500/40 bg-white/5 text-cream-light placeholder:text-cream/50 focus:border-gold-400' : 'input'}`}
      />
      <button disabled={busy} className="btn-gold px-8">{busy ? 'Subscribing…' : 'Subscribe'}</button>
    </form>
  );
}
