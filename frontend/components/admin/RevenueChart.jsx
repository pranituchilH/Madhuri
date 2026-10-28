'use client';

import { useMemo, useState } from 'react';
import { inr } from '@/lib/format';

const pad = (n) => String(n).padStart(2, '0');
const key = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** Rounds a max value up to a "nice" axis ceiling. */
function niceMax(v) {
  if (v <= 0) return 1000;
  const mag = 10 ** Math.floor(Math.log10(v));
  const n = v / mag;
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10;
  return step * mag;
}

const compact = (n) => (n >= 100000 ? `₹${(n / 100000).toFixed(n % 100000 ? 1 : 0)}L` : n >= 1000 ? `₹${Math.round(n / 1000)}k` : `₹${n}`);

/** 30-day revenue column chart. `data` is [{ day: 'YYYY-MM-DD', revenue, orders }]. Missing days are filled with zero. */
export default function RevenueChart({ data = [], days = 30 }) {
  const [hover, setHover] = useState(null);

  const series = useMemo(() => {
    const byDay = new Map(data.map((d) => [d.day, d]));
    const out = [];
    const today = new Date();
    for (let i = days - 1; i >= 0; i -= 1) {
      const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
      const row = byDay.get(key(d));
      out.push({ date: d, revenue: Number(row?.revenue || 0), orders: Number(row?.orders || 0) });
    }
    return out;
  }, [data, days]);

  const max = niceMax(Math.max(...series.map((s) => s.revenue)));
  const total = series.reduce((s, x) => s + x.revenue, 0);
  const orders = series.reduce((s, x) => s + x.orders, 0);
  const ticks = [1, 0.75, 0.5, 0.25, 0];
  const active = hover != null ? series[hover] : null;

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wider text-ink-muted">Revenue · last {days} days</p>
          <p className="mt-1 font-display text-3xl font-semibold text-maroon-900">{inr(total)}</p>
        </div>
        <p className="text-sm text-ink-soft">
          {orders} order{orders === 1 ? '' : 's'}
        </p>
      </div>

      <div className="flex gap-2">
        {/* Y axis labels */}
        <div className="relative h-56 w-10 shrink-0 text-right text-[10px] text-ink-muted">
          {ticks.map((t) => (
            <span key={t} className="absolute right-0 -translate-y-1/2" style={{ top: `${(1 - t) * 100}%` }}>
              {compact(Math.round(max * t))}
            </span>
          ))}
        </div>

        <div className="relative min-w-0 flex-1">
          {/* gridlines */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-56">
            {ticks.map((t) => (
              <div key={t} className={`absolute inset-x-0 border-t ${t === 0 ? 'border-gold-300' : 'border-dashed border-gold-100'}`} style={{ top: `${(1 - t) * 100}%` }} />
            ))}
          </div>

          {/* bars */}
          <div className="relative flex h-56 items-end gap-[3px]" onMouseLeave={() => setHover(null)}>
            {series.map((s, i) => {
              const h = (s.revenue / max) * 100;
              const isHover = hover === i;
              return (
                <div
                  key={i}
                  className="flex h-full flex-1 cursor-default items-end"
                  onMouseEnter={() => setHover(i)}
                  onFocus={() => setHover(i)}
                  onTouchStart={() => setHover(i)}
                  tabIndex={0}
                  aria-label={`${s.date.toDateString()}: ${inr(s.revenue)}, ${s.orders} orders`}
                >
                  <div
                    className={`w-full rounded-t-[3px] transition-colors ${
                      s.revenue > 0 ? (isHover ? 'bg-gold-500' : 'bg-maroon-700') : isHover ? 'bg-gold-300' : 'bg-gold-100'
                    }`}
                    style={{ height: s.revenue > 0 ? `${Math.max(h, 1.5)}%` : '2px' }}
                  />
                </div>
              );
            })}

            {active && (
              <div
                className="pointer-events-none absolute -top-2 z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-lg bg-maroon-900 px-3 py-2 text-xs text-cream shadow-soft"
                style={{ left: `${Math.min(Math.max(((hover + 0.5) / series.length) * 100, 12), 88)}%` }}
              >
                <p className="text-[10px] uppercase tracking-wider text-gold-300">
                  {active.date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                </p>
                <p className="font-medium">{inr(active.revenue)}</p>
                <p className="text-cream/70">
                  {active.orders} order{active.orders === 1 ? '' : 's'}
                </p>
              </div>
            )}
          </div>

          {/* X axis labels: every 5th day */}
          <div className="mt-2 flex gap-[3px] text-[10px] text-ink-muted">
            {series.map((s, i) => (
              <span key={i} className="flex-1 text-center">
                {(series.length - 1 - i) % 5 === 0 ? s.date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : ''}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
