'use client';

import { useTranslations } from 'next-intl';
import { Search, MessageCircle, CreditCard, Gamepad2 } from 'lucide-react';
import { motion } from 'framer-motion';

const steps = [
  { icon: Search,        key: 'browse', gradient: 'from-purple/20 to-purple/5',         border: 'border-purple/20',         iconBg: 'bg-purple/20 text-purple' },
  { icon: MessageCircle, key: 'chat',   gradient: 'from-blue-500/20 to-blue-500/5',      border: 'border-blue-500/20',       iconBg: 'bg-blue-500/20 text-blue-400' },
  { icon: CreditCard,    key: 'pay',    gradient: 'from-gold/20 to-gold/5',              border: 'border-gold/20',           iconBg: 'bg-gold/20 text-gold' },
  { icon: Gamepad2,      key: 'play',   gradient: 'from-emerald-500/20 to-emerald-500/5', border: 'border-emerald-500/20', iconBg: 'bg-emerald-500/20 text-emerald-400' },
];

export function HowItWorks() {
  const t = useTranslations('home.howItWorks');

  return (
    <section className="mb-12">
      <motion.div
        className="text-center mb-8"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <h2 className="text-2xl font-bold text-white">{t('title')}</h2>
        <p className="text-muted mt-1">{t('subtitle')}</p>
      </motion.div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {steps.map((step, i) => (
          <motion.div
            key={step.key}
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-30px' }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: i * 0.1 }}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className={`relative p-5 rounded-2xl bg-gradient-to-b ${step.gradient} border ${step.border} cursor-default`}
          >
            <div className="absolute top-3 end-3 w-5 h-5 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-xs text-muted font-bold">
              {i + 1}
            </div>
            {i < steps.length - 1 && (
              <div className="hidden md:block absolute top-8 -end-2 w-4 h-0.5 bg-border z-10" />
            )}
            <motion.div
              className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${step.iconBg}`}
              whileHover={{ rotate: [0, -8, 8, 0], transition: { duration: 0.4 } }}
            >
              <step.icon className="w-5 h-5" />
            </motion.div>
            <h3 className="text-sm font-semibold text-white mb-1">{t(`steps.${step.key}.title`)}</h3>
            <p className="text-xs text-muted leading-relaxed">{t(`steps.${step.key}.desc`)}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
