import { getTranslations, getLocale } from 'next-intl/server';
import Link from 'next/link';
import { Star, Shield, Trophy, TrendingUp } from 'lucide-react';
import { getTopSellers } from '@/lib/api';
import { Badge } from '@/components/ui/badge';

export default async function BestsellersPage() {
  const t      = await getTranslations('home.bestsellers');
  const locale = await getLocale();

  const sellers = await getTopSellers(20);
  const medals  = ['🥇', '🥈', '🥉'];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/10 border border-gold/20 text-gold text-xs font-medium mb-4">
          <Trophy className="w-3.5 h-3.5" />
          {locale === 'ar' ? 'لوحة المتصدرين' : 'Leaderboard'}
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">{t('title')}</h1>
        <p className="text-muted">{t('subtitle')}</p>
      </div>

      {sellers.length === 0 ? (
        <div className="text-center py-24">
          <p className="text-white font-semibold text-lg mb-2">
            {locale === 'ar' ? 'لا يوجد بائعون بعد' : 'No sellers yet'}
          </p>
          <p className="text-muted text-sm">
            {locale === 'ar' ? 'كن أول من يبيع على GearTrad!' : 'Be the first to sell on GearTrad!'}
          </p>
        </div>
      ) : (
        <>
          {/* Top 3 Podium */}
          {sellers.length >= 3 && (
            <div className="flex items-end justify-center gap-4 mb-10">
              {[sellers[1], sellers[0], sellers[2]].map((seller, i) => {
                const pos = [2, 1, 3][i];
                const heights    = ['h-28', 'h-36', 'h-24'];
                const colors     = ['bg-slate-400/10 border-slate-400/20', 'bg-gold/10 border-gold/30', 'bg-amber-600/10 border-amber-600/20'];
                return (
                  <div key={seller.id} className="flex flex-col items-center gap-2">
                    <div className="w-14 h-14 rounded-2xl bg-purple/20 flex items-center justify-center text-2xl font-bold text-purple mb-1">
                      {seller.username.charAt(0)}
                    </div>
                    <p className="text-xs font-semibold text-white text-center truncate w-20">{seller.username}</p>
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 fill-gold text-gold" />
                      <span className="text-xs text-white">{seller.rating}</span>
                    </div>
                    <div className={`w-20 ${heights[i]} rounded-t-xl border ${colors[i]} flex items-start justify-center pt-3`}>
                      <span className="text-2xl">{medals[pos - 1]}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Full List */}
          <div className="space-y-3">
            {sellers.map((seller, i) => (
              <Link key={seller.id} href={`/${locale}/browse`}>
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-surface border border-border hover:border-purple/40 transition-all group">
                  <div className="w-8 text-center">
                    {i < 3 ? (
                      <span className="text-xl">{medals[i]}</span>
                    ) : (
                      <span className="text-muted font-bold text-sm">#{i + 1}</span>
                    )}
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-purple/20 flex items-center justify-center text-lg font-bold text-purple shrink-0">
                    {seller.username.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-white group-hover:text-purple transition-colors truncate">
                        {seller.username}
                      </p>
                      {seller.isVerified && <Shield className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 fill-gold text-gold" />
                        <span className="text-xs text-white">{seller.rating}</span>
                      </div>
                      <span className="text-xs text-muted">
                        {seller.totalSales} {locale === 'ar' ? 'بيعة' : 'sales'}
                      </span>
                    </div>
                  </div>
                  {i < 3 && (
                    <Badge variant={i === 0 ? 'gold' : 'default'}>
                      <TrendingUp className="w-3 h-3" />
                      {locale === 'ar' ? 'متصدر' : 'Top Seller'}
                    </Badge>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
