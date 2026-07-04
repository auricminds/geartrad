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
    {
      icon: TrendingUp,
      value: listings,
      label: t('listings'),
      color: 'text-purple',
      iconBg: 'bg-purple/15',
      glow: 'rgba(124,58,237,0.5)',
      border: 'border-purple/15 hover:border-purple/35',
      shadow: 'hover:shadow-purple/10',
    },
    {
      icon: Users,
      value: sellers,
      label: t('sellers'),
      color: 'text-gold',
      iconBg: 'bg-gold/15',
      glow: 'rgba(212,175,55,0.5)',
      border: 'border-gold/15 hover:border-gold/35',
      shadow: 'hover:shadow-gold/10',
    },
    {
      icon: ShieldCheck,
      value: trades,
      label: t('trades'),
      color: 'text-emerald-400',
      iconBg: 'bg-emerald-500/15',
      glow: 'rgba(52,211,153,0.5)',
      border: 'border-emerald-500/15 hover:border-emerald-500/35',
      shadow: 'hover:shadow-emerald-500/10',
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-4 my-8">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, rotateX: 8, y: 20 }}
          whileInView={{ opacity: 1, rotateX: 0, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: i * 0.1 }}
          whileHover={{ y: -4, transition: { type: 'spring', stiffness: 400, damping: 20 } }}
          style={{ transformPerspective: 700 }}
          className={`relative flex flex-col items-center gap-2 sm:gap-3 p-3 sm:p-5 rounded-xl sm:rounded-2xl
            bg-surface/60 backdrop-blur-sm border shadow-depth ${stat.border} ${stat.shadow}
            hover:shadow-xl transition-all duration-300 overflow-hidden group cursor-default`}
        >
          {/* Subtle bg glow on hover */}
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
            style={{ background: `radial-gradient(ellipse at center, ${stat.glow.replace('0.5', '0.06')}, transparent 70%)` }}
          />

          <div className={`relative p-2 sm:p-2.5 rounded-lg sm:rounded-xl ${stat.iconBg} ${stat.color} transition-transform duration-300 group-hover:scale-110`}>
            <stat.icon className="w-4 h-4 sm:w-5 sm:h-5" />
            {/* Icon inner glow */}
            <div
              className="absolute inset-0 rounded-lg sm:rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{ boxShadow: `0 0 12px ${stat.glow}` }}
            />
          </div>

          <div className="relative text-center">
            <p className="text-base sm:text-2xl font-bold text-white leading-tight tabular-nums">
              <CountUp to={stat.value} />
            </p>
            <p className="text-[10px] sm:text-xs text-muted mt-0.5 leading-tight">{stat.label}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
