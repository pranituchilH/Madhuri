import Link from 'next/link';
import { ArrowRight, Award, Gem, HandHeart, Sparkles } from 'lucide-react';
import SectionHeading from '@/components/store/SectionHeading';

export const metadata = { title: 'Our Story', description: 'The story behind Madhuri Sarees — timeless tradition, premium quality and elegant styles.' };

const VALUES = [
  { icon: Award, title: 'Timeless Tradition', text: 'Weaves and motifs inspired by generations of Indian craftsmanship.' },
  { icon: Gem, title: 'Premium Quality', text: 'Every saree is hand-checked for weave, zari, colour and finish.' },
  { icon: Sparkles, title: 'Elegant Styles', text: 'Classic silhouettes with colours that feel fresh and modern.' },
  { icon: HandHeart, title: 'Packed with Care', text: 'Folded, wrapped and packed beautifully — ready to gift.' },
];

export default function AboutPage() {
  return (
    <>
      <section className="relative overflow-hidden">
        <img src="/brand/hero-3.jpg" alt="" className="absolute inset-0 h-full w-full object-cover object-right" />
        <div className="absolute inset-0 bg-gradient-to-r from-peacock via-peacock/85 to-transparent max-lg:bg-peacock/80" />
        <div className="container relative py-28 lg:py-36">
          <p className="eyebrow text-gold-300">Our Story</p>
          <h1 className="mt-4 max-w-xl font-display text-5xl font-semibold leading-tight text-cream-light sm:text-6xl">
            Celebrating your beauty, <span className="italic text-gold-300">embracing your tradition.</span>
          </h1>
        </div>
      </section>

      <section className="container grid items-center gap-14 py-20 lg:grid-cols-2">
        <img src="/brand/story.jpg" alt="Madhuri Sarees collection" className="mx-auto w-full max-w-md rounded-3xl shadow-soft" />
        <div>
          <SectionHeading className="!mx-0 !text-left" eyebrow="Welcome to Madhuri Sarees" title="Elegance Woven in Every Thread" />
          <div className="space-y-4 leading-relaxed text-ink-soft">
            <p>
              Madhuri Sarees was born from a lifelong love for the saree — the most graceful garment in the world. What started as sharing
              favourite weaves with family and friends has grown into a boutique trusted by women across India.
            </p>
            <p>
              We work closely with weavers and trusted suppliers to bring you Banarasi-inspired soft silks with rich zari jaal, contrast
              borders and statement pallus. Each piece is chosen for its drape, its sheen and the joy it brings when you wear it.
            </p>
            <p>Whether it is your wedding, a festival or a family puja, we want you to feel your most beautiful self — and make every moment special.</p>
          </div>
          <Link href="/shop" className="btn-primary mt-8">Explore the Collection <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </section>

      <section className="jaali py-20">
        <div className="container">
          <SectionHeading eyebrow="What we stand for" title="The Madhuri Promise" />
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {VALUES.map(({ icon: Icon, title, text }) => (
              <div key={title} className="card p-8 text-center">
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-maroon-700 text-gold-300"><Icon className="h-6 w-6" /></span>
                <h3 className="mt-5 font-display text-2xl">{title}</h3>
                <p className="mt-2 text-sm text-ink-soft">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
