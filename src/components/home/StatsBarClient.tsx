'use client';

import { useTranslations } from 'next-intl';
import { TrendingUp, Users, ShieldCheck } from 'lucide-react';
import { motion, useInView, useMotionValue, useTransform, animate } from 'framer-motion';
import { useEffect, useRef } from 'react';

function CountUp({ to }: { to: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-40px' });
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => {
    if (to >= 1000) return `${(v / 1000).toFixed(1)}k+`;
    return `${Math.round(v)}`;
  });

  useEffect(() => {
    if (!isInView) return;
    const controls = animate(count, to, { duration: 1.8, ease: [0.22, 1, 0.36, 1] });
    return controls.stop;
  }, [isInView, count, to]);

  return <motion.span ref={ref}>{rounded}</motion.span>;
}

interface Props {
  listings: number;
  sellers: number;
  trades: number;
}

export function StatsBarClient({ listings, sellers, trades }: Props) {
  const t = useTranslations('home.hero.stats');

  const stats = [
    { icon: TrendingUp,  value: listings, label: t('listings'), color: 'text-purple',      bg: 'bg-purple/10',      border: 'border-purple/20'      },
    { icon: Users,       value: sellers,  label: t('sellers'),  color: 'text-gold',        bg: 'bg-gold/10',        border: 'border-gold/20'        },
    { icon: ShieldCheck, value: trades,   label: t('trades'),   color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  ];

  return (
    <div className="grid grid-cols-3 gap-4 my-8">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: i * 0.1 }}
          className={`flex flex-col items-center gap-2 p-3 sm:p-4 rounded-2xl bg-surface border ${stat.border} hover:border-opacity-60 transition-colors`}
        >
          <div className={`p-2 rounded-xl ${stat.bg} ${stat.color}`}>
            <stat.icon className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="text-center">
            <p className="text-base sm:text-2xl font-bold text-white leading-tight">
              <CountUp to={stat.value} />
            </p>
            <p className="text-[10px] sm:text-xs text-muted mt-0.5 leading-tight">{stat.label}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
