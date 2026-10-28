import { Clock, Mail, MapPin, Phone } from 'lucide-react';
import ContactForm from '@/components/store/ContactForm';
import { SITE } from '@/lib/site';

export const metadata = { title: 'Contact Us', description: 'Get in touch with Madhuri Sarees for orders, styling help and wholesale enquiries.' };

export default function ContactPage() {
  const items = [
    [Phone, 'Call or WhatsApp', SITE.phone, `tel:${SITE.phone.replace(/\s/g, '')}`],
    [Mail, 'Email us', SITE.email, `mailto:${SITE.email}`],
    [MapPin, 'Visit us', SITE.address, null],
    [Clock, 'Store hours', SITE.hours, null],
  ];
  return (
    <>
      <section className="jaali border-b border-gold-200">
        <div className="container py-16 text-center">
          <p className="eyebrow">We’d love to hear from you</p>
          <h1 className="mt-3 font-display text-5xl font-semibold">Contact Us</h1>
          <div className="gold-divider" />
          <p className="mx-auto max-w-lg text-sm text-ink-soft">Questions about a saree, your order or bulk/wedding orders? Our team replies within 24 hours.</p>
        </div>
      </section>
      <section className="container grid gap-10 py-16 lg:grid-cols-[1fr_1.4fr]">
        <div className="space-y-4">
          {items.map(([Icon, label, value, href]) => (
            <div key={label} className="card flex items-start gap-4 p-5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-maroon-50 text-maroon-700"><Icon className="h-5 w-5" /></span>
              <div>
                <p className="text-xs uppercase tracking-widest text-ink-muted">{label}</p>
                {href ? <a href={href} className="mt-1 block font-medium text-maroon-900 hover:underline">{value}</a> : <p className="mt-1 font-medium text-maroon-900">{value}</p>}
              </div>
            </div>
          ))}
        </div>
        <ContactForm />
      </section>
    </>
  );
}
