import { useTranslations } from 'next-intl';
import { TrendingUp, Users, ShieldCheck } from 'lucide-react';

export function StatsBar() {
  const t = useTranslations('home.hero.stats');

  const stats = [
    { icon: TrendingUp, value: '12,400+', label: t('listings'), color: 'text-purple' },
    { icon: Users, value: '3,200+', label: t('sellers'), color: 'text-gold' },
    { icon: ShieldCheck, value: '28,900+', label: t('trades'), color: 'text-emerald-400' },
  ];

  return (
    <div className="grid grid-cols-3 gap-4 my-8">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="flex flex-col items-center gap-2 p-3 sm:p-4 rounded-2xl bg-surface border border-border"
        >
          <div className={`p-2 rounded-xl bg-white/5 ${stat.color}`}>
            <stat.icon className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="text-center">
            <p className="text-base sm:text-2xl font-bold text-white leading-tight">{stat.value}</p>
            <p className="text-[10px] sm:text-xs text-muted mt-0.5 leading-tight">{stat.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
