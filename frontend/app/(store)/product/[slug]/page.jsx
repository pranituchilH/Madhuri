import Link from 'next/link';
import { notFound } from 'next/navigation';
import ProductCard from '@/components/store/ProductCard';
import ProductDetail from '@/components/store/ProductDetail';
import ProductReviews from '@/components/store/ProductReviews';
import SectionHeading from '@/components/store/SectionHeading';
import { apiSafe, img } from '@/lib/api';

async function getProduct(slug) {
  const d = await apiSafe(`/products/${encodeURIComponent(slug)}`);
  return d?.product || null;
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const p = await getProduct(slug);
  if (!p) return { title: 'Saree not found' };
  return {
    title: p.name,
    description: p.short_description,
    openGraph: { title: p.name, description: p.short_description, images: p.images?.[0] ? [img(p.images[0].url)] : [] },
  };
}

export default async function ProductPage({ params }) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    sku: product.sku,
    image: product.images.map((i) => img(i.url)),
    description: product.short_description,
    brand: { '@type': 'Brand', name: 'Madhuri Sarees' },
    offers: {
      '@type': 'Offer',
      priceCurrency: 'INR',
      price: product.price,
      availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    },
    ...(product.rating ? { aggregateRating: { '@type': 'AggregateRating', ratingValue: product.rating, reviewCount: product.reviews.length } } : {}),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="container py-6">
        <nav className="text-xs uppercase tracking-[0.18em] text-ink-muted">
          <Link href="/" className="hover:text-maroon-700">Home</Link>
          <span className="mx-2">/</span>
          <Link href="/shop" className="hover:text-maroon-700">Shop</Link>
          {product.category_slug && (
            <>
              <span className="mx-2">/</span>
              <Link href={`/shop?category=${product.category_slug}`} className="hover:text-maroon-700">{product.category_name}</Link>
            </>
          )}
        </nav>
      </div>

      <ProductDetail product={product} />
      <ProductReviews product={product} />

      {product.related?.length > 0 && (
        <section className="jaali py-20">
          <div className="container">
            <SectionHeading eyebrow="You may also love" title="Complete the Look" />
            <div className="mt-12 grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4 lg:gap-x-8">
              {product.related.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
