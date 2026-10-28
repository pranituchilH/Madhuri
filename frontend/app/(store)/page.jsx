import Link from 'next/link';
import { ArrowRight, Award, Gem, HandHeart, ShieldCheck, Sparkles, Truck } from 'lucide-react';
import HeroSlider from '@/components/store/HeroSlider';
import ProductCard from '@/components/store/ProductCard';
import SectionHeading from '@/components/store/SectionHeading';
import Stars from '@/components/store/Stars';
import { apiSafe } from '@/lib/api';

export const revalidate = 60;

const USPS = [
  { icon: Gem, title: 'Premium Quality', text: 'Rich zari, soft silk' },
  { icon: Truck, title: 'Free Shipping', text: 'On orders above ₹1,999' },
  { icon: ShieldCheck, title: 'Secure Payments', text: 'UPI, cards & netbanking' },
  { icon: HandHeart, title: 'Packed with Care', text: 'Gift-ready packaging' },
];

const TESTIMONIALS = [
  { name: 'Priya S.', city: 'Pune', text: 'The peacock blue Banarasi was even more beautiful in person. The zari shines and the fabric is so soft — I got compliments all evening!' },
  { name: 'Ananya R.', city: 'Hyderabad', text: 'Ordered the rani pink saree for my sister’s haldi. Beautiful packaging, quick delivery and exactly as shown in the photos.' },
  { name: 'Meera K.', city: 'Bengaluru', text: 'Lovely quality for the price. The border work is rich and the colours are vibrant. Will definitely shop again from Madhuri Sarees.' },
];

export default async function HomePage() {
  const [featured, latest, cats] = await Promise.all([
    apiSafe('/products?featured=1&limit=8&sort=popular'),
    apiSafe('/products?limit=4&sort=newest'),
    apiSafe('/categories'),
  ]);
  const categories = cats?.categories || [];

  return (
    <>
      <HeroSlider />

      {/* USP strip */}
      <section className="border-y border-gold-200 bg-cream">
        <div className="container grid grid-cols-2 gap-y-6 py-8 lg:grid-cols-4">
          {USPS.map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex items-center justify-center gap-3 text-left lg:border-r lg:border-gold-200 lg:last:border-0">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-gold-300 bg-white text-maroon-700">
                <Icon className="h-5 w-5" />
              </span>
              <div>
                <p className="font-display text-lg font-semibold text-maroon-900">{title}</p>
                <p className="text-xs text-ink-soft">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="container py-20">
        <SectionHeading eyebrow="Shop by collection" title="Curated for Every Occasion" subtitle="From temple-town Banarasi weaves to feather-light soft silks — find the drape that tells your story." />
        <div className="mt-12 grid grid-cols-2 gap-5 lg:grid-cols-4 lg:gap-8">
          {categories.map((c, idx) => (
            <Link key={c.id} href={`/shop?category=${c.slug}`} className="group text-center" style={{ animationDelay: `${idx * 80}ms` }}>
              <div className="relative overflow-hidden rounded-t-[999px] rounded-b-2xl border-2 border-gold-300 p-1.5 transition group-hover:border-maroon-600">
                <div className="aspect-[3/4] overflow-hidden rounded-t-[999px] rounded-b-xl">
                  <img src={c.image || '/brand/cat-banarasi.jpg'} alt={c.name} className="h-full w-full object-cover transition duration-700 group-hover:scale-110" />
                </div>
                <div className="absolute inset-x-1.5 bottom-1.5 rounded-b-xl bg-gradient-to-t from-maroon-900/90 to-transparent px-3 pb-4 pt-16">
                  <p className="font-display text-xl text-cream-light sm:text-2xl">{c.name}</p>
                  <p className="mt-1 text-[11px] uppercase tracking-[0.2em] text-gold-300">{c.product_count} sarees</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Bestsellers */}
      <section className="jaali py-20">
        <div className="container">
          <SectionHeading eyebrow="Most loved" title="Bestselling Sarees" subtitle="Our customers’ favourite drapes, chosen again and again for weddings and festivities." />
          <div className="mt-12 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-8">
            {(featured?.products || []).map((p, idx) => <ProductCard key={p.id} product={p} priority={idx < 4} />)}
          </div>
          {!featured && <p className="mt-10 text-center text-ink-soft">Products are loading slowly — please make sure the API server is running.</p>}
          <div className="mt-12 text-center">
            <Link href="/shop" className="btn-outline">View All Sarees <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </div>
      </section>

      {/* Promo banner */}
      <section className="container py-20">
        <div className="relative overflow-hidden rounded-3xl">
          <img src="/brand/promo.jpg" alt="" className="absolute inset-0 h-full w-full object-cover object-right" />
          <div className="absolute inset-0 bg-gradient-to-r from-maroon-900 via-maroon-900/85 to-maroon-900/10 max-md:to-maroon-900/70" />
          <div className="relative max-w-xl px-8 py-16 sm:px-14 sm:py-20">
            <p className="eyebrow text-gold-300">Festive Offer</p>
            <h2 className="mt-3 font-display text-4xl font-semibold leading-tight text-cream-light sm:text-5xl">
              Flat ₹500 off <span className="italic text-gold-300">on orders above ₹5,000</span>
            </h2>
            <p className="mt-4 text-cream/80">Celebrate the season in silk. Use code <b className="rounded bg-gold-400/20 px-2 py-0.5 tracking-wider text-gold-200">FESTIVE500</b> at checkout.</p>
            <Link href="/shop?category=festive" className="btn-gold mt-8">Shop Festive Edit <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </div>
      </section>

      {/* New arrivals */}
      <section className="container pb-20">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row sm:items-end">
          <div className="text-center sm:text-left">
            <p className="eyebrow">Just landed</p>
            <h2 className="section-title mt-3">New Arrivals</h2>
          </div>
          <Link href="/shop?sort=newest" className="btn-ghost">See all new <ArrowRight className="h-4 w-4" /></Link>
        </div>
        <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4 lg:gap-x-8">
          {(latest?.products || []).map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>

      {/* Story */}
      <section className="overflow-hidden bg-cream">
        <div className="container grid items-center gap-12 py-20 lg:grid-cols-2">
          <div className="relative mx-auto max-w-md">
            <img src="/brand/story.jpg" alt="Madhuri Sarees collection" className="w-full rounded-3xl shadow-soft" />
            <div className="absolute -bottom-6 -right-4 rounded-2xl border border-gold-200 bg-white px-6 py-4 shadow-soft sm:-right-10">
              <p className="font-display text-4xl font-semibold text-maroon-700">5000+</p>
              <p className="text-xs uppercase tracking-widest text-ink-soft">Happy customers</p>
            </div>
          </div>
          <div>
            <p className="eyebrow">Our Story</p>
            <h2 className="section-title mt-3">Timeless Tradition, <span className="italic text-maroon-600">Thoughtfully Curated</span></h2>
            <div className="gold-divider !mx-0" />
            <p className="mt-4 leading-relaxed text-ink-soft">
              Madhuri Sarees began with a simple love for the six yards. We handpick every saree for its weave, its colour and the way it
              drapes — so that what reaches you feels as special as the occasion you wear it to.
            </p>
            <p className="mt-4 leading-relaxed text-ink-soft">
              From golden zari jaals to bold contrast borders, our collection celebrates Indian craftsmanship with a modern eye.
            </p>
            <div className="mt-8 grid grid-cols-3 gap-4">
              {[[Award, 'Timeless Tradition'], [Sparkles, 'Elegant Styles'], [Gem, 'Perfect for Every Occasion']].map(([Icon, label]) => (
                <div key={label} className="rounded-2xl border border-gold-200 bg-white p-4 text-center">
                  <Icon className="mx-auto h-6 w-6 text-gold-600" />
                  <p className="mt-2 text-xs font-medium text-maroon-900">{label}</p>
                </div>
              ))}
            </div>
            <Link href="/about" className="btn-primary mt-8">Read Our Story <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="jaali-dark py-20">
        <div className="container">
          <SectionHeading light eyebrow="Love notes" title="What Our Customers Say" />
          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <figure key={t.name} className="rounded-2xl border border-gold-500/30 bg-white/5 p-6 backdrop-blur sm:p-8 md:last:col-span-2 lg:last:col-span-1">
                <Stars value={5} />
                <blockquote className="mt-4 font-display text-lg italic sm:text-xl leading-relaxed text-cream-light">“{t.text}”</blockquote>
                <figcaption className="mt-6 text-sm text-gold-300">
                  {t.name} <span className="text-cream/50">· {t.city}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* Instagram grid */}
      <section className="container py-20">
        <SectionHeading eyebrow="@madhurisarees" title="Follow Our Journey" subtitle="Tag us in your Madhuri moments for a chance to be featured." />
        <div className="mt-10 grid grid-cols-3 gap-2 sm:gap-4 lg:grid-cols-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <a key={n} href="https://instagram.com/" target="_blank" rel="noreferrer" className="group relative aspect-square overflow-hidden rounded-xl">
              <img src={`/brand/gram-${n}.jpg`} alt="Madhuri Sarees on Instagram" loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-110" />
              <span className="absolute inset-0 bg-maroon-900/0 transition group-hover:bg-maroon-900/30" />
            </a>
          ))}
        </div>
      </section>
    </>
  );
}
