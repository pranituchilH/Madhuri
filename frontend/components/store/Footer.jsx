import Link from 'next/link';
import { Mail, MapPin, Phone } from 'lucide-react';
import { SITE } from '@/lib/site';
import { SOCIAL_LINKS, SocialIcon } from './SocialIcons';
import NewsletterForm from './NewsletterForm';

const COLS = [
  {
    title: 'Shop',
    links: [
      ['All Sarees', '/shop'],
      ['Banarasi Silk', '/shop?category=banarasi-silk'],
      ['Bridal & Wedding', '/shop?category=bridal'],
      ['Festive Collection', '/shop?category=festive'],
      ['Soft Silk', '/shop?category=soft-silk'],
      ['New Arrivals', '/shop?isNew=1'],
    ],
  },
  {
    title: 'Help',
    links: [
      ['My Account', '/account'],
      ['Track Order', '/account?tab=orders'],
      ['Shipping Policy', '/policy/shipping'],
      ['Returns & Exchange', '/policy/returns'],
      ['Contact Us', '/contact'],
    ],
  },
  {
    title: 'Company',
    links: [
      ['Our Story', '/about'],
      ['Privacy Policy', '/policy/privacy'],
      ['Terms of Service', '/policy/terms'],
    ],
  },
];

export default function Footer() {
  return (
    <footer className="jaali-dark text-cream">
      <div className="border-b border-gold-500/20">
        <div className="container grid items-center gap-6 py-12 lg:grid-cols-2">
          <div>
            <p className="eyebrow text-gold-300">Join the Madhuri family</p>
            <h3 className="mt-2 font-display text-3xl text-cream-light">New drops, festive edits &amp; exclusive offers</h3>
          </div>
          <NewsletterForm dark />
        </div>
      </div>

      <div className="container grid grid-cols-2 gap-x-6 gap-y-10 py-14 md:grid-cols-3 lg:grid-cols-5">
        <div className="col-span-2 md:col-span-3 lg:col-span-2">
          <div className="inline-block rounded-2xl bg-cream-light p-3">
            <img src="/brand/logo.png" alt="Madhuri Sarees" className="h-20 w-auto sm:h-24" />
          </div>
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-cream/75">
            Handpicked Banarasi silk sarees woven with golden zari — celebrating timeless tradition, premium quality and elegance for every
            occasion.
          </p>
          <div className="mt-6 flex gap-3">
            {SOCIAL_LINKS.map((s) => (
              <a key={s.name} href={s.href} target="_blank" rel="noreferrer" aria-label={s.label}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-gold-500/40 text-gold-300 transition hover:bg-gold-500 hover:text-maroon-900">
                <SocialIcon name={s.name} className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>

        {COLS.map((col) => (
          <div key={col.title}>
            <h4 className="font-display text-xl text-gold-300">{col.title}</h4>
            <ul className="mt-4 space-y-2.5 text-sm text-cream/75">
              {col.links.map(([label, href]) => (
                <li key={href}>
                  <Link href={href} className="transition hover:text-gold-300">{label}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-gold-500/20">
        <div className="container flex flex-col gap-4 pb-24 pt-6 text-xs md:pb-6 text-cream/60 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <span className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" /> {SITE.phone}</span>
            <span className="flex items-center gap-2"><Mail className="h-3.5 w-3.5" /> {SITE.email}</span>
            <span className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5" /> {SITE.address}</span>
          </div>
          <p>© {new Date().getFullYear()} Madhuri Sarees. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
