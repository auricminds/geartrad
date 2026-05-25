import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { CartDrawer } from '@/components/layout/CartDrawer';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { StoreProvider } from '@/components/providers/StoreProvider';
import { PageTransition } from '@/components/ui/PageTransition';
import { getDir } from '@/lib/utils';
import type { Metadata } from 'next';

const SITE_URL = 'https://geartrad.com';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'GearTrad — #1 Gaming Marketplace in Egypt & MENA',
    template: '%s | GearTrad',
  },
  description: 'Buy and sell gaming accounts, skins, weapons and bundles safely. Escrow protection, instant delivery. Valorant, Fortnite, CS2, League of Legends and more.',
  keywords: ['gaming marketplace', 'buy gaming accounts', 'sell gaming accounts', 'gaming skins', 'Egypt gaming', 'MENA gaming', 'Valorant accounts', 'Fortnite skins', 'CS2 accounts'],
  authors: [{ name: 'GearTrad', url: SITE_URL }],
  creator: 'GearTrad',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: SITE_URL,
    siteName: 'GearTrad',
    title: 'GearTrad — #1 Gaming Marketplace in Egypt & MENA',
    description: 'Buy and sell gaming accounts, skins, weapons and bundles safely. Escrow protection, instant delivery.',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'GearTrad Gaming Marketplace' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GearTrad — #1 Gaming Marketplace in Egypt & MENA',
    description: 'Buy and sell gaming accounts, skins, weapons and bundles safely.',
    images: ['/og-image.png'],
  },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
  alternates: { canonical: SITE_URL },
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as 'en' | 'ar')) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html lang={locale} dir={getDir(locale)} data-scroll-behavior="smooth" suppressHydrationWarning>
      <body className="bg-background text-white antialiased">
        <NextIntlClientProvider messages={messages}>
          <StoreProvider>
            <Navbar />
            <CartDrawer />
            <main className="min-h-screen pb-14 md:pb-0">
              <PageTransition>{children}</PageTransition>
            </main>
            <MobileBottomNav />
            <Footer />
          </StoreProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
