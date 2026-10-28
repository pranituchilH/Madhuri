'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';

const OPTIONS = [
  ['newest', 'Newest first'],
  ['popular', 'Most popular'],
  ['price_asc', 'Price: Low to High'],
  ['price_desc', 'Price: High to Low'],
  ['discount', 'Biggest discount'],
];

export default function SortSelect() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const onChange = (e) => {
    const p = new URLSearchParams(sp);
    p.set('sort', e.target.value);
    p.delete('page');
    router.push(`${pathname}?${p}`, { scroll: false });
  };

  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="hidden text-ink-muted sm:inline">Sort by</span>
      <select value={sp.get('sort') || 'newest'} onChange={onChange} className="rounded-full border border-gold-200 bg-white px-4 py-2 text-sm outline-none focus:border-maroon-500">
        {OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </label>
  );
}
