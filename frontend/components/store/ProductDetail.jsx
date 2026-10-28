'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { BadgeCheck, Heart, Minus, Plus, RotateCcw, Share2, ShieldCheck, ShoppingBag, Truck } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';
import { img } from '@/lib/api';
import { discountPct, inr } from '@/lib/format';
import Stars from './Stars';
import { useWishlist } from './useWishlist';

export default function ProductDetail({ product }) {
  const [active, setActive] = useState(0);
  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState('description');
  const [zoom, setZoom] = useState(null);
  const { add, openDrawer } = useCart();
  const { isWished, toggle } = useWishlist();
  const toast = useToast();
  const router = useRouter();

  const images = product.images?.length ? product.images : [{ id: 0, url: null }];
  const off = discountPct(product.price, product.mrp);
  const soldOut = product.stock <= 0;
  const maxQty = Math.min(10, product.stock);
  const cartProduct = { ...product, image: images[0]?.url };

  const addToBag = () => {
    add(cartProduct, qty);
    toast(`${product.name} added to your bag`);
    openDrawer();
  };

  const buyNow = () => {
    add(cartProduct, qty);
    router.push('/checkout');
  };

  const share = async () => {
    const data = { title: product.name, url: window.location.href };
    try {
      if (navigator.share) await navigator.share(data);
      else {
        await navigator.clipboard.writeText(window.location.href);
        toast('Link copied to clipboard', 'info');
      }
    } catch {}
  };

  const details = [
    ['Saree code', product.sku],
    ['Fabric', product.fabric],
    ['Colour', product.color],
    ['Work', product.work],
    ['Occasion', product.occasion],
    ['Saree length', product.saree_length],
    ['Blouse', product.blouse],
    ['Wash care', product.wash_care],
  ].filter(([, v]) => v);

  return (
    <section className="container pb-16">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16">
        {/* Gallery */}
        <div className="flex min-w-0 flex-col-reverse gap-4 sm:mx-auto sm:w-full sm:max-w-2xl sm:flex-row lg:sticky lg:top-28 lg:max-w-none lg:self-start">
          <div className="no-scrollbar flex gap-3 overflow-x-auto sm:max-h-[640px] sm:flex-col sm:overflow-y-auto">
            {images.map((im, idx) => (
              <button key={im.id ?? idx} onClick={() => setActive(idx)} aria-label={`View image ${idx + 1}`}
                className={`h-20 w-[60px] shrink-0 sm:h-24 sm:w-[72px] overflow-hidden rounded-xl border-2 transition ${idx === active ? 'border-maroon-600' : 'border-transparent opacity-70 hover:opacity-100'}`}>
                <img src={img(im.url)} alt="" className="h-full w-full object-cover object-top" />
              </button>
            ))}
          </div>
          <div
            className="relative flex-1 cursor-zoom-in overflow-hidden rounded-t-[999px] rounded-b-3xl border-2 border-gold-300 bg-cream p-2"
            onMouseMove={(e) => {
              const r = e.currentTarget.getBoundingClientRect();
              setZoom({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
            }}
            onMouseLeave={() => setZoom(null)}
          >
            <div className="relative aspect-[3/4] overflow-hidden rounded-t-[999px] rounded-b-2xl">
              <img
                src={img(images[active]?.url)}
                alt={product.name}
                className="h-full w-full object-cover object-top transition-transform duration-200"
                style={zoom ? { transform: 'scale(1.8)', transformOrigin: `${zoom.x}% ${zoom.y}%` } : undefined}
              />
            </div>
            {off > 0 && <span className="absolute bottom-6 left-6 rounded-full bg-maroon-700 px-3 py-1 text-xs font-semibold text-cream-light">{off}% OFF</span>}
          </div>
        </div>

        {/* Info */}
        <div className="min-w-0">
          {product.category_name && <p className="eyebrow">{product.category_name}</p>}
          <h1 className="mt-3 font-display text-3xl font-semibold leading-tight sm:text-5xl">{product.name}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-ink-soft">
            {product.rating ? (
              <a href="#reviews" className="flex items-center gap-2 hover:text-maroon-700">
                <Stars value={product.rating} /> {product.rating} ({product.reviews.length} reviews)
              </a>
            ) : (
              <a href="#reviews" className="hover:text-maroon-700">Be the first to review</a>
            )}
            <span className="text-gold-400">|</span>
            <span>Code: <b className="text-maroon-900">{product.sku}</b></span>
          </div>

          <div className="mt-6 flex flex-wrap items-end gap-x-3 gap-y-1">
            <span className="font-display text-3xl sm:text-4xl font-semibold text-maroon-800">{inr(product.price)}</span>
            {off > 0 && (
              <>
                <span className="pb-1 text-lg text-ink-muted line-through">{inr(product.mrp)}</span>
                <span className="mb-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-sm font-medium text-emerald-700">Save {inr(product.mrp - product.price)}</span>
              </>
            )}
          </div>
          <p className="mt-1 text-xs text-ink-muted">Inclusive of all taxes</p>

          {product.short_description && <p className="mt-6 leading-relaxed text-ink-soft">{product.short_description}</p>}

          {product.color && (
            <div className="mt-6 flex items-center gap-3">
              <span className="text-sm text-ink-soft">Colour:</span>
              <span className="h-6 w-6 rounded-full ring-2 ring-gold-300 ring-offset-2" style={{ background: product.color_hex || '#ccc' }} />
              <span className="text-sm font-medium text-maroon-900">{product.color}</span>
            </div>
          )}

          <div className="mt-6 text-sm">
            {soldOut ? (
              <span className="font-medium text-rose-600">Currently sold out</span>
            ) : product.stock <= 5 ? (
              <span className="font-medium text-amber-700">Hurry — only {product.stock} left in stock</span>
            ) : (
              <span className="flex items-center gap-2 font-medium text-emerald-700"><BadgeCheck className="h-4 w-4" /> In stock, ready to ship</span>
            )}
          </div>

          <div className="mt-6 flex items-center gap-2 sm:gap-3">
            <div className="flex shrink-0 items-center rounded-full border border-gold-300 bg-white">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="p-3 sm:p-3.5" aria-label="Decrease quantity" disabled={soldOut}><Minus className="h-4 w-4" /></button>
              <span className="w-6 text-center font-medium sm:w-8">{qty}</span>
              <button onClick={() => setQty((q) => Math.min(maxQty, q + 1))} className="p-3 sm:p-3.5" aria-label="Increase quantity" disabled={soldOut}><Plus className="h-4 w-4" /></button>
            </div>
            <button onClick={addToBag} disabled={soldOut} aria-label="Add to Bag" className="btn-outline min-w-0 flex-1 whitespace-nowrap px-3 py-3.5 sm:px-6"><ShoppingBag className="h-4 w-4 shrink-0" /> <span className="max-[359px]:sr-only">Add to Bag</span></button>
            <button onClick={() => toggle(product.id)} aria-label="Wishlist" className="flex h-11 w-11 shrink-0 items-center sm:h-12 sm:w-12 justify-center rounded-full border border-gold-300 text-maroon-700 hover:bg-maroon-50">
              <Heart className={`h-5 w-5 ${isWished(product.id) ? 'fill-maroon-700' : ''}`} />
            </button>
            <button onClick={share} aria-label="Share" className="flex h-11 w-11 shrink-0 items-center sm:h-12 sm:w-12 justify-center rounded-full border border-gold-300 text-maroon-700 hover:bg-maroon-50">
              <Share2 className="h-5 w-5" />
            </button>
          </div>
          <button onClick={buyNow} disabled={soldOut} className="btn-primary mt-3 w-full py-4 text-base">Buy It Now</button>

          <div className="mt-8 grid grid-cols-3 gap-3 rounded-2xl border border-gold-200 bg-cream p-4 text-center text-xs text-ink-soft">
            <div><Truck className="mx-auto mb-1.5 h-5 w-5 text-gold-600" />Free shipping above ₹1,999</div>
            <div><RotateCcw className="mx-auto mb-1.5 h-5 w-5 text-gold-600" />Easy 7-day exchange</div>
            <div><ShieldCheck className="mx-auto mb-1.5 h-5 w-5 text-gold-600" />Secure Razorpay checkout</div>
          </div>

          {/* Tabs */}
          <div className="mt-10">
            <div className="no-scrollbar flex gap-6 overflow-x-auto border-b border-gold-200">
              {[['description', 'Description'], ['details', 'Saree Details'], ['shipping', 'Shipping & Returns']].map(([k, label]) => (
                <button key={k} onClick={() => setTab(k)}
                  className={`-mb-px shrink-0 whitespace-nowrap border-b-2 pb-3 text-sm font-medium transition ${tab === k ? 'border-maroon-700 text-maroon-800' : 'border-transparent text-ink-muted hover:text-maroon-700'}`}>
                  {label}
                </button>
              ))}
            </div>
            <div className="pt-6 text-sm leading-relaxed text-ink-soft">
              {tab === 'description' && <div className="whitespace-pre-line">{product.description || product.short_description}</div>}
              {tab === 'details' && (
                <dl className="grid grid-cols-[140px_1fr] gap-y-3">
                  {details.map(([k, v]) => (
                    <div key={k} className="contents">
                      <dt className="text-ink-muted">{k}</dt>
                      <dd className="font-medium text-maroon-900">{v}</dd>
                    </div>
                  ))}
                </dl>
              )}
              {tab === 'shipping' && (
                <ul className="list-disc space-y-2 pl-5">
                  <li>Orders are dispatched within 1–2 business days.</li>
                  <li>Delivery in 4–7 business days across India.</li>
                  <li>Free shipping on orders above ₹1,999; ₹99 otherwise.</li>
                  <li>Exchange within 7 days of delivery for unused sarees with original tags.</li>
                  <li>Slight colour variation may occur due to photography and screen settings.</li>
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
