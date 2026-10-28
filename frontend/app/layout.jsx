import Providers from './providers';
import './globals.css';

const FONTS =
  'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600&family=Jost:wght@300;400;500;600&display=swap';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: 'Madhuri Sarees — Elegance Woven in Every Thread', template: '%s | Madhuri Sarees' },
  description:
    'Shop handpicked Banarasi silk sarees with rich zari borders — wedding, festive and everyday drapes from Madhuri Sarees. Secure payments, free shipping above ₹1,999.',
  icons: { icon: '/favicon.png', apple: '/favicon.png' },
  openGraph: { type: 'website', siteName: 'Madhuri Sarees', images: ['/brand/og.jpg'] },
};

export const viewport = { themeColor: '#741331' };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link rel="stylesheet" href={FONTS} />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
