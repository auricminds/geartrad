import { getTranslations, getLocale } from 'next-intl/server';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
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
  { id: '1', imageUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1400&q=80', linkUrl: '#', advertiserName: 'GearTrad', expiresAt: new Date('2027-01-01') },
  { id: '2', imageUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1400&q=80', linkUrl: '#', advertiserName: 'GearTrad', expiresAt: new Date('2027-01-01') },
  { id: '3', imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1400&q=80', linkUrl: '#', advertiserName: 'GearTrad', expiresAt: new Date('2027-01-01') },
];

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

      {/* Latest listings */}
      {top.length > 0 && (
        <FadeUp className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-white">{t('featured.title')}</h2>
              <p className="text-sm text-muted mt-0.5">
                {locale === 'ar' ? 'أحدث الإعلانات هذا الأسبوع' : 'Latest listings this week'}
              </p>
            </div>
            <Link href={`/${locale}/browse`} className="flex items-center gap-1 text-sm text-purple hover:text-purple-light transition-colors">
              <span>{t('featured.viewAll')}</span>
              <ArrowRight className={`w-4 h-4 ${locale === 'ar' ? 'rotate-180' : ''}`} />
            </Link>
          </div>
          <StaggerList className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {top.map((listing) => (
              <StaggerItem key={listing.id}>
                <ListingCard listing={listing} />
              </StaggerItem>
            ))}
          </StaggerList>
        </FadeUp>
      )}

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
        <section className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-purple/20 to-gold/10 border border-purple/20 p-5 sm:p-8 text-center mb-12">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(124,58,237,0.15),transparent_70%)]" />
          <div className="relative z-10">
            <h2 className="text-2xl font-bold text-white mb-2">
              {locale === 'ar' ? 'أعلن مع GearTrad' : 'Advertise with GearTrad'}
            </h2>
            <p className="text-muted mb-5 max-w-md mx-auto">
              {locale === 'ar'
                ? 'تواصل مع آلاف الجيمرز النشطين في مصر والشرق الأوسط.'
                : 'Reach thousands of active gamers across Egypt and MENA.'}
            </p>
            <Link
              href={`/${locale}/advertise`}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gold hover:bg-gold-light text-black font-semibold transition-all shadow-lg shadow-gold/30"
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
