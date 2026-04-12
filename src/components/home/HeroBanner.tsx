'use client';

import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AdBanner } from '@/types';
import { cn } from '@/lib/utils';
import { useStore } from '@/components/providers/StoreProvider';

interface HeroBannerProps {
  banners: AdBanner[];
}

export function HeroBanner({ banners }: HeroBannerProps) {
  const t = useTranslations('home.hero');
  const locale = useLocale();
  const { user } = useStore();
  const [current, setCurrent] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);

  useEffect(() => {
    if (!autoPlay) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [autoPlay, banners.length]);

  const prev = () => {
    setCurrent((c) => (c - 1 + banners.length) % banners.length);
    setAutoPlay(false);
  };
  const next = () => {
    setCurrent((c) => (c + 1) % banners.length);
    setAutoPlay(false);
  };

  return (
    <section className="relative w-full overflow-hidden rounded-2xl min-h-[280px] sm:min-h-[360px] md:min-h-[420px]">
      {/* Slides */}
      {banners.map((banner, i) => (
        <div
          key={banner.id}
          className={cn(
            'absolute inset-0 transition-opacity duration-700',
            i === current ? 'opacity-100' : 'opacity-0 pointer-events-none'
          )}
        >
          <img
            src={banner.imageUrl}
            alt={banner.advertiserName}
            className="w-full h-full object-cover pointer-events-none"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/50 to-transparent pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent pointer-events-none" />

          {/* Sponsored label + Visit button */}
          <div className="absolute top-4 end-4 flex items-center gap-2 z-20">
            <span className="px-2 py-1 rounded-lg bg-black/70 text-xs text-white/60">
              Sponsored · {banner.advertiserName}
            </span>
            <a
              href={banner.linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-black/50 border border-white/20 text-white text-xs font-medium hover:bg-black/70 transition-all"
            >
              <ExternalLink className="w-3 h-3" />
              {locale === 'ar' ? 'زيارة المعلن' : 'Visit Advertiser'}
            </a>
          </div>
        </div>
      ))}

      {/* Ambient floating orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-[1]">
        <div
          className="absolute w-64 h-64 rounded-full animate-float-slow"
          style={{
            background: 'radial-gradient(circle, rgba(124,58,237,0.18) 0%, transparent 70%)',
            top: '-10%',
            left: '20%',
            animationDelay: '0s',
            filter: 'blur(20px)',
          }}
        />
        <div
          className="absolute w-48 h-48 rounded-full animate-float"
          style={{
            background: 'radial-gradient(circle, rgba(212,175,55,0.14) 0%, transparent 70%)',
            bottom: '10%',
            right: '15%',
            animationDelay: '1.5s',
            filter: 'blur(24px)',
          }}
        />
        <div
          className="absolute w-32 h-32 rounded-full animate-float-slow"
          style={{
            background: 'radial-gradient(circle, rgba(124,58,237,0.10) 0%, transparent 70%)',
            top: '30%',
            right: '30%',
            animationDelay: '3s',
            filter: 'blur(16px)',
          }}
        />
      </div>

      {/* Hero content */}
      <div className="relative z-10 flex flex-col justify-end h-full px-4 sm:px-10 pb-6 sm:pb-8 pt-20 sm:pt-32 min-h-[280px] sm:min-h-[360px] md:min-h-[420px]">

        {/* Badge — slides in from left */}
        <motion.div
          key={`badge-${current}`}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="inline-flex items-center gap-2 mb-4 w-fit"
        >
          <span className="px-3 py-1 rounded-full bg-purple/20 border border-purple/30 text-purple text-xs font-medium animate-neon-pulse">
            {t('badge')}
          </span>
        </motion.div>

        {/* Headline — word by word stagger */}
        <motion.h1
          key={`headline-${current}`}
          className="text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight mb-3 max-w-2xl"
          initial="hidden"
          animate="visible"
          variants={{
            visible: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
          }}
        >
          {[t('title'), t('titleHighlight'), t('titleEnd')].map((word, wi) => (
            <motion.span
              key={wi}
              variants={{
                hidden: { opacity: 0, y: 24, filter: 'blur(4px)' },
                visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
              }}
              className={cn(
                wi === 1
                  ? 'gradient-text-animated'
                  : '',
                wi < 2 ? 'me-2' : ''
              )}
            >
              {word}
            </motion.span>
          ))}
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          key={`sub-${current}`}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="text-muted text-sm sm:text-base max-w-xl mb-6"
        >
          {t('subtitle')}
        </motion.p>

        {/* CTA buttons */}
        <motion.div
          key={`cta-${current}`}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.48, ease: [0.22, 1, 0.36, 1] }}
          className="flex items-center gap-3 flex-wrap"
        >
          <motion.div whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.96 }} transition={{ type: 'spring', stiffness: 400, damping: 20 }}>
            <Link
              href={`/${locale}/browse`}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 text-base font-medium rounded-xl bg-purple hover:bg-purple-light text-white shadow-xl shadow-purple/30 transition-colors duration-200"
            >
              {t('cta')}
            </Link>
          </motion.div>
          <motion.div whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.96 }} transition={{ type: 'spring', stiffness: 400, damping: 20 }}>
            <Link
              href={user ? `/${locale}/sell` : `/${locale}/auth/sign-up?type=seller`}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 text-base font-semibold rounded-xl bg-gold hover:bg-gold-light text-black shadow-lg shadow-gold/25 transition-colors duration-200"
            >
              {t('ctaSell')}
            </Link>
          </motion.div>
        </motion.div>
      </div>

      {/* Carousel controls */}
      <motion.button
        type="button"
        onClick={prev}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="absolute start-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-all z-20"
      >
        {locale === 'ar' ? (
          <ChevronRight className="w-5 h-5" />
        ) : (
          <ChevronLeft className="w-5 h-5" />
        )}
      </motion.button>
      <motion.button
        type="button"
        onClick={next}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="absolute end-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-all z-20"
      >
        {locale === 'ar' ? (
          <ChevronLeft className="w-5 h-5" />
        ) : (
          <ChevronRight className="w-5 h-5" />
        )}
      </motion.button>

      {/* Dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20">
        {banners.map((_, i) => (
          <motion.button
            type="button"
            key={i}
            onClick={() => {
              setCurrent(i);
              setAutoPlay(false);
            }}
            animate={{
              width: i === current ? 24 : 8,
              backgroundColor: i === current ? '#7c3aed' : 'rgba(255,255,255,0.3)',
            }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="h-2 rounded-full"
          />
        ))}
      </div>
    </section>
  );
}
