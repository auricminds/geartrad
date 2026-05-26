import { notFound } from 'next/navigation';
import { getListing } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import { CheckoutClient } from '@/components/checkout/CheckoutClient';
import { Shield, Star, Lock, RefreshCw, HeadphonesIcon } from 'lucide-react';
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

  // Derive which payment method IDs the seller has set up
  const pm = listing.seller.paymentMethods ?? {};
  const sellerMethods: string[] = [
    pm.vodafone && 'vodafone',
    pm.orange   && 'orange',
    pm.instapay && 'instapay',
    pm.paypal   && 'paypal',
    pm.usdt     && 'usdt',
    pm.btc      && 'btc',
    pm.eth      && 'eth',
  ].filter(Boolean) as string[];

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
            total={listing.price}
            sellerMethods={sellerMethods}
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
              <div className="flex justify-between font-bold text-white text-base">
                <span>{locale === 'ar' ? 'الإجمالي' : 'Total'}</span>
                <span>{formatPrice(listing.price, locale)}</span>
              </div>
              <p className="text-[11px] text-emerald-400">
                {locale === 'ar' ? '✓ لا توجد رسوم إضافية' : '✓ No platform fees'}
              </p>
            </div>
          </div>

          {/* Trust signals */}
          <div className="space-y-2">
            {[
              {
                icon: Shield,
                color: 'text-emerald-400',
                bg: 'bg-emerald-500/5 border-emerald-500/20',
                titleEn: 'Escrow Protection',
                titleAr: 'حماية الضمان',
                descEn: "Seller receives payment ONLY after you confirm delivery.",
                descAr: 'البائع يتلقى المبلغ فقط بعد تأكيدك الاستلام.',
              },
              {
                icon: Lock,
                color: 'text-blue-400',
                bg: 'bg-blue-500/5 border-blue-500/20',
                titleEn: 'Credential Lock',
                titleAr: 'تأمين بيانات الدخول',
                descEn: 'Account credentials are encrypted and only released after confirmed payment.',
                descAr: 'بيانات الدخول مشفرة ولا تُسلَّم إلا بعد تأكيد الدفع.',
              },
              {
                icon: RefreshCw,
                color: 'text-amber-400',
                bg: 'bg-amber-500/5 border-amber-500/20',
                titleEn: 'Dispute Protection',
                titleAr: 'حماية النزاعات',
                descEn: "If the seller doesn't deliver, open a ticket and we'll refund you.",
                descAr: 'إذا لم يسلّم البائع، افتح تذكرة وسنعيد لك المبلغ.',
              },
              {
                icon: HeadphonesIcon,
                color: 'text-purple',
                bg: 'bg-purple/5 border-purple/20',
                titleEn: '24/7 Support',
                titleAr: 'دعم على مدار الساعة',
                descEn: 'Our moderation team is always available to resolve issues.',
                descAr: 'فريق الإشراف متاح دائماً لحل المشكلات.',
              },
            ].map(({ icon: Icon, color, bg, titleEn, titleAr, descEn, descAr }) => (
              <div key={titleEn} className={`flex items-start gap-3 p-3.5 rounded-xl border ${bg}`}>
                <Icon className={`w-4 h-4 ${color} shrink-0 mt-0.5`} />
                <div>
                  <p className={`text-xs font-semibold ${color} mb-0.5`}>
                    {locale === 'ar' ? titleAr : titleEn}
                  </p>
                  <p className="text-xs text-muted leading-relaxed">
                    {locale === 'ar' ? descAr : descEn}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Seller's accepted payment methods */}
          {sellerMethods.length > 0 && (() => {
            const labels: Record<string, string> = {
              vodafone: 'Vodafone Cash', orange: 'Orange Money', instapay: 'InstaPay',
              paypal: 'PayPal', usdt: 'USDT', btc: 'BTC', eth: 'ETH',
            };
            return (
              <div className="p-4 rounded-xl border border-border bg-surface/50">
                <p className="text-xs text-muted mb-3 text-center uppercase tracking-wider">
                  {locale === 'ar' ? 'وسائل الدفع المقبولة من البائع' : 'Seller Accepts'}
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {sellerMethods.map((id) => (
                    <span key={id} className="px-2.5 py-1 rounded-lg bg-white/5 border border-border text-xs text-white/60 font-medium">
                      {labels[id] ?? id}
                    </span>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
