import { getTranslations, getLocale } from 'next-intl/server';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { Metadata } from 'next';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const isAr = locale === 'ar';
  return {
    alternates: {
      canonical: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://geartrad.com'}/${locale}`,
      languages: {
        en: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://geartrad.com'}/en`,
        ar: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://geartrad.com'}/ar`,
      },
    },
    title: isAr
      ? 'جيرتراد — سوق الألعاب الأول في مصر والشرق الأوسط'
      : 'GearTrad — #1 Gaming Marketplace in Egypt & MENA',
    description: isAr
      ? 'اشتر وبع حسابات الألعاب والسكنات والأسلحة بأمان. حماية الضمان، توصيل فوري.'
      : 'Buy and sell gaming accounts, skins, and weapons safely. Escrow protection, instant delivery.',
  };
}
import { HeroBanner } from '@/components/home/HeroBanner';
import { StatsBar } from '@/components/home/StatsBar';
import { BestsellerStrip } from '@/components/home/BestsellerStrip';
import { HowItWorks } from '@/components/home/HowItWorks';
import { FAQ } from '@/components/home/FAQ';
import { RecommendationsSection } from '@/components/home/RecommendationsSection';
import { ListingCard } from '@/components/listing/ListingCard';
import { FadeUp, StaggerList, StaggerItem } from '@/components/ui/FadeUp';
import { getListings, getTopSellers } from '@/lib/api';
import type { AdBanner } from '@/types';

const adBanners: AdBanner[] = [
  { id: '1', imageUrl: '/banners/banner-1.webp', linkUrl: '#', advertiserName: 'GearTrad', expiresAt: new Date('2027-01-01') },
  { id: '2', imageUrl: '/banners/banner-2.webp', linkUrl: '#', advertiserName: 'GearTrad', expiresAt: new Date('2027-01-01') },
  { id: '3', imageUrl: '/banners/banner-3.webp', linkUrl: '#', advertiserName: 'GearTrad', expiresAt: new Date('2027-01-01') },
];

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://geartrad.com';

const orgJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'GearTrad',
  url: BASE,
  logo: { '@type': 'ImageObject', url: `${BASE}/logo.png`, width: 200, height: 60 },
  description: 'The #1 marketplace for buying and selling game accounts, skins, and in-game items in Egypt and the Middle East.',
  foundingDate: '2024',
  areaServed: ['EG', 'SA', 'AE', 'KW', 'QA', 'BH', 'JO', 'LB', 'IQ', 'MA', 'TN', 'DZ'],
  knowsAbout: ['Gaming accounts', 'Game skins', 'Valorant', 'Fortnite', 'CS2', 'PUBG Mobile', 'FIFA', 'League of Legends'],
  sameAs: [],
};

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'GearTrad',
  url: BASE,
  description: 'Buy and sell gaming accounts, skins, weapons and bundles safely in Egypt and MENA.',
  inLanguage: ['en', 'ar'],
  potentialAction: {
    '@type': 'SearchAction',
    target: { '@type': 'EntryPoint', urlTemplate: `${BASE}/en/browse?q={search_term_string}` },
    'query-input': 'required name=search_term_string',
  },
};

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Is GearTrad safe to use?',
      acceptedAnswer: { '@type': 'Answer', text: 'Yes. Every transaction is protected by escrow — your money is held by GearTrad and only released to the seller after you confirm receipt. You are never at risk of paying and getting nothing.' },
    },
    {
      '@type': 'Question',
      name: 'How does payment work on GearTrad?',
      acceptedAnswer: { '@type': 'Answer', text: 'We support Vodafone Cash, InstaPay, Bitcoin (BTC), USDT, and Ethereum. All payments go directly from buyer to seller — GearTrad charges no platform fees.' },
    },
    {
      '@type': 'Question',
      name: 'What happens if the seller does not deliver?',
      acceptedAnswer: { '@type': 'Answer', text: 'If the seller does not deliver, do NOT confirm delivery. Open a support ticket or contact a moderator. Our team investigates and issues a full refund if the seller is at fault.' },
    },
    {
      '@type': 'Question',
      name: 'What games are supported on GearTrad?',
      acceptedAnswer: { '@type': 'Answer', text: 'Valorant, Fortnite, CS2, League of Legends, PUBG Mobile, Apex Legends, FIFA, Call of Duty, Brawl Stars, and more. Any game works — just choose "Other" when posting.' },
    },
    {
      '@type': 'Question',
      name: 'Can I sell any type of gaming account?',
      acceptedAnswer: { '@type': 'Answer', text: 'Yes — accounts, skins, weapons, bundles, and tickets are all supported. You must own the item and accurately describe it. False listings result in an immediate ban.' },
    },
    {
      '@type': 'Question',
      name: 'Are there any fees for buying or selling?',
      acceptedAnswer: { '@type': 'Answer', text: 'No fees at all — for buyers or sellers. You pay or receive exactly the listed price. 100% of every sale goes to the seller.' },
    },
    {
      '@type': 'Question',
      name: 'How do I get a Verified badge?',
      acceptedAnswer: { '@type': 'Answer', text: 'Go to your profile and click Get Verified. Upload a photo of your government ID. Our moderators review within 24–48 hours.' },
    },
    {
      '@type': 'Question',
      name: 'How long does delivery usually take?',
      acceptedAnswer: { '@type': 'Answer', text: 'Most sellers deliver within a few hours after payment. You can chat directly with the seller to coordinate. Always confirm delivery only after testing the account.' },
    },
  ],
};

export default async function HomePage() {
  const t = await getTranslations('home');
  const locale = await getLocale();

  const [featuredListings, allListings, topSellers] = await Promise.all([
    getListings({ boosted: true, limit: 3 }),
    getListings({ limit: 6 }),
    getTopSellers(6),
  ]);

  const featured = featuredListings.length > 0 ? featuredListings : allListings.slice(0, 3);
  const top = allListings.length > 0 ? allListings : [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      {/* Hero — no entrance delay, it's above the fold */}
      <HeroBanner banners={adBanners} />

      {/* Stats — count-up triggers when in view */}
      <StatsBar />

      {/* Featured / Boosted Listings */}
      {featured.length > 0 && (
        <FadeUp className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-white">{t('featured.title')}</h2>
              <p className="text-sm text-muted mt-0.5">{t('featured.subtitle')}</p>
            </div>
            <Link href={`/${locale}/browse`} className="flex items-center gap-1 text-sm text-purple hover:text-purple-light transition-colors">
              <span>{t('featured.viewAll')}</span>
              <ArrowRight className={`w-4 h-4 ${locale === 'ar' ? 'rotate-180' : ''}`} />
            </Link>
          </div>
          <StaggerList className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {featured.map((listing) => (
              <StaggerItem key={listing.id}>
                <ListingCard listing={listing} />
              </StaggerItem>
            ))}
          </StaggerList>
        </FadeUp>
      )}

      <FadeUp delay={0.05}>
        <BestsellerStrip sellers={topSellers} />
      </FadeUp>

      {/* Smart recommendations — client-side, reads localStorage */}
      <RecommendationsSection />

      <FadeUp delay={0.05}>
        <HowItWorks />
      </FadeUp>

      {top.length === 0 && (
        <FadeUp className="mb-12 text-center py-16">
          <p className="text-muted text-lg mb-4">
            {locale === 'ar' ? 'لا توجد إعلانات بعد — كن أول من يبيع!' : 'No listings yet — be the first to sell!'}
          </p>
          <Link
            href={`/${locale}/auth/sign-up?type=seller`}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gold hover:bg-gold-light text-black font-semibold transition-all shadow-lg shadow-gold/25"
          >
            {locale === 'ar' ? 'أضف إعلانك الأول' : 'Add Your First Listing'}
          </Link>
        </FadeUp>
      )}

      {/* FAQ — right before footer */}
      <FadeUp delay={0.05}>
        <FAQ />
      </FadeUp>

      {/* Advertise CTA */}
      <FadeUp>
        <section className="relative rounded-2xl overflow-hidden border border-purple/25 p-5 sm:p-8 text-center mb-12">
          {/* Layered background */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple/15 via-surface to-gold/8" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(124,58,237,0.2),transparent_65%)]" />
          {/* Ambient corner orbs */}
          <div className="absolute -top-8 -left-8 w-40 h-40 bg-purple/20 rounded-full blur-[60px] pointer-events-none" />
          <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-gold/15 rounded-full blur-[50px] pointer-events-none" />

          <div className="relative z-10">
            <h2 className="text-2xl font-bold text-white mb-2">
              {locale === 'ar' ? 'أعلن مع GearTrad' : 'Advertise with GearTrad'}
            </h2>
            <p className="text-muted mb-5 max-w-md mx-auto text-sm">
              {locale === 'ar'
                ? 'تواصل مع آلاف الجيمرز النشطين في مصر والشرق الأوسط.'
                : 'Reach thousands of active gamers across Egypt and MENA.'}
            </p>
            <Link
              href={`/${locale}/advertise`}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gold hover:bg-gold-light text-black font-semibold transition-all shadow-lg shadow-gold/30 hover:shadow-gold/50 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]"
            >
              {locale === 'ar' ? 'ابدأ الآن' : 'Get Started'}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      </FadeUp>

    </div>
  );
}
