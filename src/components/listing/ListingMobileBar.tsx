'use client';

import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { ShoppingCart, MessageCircle, Check } from 'lucide-react';
import type { Listing } from '@/types';
import { formatPrice, cn } from '@/lib/utils';
import { useStore } from '@/components/providers/StoreProvider';

interface ListingMobileBarProps {
  listing: Listing;
}

export function ListingMobileBar({ listing }: ListingMobileBarProps) {
  const locale = useLocale();
  const router = useRouter();
  const { addToCart, isInCart } = useStore();
  const inCart = isInCart(listing.id);

  const handleCart = () => {
    if (!inCart) addToCart(listing);
  };

  return (
    <div
      className="lg:hidden fixed bottom-0 inset-x-0 bg-surface border-t border-border px-4 pt-3"
      style={{ zIndex: 45, paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom, 0.75rem))' }}
    >
      <div className="flex items-center gap-3 max-w-7xl mx-auto">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-muted leading-none mb-0.5">
            {locale === 'ar' ? 'السعر' : 'Price'}
          </p>
          <p className="text-base font-bold text-white leading-tight truncate">
            {formatPrice(listing.price, locale)}
          </p>
        </div>

        <button
          type="button"
          onClick={() => router.push(`/${locale}/chat?listing=${listing.id}`)}
          className="p-2.5 rounded-xl bg-surface border border-border text-muted hover:text-white hover:border-purple/40 transition-all shrink-0"
          aria-label={locale === 'ar' ? 'تواصل مع البائع' : 'Chat with seller'}
        >
          <MessageCircle className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={handleCart}
          disabled={inCart}
          className={cn(
            'p-2.5 rounded-xl border transition-all shrink-0',
            inCart
              ? 'bg-green-500/20 border-green-500/30 text-green-400 cursor-default'
              : 'bg-surface border-border text-muted hover:text-white hover:border-purple/40'
          )}
          aria-label={inCart
            ? (locale === 'ar' ? 'في السلة' : 'In cart')
            : (locale === 'ar' ? 'أضف للسلة' : 'Add to cart')}
        >
          {inCart ? <Check className="w-5 h-5" /> : <ShoppingCart className="w-5 h-5" />}
        </button>

        <button
          type="button"
          onClick={() => router.push(`/${locale}/checkout/${listing.id}`)}
          className="px-4 py-2.5 rounded-xl bg-purple hover:bg-purple-light text-white font-semibold text-sm shadow-lg shadow-purple/25 transition-all shrink-0"
        >
          {locale === 'ar' ? 'اشتري الآن' : 'Buy Now'}
        </button>
      </div>
    </div>
  );
}
