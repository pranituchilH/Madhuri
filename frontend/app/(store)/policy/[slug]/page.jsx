import { notFound } from 'next/navigation';
import { SITE } from '@/lib/site';

// Template policy text — have it reviewed and adapted to the business before going live.
const POLICIES = {
  shipping: {
    title: 'Shipping Policy',
    body: [
      ['Processing time', 'Orders are processed and dispatched within 1–2 business days. Orders placed on Sundays or public holidays are processed the next business day.'],
      ['Delivery time', 'Most orders are delivered within 4–7 business days across India. Remote locations may take a little longer.'],
      ['Shipping charges', 'Shipping is free on orders above ₹1,999. A flat fee of ₹99 applies to smaller orders.'],
      ['Tracking', 'Once your order ships, the tracking number will appear on your order page under My Account.'],
    ],
  },
  returns: {
    title: 'Returns & Exchange',
    body: [
      ['Exchange window', 'You may request an exchange within 7 days of delivery. Sarees must be unused, unwashed and returned with original tags and packaging.'],
      ['Damaged or wrong items', 'If you receive a damaged or incorrect product, please contact us within 48 hours of delivery with an unboxing video and photos.'],
      ['Refunds', 'Approved refunds for prepaid orders are made to the original payment method within 5–7 business days. COD refunds are made by bank transfer or UPI.'],
      ['Non-returnable', 'Sarees with stitched blouses, falls or customisations cannot be returned.'],
    ],
  },
  privacy: {
    title: 'Privacy Policy',
    body: [
      ['Information we collect', 'We collect your name, contact details and shipping address to process orders, and your email if you subscribe to our newsletter.'],
      ['Payments', 'Online payments are processed securely by Razorpay. We never store your card or bank details on our servers.'],
      ['How we use it', 'Your information is used only to fulfil orders, provide support and — if you opt in — send updates and offers.'],
      ['Contact', `For any privacy questions, write to ${SITE.email}.`],
    ],
  },
  terms: {
    title: 'Terms of Service',
    body: [
      ['Products', 'We make every effort to display colours accurately; slight variations may occur due to lighting and screen settings. Handloom and zari products may have minor irregularities that add to their charm.'],
      ['Pricing', 'All prices are in Indian Rupees and inclusive of applicable taxes. Prices and availability may change without notice.'],
      ['Orders', 'We reserve the right to cancel an order in case of pricing errors, stock unavailability or suspected fraud. Any amount paid will be refunded in full.'],
      ['Governing law', 'These terms are governed by the laws of India.'],
    ],
  },
};

export function generateStaticParams() {
  return Object.keys(POLICIES).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  return { title: POLICIES[slug]?.title || 'Policy' };
}

export default async function PolicyPage({ params }) {
  const { slug } = await params;
  const policy = POLICIES[slug];
  if (!policy) notFound();
  return (
    <>
      <section className="jaali border-b border-gold-200">
        <div className="container py-14 text-center">
          <h1 className="font-display text-5xl font-semibold">{policy.title}</h1>
          <div className="gold-divider" />
        </div>
      </section>
      <article className="container max-w-3xl space-y-8 py-14">
        {policy.body.map(([h, p]) => (
          <section key={h}>
            <h2 className="font-display text-2xl">{h}</h2>
            <p className="mt-2 leading-relaxed text-ink-soft">{p}</p>
          </section>
        ))}
      </article>
    </>
  );
}
