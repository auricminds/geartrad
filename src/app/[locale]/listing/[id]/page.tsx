import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Heart, Star, Shield, Trophy, Zap, Clock, BadgeCheck, Timer } from 'lucide-react';
import { getListing, getListings } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { formatPrice } from '@/lib/utils';
import { ListingCard } from '@/components/listing/ListingCard';
import { ListingActions } from '@/components/listing/ListingActions';
import { ListingMobileBar } from '@/components/listing/ListingMobileBar';
import { ListingViewers } from '@/components/listing/ListingViewers';
import { SellerAnalytics } from '@/components/listing/SellerAnalytics';
import { ActivityTracker } from '@/components/listing/ActivityTracker';
import type { Metadata } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://geartrad.com';

interface ListingPageProps {
  params: Promise<{ id: string; locale: string }>;
}

export async function generateMetadata({ params }: ListingPageProps): Promise<Metadata> {
  const { id, locale } = await params;
  const listing = await getListing(id);
  if (!listing) return {};

  const title = locale === 'ar' && listing.titleAr ? listing.titleAr : listing.title;
  const description = locale === 'ar' && listing.descriptionAr
    ? listing.descriptionAr
    : listing.description ?? `Buy ${listing.title} on GearTrad. ${listing.game} ${listing.type} by verified seller ${listing.seller.username}.`;
  const url = `${SITE_URL}/${locale}/listing/${id}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      url,
      title,
      description,
      images: listing.coverImage ? [{ url: listing.coverImage, width: 800, height: 600, alt: title }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: listing.coverImage ? [listing.coverImage] : [],
    },
  };
}

export default async function ListingPage({ params }: ListingPageProps) {
  const { id, locale } = await params;
  const t = await getTranslations('listing');

  const listing = await getListing(id);
  if (!listing) notFound();

  const displayTitle = locale === 'ar' && listing.titleAr ? listing.titleAr : listing.title;
  const displayDesc  = locale === 'ar' && listing.descriptionAr ? listing.descriptionAr : listing.description;

  const related = (await getListings({ game: listing.game, limit: 4 }))
    .filter((l) => l.id !== id)
    .slice(0, 3);

  const isTrusted = listing.seller.rating >= 4.5 && listing.seller.totalSales >= 5;

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/${locale}` },
      { '@type': 'ListItem', position: 2, name: locale === 'ar' ? 'تصفح الإعلانات' : 'Browse', item: `${SITE_URL}/${locale}/browse` },
      { '@type': 'ListItem', position: 3, name: listing.game, item: `${SITE_URL}/${locale}/browse?game=${encodeURIComponent(listing.game)}` },
      { '@type': 'ListItem', position: 4, name: displayTitle, item: `${SITE_URL}/${locale}/listing/${id}` },
    ],
  };

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: listing.title,
    description: listing.description ?? `${listing.title} — ${listing.game} ${listing.type} on GearTrad`,
    image: listing.coverImage,
    url: `${SITE_URL}/${locale}/listing/${id}`,
    offers: {
      '@type': 'Offer',
      price: listing.price,
      priceCurrency: 'EGP',
      availability: listing.isAvailable
        ? 'https://schema.org/InStock'
        : 'https://schema.org/SoldOut',
      seller: {
        '@type': 'Person',
        name: listing.seller.username,
        url: `${SITE_URL}/${locale}/seller/${listing.seller.id}`,
      },
    },
    aggregateRating: listing.seller.rating > 0 ? {
      '@type': 'AggregateRating',
      ratingValue: listing.seller.rating,
      reviewCount: listing.seller.totalSales || 1,
      bestRating: 5,
      worstRating: 1,
    } : undefined,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 pb-28 lg:pb-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Track game activity for recommendations */}
      <ActivityTracker game={listing.game} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Image + Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="space-y-2">
            <div className="relative rounded-2xl overflow-hidden aspect-video">
              <img src={listing.coverImage} alt={displayTitle} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent" />

              <div className="absolute top-4 start-4 flex gap-2 flex-wrap">
                {listing.isBoosted && (
                  <Badge variant="purple"><Zap className="w-3 h-3" />{t('adBoosted')}</Badge>
                )}
                {listing.seller.isVerified && (
                  <Badge variant="green"><Shield className="w-3 h-3" />{t('verified')}</Badge>
                )}
              </div>

              {listing.rank && (
                <div className="absolute bottom-4 start-4 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/60">
                  <Trophy className="w-4 h-4 text-gold" />
                  <span className="text-sm font-bold text-gold">{listing.rank}</span>
                </div>
              )}
            </div>

            {/* Additional images gallery */}
            {listing.images && listing.images.length > 0 && (
              <div className="grid grid-cols-4 gap-2">
                {listing.images.map((img, idx) => (
                  <div key={idx} className="relative rounded-xl overflow-hidden aspect-square border border-border">
                    <img src={img} alt={`${displayTitle} photo ${idx + 2}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <Badge variant="purple">{listing.game}</Badge>
              <Badge variant="default">{listing.type}</Badge>
              {/* Live viewer count */}
              <ListingViewers listingId={id} />
            </div>
            <h1 className="text-2xl font-bold text-white leading-tight mb-2">{displayTitle}</h1>
            <div className="flex items-center gap-4 text-sm text-muted">
              <span className="flex items-center gap-1">
                <Heart className="w-4 h-4" /> {listing.likes.toLocaleString()}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {new Date(listing.createdAt).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-EG')}
              </span>
            </div>
          </div>

          {listing.stats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {listing.stats.level != null && (
                <div className="p-3 rounded-xl bg-surface border border-border text-center">
                  <p className="text-lg font-bold text-white">{listing.stats.level}</p>
                  <p className="text-xs text-muted">{locale === 'ar' ? 'المستوى' : 'Level'}</p>
                </div>
              )}
              {listing.stats.hoursPlayed != null && (
                <div className="p-3 rounded-xl bg-surface border border-border text-center">
                  <p className="text-lg font-bold text-white">{listing.stats.hoursPlayed.toLocaleString()}</p>
                  <p className="text-xs text-muted">{locale === 'ar' ? 'ساعة لعب' : 'Hours Played'}</p>
                </div>
              )}
              {listing.stats.winRate != null && (
                <div className="p-3 rounded-xl bg-surface border border-border text-center">
                  <p className="text-lg font-bold text-white">{listing.stats.winRate}%</p>
                  <p className="text-xs text-muted">{locale === 'ar' ? 'معدل الفوز' : 'Win Rate'}</p>
                </div>
              )}
              {listing.stats.achievements != null && (
                <div className="p-3 rounded-xl bg-surface border border-border text-center">
                  <p className="text-lg font-bold text-white">{listing.stats.achievements}</p>
                  <p className="text-xs text-muted">{locale === 'ar' ? 'إنجاز' : 'Achievements'}</p>
                </div>
              )}
            </div>
          )}

          <div className="bg-surface border border-border rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-white mb-3 uppercase tracking-wider">{t('description')}</h2>
            <p className="text-muted text-sm leading-relaxed whitespace-pre-line">{displayDesc}</p>
          </div>
        </div>

        {/* Right: Purchase Card + Seller */}
        <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="hidden lg:block bg-surface border border-border rounded-2xl p-6 space-y-4">
            <div>
              <p className="text-sm text-muted mb-1">{t('price')}</p>
              <p className="text-3xl font-bold text-white">{formatPrice(listing.price, locale)}</p>
            </div>
            <ListingActions listing={listing} />
          </div>

          {/* Seller card */}
          <div className="bg-surface border border-border rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">{t('sellerInfo')}</h3>
            <a href={`/${locale}/seller/${listing.seller.id}`} className="flex items-center gap-3 mb-4 group/seller">
              <div className="w-12 h-12 rounded-2xl bg-purple/20 flex items-center justify-center text-xl font-bold text-purple group-hover/seller:bg-purple/30 transition-colors">
                {listing.seller.username.charAt(0)}
              </div>
              <div>
                <p className="font-semibold text-white group-hover/seller:text-purple transition-colors">{listing.seller.username}</p>
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`w-3 h-3 ${i < Math.floor(listing.seller.rating) ? 'fill-gold text-gold' : 'text-muted'}`} />
                  ))}
                  <span className="text-xs text-muted ms-1">({listing.seller.totalSales} {locale === 'ar' ? 'بيعة' : 'sales'})</span>
                </div>
              </div>
              <span className="ms-auto text-xs text-muted/50 group-hover/seller:text-purple transition-colors">View profile →</span>
            </a>

            {/* Seller badges */}
            <div className="flex flex-wrap gap-2 mb-4">
              {listing.seller.isVerified && (
                <Badge variant="green" className="text-xs">
                  <Shield className="w-3 h-3" />
                  {locale === 'ar' ? 'بائع موثق' : 'Verified Seller'}
                </Badge>
              )}
              {isTrusted && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-gold/10 border border-gold/20 text-gold text-xs font-medium">
                  <BadgeCheck className="w-3 h-3" />
                  {locale === 'ar' ? 'بائع موثوق' : 'Trusted Seller'}
                </span>
              )}
            </div>

            {/* Seller analytics (client-fetched) */}
            <SellerAnalytics sellerId={listing.seller.id} locale={locale} />
          </div>
        </div>
      </div>

      <ListingMobileBar listing={listing} />

      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="text-xl font-bold text-white mb-6">
            {locale === 'ar' ? 'حسابات مشابهة' : 'Related Listings'}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {related.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
