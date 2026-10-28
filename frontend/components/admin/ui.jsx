'use client';

import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Inbox, Search, X } from 'lucide-react';
import Spinner from '@/components/ui/Spinner';

/** Page title row with optional description and action buttons. */
export function PageHeader({ title, description, children }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between print:hidden">
      <div>
        <h1 className="font-display text-3xl font-semibold text-maroon-900">{title}</h1>
        {description && <p className="mt-1 text-sm text-ink-soft">{description}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}

export function LoadingBlock({ label = 'Loading…' }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-maroon-700">
      <Spinner className="h-6 w-6" />
      <span className="text-sm text-ink-soft">{label}</span>
    </div>
  );
}

export function EmptyState({ icon: Icon = Inbox, title = 'Nothing here yet', children }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gold-50 text-gold-700">
        <Icon className="h-6 w-6" />
      </span>
      <p className="font-display text-xl text-maroon-900">{title}</p>
      {children && <div className="mt-1 text-sm text-ink-soft">{children}</div>}
    </div>
  );
}

/** Horizontally scrollable table wrapper. */
export function Table({ head, children }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead>
          <tr className="border-b border-gold-100 bg-cream/60 text-[11px] uppercase tracking-wider text-ink-muted">
            {head.map((h, i) => (
              <th key={i} className={`whitespace-nowrap px-4 py-3 font-medium ${typeof h === 'object' && h?.className ? h.className : ''}`}>
                {typeof h === 'object' && h !== null ? h.label : h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gold-100/70">{children}</tbody>
      </table>
    </div>
  );
}

export function Pagination({ page, pages, total, onChange }) {
  if (!pages || pages <= 1) {
    return total != null ? <p className="px-4 py-3 text-xs text-ink-muted">{total} record{total === 1 ? '' : 's'}</p> : null;
  }
  return (
    <div className="flex items-center justify-between gap-3 border-t border-gold-100 px-4 py-3 text-sm">
      <p className="text-xs text-ink-muted">
        Page {page} of {pages} · {total} records
      </p>
      <div className="flex items-center gap-1">
        <button className="rounded-full p-2 text-maroon-700 hover:bg-maroon-50 disabled:opacity-40" disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label="Previous page">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button className="rounded-full p-2 text-maroon-700 hover:bg-maroon-50 disabled:opacity-40" disabled={page >= pages} onClick={() => onChange(page + 1)} aria-label="Next page">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

/** Search box that reports its value after the user pauses typing. */
export function SearchInput({ value, onChange, placeholder = 'Search…', className = '' }) {
  const [text, setText] = useState(value || '');
  useEffect(() => setText(value || ''), [value]);
  useEffect(() => {
    if (text === (value || '')) return undefined;
    const t = setTimeout(() => onChange(text), 350);
    return () => clearTimeout(t);
  }, [text]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className={`relative ${className}`}>
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
      <input className="input !py-2.5 pl-10 pr-9" value={text} placeholder={placeholder} onChange={(e) => setText(e.target.value)} />
      {text && (
        <button className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink" onClick={() => setText('')} aria-label="Clear search">
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

export function Select({ value, onChange, options, className = '' }) {
  return (
    <select className={`input !w-auto !py-2.5 ${className}`} value={value} onChange={(e) => onChange(e.target.value)}>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

/** Small on/off switch. */
export function Toggle({ checked, onChange, disabled, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={!!checked}
      aria-label={label}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        onChange(!checked);
      }}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition disabled:opacity-50 ${checked ? 'bg-maroon-700' : 'bg-gold-200'}`}
    >
      <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  );
}

export function ToggleField({ label, hint, checked, onChange }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-gold-100 bg-cream-light px-4 py-3">
      <span>
        <span className="block text-sm font-medium text-ink">{label}</span>
        {hint && <span className="block text-xs text-ink-muted">{hint}</span>}
      </span>
      <Toggle checked={checked} onChange={onChange} label={label} />
    </label>
  );
}

export function Field({ label, children, className = '', hint }) {
  return (
    <div className={className}>
      {label && <label className="label">{label}</label>}
      {children}
      {hint && <p className="mt-1 text-xs text-ink-muted">{hint}</p>}
    </div>
  );
}

/** Small pill badge. */
export function Pill({ children, tone = 'slate' }) {
  const tones = {
    slate: 'bg-slate-100 text-slate-700 ring-slate-200',
    green: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    red: 'bg-rose-50 text-rose-700 ring-rose-200',
    gold: 'bg-gold-50 text-gold-800 ring-gold-200',
    maroon: 'bg-maroon-50 text-maroon-700 ring-maroon-200',
    teal: 'bg-teal-50 text-teal-700 ring-teal-200',
  };
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${tones[tone]}`}>{children}</span>;
}

export function IconButton({ icon: Icon, label, onClick, tone = 'default', disabled, href, target }) {
  const cls = `inline-flex h-8 w-8 items-center justify-center rounded-full transition disabled:opacity-40 ${
    tone === 'danger' ? 'text-rose-600 hover:bg-rose-50' : 'text-maroon-700 hover:bg-maroon-50'
  }`;
  if (href) {
    return (
      <a href={href} target={target} rel={target === '_blank' ? 'noreferrer' : undefined} className={cls} title={label} aria-label={label} onClick={(e) => e.stopPropagation()}>
        <Icon className="h-4 w-4" />
      </a>
    );
  }
  return (
    <button
      type="button"
      className={cls}
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(e);
      }}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

/** Converts a MySQL/ISO datetime to the value a datetime-local input expects. */
export function toLocalInput(v) {
  if (!v) return '';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return '';
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

/** Converts a datetime-local value to 'YYYY-MM-DD HH:MM:SS'. */
export function fromLocalInput(v) {
  return v ? `${v.replace('T', ' ')}:00` : '';
}
