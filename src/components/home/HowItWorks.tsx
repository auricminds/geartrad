'use client';

import { useTranslations } from 'next-intl';
import { Search, MessageCircle, CreditCard, Gamepad2 } from 'lucide-react';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

const steps = [
  {
    icon: Search,
    key: 'browse',
    gradient: 'from-purple/25 to-transparent',
    border: 'border-purple/20 hover:border-purple/40',
    iconBg: 'bg-purple/20 text-purple',
    glow: 'rgba(124,58,237,0.4)',
    numBg: 'bg-purple/20 text-purple border-purple/30',
  },
  {
    icon: MessageCircle,
    key: 'chat',
    gradient: 'from-blue-500/25 to-transparent',
    border: 'border-blue-500/20 hover:border-blue-500/40',
    iconBg: 'bg-blue-500/20 text-blue-400',
    glow: 'rgba(59,130,246,0.4)',
    numBg: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  },
  {
    icon: CreditCard,
    key: 'pay',
    gradient: 'from-gold/25 to-transparent',
    border: 'border-gold/20 hover:border-gold/40',
    iconBg: 'bg-gold/20 text-gold',
    glow: 'rgba(212,175,55,0.4)',
    numBg: 'bg-gold/20 text-gold border-gold/30',
  },
  {
    icon: Gamepad2,
    key: 'play',
    gradient: 'from-emerald-500/25 to-transparent',
    border: 'border-emerald-500/20 hover:border-emerald-500/40',
    iconBg: 'bg-emerald-500/20 text-emerald-400',
    glow: 'rgba(52,211,153,0.4)',
    numBg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  },
];

export function HowItWorks() {
  const t = useTranslations('home.howItWorks');
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: '-60px' });

  return (
    <section className="mb-12">
      <motion.div
        className="text-center mb-10"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <h2 className="text-2xl font-bold text-white">{t('title')}</h2>
        <p className="text-muted mt-1 text-sm">{t('subtitle')}</p>
      </motion.div>

      <div ref={containerRef} className="relative grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Animated connector line (desktop) */}
        <div className="hidden md:block absolute top-[28px] left-[12.5%] right-[12.5%] h-px z-0 overflow-hidden">
          <div className="w-full h-full bg-gradient-to-r from-transparent via-border to-transparent animate-connector" />
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-purple/50 to-transparent"
            initial={{ x: '-100%' }}
            animate={isInView ? { x: '200%' } : { x: '-100%' }}
            transition={{ duration: 2.2, ease: [0.22, 1, 0.36, 1], delay: 0.6 }}
          />
        </div>

        {steps.map((step, i) => (
          <motion.div
            key={step.key}
            initial={{ opacity: 0, rotateX: 10, y: 32, scale: 0.96 }}
            whileInView={{ opacity: 1, rotateX: 0, y: 0, scale: 1 }}
            viewport={{ once: true, margin: '-30px' }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: i * 0.12 }}
            whileHover={{ y: -5, transition: { type: 'spring', stiffness: 400, damping: 22 } }}
            style={{ transformPerspective: 800 }}
            className={`relative z-10 p-5 rounded-2xl bg-gradient-to-b ${step.gradient} bg-surface/60
              border ${step.border} shadow-depth transition-all duration-300 group cursor-default
              hover:shadow-xl overflow-hidden`}
          >
            {/* Hover glow layer */}
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-400 pointer-events-none"
              style={{ background: `radial-gradient(ellipse at top left, ${step.glow.replace('0.4', '0.07')}, transparent 65%)` }}
            />

            {/* Step number badge */}
            <motion.div
              className={`absolute top-3 end-3 w-6 h-6 rounded-full border flex items-center justify-center text-[10px] font-bold ${step.numBg} z-10`}
              initial={{ scale: 0, rotate: -30 }}
              whileInView={{ scale: 1, rotate: 0 }}
              viewport={{ once: true }}
              transition={{ type: 'spring', stiffness: 400, damping: 18, delay: i * 0.12 + 0.2 }}
            >
              {i + 1}
            </motion.div>

            {/* Icon */}
            <motion.div
              className={`relative w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${step.iconBg} transition-all duration-300`}
              whileHover={{ rotate: [0, -8, 8, 0], transition: { duration: 0.4 } }}
            >
              <step.icon className="w-5 h-5" />
              <div
                className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ boxShadow: `0 0 16px ${step.glow}` }}
              />
            </motion.div>

            <h3 className="text-sm font-semibold text-white mb-1.5">{t(`steps.${step.key}.title`)}</h3>
            <p className="text-xs text-muted leading-relaxed">{t(`steps.${step.key}.desc`)}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
