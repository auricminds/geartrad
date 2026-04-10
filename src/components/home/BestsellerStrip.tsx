import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { Star, Shield, Trophy, ArrowRight } from 'lucide-react';
import { User } from '@/types';
import { cn } from '@/lib/utils';

interface BestsellerStripProps {
  sellers: User[];
}

const rankMedals = ['🥇', '🥈', '🥉'];

export function BestsellerStrip({ sellers }: BestsellerStripProps) {
  const t = useTranslations('home.bestsellers');
  const locale = useLocale();

  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-6">
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
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {sellers.map((seller, i) => (
          <Link key={seller.id} href={`/${locale}/seller/${seller.id}`}>
            <div className={cn(
              'group p-4 rounded-2xl bg-surface border border-border hover:border-purple/40 transition-all duration-200',
              i === 0 && 'border-gold/30 bg-gradient-to-b from-gold/5 to-surface'
            )}>
              <div className="flex items-start justify-between mb-3">
                <div className="text-xl">{rankMedals[i] || `#${i + 1}`}</div>
                {seller.isVerified && (
                  <Shield className="w-4 h-4 text-emerald-400" />
                )}
              </div>

              {/* Avatar */}
              <div className={cn(
                'w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-bold mb-2',
                i === 0 ? 'bg-gold/20 text-gold' : 'bg-purple/20 text-purple'
              )}>
                {seller.username.charAt(0)}
              </div>

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
        ))}
      </div>
    </section>
  );
}
