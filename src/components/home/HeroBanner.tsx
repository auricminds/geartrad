'use client';

import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
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
  const hasMultiple = banners.length > 1;

  useEffect(() => {
    if (!autoPlay || !hasMultiple) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [autoPlay, banners.length, hasMultiple]);

  const prev = () => { setCurrent((c) => (c - 1 + banners.length) % banners.length); setAutoPlay(false); };
  const next = () => { setCurrent((c) => (c + 1) % banners.length); setAutoPlay(false); };

  if (banners.length === 0) {
    return (
      <section className="w-full">
        <div className="w-full rounded-2xl aspect-[4/3] sm:aspect-[16/7] bg-surface border border-border" />
      </section>
    );
  }

  return (
    <section className="w-full">
      {/* ── Banner carousel — clean image, no text on top ─── */}
      <div className="relative w-full overflow-hidden rounded-2xl aspect-[16/9] sm:aspect-[16/7]">
        {banners.map((banner, i) => (
          <div
            key={banner.id}
            className={cn(
              'absolute inset-0 transition-opacity duration-700',
              i === current ? 'opacity-100' : 'opacity-0 pointer-events-none'
            )}
          >
            <Image
              src={banner.imageUrl}
              alt={banner.advertiserName}
              fill
              className="object-cover object-center pointer-events-none"
              priority={i === 0}
              sizes="(max-width: 768px) 100vw, 100vw"
            />

            {/* Sponsored label + Visit button — minimal corner overlay */}
            <div className="absolute top-3 end-3 flex items-center gap-2 z-20">
              <span className="px-2 py-1 rounded-lg bg-black/60 text-[10px] text-white/60 backdrop-blur-sm">
                Sponsored · {banner.advertiserName}
              </span>
              {banner.linkUrl && banner.linkUrl !== '#' && (
                <a
                  href={banner.linkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-black/50 border border-white/20 text-white text-[11px] font-medium hover:bg-black/70 transition-all backdrop-blur-sm"
                >
                  <ExternalLink className="w-3 h-3" />
                  {locale === 'ar' ? 'زيارة' : 'Visit'}
                </a>
              )}
            </div>
          </div>
        ))}

        {/* Prev / Next buttons — only when multiple banners */}
        {hasMultiple && (
          <>
            <button
              type="button"
              onClick={prev}
              className="absolute start-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-all z-20 backdrop-blur-sm"
            >
              {locale === 'ar' ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={next}
              className="absolute end-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-all z-20 backdrop-blur-sm"
            >
              {locale === 'ar' ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>

            {/* Dots */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20">
              {banners.map((_, i) => (
                <motion.button
                  type="button"
                  key={i}
                  onClick={() => { setCurrent(i); setAutoPlay(false); }}
                  animate={{
                    width: i === current ? 20 : 6,
                    backgroundColor: i === current ? '#7c3aed' : 'rgba(255,255,255,0.4)',
                  }}
                  transition={{ duration: 0.3 }}
                  className="h-1.5 rounded-full"
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── Hero text — BELOW the banner ─────────────────── */}
      <div className="pt-5 pb-2 px-1">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="inline-flex items-center gap-2 mb-2.5"
        >
          <span className="px-2.5 py-0.5 rounded-full bg-purple/20 border border-purple/30 text-purple text-[11px] font-medium animate-neon-pulse">
            {t('badge')}
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          key={`headline-${current}`}
          className="text-xl sm:text-2xl md:text-3xl font-bold text-white leading-snug mb-2 max-w-2xl"
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.05, delayChildren: 0.03 } } }}
        >
          {[t('title'), t('titleHighlight'), t('titleEnd')].map((word, wi) => (
            <motion.span
              key={wi}
              variants={{
                hidden: { opacity: 0, y: 10, filter: 'blur(4px)' },
                visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
              }}
              className={cn(wi === 1 ? 'gradient-text-animated' : '', wi < 2 ? 'me-2' : '')}
            >
              {word}
            </motion.span>
          ))}
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="text-muted text-xs sm:text-sm max-w-xl mb-4"
        >
          {t('subtitle')}
        </motion.p>

        {/* CTA buttons */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.22 }}
          className="flex items-center gap-2.5 flex-wrap"
        >
          <Link
            href={`/${locale}/browse`}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium rounded-xl bg-purple hover:bg-purple-light text-white shadow-lg shadow-purple/30 transition-colors duration-200"
          >
            {t('cta')}
          </Link>
          <Link
            href={user ? `/${locale}/sell` : `/${locale}/auth/sign-up?type=seller`}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl bg-gold hover:bg-gold-light text-black shadow-md shadow-gold/25 transition-colors duration-200"
          >
            {t('ctaSell')}
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
