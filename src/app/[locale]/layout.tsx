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

export const metadata: Metadata = {
  title: 'GearTrad — Gaming Marketplace for MENA',
  description:
    'Buy and sell gaming accounts, skins, weapons and more. The #1 trusted gaming marketplace in Egypt and MENA.',
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
