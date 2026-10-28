'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { Check, SlidersHorizontal, X } from 'lucide-react';

const PRICE_BANDS = [
  ['Under ₹2,500', '', '2500'],
  ['₹2,500 – ₹3,000', '2500', '3000'],
  ['₹3,000 – ₹4,000', '3000', '4000'],
  ['Above ₹4,000', '4000', ''],
];

export default function ShopFilters({ categories, colors }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [open, setOpen] = useState(false);

  const set = (updates) => {
    const p = new URLSearchParams(sp);
    for (const [k, v] of Object.entries(updates)) v ? p.set(k, v) : p.delete(k);
    p.delete('page');
    router.push(`${pathname}?${p}`, { scroll: false });
  };

  const selectedColors = (sp.get('color') || '').split(',').filter(Boolean);
  const toggleColor = (name) => {
    const next = selectedColors.includes(name) ? selectedColors.filter((c) => c !== name) : [...selectedColors, name];
    set({ color: next.join(',') });
  };
  const hasFilters = ['category', 'color', 'minPrice', 'maxPrice', 'inStock', 'isNew', 'q'].some((k) => sp.get(k));

  const body = (
    <div className="space-y-8">
      <div>
        <h3 className="font-display text-xl">Collections</h3>
        <ul className="mt-3 space-y-1">
          <li>
            <button onClick={() => set({ category: '' })} className={`w-full rounded-lg px-3 py-2 text-left text-sm transition ${!sp.get('category') ? 'bg-maroon-50 font-medium text-maroon-700' : 'hover:bg-cream'}`}>
              All Sarees
            </button>
          </li>
          {categories.map((c) => (
            <li key={c.id}>
              <button onClick={() => set({ category: c.slug })}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition ${sp.get('category') === c.slug ? 'bg-maroon-50 font-medium text-maroon-700' : 'hover:bg-cream'}`}>
                {c.name} <span className="text-xs text-ink-muted">{c.product_count}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="font-display text-xl">Colour</h3>
        <div className="mt-4 flex flex-wrap gap-3">
          {colors.map((c) => {
            const on = selectedColors.includes(c.name);
            return (
              <button key={c.name} onClick={() => toggleColor(c.name)} title={c.name} aria-pressed={on} className="group flex flex-col items-center gap-1">
                <span className={`flex h-9 w-9 items-center justify-center rounded-full ring-2 ring-offset-2 transition ${on ? 'ring-maroon-600' : 'ring-transparent group-hover:ring-gold-300'}`} style={{ background: c.hex || '#ccc' }}>
                  {on && <Check className="h-4 w-4 text-white" />}
                </span>
                <span className="text-[10px] text-ink-muted">{c.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <h3 className="font-display text-xl">Price</h3>
        <ul className="mt-3 space-y-1">
          {PRICE_BANDS.map(([label, min, max]) => {
            const on = (sp.get('minPrice') || '') === min && (sp.get('maxPrice') || '') === max;
            return (
              <li key={label}>
                <button onClick={() => set(on ? { minPrice: '', maxPrice: '' } : { minPrice: min, maxPrice: max })}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition ${on ? 'bg-maroon-50 font-medium text-maroon-700' : 'hover:bg-cream'}`}>
                  <span className={`flex h-4 w-4 items-center justify-center rounded-full border ${on ? 'border-maroon-600 bg-maroon-600' : 'border-gold-300'}`}>
                    {on && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                  </span>
                  {label}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <label className="flex cursor-pointer items-center gap-3 text-sm">
        <input type="checkbox" checked={sp.get('inStock') === '1'} onChange={(e) => set({ inStock: e.target.checked ? '1' : '' })} className="h-4 w-4 accent-maroon-700" />
        In stock only
      </label>

      {hasFilters && (
        <button onClick={() => router.push(pathname)} className="btn-outline btn-sm w-full">Clear all filters</button>
      )}
    </div>
  );

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-outline btn-sm mb-6 lg:hidden">
        <SlidersHorizontal className="h-4 w-4" /> Filters
      </button>
      <aside className="hidden lg:block">
        <div className="sticky top-32">{body}</div>
      </aside>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-maroon-900/50" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-80 max-w-[85%] overflow-y-auto bg-cream-light p-6 shadow-soft">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="font-display text-2xl">Filters</h2>
              <button onClick={() => setOpen(false)} aria-label="Close filters"><X className="h-5 w-5" /></button>
            </div>
            <div onClick={(e) => e.target.closest('button') && setTimeout(() => setOpen(false), 150)}>{body}</div>
          </div>
        </div>
      )}
    </>
  );
}
