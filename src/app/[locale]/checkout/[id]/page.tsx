import { notFound } from 'next/navigation';
import { getListing } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import { CheckoutClient } from '@/components/checkout/CheckoutClient';
import { Shield, Star } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

interface CheckoutPageProps {
  params: Promise<{ id: string; locale: string }>;
}

export default async function CheckoutPage({ params }: CheckoutPageProps) {
  const { id, locale } = await params;
  await getTranslations('checkout');

  const listing = await getListing(id);
  if (!listing) notFound();
  if (!listing.isAvailable) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <p className="text-white font-semibold text-xl mb-2">
          {locale === 'ar' ? 'هذا الإعلان لم يعد متاحاً' : 'This listing is no longer available'}
        </p>
        <p className="text-muted text-sm">
          {locale === 'ar' ? 'ربما تم بيعه بالفعل. تصفح إعلانات أخرى.' : 'It may have already been sold. Browse other listings.'}
        </p>
      </div>
    );
  }

  const displayTitle = locale === 'ar' && listing.titleAr ? listing.titleAr : listing.title;
  const platformFee  = Math.round(listing.price * 0.05);
  const total        = listing.price + platformFee;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-2xl font-bold text-white mb-8">
        {locale === 'ar' ? 'إتمام الشراء' : 'Checkout'}
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3">
          <CheckoutClient
            locale={locale}
            listingId={listing.id}
            sellerId={listing.seller.id}
            total={total}
            platformFee={platformFee}
          />
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="bg-surface border border-border rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              {locale === 'ar' ? 'ملخص الطلب' : 'Order Summary'}
            </h2>

            <div className="flex gap-3 mb-5">
              <img src={listing.coverImage} alt={displayTitle} className="w-16 h-16 rounded-xl object-cover shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-white leading-snug line-clamp-2">{displayTitle}</p>
                <p className="text-xs text-muted mt-1">{listing.game}</p>
                {listing.rank && <p className="text-xs text-purple mt-0.5">{listing.rank}</p>}
              </div>
            </div>

            <div className="flex items-center gap-2 mb-5 pb-5 border-b border-border">
              <div className="w-7 h-7 rounded-full bg-purple/20 flex items-center justify-center text-xs font-bold text-purple">
                {listing.seller.username.charAt(0)}
              </div>
              <span className="text-xs text-muted">{listing.seller.username}</span>
              <div className="flex items-center gap-0.5 ms-auto">
                <Star className="w-3 h-3 fill-gold text-gold" />
                <span className="text-xs text-white">{listing.seller.rating}</span>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-muted">
                <span>{locale === 'ar' ? 'سعر الحساب' : 'Listing price'}</span>
                <span className="text-white">{formatPrice(listing.price, locale)}</span>
              </div>
              <div className="flex justify-between text-muted">
                <span>{locale === 'ar' ? 'رسوم المنصة (5%)' : 'Platform fee (5%)'}</span>
                <span className="text-white">{formatPrice(platformFee, locale)}</span>
              </div>
              <div className="flex justify-between font-bold text-white text-base pt-3 border-t border-border">
                <span>{locale === 'ar' ? 'الإجمالي' : 'Total'}</span>
                <span>{formatPrice(total, locale)}</span>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
            <Shield className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-emerald-400 mb-0.5">
                {locale === 'ar' ? 'دفع محمي' : 'Protected Payment'}
              </p>
              <p className="text-xs text-muted leading-relaxed">
                {locale === 'ar'
                  ? 'لن يتلقى البائع المبلغ حتى تؤكد استلام الحساب بشكل صحيح'
                  : "The seller won't receive payment until you confirm the account was delivered correctly"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
