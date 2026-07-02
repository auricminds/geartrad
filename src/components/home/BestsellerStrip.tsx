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

const medalGlow: Record<number, string> = {
  0: 'hover:shadow-gold/20 hover:border-gold/40',
  1: 'hover:shadow-slate-400/10 hover:border-slate-400/30',
  2: 'hover:shadow-amber-700/10 hover:border-amber-700/30',
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
        {sellers.map((seller, i) => (
          <motion.div
            key={seller.id}
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, margin: '-30px' }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1], delay: i * 0.08 }}
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
          >
            <Link href={`/${locale}/seller/${seller.id}`}>
              <div className={cn(
                'group p-4 rounded-2xl bg-surface border border-border transition-all duration-200 hover:shadow-xl cursor-pointer',
                i === 0 && 'border-gold/30 bg-gradient-to-b from-gold/5 to-surface',
                medalGlow[i] ?? 'hover:border-purple/30',
              )}>
                <div className="flex items-start justify-between mb-3">
                  <motion.div
                    className="text-xl"
                    whileHover={{ rotate: [0, -10, 10, 0], scale: 1.2 }}
                    transition={{ duration: 0.35 }}
                  >
                    {rankMedals[i] || `#${i + 1}`}
                  </motion.div>
                  {seller.isVerified && (
                    <Shield className="w-4 h-4 text-emerald-400" />
                  )}
                </div>

                {/* Avatar */}
                <motion.div
                  className="w-12 h-12 rounded-2xl mb-2 overflow-hidden"
                  whileHover={{ scale: 1.1 }}
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

                <p className="text-sm font-semibold text-white truncate group-hover:text-purple transition-colors">
                  {seller.username}
                </p>

                <div className="flex items-center gap-1 mt-1">
                  <Star className="w-3 h-3 fill-gold text-gold" />
                  <span className="text-xs text-white font-medium">{seller.rating}</span>
                  <span className="text-xs text-muted ms-1">({seller.totalSales})</span>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
