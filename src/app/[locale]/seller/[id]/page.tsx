import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Star, Shield, BadgeCheck, Package, ArrowLeft, CreditCard, CheckCircle2, Clock, AlertCircle, TrendingUp, MessageSquare } from 'lucide-react';
import { getProfile, getSellerListings, getSellerStats, getSellerReviews } from '@/lib/api';
import { ListingCard } from '@/components/listing/ListingCard';
import { SellerAnalytics } from '@/components/listing/SellerAnalytics';
import { cn } from '@/lib/utils';
import type { Metadata } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://geartrad.com';

interface Props {
  params: Promise<{ id: string; locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id, locale } = await params;
  const profile = await getProfile(id);
  if (!profile) return {};

  const title = `${profile.username} — GearTrad Seller`;
  const description = `Browse ${profile.username}'s gaming listings on GearTrad. ${profile.total_sales} sales, rated ${Number(profile.rating).toFixed(1)}/5.`;
  const url = `${SITE_URL}/${locale}/seller/${id}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { type: 'profile', url, title, description },
  };
}

export default async function SellerProfilePage({ params }: Props) {
  const { id, locale } = await params;
  const isAr = locale === 'ar';

  const [profile, listings, stats, reviews] = await Promise.all([
    getProfile(id),
    getSellerListings(id),
    getSellerStats(id),
    getSellerReviews(id),
  ]);

  if (!profile) notFound();

  const isTrusted = Number(profile.rating) >= 4.5 && profile.total_sales >= 5;
  const initials  = profile.username.slice(0, 2).toUpperCase();
  const stars     = Math.floor(Number(profile.rating));

  const paymentMethods = [
    { key: 'vodafone_number' as const, label: 'Vodafone Cash',  labelAr: 'فودافون كاش',       color: 'bg-red-500/10 border-red-500/20 text-red-400' },
    { key: 'orange_number'   as const, label: 'Orange Money',   labelAr: 'أورنج موني',         color: 'bg-orange-500/10 border-orange-500/20 text-orange-400' },
    { key: 'instapay_id'     as const, label: 'InstaPay',       labelAr: 'إنستاباي',           color: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' },
    { key: 'paypal_email'    as const, label: 'PayPal',         labelAr: 'باي بال',            color: 'bg-blue-500/10 border-blue-500/20 text-blue-400' },
    { key: 'crypto_wallet_usdt' as const, label: 'USDT',        labelAr: 'يو إس دي تي',        color: 'bg-green-500/10 border-green-500/20 text-green-400' },
    { key: 'crypto_wallet_btc'  as const, label: 'Bitcoin',     labelAr: 'بيتكوين',            color: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400' },
  ].filter((m) => !!profile[m.key]);
  const activeListings = listings.filter((l) => l.isAvailable);

  // Rank distribution across listings
  const rankCounts: Record<string, number> = {};
  listings.forEach((l) => { if (l.rank) rankCounts[l.rank] = (rankCounts[l.rank] ?? 0) + 1; });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <Link
        href={`/${locale}/browse`}
        className="inline-flex items-center gap-1.5 text-muted hover:text-white transition-colors text-sm mb-8"
      >
        <ArrowLeft className={cn('w-4 h-4', isAr && 'rotate-180')} />
        {isAr ? 'رجوع' : 'Back'}
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
        {/* Profile card */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-surface border border-border rounded-2xl p-6 text-center">
            {/* Avatar */}
            <div className="relative inline-block mb-4">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.username}
                  className="w-20 h-20 rounded-2xl object-cover shadow-lg shadow-purple/30 mx-auto"
                />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple to-purple-light flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-purple/30 mx-auto">
                  {initials}
                </div>
              )}
              {profile.is_verified && (
                <span className="absolute -bottom-1 -end-1 w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center border-2 border-background">
                  <Shield className="w-3 h-3 text-white" />
                </span>
              )}
            </div>

            <h1 className="text-xl font-bold text-white mb-1">{profile.username}</h1>

            {/* Badges */}
            <div className="flex flex-wrap gap-2 justify-center mb-4">
              {profile.is_verified && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
                  <Shield className="w-3 h-3" />
                  {isAr ? 'موثق' : 'Verified'}
                </span>
              )}
              {isTrusted && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gold/10 border border-gold/20 text-gold text-xs font-medium">
                  <BadgeCheck className="w-3 h-3" />
                  {isAr ? 'بائع موثوق' : 'Trusted Seller'}
                </span>
              )}
            </div>

            {/* Star rating */}
            <div className="flex items-center justify-center gap-1 mb-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={cn('w-4 h-4', i < stars ? 'fill-gold text-gold' : 'text-muted/30')} />
              ))}
            </div>
            <p className="text-white font-bold text-lg">{Number(profile.rating).toFixed(1)}</p>
            <p className="text-muted text-xs mb-1">{isAr ? 'التقييم' : 'Rating'}</p>
            {profile.bio && (
              <p className="text-xs text-muted/70 text-center leading-relaxed max-w-[200px] mb-3">{profile.bio}</p>
            )}

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <div className="bg-background rounded-xl p-3 text-center">
                <div className="flex items-center justify-center gap-1 mb-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <p className="text-lg font-bold text-white">{stats.successfulTrades}</p>
                </div>
                <p className="text-[11px] text-muted">{isAr ? 'صفقات ناجحة' : 'Successful Trades'}</p>
              </div>
              <div className="bg-background rounded-xl p-3 text-center">
                <div className="flex items-center justify-center gap-1 mb-0.5">
                  <Package className="w-3.5 h-3.5 text-purple" />
                  <p className="text-lg font-bold text-white">{activeListings.length}</p>
                </div>
                <p className="text-[11px] text-muted">{isAr ? 'إعلانات نشطة' : 'Active Listings'}</p>
              </div>
              {stats.openTrades > 0 && (
                <div className="bg-background rounded-xl p-3 text-center">
                  <div className="flex items-center justify-center gap-1 mb-0.5">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <p className="text-lg font-bold text-white">{stats.openTrades}</p>
                  </div>
                  <p className="text-[11px] text-muted">{isAr ? 'صفقات جارية' : 'Open Trades'}</p>
                </div>
              )}
              {stats.totalOrders > 0 && (
                <div className="bg-background rounded-xl p-3 text-center">
                  <div className="flex items-center justify-center gap-1 mb-0.5">
                    <TrendingUp className="w-3.5 h-3.5 text-gold" />
                    <p className="text-lg font-bold text-white">{stats.totalOrders}</p>
                  </div>
                  <p className="text-[11px] text-muted">{isAr ? 'إجمالي الطلبات' : 'Total Orders'}</p>
                </div>
              )}
            </div>

            {/* Message seller */}
            {profile.account_type === 'seller' && (
              <Link
                href={`/${locale}/browse?seller=${id}`}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-purple hover:bg-purple-light text-white text-sm font-medium transition-all"
              >
                <Package className="w-4 h-4" />
                {isAr ? 'عرض جميع الإعلانات' : 'View All Listings'}
              </Link>
            )}
          </div>

          {/* Rank distribution */}
          {Object.keys(rankCounts).length > 0 && (
            <div className="bg-surface border border-border rounded-2xl p-5">
              <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">
                {isAr ? 'توزيع التصنيفات' : 'Rank Distribution'}
              </h3>
              <div className="space-y-2">
                {Object.entries(rankCounts)
                  .sort((a, b) => b[1] - a[1])
                  .map(([rank, count]) => (
                    <div key={rank} className="flex items-center justify-between text-sm">
                      <span className="text-muted">{rank}</span>
                      <span className="text-white font-medium">{count} {isAr ? 'إعلان' : 'listings'}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Seller analytics */}
          <div className="bg-surface border border-border rounded-2xl p-5">
            <SellerAnalytics sellerId={id} locale={locale} />
          </div>

          {/* Payment methods */}
          {paymentMethods.length > 0 && (
            <div className="bg-surface border border-border rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <CreditCard className="w-3.5 h-3.5 text-muted" />
                <h3 className="text-xs font-semibold text-muted uppercase tracking-wider">
                  {isAr ? 'طرق الدفع المقبولة' : 'Accepted Payment Methods'}
                </h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {paymentMethods.map((m) => (
                  <span
                    key={m.key}
                    className={cn('inline-flex items-center px-2.5 py-1 rounded-lg border text-xs font-medium', m.color)}
                  >
                    {isAr ? m.labelAr : m.label}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Listings */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-white">
              {isAr ? 'إعلانات البائع' : "Seller's Listings"}
              <span className="text-muted font-normal text-sm ms-2">({activeListings.length})</span>
            </h2>
          </div>

          {activeListings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
              <Package className="w-10 h-10 text-muted/20" />
              <p className="text-muted text-sm">
                {isAr ? 'لا توجد إعلانات نشطة' : 'No active listings'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {activeListings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          )}

          {/* Sold / unavailable count */}
          {listings.length > activeListings.length && (
            <p className="text-center text-muted text-xs mt-6">
              +{listings.length - activeListings.length} {isAr ? 'إعلانات تم بيعها' : 'listings already sold'}
            </p>
          )}

          {/* Buyer reviews */}
          {reviews.length > 0 && (
            <div className="mt-10">
              <div className="flex items-center gap-2 mb-5">
                <MessageSquare className="w-4 h-4 text-muted" />
                <h2 className="text-lg font-bold text-white">
                  {isAr ? 'تقييمات المشترين' : 'Buyer Reviews'}
                  <span className="text-muted font-normal text-sm ms-2">({reviews.length})</span>
                </h2>
              </div>
              <div className="space-y-3">
                {reviews.map((review) => (
                  <div key={review.id} className="bg-surface border border-border rounded-2xl p-4">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-purple/20 flex items-center justify-center text-purple text-xs font-bold shrink-0">
                          {review.buyer?.username?.slice(0, 2).toUpperCase() ?? '??'}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{review.buyer?.username ?? 'Anonymous'}</p>
                          {review.listing?.title && (
                            <p className="text-[11px] text-muted truncate max-w-[200px]">{review.listing.title}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5 shrink-0">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={cn('w-3.5 h-3.5', i < review.buyer_rating ? 'fill-gold text-gold' : 'text-muted/30')} />
                        ))}
                      </div>
                    </div>
                    {review.buyer_comment && (
                      <p className="text-sm text-white/70 leading-relaxed">{review.buyer_comment}</p>
                    )}
                    <p className="text-[10px] text-muted mt-2">
                      {new Date(review.created_at).toLocaleDateString(isAr ? 'ar-EG' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
