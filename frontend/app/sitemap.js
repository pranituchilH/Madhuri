import { apiSafe } from '@/lib/api';

export const revalidate = 3600;

export default async function sitemap() {
  const site = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const data = await apiSafe('/products?limit=48');
  const pages = ['', '/shop', '/about', '/contact', '/policy/shipping', '/policy/returns', '/policy/privacy', '/policy/terms'];
  return [
    ...pages.map((p) => ({ url: `${site}${p}`, changeFrequency: 'weekly', priority: p === '' ? 1 : 0.6 })),
    ...(data?.products || []).map((p) => ({ url: `${site}/product/${p.slug}`, lastModified: p.created_at, changeFrequency: 'weekly', priority: 0.8 })),
  ];
}
