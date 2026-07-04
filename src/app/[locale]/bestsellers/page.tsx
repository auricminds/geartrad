'use client';

import { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import Link from 'next/link';
import { Star, Shield, Trophy, TrendingUp, Crown, BadgeCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { getTopSellers } from '@/lib/api';
import { TiltCard } from '@/components/ui/TiltCard';
import { cn } from '@/lib/utils';
import type { User } from '@/types';

const MEDALS = ['🥇', '🥈', '🥉'];

const PODIUM_STYLES = [
  // #2 — silver, left
  {
    height: 'h-28 sm:h-32',
    bg: 'from-slate-400/15 to-slate-400/5',
    border: 'border-slate-400/30',
    shadow: 'shadow-slate-400/15',
    glow: 'rgba(148,163,184,0.5)',
    avatarBg: 'from-slate-400/30 to-slate-600/20',
    avatarText: 'text-slate-300',
    numGradient: 'from-slate-300 to-slate-500',
  },
  // #1 — gold, center
  {
    height: 'h-36 sm:h-44',
    bg: 'from-gold/25 to-gold/5',
    border: 'border-gold/40',
    shadow: 'shadow-gold/25',
    glow: 'rgba(212,175,55,0.7)',
    avatarBg: 'from-gold/40 to-gold/20',
    avatarText: 'text-gold',
    numGradient: 'from-gold to-amber-600',
  },
  // #3 — bronze, right
  {
    height: 'h-24 sm:h-28',
    bg: 'from-amber-700/15 to-amber-700/5',
    border: 'border-amber-700/30',
    shadow: 'shadow-amber-700/15',
    glow: 'rgba(180,83,9,0.5)',
    avatarBg: 'from-amber-700/30 to-amber-900/20',
    avatarText: 'text-amber-500',
    numGradient: 'from-amber-500 to-amber-800',
  },
];

function PodiumCard({ seller, rank, style, locale }: {
  seller: User;
  rank: number;
  style: typeof PODIUM_STYLES[0];
  locale: string;
}) {
  return (
    <motion.div
      className="flex flex-col items-center gap-2"
      initial={{ opacity: 0, y: 40, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1], delay: rank === 1 ? 0 : rank === 2 ? 0.15 : 0.28 }}
    >
      {/* Medal */}
      <motion.span
        className="text-3xl sm:text-4xl"
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 18, delay: rank === 1 ? 0.3 : rank === 2 ? 0.45 : 0.55 }}
      >
        {MEDALS[rank - 1]}
      </motion.span>

      {/* Avatar */}
      <TiltCard max={10} className="relative">
        <Link href={`/${locale}/seller/${seller.id}`}>
          <motion.div
            className={cn(
              'relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden shadow-xl',
              style.shadow
            )}
            whileHover={{ scale: 1.08 }}
            transition={{ type: 'spring', stiffness: 350, damping: 22 }}
          >
            {seller.avatar ? (
              <img src={seller.avatar} alt={seller.username} className="w-full h-full object-cover" />
            ) : (
              <div className={cn(
                'w-full h-full bg-gradient-to-br flex items-center justify-center text-2xl sm:text-3xl font-bold',
                style.avatarBg, style.avatarText
              )}>
                {seller.username.charAt(0)}
              </div>
            )}
            {/* Glow ring on avatar */}
            <div
              className="absolute inset-0 rounded-2xl"
              style={{ boxShadow: `inset 0 0 0 2px ${style.glow}, 0 0 20px ${style.glow.replace('0.7', '0.3').replace('0.5', '0.2')}` }}
            />
          </motion.div>
        </Link>
      </TiltCard>

      <Link href={`/${locale}/seller/${seller.id}`} className="text-center group">
        <p className="text-sm font-bold text-white group-hover:text-purple transition-colors truncate max-w-[80px] sm:max-w-[100px]">
          {seller.username}
        </p>
        <div className="flex items-center justify-center gap-1 mt-0.5">
          <Star className="w-3 h-3 fill-gold text-gold" />
          <span className="text-xs font-semibold text-white">{Number(seller.rating).toFixed(1)}</span>
          {seller.isVerified && <Shield className="w-3 h-3 text-emerald-400" />}
        </div>
      </Link>

      {/* Podium block */}
      <div className={cn(
        'w-20 sm:w-28 rounded-t-2xl border bg-gradient-to-b flex items-start justify-center pt-3 shadow-lg',
        style.height, style.bg, style.border, style.shadow
      )}>
        <span className={cn(
          'text-2xl sm:text-3xl font-black bg-gradient-to-b bg-clip-text text-transparent',
          style.numGradient
        )}>
          {rank}
        </span>
      </div>
    </motion.div>
  );
}

export default function BestsellersPage() {
  const locale = useLocale();
  const [sellers, setSellers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTopSellers(20).then((data) => { setSellers(data); setLoading(false); });
  }, []);

  const top3  = sellers.slice(0, 3);
  const rest  = sellers.slice(3);
  const podiumOrder = top3.length >= 3 ? [top3[1], top3[0], top3[2]] : [];
  const podiumRanks = [2, 1, 3];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 relative">
      {/* Ambient orbs */}
      <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-96 h-48 bg-gold/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-40 -right-16 w-56 h-56 bg-purple/10 rounded-full blur-[80px] pointer-events-none" />

      {/* Header */}
      <motion.div
        className="text-center mb-12 relative z-10"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gold/12 border border-gold/25 text-gold text-xs font-semibold mb-5 shadow-sm shadow-gold/10">
          <Trophy className="w-3.5 h-3.5" />
          {locale === 'ar' ? 'لوحة المتصدرين' : 'Leaderboard'}
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
          {locale === 'ar' ? 'أفضل التجار' : 'Bestselling Traders'}
        </h1>
        <p className="text-muted text-sm">
          {locale === 'ar' ? 'موثوق من آلاف الجيمرز' : 'Trusted by thousands of gamers'}
        </p>
      </motion.div>

      {loading ? (
        <div className="flex justify-center py-24">
          <div className="w-8 h-8 rounded-full border-2 border-gold/30 border-t-gold animate-spin" />
        </div>
      ) : sellers.length === 0 ? (
        <div className="text-center py-24">
          <div className="w-16 h-16 rounded-2xl bg-surface border border-border flex items-center justify-center mx-auto mb-4 shadow-depth">
            <Trophy className="w-7 h-7 text-muted/40" />
          </div>
          <p className="text-white font-semibold text-lg mb-2">
            {locale === 'ar' ? 'لا يوجد بائعون بعد' : 'No sellers yet'}
          </p>
          <p className="text-muted text-sm">
            {locale === 'ar' ? 'كن أول من يبيع على GearTrad!' : 'Be the first to sell on GearTrad!'}
          </p>
        </div>
      ) : (
        <>
          {/* Podium — top 3 */}
          {podiumOrder.length === 3 && (
            <div className="flex items-end justify-center gap-3 sm:gap-6 mb-14">
              {podiumOrder.map((seller, i) => (
                <PodiumCard
                  key={seller.id}
                  seller={seller}
                  rank={podiumRanks[i]}
                  style={PODIUM_STYLES[i]}
                  locale={locale}
                />
              ))}
            </div>
          )}

          {/* Full list */}
          <motion.div
            className="space-y-2.5"
            initial="hidden"
            animate="visible"
            variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.06 } } }}
          >
            {sellers.map((seller, i) => (
              <motion.div
                key={seller.id}
                variants={{
                  hidden: { opacity: 0, x: -20 },
                  visible: { opacity: 1, x: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
                }}
              >
                <Link href={`/${locale}/seller/${seller.id}`}>
                  <motion.div
                    whileHover={{ x: 4, transition: { type: 'spring', stiffness: 400, damping: 25 } }}
                    className={cn(
                      'flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300 group relative overflow-hidden',
                      i === 0 ? 'bg-gradient-to-r from-gold/8 to-surface border-gold/30 hover:border-gold/50 shadow-depth-gold'
                      : i === 1 ? 'bg-surface border-slate-400/20 hover:border-slate-400/40 shadow-depth'
                      : i === 2 ? 'bg-surface border-amber-700/20 hover:border-amber-700/40 shadow-depth'
                      : 'bg-surface border-border hover:border-purple/35 shadow-depth'
                    )}
                  >
                    {/* Hover glow */}
                    <div className={cn(
                      'absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-400 pointer-events-none',
                      i === 0 ? 'bg-[radial-gradient(ellipse_at_left,rgba(212,175,55,0.06),transparent_60%)]'
                      : 'bg-[radial-gradient(ellipse_at_left,rgba(124,58,237,0.05),transparent_60%)]'
                    )} />

                    {/* Rank */}
                    <div className="w-9 text-center shrink-0">
                      {i < 3 ? (
                        <span className="text-xl">{MEDALS[i]}</span>
                      ) : (
                        <span className="text-muted font-bold text-sm tabular-nums">#{i + 1}</span>
                      )}
                    </div>

                    {/* Avatar */}
                    <div className={cn(
                      'w-12 h-12 rounded-2xl overflow-hidden shrink-0 shadow-md',
                      i === 0 ? 'shadow-gold/20' : 'shadow-black/30'
                    )}>
                      {seller.avatar ? (
                        <img src={seller.avatar} alt={seller.username} className="w-full h-full object-cover" />
                      ) : (
                        <div className={cn(
                          'w-full h-full flex items-center justify-center text-lg font-bold',
                          i === 0 ? 'bg-gold/20 text-gold'
                          : i === 1 ? 'bg-slate-400/20 text-slate-300'
                          : i === 2 ? 'bg-amber-700/20 text-amber-500'
                          : 'bg-purple/20 text-purple'
                        )}>
                          {seller.username.charAt(0)}
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className={cn(
                          'font-semibold truncate transition-colors',
                          i === 0 ? 'text-gold group-hover:text-gold/80'
                          : 'text-white group-hover:text-purple'
                        )}>
                          {seller.username}
                        </p>
                        {seller.isVerified && (
                          <Shield className="w-3.5 h-3.5 text-emerald-400 shrink-0 drop-shadow-[0_0_4px_rgba(52,211,153,0.5)]" />
                        )}
                        {i === 0 && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-gold/15 border border-gold/25 text-gold text-[10px] font-semibold">
                            <Crown className="w-2.5 h-2.5" />
                            {locale === 'ar' ? 'الأفضل' : 'Best'}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 fill-gold text-gold" />
                          <span className="text-xs font-semibold text-white">{Number(seller.rating).toFixed(1)}</span>
                        </div>
                        <span className="text-xs text-muted">
                          {seller.totalSales} {locale === 'ar' ? 'بيعة' : 'sales'}
                        </span>
                      </div>
                    </div>

                    {/* Badge for top 3 */}
                    {i < 3 && (
                      <div className={cn(
                        'shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold border',
                        i === 0 ? 'bg-gold/15 border-gold/30 text-gold'
                        : i === 1 ? 'bg-slate-400/15 border-slate-400/30 text-slate-300'
                        : 'bg-amber-700/15 border-amber-700/30 text-amber-500'
                      )}>
                        <TrendingUp className="w-3 h-3" />
                        {locale === 'ar' ? 'متصدر' : 'Top'}
                      </div>
                    )}
                  </motion.div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </>
      )}
    </div>
  );
}
