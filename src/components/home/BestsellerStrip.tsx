'use client';

import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { Star, Shield, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { User } from '@/types';
import { cn } from '@/lib/utils';

interface BestsellerStripProps {
  sellers: User[];
}

const rankMedals = ['🥇', '🥈', '🥉'];

const cardStyles: Record<number, { border: string; glow: string; medalGlow: string }> = {
  0: {
    border: 'border-gold/30 hover:border-gold/60',
    glow: 'group-hover:shadow-[0_0_40px_rgba(212,175,55,0.15)]',
    medalGlow: 'drop-shadow-[0_0_8px_rgba(212,175,55,0.8)]',
  },
  1: {
    border: 'border-slate-400/20 hover:border-slate-400/40',
    glow: 'group-hover:shadow-[0_0_30px_rgba(148,163,184,0.1)]',
    medalGlow: 'drop-shadow-[0_0_6px_rgba(148,163,184,0.6)]',
  },
  2: {
    border: 'border-amber-700/20 hover:border-amber-700/40',
    glow: 'group-hover:shadow-[0_0_30px_rgba(180,83,9,0.1)]',
    medalGlow: 'drop-shadow-[0_0_6px_rgba(180,83,9,0.6)]',
  },
};

const defaultCardStyle = {
  border: 'border-border hover:border-purple/30',
  glow: 'group-hover:shadow-[0_0_24px_rgba(124,58,237,0.1)]',
  medalGlow: '',
};

export function BestsellerStrip({ sellers }: BestsellerStripProps) {
  const t = useTranslations('home.bestsellers');
  const locale = useLocale();

  return (
    <section className="mb-12">
      <motion.div
        className="flex items-center justify-between mb-6"
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        <div>
          <h2 className="text-xl font-bold text-white">{t('title')}</h2>
          <p className="text-sm text-muted mt-0.5">{t('subtitle')}</p>
        </div>
        <Link
          href={`/${locale}/bestsellers`}
          className="flex items-center gap-1 text-sm text-purple hover:text-purple-light transition-colors"
        >
          {locale === 'ar' ? <ArrowRight className="w-4 h-4 rotate-180" /> : null}
          <span>See All</span>
          {locale !== 'ar' ? <ArrowRight className="w-4 h-4" /> : null}
        </Link>
      </motion.div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {sellers.map((seller, i) => {
          const style = cardStyles[i] ?? defaultCardStyle;

          return (
            <motion.div
              key={seller.id}
              initial={{ opacity: 0, y: 24, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: '-30px' }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: i * 0.08 }}
              whileHover={{ y: -6, transition: { type: 'spring', stiffness: 350, damping: 20 } }}
            >
              <Link href={`/${locale}/seller/${seller.id}`}>
                <div className={cn(
                  'group relative p-4 rounded-2xl bg-surface border transition-all duration-300 cursor-pointer overflow-hidden',
                  style.border,
                  style.glow,
                  i === 0 && 'bg-gradient-to-b from-gold/8 to-surface',
                )}>
                  {/* Top-rank background shimmer for #1 */}
                  {i === 0 && (
                    <div className="absolute inset-0 bg-gradient-to-br from-gold/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                  )}

                  <div className="flex items-start justify-between mb-3">
                    {/* Medal with glow */}
                    <motion.div
                      className={cn('text-xl', style.medalGlow)}
                      whileHover={{ rotate: [0, -12, 12, 0], scale: 1.25 }}
                      transition={{ duration: 0.35 }}
                    >
                      {rankMedals[i] || (
                        <span className="text-sm font-bold text-muted">#{i + 1}</span>
                      )}
                    </motion.div>
                    {seller.isVerified && (
                      <Shield className="w-4 h-4 text-emerald-400 drop-shadow-[0_0_4px_rgba(52,211,153,0.6)]" />
                    )}
                  </div>

                  {/* Avatar */}
                  <motion.div
                    className="w-12 h-12 rounded-2xl mb-3 overflow-hidden shrink-0"
                    whileHover={{ scale: 1.08 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                  >
                    {seller.avatar ? (
                      <img src={seller.avatar} alt={seller.username} className="w-full h-full object-cover" />
                    ) : (
                      <div className={cn(
                        'w-full h-full flex items-center justify-center text-lg font-bold',
                        i === 0 ? 'bg-gold/20 text-gold' : 'bg-purple/20 text-purple'
                      )}>
                        {seller.username.charAt(0)}
                      </div>
                    )}
                  </motion.div>

                  <p className="text-sm font-semibold text-white truncate group-hover:text-purple transition-colors duration-200">
                    {seller.username}
                  </p>

                  <div className="flex items-center gap-1 mt-1.5">
                    <Star className="w-3 h-3 fill-gold text-gold" />
                    <span className="text-xs text-white font-medium">{seller.rating}</span>
                    <span className="text-xs text-muted ms-1">({seller.totalSales})</span>
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
