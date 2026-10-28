'use client';

import Link from 'next/link';
import { Minus, Plus, ShoppingBag, Trash } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { img } from '@/lib/api';
import { inr } from '@/lib/format';
import Spinner from '@/components/ui/Spinner';

const FREE_SHIPPING = 1999;
const SHIPPING_FEE = 99;

export default function CartPage() {
  const { items, ready, update, remove, subtotal } = useCart();

  if (!ready) return <div className="flex justify-center py-32 text-maroon-700"><Spinner className="h-8 w-8" /></div>;

  if (!items.length) {
    return (
      <div className="container flex flex-col items-center py-28 text-center">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-maroon-50 text-maroon-700"><ShoppingBag className="h-10 w-10" /></div>
        <h1 className="mt-6 font-display text-4xl">Your bag is empty</h1>
        <p className="mt-2 text-ink-soft">Looks like you haven’t added any sarees yet.</p>
        <Link href="/shop" className="btn-primary mt-8">Continue Shopping</Link>
      </div>
    );
  }

  const shipping = subtotal >= FREE_SHIPPING ? 0 : SHIPPING_FEE;

  return (
    <div className="container py-12 lg:py-16">
      <h1 className="font-display text-4xl font-semibold sm:text-5xl">Shopping Bag</h1>
      <div className="gold-divider !mx-0" />
      <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_380px]">
        <ul className="divide-y divide-gold-100 rounded-3xl border border-gold-200 bg-white px-6">
          {items.map((i) => (
            <li key={i.productId} className="flex gap-5 py-6">
              <Link href={`/product/${i.slug}`} className="shrink-0">
                <img src={img(i.image)} alt={i.name} className="h-36 w-28 rounded-xl object-cover object-top" />
              </Link>
              <div className="flex flex-1 flex-col gap-1 sm:flex-row sm:justify-between">
                <div>
                  <Link href={`/product/${i.slug}`} className="font-display text-xl text-maroon-900 hover:text-maroon-600">{i.name}</Link>
                  {i.color && <p className="mt-1 text-sm text-ink-muted">Colour: {i.color}</p>}
                  <p className="mt-2 font-medium">
                    {inr(i.price)} {i.mrp > i.price && <span className="ml-1 text-sm text-ink-muted line-through">{inr(i.mrp)}</span>}
                  </p>
                  <div className="mt-4 flex items-center gap-4">
                    <div className="flex items-center rounded-full border border-gold-200">
                      <button onClick={() => update(i.productId, i.qty - 1)} className="p-2.5" aria-label="Decrease"><Minus className="h-3.5 w-3.5" /></button>
                      <span className="w-7 text-center text-sm">{i.qty}</span>
                      <button onClick={() => update(i.productId, i.qty + 1)} className="p-2.5" aria-label="Increase"><Plus className="h-3.5 w-3.5" /></button>
                    </div>
                    <button onClick={() => remove(i.productId)} className="flex items-center gap-1 text-sm text-ink-muted hover:text-rose-600">
                      <Trash className="h-4 w-4" /> Remove
                    </button>
                  </div>
                </div>
                <p className="font-display text-2xl font-semibold text-maroon-800 sm:text-right">{inr(i.price * i.qty)}</p>
              </div>
            </li>
          ))}
        </ul>

        <aside className="h-fit rounded-3xl border border-gold-200 bg-cream p-6 lg:sticky lg:top-28">
          <h2 className="font-display text-2xl">Order Summary</h2>
          <dl className="mt-6 space-y-3 text-sm">
            <div className="flex justify-between"><dt className="text-ink-soft">Subtotal</dt><dd>{inr(subtotal)}</dd></div>
            <div className="flex justify-between"><dt className="text-ink-soft">Shipping</dt><dd>{shipping ? inr(shipping) : <span className="text-emerald-700">Free</span>}</dd></div>
            <div className="flex justify-between border-t border-gold-200 pt-4 text-base">
              <dt className="font-medium">Estimated total</dt>
              <dd className="font-display text-2xl font-semibold text-maroon-900">{inr(subtotal + shipping)}</dd>
            </div>
          </dl>
          {shipping > 0 && <p className="mt-3 text-xs text-ink-muted">Add {inr(FREE_SHIPPING - subtotal)} more for free shipping.</p>}
          <p className="mt-3 text-xs text-ink-muted">Have a coupon? Apply it at checkout.</p>
          <Link href="/checkout" className="btn-primary mt-6 w-full py-4">Proceed to Checkout</Link>
          <Link href="/shop" className="btn-ghost mt-2 w-full">Continue Shopping</Link>
        </aside>
      </div>
    </div>
  );
}
