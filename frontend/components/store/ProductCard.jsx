'use client';

import Link from 'next/link';
import { Heart, ShoppingBag } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';
import { img } from '@/lib/api';
import { discountPct, inr } from '@/lib/format';
import { useWishlist } from './useWishlist';
import Stars from './Stars';

export default function ProductCard({ product, priority = false }) {
  const { add, openDrawer } = useCart();
  const toast = useToast();
  const { isWished, toggle } = useWishlist();
  const off = discountPct(product.price, product.mrp);
  const soldOut = product.stock <= 0;
  const wished = isWished(product.id);

  const addToBag = () => {
    add(product, 1);
    toast(`${product.name} added to your bag`);
    openDrawer();
  };

  return (
    <article className="group relative flex flex-col">
      <div className="relative overflow-hidden rounded-t-[999px] rounded-b-2xl border border-gold-200 bg-cream p-1.5 shadow-card transition group-hover:shadow-soft">
        <Link href={`/product/${product.slug}`} className="relative block aspect-[3/4] overflow-hidden rounded-t-[999px] rounded-b-xl">
          <img
            src={img(product.image)}
            alt={product.name}
            loading={priority ? 'eager' : 'lazy'}
            className="absolute inset-0 h-full w-full object-cover object-top transition duration-700 group-hover:scale-105"
          />
          {product.hover_image && (
            <img
              src={img(product.hover_image)}
              alt=""
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover opacity-0 transition duration-700 group-hover:opacity-100"
            />
          )}
        </Link>

        <div className="pointer-events-none absolute left-4 top-[22%] flex flex-col gap-1.5">
          {off > 0 && <span className="rounded-full bg-maroon-700 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-cream-light">{off}% off</span>}
          {product.is_new ? <span className="rounded-full bg-peacock px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-gold-200">New</span> : null}
        </div>

        <button
          onClick={() => toggle(product.id)}
          aria-label={wished ? 'Remove from wishlist' : 'Add to wishlist'}
          className="absolute right-4 top-[22%] flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-maroon-700 shadow-card transition hover:scale-110"
        >
          <Heart className={`h-4 w-4 ${wished ? 'fill-maroon-700' : ''}`} />
        </button>

        <div className="absolute inset-x-4 bottom-4 translate-y-3 opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100 max-lg:translate-y-0 max-lg:opacity-100">
          <button onClick={addToBag} disabled={soldOut} className="btn w-full bg-white/95 py-2.5 text-maroon-800 shadow-card backdrop-blur hover:bg-maroon-700 hover:text-cream-light max-lg:hidden">
            <ShoppingBag className="h-4 w-4" /> {soldOut ? 'Sold out' : 'Add to Bag'}
          </button>
        </div>
      </div>

      <div className="flex flex-1 flex-col px-1 pt-4 text-center">
        {product.category_name && <p className="text-[10px] uppercase tracking-[0.25em] text-gold-700">{product.category_name}</p>}
        <Link href={`/product/${product.slug}`} className="mt-1 font-display text-lg leading-snug text-maroon-900 transition hover:text-maroon-600 sm:text-xl">
          {product.name}
        </Link>
        {product.rating ? (
          <div className="mt-1 flex items-center justify-center gap-1.5 text-xs text-ink-muted">
            <Stars value={product.rating} className="h-3 w-3" /> ({product.review_count})
          </div>
        ) : null}
        <div className="mt-2 flex items-center justify-center gap-2">
          <span className="font-semibold text-maroon-800">{inr(product.price)}</span>
          {off > 0 && <span className="text-sm text-ink-muted line-through">{inr(product.mrp)}</span>}
        </div>
        <button onClick={addToBag} disabled={soldOut} className="btn-outline btn-sm mt-3 lg:hidden">
          {soldOut ? 'Sold out' : 'Add to Bag'}
        </button>
      </div>
    </article>
  );
}
