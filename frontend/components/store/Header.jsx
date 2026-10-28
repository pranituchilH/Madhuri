'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Heart, Menu, Search, ShoppingBag, User, X } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { NAV } from '@/lib/site';

export default function Header() {
  const { count, openDrawer, ready } = useCart();
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [q, setQ] = useState('');
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  const submitSearch = (e) => {
    e.preventDefault();
    if (!q.trim()) return;
    router.push(`/shop?q=${encodeURIComponent(q.trim())}`);
    setSearchOpen(false);
  };

  return (
    <>
      <div className="overflow-hidden bg-maroon-900 py-2 text-[11px] uppercase tracking-[0.25em] text-gold-200">
        <div className="flex w-max animate-marquee gap-16 whitespace-nowrap">
          {Array.from({ length: 2 }).map((_, k) => (
            <div key={k} className="flex gap-16">
              <span>✦ Free shipping on orders above ₹1,999</span>
              <span>✦ Use code WELCOME10 for 10% off your first order</span>
              <span>✦ Secure payments with Razorpay</span>
              <span>✦ Cash on delivery available</span>
              <span>✦ Every saree packed with care</span>
            </div>
          ))}
        </div>
      </div>

      <header className={`sticky top-0 z-40 border-b border-gold-100 transition-all ${scrolled ? 'bg-cream-light/95 shadow-card backdrop-blur' : 'bg-cream-light'}`}>
        <div className="container flex h-20 items-center justify-between gap-4 lg:h-24">
          <button className="-ml-2 p-2 text-maroon-800 lg:hidden" onClick={() => setMenuOpen(true)} aria-label="Open menu">
            <Menu className="h-6 w-6" />
          </button>

          <Link href="/" className="flex items-center gap-3" aria-label="Madhuri Sarees home">
            <img src="/brand/logo.png" alt="Madhuri Sarees" className={`w-auto transition-all ${scrolled ? 'h-14 lg:h-16' : 'h-16 lg:h-20'}`} />
          </Link>

          <nav className="hidden items-center gap-7 lg:flex">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group relative text-[13px] font-medium uppercase tracking-[0.14em] text-ink-soft transition hover:text-maroon-700"
              >
                {item.label}
                <span className="absolute -bottom-1.5 left-0 h-px w-0 bg-gold-500 transition-all group-hover:w-full" />
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-1 sm:gap-2">
            <button onClick={() => setSearchOpen((s) => !s)} className="rounded-full p-2.5 text-maroon-800 hover:bg-maroon-50" aria-label="Search">
              <Search className="h-5 w-5" />
            </button>
            <Link href="/account?tab=wishlist" className="hidden rounded-full p-2.5 text-maroon-800 hover:bg-maroon-50 sm:block" aria-label="Wishlist">
              <Heart className="h-5 w-5" />
            </Link>
            <Link href={user ? '/account' : '/login'} className="rounded-full p-2.5 text-maroon-800 hover:bg-maroon-50" aria-label="Account">
              <User className="h-5 w-5" />
            </Link>
            <button onClick={openDrawer} className="relative rounded-full p-2.5 text-maroon-800 hover:bg-maroon-50" aria-label="Open cart">
              <ShoppingBag className="h-5 w-5" />
              {ready && count > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-maroon-700 px-1 text-[10px] font-semibold text-cream-light">
                  {count}
                </span>
              )}
            </button>
          </div>
        </div>

        {searchOpen && (
          <div className="border-t border-gold-100 bg-cream-light">
            <form onSubmit={submitSearch} className="container flex items-center gap-3 py-4">
              <Search className="h-5 w-5 text-gold-600" />
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search sarees by colour, code or occasion…"
                className="flex-1 bg-transparent py-2 font-display text-xl outline-none placeholder:text-ink-muted"
              />
              <button type="submit" className="btn-primary btn-sm">Search</button>
            </form>
          </div>
        )}
      </header>

      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-maroon-900/50" onClick={() => setMenuOpen(false)} />
          <aside className="jaali absolute inset-y-0 left-0 flex w-80 max-w-[85%] flex-col shadow-soft">
            <div className="flex items-center justify-between border-b border-gold-200 p-4">
              <img src="/brand/logo.png" alt="Madhuri Sarees" className="h-14 w-auto" />
              <button onClick={() => setMenuOpen(false)} aria-label="Close menu" className="p-2 text-maroon-800">
                <X className="h-6 w-6" />
              </button>
            </div>
            <nav className="flex flex-col p-4">
              {NAV.map((item) => (
                <Link key={item.href} href={item.href} className="border-b border-gold-100 py-3.5 font-display text-xl text-maroon-900">
                  {item.label}
                </Link>
              ))}
              <Link href={user ? '/account' : '/login'} className="py-3.5 font-display text-xl text-maroon-900">
                {user ? 'My Account' : 'Login / Register'}
              </Link>
            </nav>
          </aside>
        </div>
      )}
    </>
  );
}
