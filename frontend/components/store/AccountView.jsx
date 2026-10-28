'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Heart, LogOut, MapPin, Package, Pencil, Trash, User } from 'lucide-react';
import Spinner from '@/components/ui/Spinner';
import StatusBadge from '@/components/ui/StatusBadge';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { api, img } from '@/lib/api';
import { date, inr } from '@/lib/format';
import AddressFields, { EMPTY_ADDRESS } from './AddressFields';
import ProductCard from './ProductCard';

const TABS = [
  ['orders', 'My Orders', Package],
  ['wishlist', 'Wishlist', Heart],
  ['addresses', 'Addresses', MapPin],
  ['profile', 'Profile', User],
];

export default function AccountView() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const tab = useSearchParams().get('tab') || 'orders';

  useEffect(() => {
    if (!loading && !user) router.replace(`/login?next=${encodeURIComponent('/account')}`);
  }, [loading, user, router]);

  if (loading || !user) return <div className="flex justify-center py-32 text-maroon-700"><Spinner className="h-8 w-8" /></div>;

  return (
    <div className="container py-12 lg:py-16">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">My Account</p>
          <h1 className="mt-2 font-display text-4xl font-semibold sm:text-5xl">Namaste, {user.name.split(' ')[0]}</h1>
        </div>
        {user.role === 'admin' && <Link href="/admin" className="btn-gold btn-sm">Open Admin Panel</Link>}
      </div>
      <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-[240px_minmax(0,1fr)]">
        <nav className="no-scrollbar flex gap-2 overflow-x-auto lg:flex-col">
          {TABS.map(([k, label, Icon]) => (
            <Link key={k} href={`${pathname}?tab=${k}`} scroll={false}
              className={`flex shrink-0 items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${tab === k ? 'bg-maroon-700 text-cream-light' : 'text-ink-soft hover:bg-maroon-50'}`}>
              <Icon className="h-4 w-4" /> {label}
            </Link>
          ))}
          <button onClick={() => { logout(); router.push('/'); }} className="flex shrink-0 items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium text-ink-soft hover:bg-maroon-50">
            <LogOut className="h-4 w-4" /> Log out
          </button>
        </nav>
        <div>
          {tab === 'orders' && <Orders />}
          {tab === 'wishlist' && <Wishlist />}
          {tab === 'addresses' && <Addresses />}
          {tab === 'profile' && <Profile />}
        </div>
      </div>
    </div>
  );
}

function Empty({ title, text, cta = true }) {
  return (
    <div className="rounded-3xl border border-dashed border-gold-300 bg-cream py-16 text-center">
      <p className="font-display text-3xl">{title}</p>
      <p className="mt-2 text-sm text-ink-soft">{text}</p>
      {cta && <Link href="/shop" className="btn-primary mt-6">Explore Sarees</Link>}
    </div>
  );
}

function Orders() {
  const [orders, setOrders] = useState(null);
  useEffect(() => {
    api('/orders?limit=50').then((d) => setOrders(d.orders)).catch(() => setOrders([]));
  }, []);
  if (!orders) return <Spinner className="h-6 w-6 text-maroon-700" />;
  if (!orders.length) return <Empty title="No orders yet" text="When you place an order it will appear here." />;
  return (
    <ul className="space-y-4">
      {orders.map((o) => (
        <li key={o.id}>
          <Link href={`/order/${o.id}`} className="card flex items-center gap-3 p-4 transition sm:gap-4 hover:shadow-soft sm:p-5">
            <img src={img(o.image)} alt="" className="h-20 w-16 shrink-0 rounded-lg object-cover object-top" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-display text-lg text-maroon-900 sm:text-xl">#{o.order_number}</p>
              <p className="text-xs text-ink-muted">{date(o.created_at)} · {o.item_count} item{o.item_count > 1 ? 's' : ''}</p>
              <div className="mt-2 flex flex-wrap gap-2"><StatusBadge status={o.status} /><StatusBadge status={o.payment_status} /></div>
            </div>
            <p className="shrink-0 font-display text-xl font-semibold text-maroon-800 sm:text-2xl">{inr(o.total)}</p>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function Wishlist() {
  const [products, setProducts] = useState(null);
  useEffect(() => {
    api('/account/wishlist').then((d) => setProducts(d.products)).catch(() => setProducts([]));
  }, []);
  if (!products) return <Spinner className="h-6 w-6 text-maroon-700" />;
  if (!products.length) return <Empty title="Your wishlist is empty" text="Tap the heart on any saree to save it for later." />;
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3">
      {products.map((p) => <ProductCard key={p.id} product={p} />)}
    </div>
  );
}

function Addresses() {
  const toast = useToast();
  const [list, setList] = useState(null);
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = () => api('/account/addresses').then((d) => setList(d.addresses));
  useEffect(() => {
    load().catch(() => setList([]));
  }, []);

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (editing.id) await api(`/account/addresses/${editing.id}`, { method: 'PUT', body: editing });
      else await api('/account/addresses', { method: 'POST', body: editing });
      await load();
      setEditing(null);
      toast('Address saved');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const del = async (id) => {
    if (!confirm('Delete this address?')) return;
    await api(`/account/addresses/${id}`, { method: 'DELETE' });
    load();
  };

  if (!list) return <Spinner className="h-6 w-6 text-maroon-700" />;
  if (editing) {
    return (
      <form onSubmit={save} className="card p-6 sm:p-8">
        <h2 className="mb-6 font-display text-2xl">{editing.id ? 'Edit address' : 'New address'}</h2>
        <AddressFields value={editing} onChange={setEditing} />
        <label className="mt-4 flex items-center gap-2 text-sm text-ink-soft">
          <input type="checkbox" checked={!!editing.is_default} onChange={(e) => setEditing({ ...editing, is_default: e.target.checked })} className="accent-maroon-700" />
          Make this my default address
        </label>
        <div className="mt-6 flex gap-3">
          <button disabled={busy} className="btn-primary">{busy ? 'Saving…' : 'Save address'}</button>
          <button type="button" onClick={() => setEditing(null)} className="btn-ghost">Cancel</button>
        </div>
      </form>
    );
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {list.map((a) => (
        <div key={a.id} className="card p-5 text-sm">
          <div className="flex items-start justify-between">
            <p className="font-medium text-maroon-900">{a.name}</p>
            {a.is_default ? <span className="rounded-full bg-gold-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-gold-800">Default</span> : null}
          </div>
          <p className="mt-2 text-ink-soft">{a.line1}{a.line2 ? `, ${a.line2}` : ''}</p>
          <p className="text-ink-soft">{a.city}, {a.state} – {a.pincode}</p>
          <p className="mt-1 text-ink-muted">{a.phone}</p>
          <div className="mt-4 flex gap-2">
            <button onClick={() => setEditing(a)} className="btn-ghost btn-sm"><Pencil className="h-3.5 w-3.5" /> Edit</button>
            <button onClick={() => del(a.id)} className="btn-ghost btn-sm text-rose-600 hover:bg-rose-50"><Trash className="h-3.5 w-3.5" /> Delete</button>
          </div>
        </div>
      ))}
      <button onClick={() => setEditing({ ...EMPTY_ADDRESS })} className="flex min-h-40 items-center justify-center rounded-2xl border-2 border-dashed border-gold-300 text-sm font-medium text-maroon-700 hover:border-maroon-500">
        + Add new address
      </button>
    </div>
  );
}

function Profile() {
  const { user, setUser } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({ name: user.name, phone: user.phone || '' });
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '' });

  const saveProfile = async (e) => {
    e.preventDefault();
    try {
      const d = await api('/auth/me', { method: 'PUT', body: form });
      setUser(d.user);
      toast('Profile updated');
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    try {
      await api('/auth/password', { method: 'PUT', body: pw });
      setPw({ currentPassword: '', newPassword: '' });
      toast('Password changed');
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <form onSubmit={saveProfile} className="card space-y-4 p-6 sm:p-8">
        <h2 className="font-display text-2xl">Personal details</h2>
        <div><label className="label">Email</label><input className="input bg-cream" value={user.email} disabled /></div>
        <div><label className="label" htmlFor="p-name">Name</label><input id="p-name" required className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
        <div><label className="label" htmlFor="p-phone">Mobile</label><input id="p-phone" className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
        <button className="btn-primary">Save changes</button>
      </form>
      <form onSubmit={savePassword} className="card space-y-4 p-6 sm:p-8">
        <h2 className="font-display text-2xl">Change password</h2>
        <div><label className="label" htmlFor="p-cur">Current password</label><input id="p-cur" type="password" required className="input" value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} /></div>
        <div><label className="label" htmlFor="p-new">New password</label><input id="p-new" type="password" required minLength={6} className="input" value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} /></div>
        <button className="btn-outline">Update password</button>
      </form>
    </div>
  );
}
