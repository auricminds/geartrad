'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { Heart, ShoppingCart, Star, Shield, Zap, Trophy, Check, Timer, BadgeCheck, Crown } from 'lucide-react';
import { motion } from 'framer-motion';
import { Listing } from '@/types';
import { Badge } from '@/components/ui/badge';
import { TiltCard } from '@/components/ui/TiltCard';
import { useStore } from '@/components/providers/StoreProvider';
import { formatPrice, cn } from '@/lib/utils';
import { trackGameActivity } from '@/components/home/RecommendationsSection';

interface ListingCardProps {
  listing: Listing;
  size?: 'sm' | 'md' | 'lg';
}

const rankColors: Record<string, string> = {
  Bronze: 'text-amber-600',
  Silver: 'text-slate-400',
  Gold: 'text-gold',
  Platinum: 'text-cyan-400',
  Diamond: 'text-blue-400',
  Ascendant: 'text-emerald-400',
  Immortal: 'text-red-400',
  Radiant: 'text-gold',
  Master: 'text-purple-400',
  Grandmaster: 'text-red-400',
  Challenger: 'text-gold',
  Conqueror: 'text-gold',
  Predator: 'text-red-400',
  Masters: 'text-gold',
};

const rankGlows: Record<string, string> = {
  Diamond: 'shadow-blue-500/20',
  Master: 'shadow-purple/20',
  Immortal: 'shadow-red-500/20',
  Radiant: 'shadow-gold/20',
  Grandmaster: 'shadow-red-500/20',
  Challenger: 'shadow-gold/20',
  Conqueror: 'shadow-gold/20',
  Predator: 'shadow-red-500/20',
};

// Badge helpers — computed from existing profile data
function isTrustedSeller(listing: Listing) {
  return listing.seller.rating >= 4.5 && listing.seller.totalSales >= 5;
}

function isFastResponder(listing: Listing & { seller: { avgResponseHours?: number } }) {
  return typeof listing.seller.avgResponseHours === 'number' && listing.seller.avgResponseHours <= 2;
}

export function ListingCard({ listing, size = 'md' }: ListingCardProps) {
  const t = useTranslations('listing');
  const locale = useLocale();
  const { addToCart, isInCart, toggleLike, isLiked } = useStore();

  const liked = isLiked(listing.id);
  const inCart = isInCart(listing.id);
  const [likeCount, setLikeCount] = useState(listing.likes);

  const displayTitle = locale === 'ar' && listing.titleAr ? listing.titleAr : listing.title;

  const trusted = isTrustedSeller(listing);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fastResponder = isFastResponder(listing as any);

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleLike(listing.id);
    setLikeCount((c) => (liked ? c - 1 : c + 1));
  };

  const handleCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!inCart) addToCart(listing);
  };

  const handleClick = () => {
    trackGameActivity(listing.game);
  };

  return (
    <Link href={`/${locale}/listing/${listing.id}`} onClick={handleClick}>
      <TiltCard
        max={6}
        className={cn(
          'group relative bg-surface border rounded-2xl overflow-hidden card-scan',
          'transition-all duration-300 ease-out',
          listing.seller.role === 'admin'
            ? 'border-gold/40 hover:border-gold/60 shadow-depth-gold'
            : listing.isBoosted
              ? 'neon-border border-purple/30 shadow-depth-purple'
              : 'border-border hover:border-purple/40 shadow-depth',
        )}
      >
        {/* Cover Image */}
        <div className="relative overflow-hidden aspect-[4/3]">
          <img
            src={listing.coverImage}
            alt={displayTitle}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-107"
          />
          {/* Depth gradient — stronger bottom vignette for 3D depth feel */}
          <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/20 to-transparent" />
          {/* Top edge shadow for depth */}
          <div className="absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-black/30 to-transparent" />

          {/* Top badges */}
          <div className="absolute top-3 start-3 flex items-center gap-1.5 flex-wrap">
            {listing.seller.role === 'admin' && (
              <Badge variant="gold">
                <Crown className="w-3 h-3" />
                {locale === 'ar' ? 'إدارة' : 'Official'}
              </Badge>
            )}
            {listing.isBoosted && (
              <Badge variant="purple">
                <Zap className="w-3 h-3" />
                {t('adBoosted')}
              </Badge>
            )}
            {listing.seller.isVerified && !listing.seller.role && (
              <Badge variant="green">
                <Shield className="w-3 h-3" />
                {t('verified')}
              </Badge>
            )}
          </div>

          {/* Like button */}
          <motion.button
            type="button"
            whileTap={{ scale: 1.3 }}
            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={handleLike}
            className={cn(
              'absolute top-3 end-3 w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-200',
              liked ? 'bg-red-500 text-white' : 'bg-black/60 text-white hover:bg-red-500/80'
            )}
          >
            <Heart className={cn('w-4 h-4', liked && 'fill-current')} />
          </motion.button>

          {/* Rank badge */}
          {listing.rank && (
            <div className="absolute bottom-3 start-3">
              <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-black/70">
                <Trophy className={cn('w-3.5 h-3.5', rankColors[listing.rank] ?? 'text-muted')} />
                <span className={cn('text-xs font-bold', rankColors[listing.rank] ?? 'text-white')}>
                  {listing.rank}
                </span>
              </div>
            </div>
          )}

          {/* Game badge */}
          <div className="absolute bottom-3 end-3">
            <span className="px-2 py-1 rounded-lg bg-black/70 text-xs text-white/80 font-medium">
              {listing.game}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="text-sm font-semibold text-white leading-tight mb-2 line-clamp-2 group-hover:text-purple transition-colors">
            {displayTitle}
          </h3>

          {/* Seller badges row */}
          {(trusted || fastResponder) && (
            <div className="flex items-center gap-1.5 mb-2 flex-wrap">
              {trusted && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-gold/10 border border-gold/20 text-gold text-[10px] font-medium">
                  <BadgeCheck className="w-2.5 h-2.5" />
                  {locale === 'ar' ? 'بائع موثوق' : 'Trusted Seller'}
                </span>
              )}
              {fastResponder && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-medium">
                  <Timer className="w-2.5 h-2.5" />
                  {locale === 'ar' ? 'يرد بسرعة' : 'Fast Responder'}
                </span>
              )}
            </div>
          )}

          {/* Seller info */}
          <div className="flex items-center gap-2 mb-3">
            <div className={cn(
              'w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold',
              listing.seller.role === 'admin' ? 'bg-gold/20 text-gold' : 'bg-purple/20 text-purple'
            )}>
              {listing.seller.role === 'admin' ? <Crown className="w-3 h-3" /> : (listing.seller.username?.[0]?.toUpperCase() ?? '?')}
            </div>
            <span
              className={cn(
                'text-xs truncate transition-colors cursor-pointer',
                listing.seller.role === 'admin' ? 'text-gold hover:text-gold/80 font-medium' : 'text-muted hover:text-purple'
              )}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); window.location.href = `/${locale}/seller/${listing.seller.id}`; }}
            >
              {listing.seller.username}
              {listing.seller.role === 'admin' && (
                <span className="ms-1 text-[10px] text-gold/70">• Official</span>
              )}
            </span>
            <div className="flex items-center gap-0.5 ms-auto">
              <Star className="w-3 h-3 fill-gold text-gold" />
              <span className="text-xs font-medium text-white">{listing.seller.rating}</span>
            </div>
          </div>

          {/* Stats row */}
          {listing.stats && (
            <div className="flex items-center gap-3 mb-3 text-xs text-muted">
              {listing.stats.level && <span>Lv.{listing.stats.level}</span>}
              {listing.stats.winRate && <span>{listing.stats.winRate}% WR</span>}
              {listing.stats.hoursPlayed && (
                <span>{(listing.stats.hoursPlayed / 1000).toFixed(1)}k hrs</span>
              )}
            </div>
          )}

          {/* Payment methods */}
          {listing.seller.paymentMethods && (
            <div className="flex items-center gap-1 flex-wrap mb-3">
              {listing.seller.paymentMethods.vodafone && (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-500/10 border border-red-500/20 text-red-400">VOD</span>
              )}
              {listing.seller.paymentMethods.orange && (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-orange-500/10 border border-orange-500/20 text-orange-400">ONG</span>
              )}
              {listing.seller.paymentMethods.instapay && (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">IP</span>
              )}
              {listing.seller.paymentMethods.paypal && (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-500/10 border border-blue-500/20 text-blue-400">PP</span>
              )}
              {listing.seller.paymentMethods.usdt && (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-green-500/10 border border-green-500/20 text-green-400">USDT</span>
              )}
              {listing.seller.paymentMethods.btc && (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-yellow-500/10 border border-yellow-500/20 text-yellow-400">BTC</span>
              )}
            </div>
          )}

          {/* Price + Actions */}
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-lg font-bold text-white">{formatPrice(listing.price, locale)}</p>
              <p className="text-xs text-muted flex items-center gap-1">
                <Heart className={cn('w-3 h-3', liked && 'fill-red-400 text-red-400')} />
                {likeCount.toLocaleString()}
              </p>
            </div>
            <motion.button
              type="button"
              whileTap={{ scale: 0.92 }}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={handleCart}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors duration-200',
                inCart
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30 cursor-default'
                  : 'bg-purple/10 text-purple border border-purple/30 hover:bg-purple hover:text-white'
              )}
            >
              {inCart ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  {locale === 'ar' ? 'في السلة' : 'In Cart'}
                </>
              ) : (
                <>
                  <ShoppingCart className="w-3.5 h-3.5" />
                  {t('addToCart')}
                </>
              )}
            </motion.button>
          </div>
        </div>
      </TiltCard>
    </Link>
  );
}
