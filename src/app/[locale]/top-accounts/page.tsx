'use client';

import { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import { Crown, Gamepad2, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { ListingCard } from '@/components/listing/ListingCard';
import { getListings } from '@/lib/api';
import type { Listing } from '@/types';
import { cn } from '@/lib/utils';

const MEDALS = ['🥇', '🥈', '🥉'];

function SkeletonCard() {
  return (
    <div className="rounded-2xl bg-surface border border-border overflow-hidden animate-pulse shadow-depth">
      <div className="h-44 bg-white/5" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-white/8 rounded-full w-3/4" />
        <div className="h-3 bg-white/5 rounded-full w-1/2" />
        <div className="flex justify-between items-center pt-1">
          <div className="h-5 bg-white/8 rounded-full w-20" />
          <div className="h-8 bg-white/6 rounded-xl w-24" />
        </div>
      </div>
    </div>
  );
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 0) {
    return (
      <motion.div
        className="absolute -top-3 -start-3 z-20"
        initial={{ scale: 0, rotate: -30 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 18, delay: 0.1 * rank }}
      >
        <div className="relative w-9 h-9 flex items-center justify-center">
          {/* Outer glow ring */}
          <div className="absolute inset-0 rounded-full bg-gold/30 blur-md" />
          <div className="relative w-9 h-9 rounded-full bg-gradient-to-br from-gold to-amber-600 flex items-center justify-center shadow-lg shadow-gold/40 border-2 border-gold/60">
            <span className="text-base">{MEDALS[rank]}</span>
          </div>
        </div>
      </motion.div>
    );
  }
  if (rank === 1) {
    return (
      <motion.div
        className="absolute -top-3 -start-3 z-20"
        initial={{ scale: 0, rotate: -30 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 18, delay: 0.1 * rank }}
      >
        <div className="relative w-9 h-9 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-slate-400/20 blur-sm" />
          <div className="relative w-9 h-9 rounded-full bg-gradient-to-br from-slate-300 to-slate-500 flex items-center justify-center shadow-lg shadow-slate-400/30 border-2 border-slate-400/50">
            <span className="text-base">{MEDALS[rank]}</span>
          </div>
        </div>
      </motion.div>
    );
  }
  if (rank === 2) {
    return (
      <motion.div
        className="absolute -top-3 -start-3 z-20"
        initial={{ scale: 0, rotate: -30 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 18, delay: 0.1 * rank }}
      >
        <div className="relative w-9 h-9 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-amber-700/20 blur-sm" />
          <div className="relative w-9 h-9 rounded-full bg-gradient-to-br from-amber-500 to-amber-800 flex items-center justify-center shadow-lg shadow-amber-700/30 border-2 border-amber-600/50">
            <span className="text-base">{MEDALS[rank]}</span>
          </div>
        </div>
      </motion.div>
    );
  }
  return (
    <motion.div
      className="absolute -top-3 -start-3 z-20"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.05 * rank }}
    >
      <div className="w-8 h-8 rounded-full bg-surface border border-border flex items-center justify-center shadow-depth">
        <span className="text-[10px] font-bold text-muted tabular-nums">#{rank + 1}</span>
      </div>
    </motion.div>
  );
}

export default function TopAccountsPage() {
  const locale = useLocale();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getListings({ sortBy: 'popular', limit: 24 }).then((data) => {
      setListings(data);
      setLoading(false);
    });
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 relative">
      {/* Ambient background orbs */}
      <div className="pointer-events-none absolute -top-24 left-1/4 w-80 h-80 bg-purple/8 rounded-full blur-[120px]" />
      <div className="pointer-events-none absolute top-32 -right-20 w-72 h-72 bg-gold/8 rounded-full blur-[100px]" />
      <div className="pointer-events-none absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/6 rounded-full blur-[90px]" />

      {/* Page header */}
      <motion.div
        className="text-center mb-12 relative z-10"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Badge row */}
        <div className="flex items-center justify-center gap-3 mb-5">
          <motion.div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple/12 border border-purple/25 text-purple text-xs font-semibold shadow-sm"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.45, delay: 0.1 }}
          >
            <Crown className="w-3.5 h-3.5" />
            {locale === 'ar' ? 'مرتبة حسب الإعجابات' : 'Ranked by Popularity'}
          </motion.div>
          <motion.div
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-gold/10 border border-gold/20 text-gold text-xs font-semibold"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.45, delay: 0.18 }}
          >
            <Sparkles className="w-3 h-3" />
            {locale === 'ar' ? 'مميزة' : 'Featured'}
          </motion.div>
        </div>

        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
          {locale === 'ar' ? 'أفضل الحسابات' : 'Top Gaming Accounts'}
        </h1>
        <p className="text-muted text-sm max-w-md mx-auto">
          {locale === 'ar'
            ? 'أعلى الحسابات تقييماً وأكثرها شعبية من مجتمعنا'
            : 'The highest rated and most popular accounts in our community'}
        </p>

        {/* Icon decorative row */}
        <motion.div
          className="flex items-center justify-center gap-2 mt-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
        >
          <div className="h-px w-16 bg-gradient-to-r from-transparent to-border" />
          <div className="p-2 rounded-xl bg-surface border border-border shadow-depth">
            <Gamepad2 className="w-4 h-4 text-muted" />
          </div>
          <div className="h-px w-16 bg-gradient-to-l from-transparent to-border" />
        </motion.div>
      </motion.div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : listings.length === 0 ? (
        <motion.div
          className="text-center py-28"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="w-16 h-16 rounded-2xl bg-surface border border-border flex items-center justify-center mx-auto mb-4 shadow-depth">
            <Crown className="w-7 h-7 text-muted/40" />
          </div>
          <p className="text-white font-semibold text-lg mb-2">
            {locale === 'ar' ? 'لا توجد حسابات بعد' : 'No listings yet'}
          </p>
          <p className="text-muted text-sm">
            {locale === 'ar' ? 'كن أول من ينشر حساباً!' : 'Be the first to list an account!'}
          </p>
        </motion.div>
      ) : (
        <>
          {/* Top 3 spotlight section */}
          {listings.length >= 3 && (
            <motion.div
              className="mb-6"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15 }}
            >
              <div className="flex items-center gap-2 mb-4">
                <span className="text-sm font-semibold text-gold flex items-center gap-1.5">
                  <Crown className="w-3.5 h-3.5" />
                  {locale === 'ar' ? 'المميزون' : 'Spotlight'}
                </span>
                <div className="flex-1 h-px bg-gradient-to-r from-gold/30 to-transparent" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                {listings.slice(0, 3).map((listing, i) => (
                  <motion.div
                    key={listing.id}
                    className="relative"
                    initial={{ opacity: 0, y: 32, scale: 0.94 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: i * 0.1 }}
                  >
                    <RankBadge rank={i} />
                    {/* Spotlight glow under top 3 */}
                    <div className={cn(
                      'absolute inset-0 rounded-2xl pointer-events-none z-0 opacity-40 blur-xl -bottom-3',
                      i === 0 ? 'bg-gold/15' : i === 1 ? 'bg-slate-400/10' : 'bg-amber-700/10'
                    )} />
                    <div className={cn(
                      'relative z-10 isolate rounded-2xl ring-1',
                      i === 0 ? 'ring-gold/25' : i === 1 ? 'ring-slate-400/15' : 'ring-amber-700/15'
                    )}>
                      <ListingCard listing={listing} />
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Rest of listings */}
          {listings.length > 3 && (
            <motion.div
              className="mt-8"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.35 }}
            >
              <div className="flex items-center gap-2 mb-4">
                <span className="text-sm font-semibold text-muted">
                  {locale === 'ar' ? 'المزيد' : 'More Listings'}
                </span>
                <div className="flex-1 h-px bg-border" />
              </div>

              <motion.div
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
                initial="hidden"
                animate="visible"
                variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.055 } } }}
              >
                {listings.slice(3).map((listing, i) => (
                  <motion.div
                    key={listing.id}
                    className="relative"
                    variants={{
                      hidden: { opacity: 0, y: 24, scale: 0.96 },
                      visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
                    }}
                  >
                    <RankBadge rank={i + 3} />
                    <div className="relative z-10 isolate">
                      <ListingCard listing={listing} />
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}
