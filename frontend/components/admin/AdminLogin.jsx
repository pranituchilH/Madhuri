'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Lock } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import Spinner from '@/components/ui/Spinner';

export default function AdminLogin() {
  const { user, login, logout } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(user ? 'You are signed in with a customer account. Please sign in with an admin account.' : '');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const u = await login(email.trim(), password);
      if (u?.role !== 'admin') {
        logout();
        setError('This account does not have admin access.');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="jaali-dark flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md animate-fade-up rounded-3xl border border-gold-500/30 bg-cream-light p-8 shadow-soft sm:p-10">
        <div className="mb-8 text-center">
          <img src="/brand/logo.png" alt="Madhuri Sarees" className="mx-auto mb-4 h-20 w-20 object-contain" />
          <p className="eyebrow">Admin panel</p>
          <h1 className="mt-2 font-display text-3xl font-semibold text-maroon-900">Welcome back</h1>
          <div className="gold-divider" />
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label" htmlFor="admin-email">
              Email
            </label>
            <input id="admin-email" type="email" required autoComplete="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="admin-password">
              Password
            </label>
            <input
              id="admin-password"
              type="password"
              required
              autoComplete="current-password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && <p className="rounded-xl bg-rose-50 px-4 py-2.5 text-sm text-rose-700">{error}</p>}
          <button type="submit" className="btn-primary w-full" disabled={busy}>
            {busy ? <Spinner className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
            Sign in
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-ink-muted">
          <Link href="/" className="hover:text-maroon-700">
            ← Back to the store
          </Link>
        </p>
      </div>
    </div>
  );
}
