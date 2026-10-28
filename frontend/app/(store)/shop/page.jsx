import Link from 'next/link';
import ProductCard from '@/components/store/ProductCard';
import ShopFilters from '@/components/store/ShopFilters';
import SortSelect from '@/components/store/SortSelect';
import { apiSafe } from '@/lib/api';

export async function generateMetadata({ searchParams }) {
  const sp = await searchParams;
  if (sp.q) return { title: `Search: ${sp.q}` };
  if (sp.category) {
    const d = await apiSafe('/categories');
    const c = d?.categories?.find((x) => x.slug === sp.category);
    if (c) return { title: c.name, description: c.description };
  }
  return { title: 'Shop All Sarees', description: 'Browse Banarasi silk, bridal and festive sarees from Madhuri Sarees.' };
}

const KEYS = ['category', 'q', 'color', 'minPrice', 'maxPrice', 'sort', 'page', 'isNew', 'inStock'];

export default async function ShopPage({ searchParams }) {
  const sp = await searchParams;
  const params = new URLSearchParams();
  for (const k of KEYS) if (sp[k]) params.set(k, sp[k]);
  params.set('limit', '12');

  const [data, filters, cats] = await Promise.all([apiSafe(`/products?${params}`), apiSafe('/products/filters'), apiSafe('/categories')]);
  const categories = cats?.categories || [];
  const active = categories.find((c) => c.slug === sp.category);
  const title = sp.q ? `Results for “${sp.q}”` : active ? active.name : sp.isNew ? 'New Arrivals' : 'All Sarees';
  const page = Number(sp.page) || 1;

  const pageHref = (n) => {
    const p = new URLSearchParams(params);
    p.delete('limit');
    p.set('page', String(n));
    return `/shop?${p}`;
  };

  return (
    <>
      <section className="jaali border-b border-gold-200">
        <div className="container py-12 text-center sm:py-16">
          <nav className="text-xs uppercase tracking-[0.2em] text-ink-muted">
            <Link href="/" className="hover:text-maroon-700">Home</Link> <span className="mx-2">/</span> <span className="text-maroon-700">Shop</span>
          </nav>
          <h1 className="mt-4 font-display text-4xl font-semibold sm:text-5xl">{title}</h1>
          <div className="gold-divider" />
          {active?.description && <p className="mx-auto max-w-xl text-sm text-ink-soft">{active.description}</p>}
        </div>
      </section>

      <div className="container py-10 lg:py-14">
        <div className="lg:grid lg:grid-cols-[260px_1fr] lg:gap-10">
          <ShopFilters categories={categories} colors={filters?.colors || []} />

          <div>
            <div className="mb-8 flex items-center justify-between gap-4 border-b border-gold-100 pb-4">
              <p className="text-sm text-ink-soft">
                {data ? <><b className="text-maroon-900">{data.total}</b> saree{data.total === 1 ? '' : 's'}</> : 'Unable to load products'}
              </p>
              <SortSelect />
            </div>

            {data?.products?.length ? (
              <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:gap-x-6">
                {data.products.map((p, idx) => <ProductCard key={p.id} product={p} priority={idx < 3} />)}
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-gold-300 bg-cream py-20 text-center">
                <p className="font-display text-3xl text-maroon-900">No sarees found</p>
                <p className="mt-2 text-sm text-ink-soft">Try removing some filters or searching for something else.</p>
                <Link href="/shop" className="btn-primary mt-6">Clear all filters</Link>
              </div>
            )}

            {data?.pages > 1 && (
              <nav className="mt-14 flex items-center justify-center gap-2" aria-label="Pagination">
                {Array.from({ length: data.pages }, (_, k) => k + 1).map((n) => (
                  <Link key={n} href={pageHref(n)} aria-current={n === page ? 'page' : undefined}
                    className={`flex h-10 w-10 items-center justify-center rounded-full text-sm transition ${n === page ? 'bg-maroon-700 text-cream-light' : 'border border-gold-200 hover:border-maroon-600'}`}>
                    {n}
                  </Link>
                ))}
              </nav>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
