'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { ShoppingCart, MessageCircle, Heart, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useStore } from '@/components/providers/StoreProvider';
import { Listing } from '@/types';
import { cn } from '@/lib/utils';

interface ListingActionsProps {
  listing: Listing;
}

export function ListingActions({ listing }: ListingActionsProps) {
  const t = useTranslations('listing');
  const locale = useLocale();
  const router = useRouter();
  const { addToCart, isInCart, toggleLike, isLiked } = useStore();
  const [likeCount, setLikeCount] = useState(listing.likes);

  const inCart = isInCart(listing.id);
  const liked = isLiked(listing.id);

  const handleLike = () => {
    toggleLike(listing.id);
    setLikeCount((c) => (liked ? c - 1 : c + 1));
  };

  const handleCart = () => {
    if (!inCart) addToCart(listing);
  };

  return (
    <div className="space-y-3">
      {/* Buy Now */}
      <Button
        className="w-full"
        size="lg"
        onClick={() => router.push(`/${locale}/checkout/${listing.id}`)}
      >
        {t('buyNow')}
      </Button>

      {/* Add to Cart */}
      <button
        type="button"
        onClick={handleCart}
        className={cn(
          'w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl text-base font-medium transition-all duration-200 border',
          inCart
            ? 'bg-green-500/20 text-green-400 border-green-500/30 cursor-default'
            : 'bg-surface text-white border-border hover:border-purple/40 hover:bg-purple/5'
        )}
      >
        {inCart ? (
          <>
            <Check className="w-4 h-4" />
            {locale === 'ar' ? 'في السلة' : 'Added to Cart'}
          </>
        ) : (
          <>
            <ShoppingCart className="w-4 h-4" />
            {t('addToCart')}
          </>
        )}
      </button>

      {/* Chat with Seller */}
      <Button
        variant="outline"
        className="w-full"
        size="lg"
        onClick={() =>
          router.push(`/${locale}/chat?listing=${listing.id}`)
        }
      >
        <MessageCircle className="w-4 h-4" />
        {t('chatSeller')}
      </Button>

      {/* Save to Wishlist */}
      <button
        type="button"
        onClick={handleLike}
        className={cn(
          'w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-medium transition-all duration-200',
          liked
            ? 'text-red-400 bg-red-500/10 border border-red-500/20'
            : 'text-muted hover:text-white hover:bg-white/5 border border-border/50'
        )}
      >
        <Heart className={cn('w-4 h-4', liked && 'fill-current')} />
        {liked
          ? locale === 'ar'
            ? `في المفضلة (${likeCount.toLocaleString()})`
            : `Saved (${likeCount.toLocaleString()})`
          : locale === 'ar'
          ? `أضف للمفضلة (${likeCount.toLocaleString()})`
          : `Save to Wishlist (${likeCount.toLocaleString()})`}
      </button>

      <p className="text-xs text-muted text-center pt-2 border-t border-border">
        {locale === 'ar'
          ? 'الدفع محمي — لن يحصل البائع على المبلغ حتى تؤكد الاستلام'
          : 'Protected payment — seller receives funds only after you confirm delivery'}
      </p>
    </div>
  );
}
