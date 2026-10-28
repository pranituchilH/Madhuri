import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="jaali flex min-h-[60vh] flex-col items-center justify-center px-4 py-24 text-center">
      <p className="font-display text-8xl font-semibold text-maroon-200">404</p>
      <h1 className="mt-2 font-display text-4xl">This page has slipped away</h1>
      <p className="mt-3 text-ink-soft">The page you’re looking for doesn’t exist or has been moved.</p>
      <Link href="/shop" className="btn-primary mt-8">Browse Sarees</Link>
    </div>
  );
}
