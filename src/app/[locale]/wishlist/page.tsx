'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/components/providers/StoreProvider';
import { useLocale } from 'next-intl';
import { getWishlistListings } from '@/lib/api';
import { ListingCard } from '@/components/listing/ListingCard';
import { Heart, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { Listing } from '@/types';

export default function WishlistPage() {
  const { user, authLoading, likedIds } = useStore();
  const locale = useLocale();
  const isRTL  = locale === 'ar';

  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading]   = useState(false);

  useEffect(() => {
    if (!user) { setListings([]); return; }
    setLoading(true);
    getWishlistListings(user.id)
      .then(setListings)
      .catch(() => setListings([]))
      .finally(() => setLoading(false));
  }, [user, likedIds]);  // Re-fetch when likedIds changes so it stays in sync

  if (authLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-surface border border-border rounded-2xl overflow-hidden animate-pulse">
              <div className="aspect-[4/3] bg-white/5" />
              <div className="p-4 space-y-2">
                <div className="h-3 bg-white/5 rounded-full w-3/4" />
                <div className="h-3 bg-white/5 rounded-full w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-surface border border-border flex items-center justify-center mx-auto mb-4">
          <Heart className="w-7 h-7 text-muted/30" />
        </div>
        <p className="text-white font-semibold text-lg mb-2">
          {isRTL ? 'سجّل دخولك لرؤية مفضلتك' : 'Sign in to see your wishlist'}
        </p>
        <p className="text-muted text-sm mb-6">
          {isRTL ? 'احفظ الحسابات المفضلة لديك ولا تفوت الصفقات' : 'Save your favorite listings and never miss a deal'}
        </p>
        <Link
          href={`/${locale}/auth/sign-in`}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-purple hover:bg-purple-light text-white font-semibold transition-all"
        >
          {isRTL ? 'تسجيل الدخول' : 'Sign In'}
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex items-center gap-4 mb-8">
        <Link
          href={`/${locale}/browse`}
          className="flex items-center gap-1.5 text-muted hover:text-white transition-colors text-sm"
        >
          <ArrowLeft className={cn('w-4 h-4', isRTL && 'rotate-180')} />
          {locale === 'ar' ? 'رجوع للتصفح' : 'Back to Browse'}
        </Link>
      </div>

      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
          <Heart className="w-5 h-5 text-red-400 fill-current" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">
            {locale === 'ar' ? 'المفضلة' : 'Wishlist'}
          </h1>
          <p className="text-muted text-sm">
            {loading
              ? (locale === 'ar' ? 'جاري التحميل...' : 'Loading...')
              : listings.length === 0
              ? (locale === 'ar' ? 'لا توجد حسابات في المفضلة بعد' : 'No saved listings yet')
              : (locale === 'ar' ? `${listings.length} حساب محفوظ` : `${listings.length} saved listing${listings.length !== 1 ? 's' : ''}`)}
          </p>
        </div>
      </div>

      {!loading && listings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-5 text-center">
          <div className="w-20 h-20 rounded-2xl bg-surface border border-border flex items-center justify-center">
            <Heart className="w-9 h-9 text-muted/30" />
          </div>
          <div>
            <p className="text-white font-semibold text-lg mb-1">
              {locale === 'ar' ? 'مفضلتك فارغة' : 'Your wishlist is empty'}
            </p>
            <p className="text-muted text-sm max-w-xs">
              {locale === 'ar'
                ? 'اضغط على أيقونة القلب على أي حساب لحفظه هنا'
                : 'Tap the heart icon on any listing to save it here'}
            </p>
          </div>
          <Link
            href={`/${locale}/browse`}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple/10 border border-purple/30 text-purple text-sm font-medium hover:bg-purple/20 transition-all"
          >
            {locale === 'ar' ? 'تصفح الحسابات' : 'Browse Listings'}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </div>
  );
}
