'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ExternalLink,
  FolderTree,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  MessageSquare,
  Newspaper,
  Package,
  ShoppingBag,
  Star,
  Ticket,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import Spinner from '@/components/ui/Spinner';
import AdminLogin from './AdminLogin';

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/categories', label: 'Categories', icon: FolderTree },
  { href: '/admin/customers', label: 'Customers', icon: Users },
  { href: '/admin/coupons', label: 'Coupons', icon: Ticket },
  { href: '/admin/reviews', label: 'Reviews', icon: Star },
  { href: '/admin/messages', label: 'Messages', icon: MessageSquare },
  { href: '/admin/subscribers', label: 'Subscribers', icon: Newspaper },
];

function Sidebar({ pathname, user, onLogout, onNavigate }) {
  return (
    <div className="jaali-dark flex h-full flex-col text-cream">
      <div className="flex items-center gap-3 border-b border-gold-500/20 px-5 py-5">
        <img src="/brand/logo.png" alt="Madhuri Sarees" className="h-11 w-11 rounded-full bg-cream-light object-contain p-1" />
        <div className="leading-tight">
          <p className="font-display text-xl font-semibold text-gold-300">Madhuri Sarees</p>
          <p className="text-[10px] uppercase tracking-[0.3em] text-cream/60">Admin panel</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {NAV.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                active ? 'bg-gold-500/15 text-gold-300 ring-1 ring-inset ring-gold-500/30' : 'text-cream/75 hover:bg-white/5 hover:text-cream'
              }`}
            >
              <Icon className={`h-[18px] w-[18px] ${active ? 'text-gold-400' : 'text-cream/50 group-hover:text-gold-300'}`} />
              {label}
            </Link>
          );
        })}
        <div className="my-3 h-px bg-gradient-to-r from-transparent via-gold-500/30 to-transparent" />
        <Link href="/" target="_blank" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-cream/75 transition hover:bg-white/5 hover:text-cream">
          <ExternalLink className="h-[18px] w-[18px] text-cream/50" />
          View store
        </Link>
      </nav>

      <div className="border-t border-gold-500/20 p-4">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gold-500 font-display text-lg font-semibold text-maroon-900">
            {(user?.name || 'A').charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-cream">{user?.name}</p>
            <p className="flex items-center gap-1 truncate text-[11px] text-cream/50">
              <Mail className="h-3 w-3" />
              {user?.email}
            </p>
          </div>
          <button onClick={onLogout} className="rounded-full p-2 text-cream/60 transition hover:bg-white/10 hover:text-gold-300" title="Log out" aria-label="Log out">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminShell({ children }) {
  const { user, loading, isAdmin, logout } = useAuth();
  const pathname = usePathname() || '/admin';
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream-light text-maroon-700">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (!user || !isAdmin) return <AdminLogin />;

  const current = NAV.find((n) => (n.exact ? pathname === n.href : pathname.startsWith(n.href)));

  return (
    <div className="min-h-screen bg-cream-light print:bg-white">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 lg:block print:hidden">
        <Sidebar pathname={pathname} user={user} onLogout={logout} />
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden print:hidden">
          <div className="absolute inset-0 bg-maroon-900/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 max-w-[85vw] animate-fade-up shadow-soft">
            <button onClick={() => setOpen(false)} className="absolute right-3 top-3 z-10 rounded-full p-1.5 text-cream/70 hover:bg-white/10" aria-label="Close menu">
              <X className="h-5 w-5" />
            </button>
            <Sidebar pathname={pathname} user={user} onLogout={logout} onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      )}

      <div className="lg:pl-64 print:pl-0">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-gold-100 bg-maroon-900 px-4 py-3 text-cream lg:hidden print:hidden">
          <button onClick={() => setOpen(true)} className="rounded-lg p-1.5 hover:bg-white/10" aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </button>
          <img src="/brand/logo.png" alt="" className="h-8 w-8 rounded-full bg-cream-light object-contain p-0.5" />
          <p className="flex-1 truncate font-display text-lg text-gold-300">{current?.label || 'Admin'}</p>
          <button onClick={logout} className="rounded-lg p-1.5 text-cream/70 hover:bg-white/10" aria-label="Log out">
            <LogOut className="h-4 w-4" />
          </button>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8 print:max-w-none print:p-0">{children}</main>
      </div>
    </div>
  );
}
