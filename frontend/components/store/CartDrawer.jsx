'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { Minus, Plus, ShoppingBag, Trash, X } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { img } from '@/lib/api';
import { inr } from '@/lib/format';

const FREE_SHIPPING = 1999;

export default function CartDrawer() {
  const { items, drawerOpen, closeDrawer, update, remove, subtotal } = useCart();

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [drawerOpen]);

  if (!drawerOpen) return null;
  const remaining = Math.max(0, FREE_SHIPPING - subtotal);

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-maroon-900/50 backdrop-blur-[2px]" onClick={closeDrawer} />
      <aside className="absolute inset-y-0 right-0 flex w-full max-w-md animate-slide-in flex-col bg-cream-light shadow-soft" aria-label="Shopping bag">
        <div className="flex items-center justify-between border-b border-gold-100 px-6 py-5">
          <h2 className="font-display text-2xl">Your Bag</h2>
          <button onClick={closeDrawer} aria-label="Close bag" className="rounded-full p-2 hover:bg-maroon-50">
            <X className="h-5 w-5" />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-maroon-50 text-maroon-700">
              <ShoppingBag className="h-8 w-8" />
            </div>
            <p className="font-display text-2xl">Your bag is empty</p>
            <p className="text-sm text-ink-soft">Discover sarees woven with love and golden zari.</p>
            <Link href="/shop" onClick={closeDrawer} className="btn-primary mt-2">Start Shopping</Link>
          </div>
        ) : (
          <>
            <div className="border-b border-gold-100 bg-gold-50 px-6 py-3 text-xs text-ink-soft">
              {remaining > 0 ? (
                <>Add <b className="text-maroon-700">{inr(remaining)}</b> more for <b>free shipping</b></>
              ) : (
                <b className="text-emerald-700">✓ You have unlocked free shipping</b>
              )}
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gold-100">
                <div className="h-full rounded-full bg-gradient-to-r from-gold-500 to-maroon-600 transition-all" style={{ width: `${Math.min(100, (subtotal / FREE_SHIPPING) * 100)}%` }} />
              </div>
            </div>
            <ul className="flex-1 divide-y divide-gold-100 overflow-y-auto px-6">
              {items.map((i) => (
                <li key={i.productId} className="flex gap-4 py-5">
                  <Link href={`/product/${i.slug}`} onClick={closeDrawer} className="shrink-0">
                    <img src={img(i.image)} alt={i.name} className="h-28 w-20 rounded-lg object-cover object-top" />
                  </Link>
                  <div className="flex flex-1 flex-col">
                    <Link href={`/product/${i.slug}`} onClick={closeDrawer} className="font-display text-lg leading-tight text-maroon-900 hover:text-maroon-600">
                      {i.name}
                    </Link>
                    {i.color && <span className="mt-1 text-xs text-ink-muted">Colour: {i.color}</span>}
                    <span className="mt-1 text-sm font-medium">{inr(i.price)}</span>
                    <div className="mt-auto flex items-center justify-between pt-2">
                      <div className="flex items-center rounded-full border border-gold-200">
                        <button onClick={() => update(i.productId, i.qty - 1)} className="p-2" aria-label="Decrease"><Minus className="h-3.5 w-3.5" /></button>
                        <span className="w-6 text-center text-sm">{i.qty}</span>
                        <button onClick={() => update(i.productId, i.qty + 1)} className="p-2" aria-label="Increase"><Plus className="h-3.5 w-3.5" /></button>
                      </div>
                      <button onClick={() => remove(i.productId)} className="p-2 text-ink-muted hover:text-rose-600" aria-label="Remove">
                        <Trash className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <div className="border-t border-gold-100 p-6">
              <div className="flex items-center justify-between text-sm">
                <span className="text-ink-soft">Subtotal</span>
                <span className="font-display text-2xl font-semibold text-maroon-900">{inr(subtotal)}</span>
              </div>
              <p className="mt-1 text-xs text-ink-muted">Shipping &amp; discounts calculated at checkout</p>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <Link href="/cart" onClick={closeDrawer} className="btn-outline">View Bag</Link>
                <Link href="/checkout" onClick={closeDrawer} className="btn-primary">Checkout</Link>
              </div>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
