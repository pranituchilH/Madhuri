import Link from 'next/link';

const TONES = {
  maroon: 'bg-maroon-50 text-maroon-700',
  gold: 'bg-gold-50 text-gold-700',
  peacock: 'bg-emerald-50 text-peacock-light',
  teal: 'bg-sky-50 text-peacock-teal',
};

export default function StatCard({ label, value, sub, icon: Icon, tone = 'maroon', href }) {
  const body = (
    <div className="card flex h-full items-start gap-4 p-5 transition hover:shadow-soft">
      {Icon && (
        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${TONES[tone]}`}>
          <Icon className="h-5 w-5" />
        </span>
      )}
      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-wider text-ink-muted">{label}</p>
        <p className="mt-1 truncate font-display text-3xl font-semibold leading-none text-maroon-900">{value}</p>
        {sub && <p className="mt-1.5 text-xs text-ink-soft">{sub}</p>}
      </div>
    </div>
  );
  return href ? (
    <Link href={href} className="block">
      {body}
    </Link>
  ) : (
    body
  );
}
