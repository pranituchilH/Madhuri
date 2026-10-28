import { Star } from 'lucide-react';

export default function Stars({ value = 0, className = 'h-4 w-4' }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={`${className} ${n <= Math.round(value) ? 'fill-gold-500 text-gold-500' : 'text-gold-200'}`} />
      ))}
    </span>
  );
}
