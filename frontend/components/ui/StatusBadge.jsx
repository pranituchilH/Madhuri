import { STATUS_STYLES } from '@/lib/format';

export default function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ring-1 ring-inset ${STATUS_STYLES[status] || 'bg-slate-100 text-slate-700 ring-slate-200'}`}>
      {status}
    </span>
  );
}
