'use client';

import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { AdBanner } from '@/types';
import { cn } from '@/lib/utils';

interface HeroBannerProps {
  banners: AdBanner[];
}

export function HeroBanner({ banners }: HeroBannerProps) {
  const t = useTranslations('home.hero');
  const locale = useLocale();
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

      {/* Hero content */}
      <div
        className="relative z-10 flex flex-col justify-end h-full px-4 sm:px-10 pb-6 sm:pb-8 pt-20 sm:pt-32 min-h-[280px] sm:min-h-[360px] md:min-h-[420px]"
      >
        {/* Badge */}
        <div className="inline-flex items-center gap-2 mb-4 w-fit">
          <span className="px-3 py-1 rounded-full bg-purple/20 border border-purple/30 text-purple text-xs font-medium">
            {t('badge')}
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight mb-3 max-w-2xl">
          {t('title')}{' '}
          <span className="bg-gradient-to-r from-purple to-gold bg-clip-text text-transparent">
            {t('titleHighlight')}
          </span>{' '}
          {t('titleEnd')}
        </h1>

        <p className="text-muted text-sm sm:text-base max-w-xl mb-6">{t('subtitle')}</p>

        <div className="flex items-center gap-3 flex-wrap">
          <Link
            href={`/${locale}/browse`}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 text-base font-medium rounded-xl bg-purple hover:bg-purple-light text-white shadow-xl shadow-purple/30 transition-all duration-200"
          >
            {t('cta')}
          </Link>
          <Link
            href={`/${locale}/auth/sign-up?type=seller`}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 text-base font-semibold rounded-xl bg-gold hover:bg-gold-light text-black shadow-lg shadow-gold/25 transition-all duration-200"
          >
            {t('ctaSell')}
          </Link>
        </div>
      </div>

      {/* Carousel controls */}
      <button
        type="button"
        onClick={prev}
        className="absolute start-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-all z-20"
      >
        {locale === 'ar' ? (
          <ChevronRight className="w-5 h-5" />
        ) : (
          <ChevronLeft className="w-5 h-5" />
        )}
      </button>
      <button
        type="button"
        onClick={next}
        className="absolute end-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-all z-20"
      >
        {locale === 'ar' ? (
          <ChevronLeft className="w-5 h-5" />
        ) : (
          <ChevronRight className="w-5 h-5" />
        )}
      </button>

      {/* Dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20">
        {banners.map((_, i) => (
          <button
            type="button"
            key={i}
            onClick={() => {
              setCurrent(i);
              setAutoPlay(false);
            }}
            className={cn(
              'rounded-full transition-all duration-300',
              i === current ? 'w-6 h-2 bg-purple' : 'w-2 h-2 bg-white/30 hover:bg-white/50'
            )}
          />
        ))}
      </div>
    </section>
  );
}
