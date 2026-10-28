'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

export default function AuthForm({ mode }) {
  const isLogin = mode === 'login';
  const { login, register } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const next = useSearchParams().get('next');
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const user = isLogin ? await login(form.email, form.password) : await register(form);
      toast(isLogin ? `Welcome back, ${user.name.split(' ')[0]}!` : 'Your account has been created');
      const safeNext = next && next.startsWith('/') && !next.startsWith('//') ? next : null;
      router.push(safeNext || (user.role === 'admin' ? '/admin' : '/account'));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-[80vh] lg:grid-cols-2">
      <div className="relative hidden lg:block">
        <img src="/brand/hero-1.jpg" alt="" className="absolute inset-0 h-full w-full object-cover object-right" />
        <div className="absolute inset-0 bg-gradient-to-r from-maroon-900/90 to-maroon-900/30" />
        <div className="relative flex h-full flex-col justify-end p-14">
          <p className="eyebrow text-gold-300">Madhuri Sarees</p>
          <p className="mt-3 max-w-md font-display text-5xl italic leading-tight text-cream-light">Elegance woven in every thread.</p>
        </div>
      </div>
      <div className="jaali flex items-center justify-center px-4 py-16">
        <form onSubmit={submit} className="w-full max-w-md rounded-3xl border border-gold-200 bg-white p-8 shadow-soft sm:p-10">
          <h1 className="text-center font-display text-4xl font-semibold">{isLogin ? 'Welcome Back' : 'Create Account'}</h1>
          <div className="gold-divider" />
          <p className="text-center text-sm text-ink-soft">{isLogin ? 'Log in to track orders and checkout faster.' : 'Join us for faster checkout, order tracking and wishlists.'}</p>

          {error && <p className="mt-6 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}

          <div className="mt-6 space-y-4">
            {!isLogin && (
              <div>
                <label className="label" htmlFor="name">Full name</label>
                <input id="name" required className="input" value={form.name} onChange={set('name')} autoComplete="name" />
              </div>
            )}
            <div>
              <label className="label" htmlFor="email">Email</label>
              <input id="email" type="email" required className="input" value={form.email} onChange={set('email')} autoComplete="email" />
            </div>
            {!isLogin && (
              <div>
                <label className="label" htmlFor="phone">Mobile (optional)</label>
                <input id="phone" className="input" value={form.phone} onChange={set('phone')} inputMode="numeric" maxLength={10} autoComplete="tel-national" />
              </div>
            )}
            <div>
              <label className="label" htmlFor="password">Password</label>
              <input id="password" type="password" required minLength={6} className="input" value={form.password} onChange={set('password')} autoComplete={isLogin ? 'current-password' : 'new-password'} />
            </div>
          </div>

          <button disabled={busy} className="btn-primary mt-8 w-full py-3.5">{busy ? 'Please wait…' : isLogin ? 'Log In' : 'Create Account'}</button>

          <p className="mt-6 text-center text-sm text-ink-soft">
            {isLogin ? 'New to Madhuri Sarees? ' : 'Already have an account? '}
            <Link href={`${isLogin ? '/register' : '/login'}${next ? `?next=${encodeURIComponent(next)}` : ''}`} className="font-medium text-maroon-700 underline-offset-4 hover:underline">
              {isLogin ? 'Create an account' : 'Log in'}
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
