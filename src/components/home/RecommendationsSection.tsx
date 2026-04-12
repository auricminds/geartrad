'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { Sparkles, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { getListings } from '@/lib/api';
import { Listing } from '@/types';
import { ListingCard } from '@/components/listing/ListingCard';

// Activity tracker helpers — exported so listing pages can call them
export function trackGameActivity(game: string) {
  try {
    const raw = localStorage.getItem('gt_activity');
    const activity: Record<string, number> = raw ? JSON.parse(raw) : {};
    activity[game] = (activity[game] ?? 0) + 1;
    localStorage.setItem('gt_activity', JSON.stringify(activity));
  } catch {}
}

export function getTopGame(): string | null {
  try {
    const raw = localStorage.getItem('gt_activity');
    if (!raw) return null;
    const activity: Record<string, number> = JSON.parse(raw);
    const entries = Object.entries(activity);
    if (entries.length === 0) return null;
    return entries.sort((a, b) => b[1] - a[1])[0][0];
  } catch {
    return null;
  }
}

export function RecommendationsSection() {
  const locale = useLocale();
  const [listings, setListings] = useState<Listing[]>([]);
  const [topGame, setTopGame] = useState<string | null>(null);

  useEffect(() => {
    const game = getTopGame();
    if (!game) return;
    setTopGame(game);
    getListings({ game, limit: 3 }).then(setListings).catch(() => {});
  }, []);

  if (!topGame || listings.length === 0) return null;

  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-gold" />
            <h2 className="text-xl font-bold text-white">
              {locale === 'ar' ? 'بناءً على نشاطك' : 'Based on Your Activity'}
            </h2>
          </div>
          <p className="text-sm text-muted">
            {locale === 'ar'
              ? `لأنك اهتممت بـ ${topGame} مؤخراً`
              : `Because you've been looking at ${topGame}`}
          </p>
        </div>
        <Link
          href={`/${locale}/browse?game=${encodeURIComponent(topGame)}`}
          className="flex items-center gap-1 text-sm text-purple hover:text-purple-light transition-colors"
        >
          <span>{locale === 'ar' ? 'عرض الكل' : 'View All'}</span>
          <ArrowRight className={`w-4 h-4 ${locale === 'ar' ? 'rotate-180' : ''}`} />
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {listings.map((listing, i) => (
          <motion.div
            key={listing.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, duration: 0.4 }}
          >
            <ListingCard listing={listing} />
          </motion.div>
        ))}
      </div>
    </section>
  );
}
