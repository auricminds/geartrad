'use client';

import { useTranslations, useLocale } from 'next-intl';
import { useState, useEffect, useCallback } from 'react';
import { Search, SlidersHorizontal, X, Gamepad2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ListingCard } from '@/components/listing/ListingCard';
import { getListings, ListingFilters } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { Listing } from '@/types';

const GAMES = ['All Games', 'Valorant', 'Fortnite', 'League of Legends', 'PUBG Mobile', 'CS2', 'Apex Legends', 'FIFA', 'Call of Duty'];
const TYPES = ['All Types', 'Account', 'Skin', 'Weapon', 'Bundle', 'Ticket'];

const GAME_COLORS: Record<string, string> = {
  'Valorant':          'bg-red-500/15 text-red-400 border-red-500/25 hover:border-red-500/50',
  'Fortnite':          'bg-blue-500/15 text-blue-400 border-blue-500/25 hover:border-blue-500/50',
  'League of Legends': 'bg-amber-500/15 text-amber-400 border-amber-500/25 hover:border-amber-500/50',
  'PUBG Mobile':       'bg-yellow-500/15 text-yellow-400 border-yellow-500/25 hover:border-yellow-500/50',
  'CS2':               'bg-orange-500/15 text-orange-400 border-orange-500/25 hover:border-orange-500/50',
  'Apex Legends':      'bg-red-600/15 text-red-300 border-red-600/25 hover:border-red-600/50',
  'FIFA':              'bg-green-500/15 text-green-400 border-green-500/25 hover:border-green-500/50',
  'Call of Duty':      'bg-slate-500/15 text-slate-300 border-slate-500/25 hover:border-slate-500/50',
  'All Games':         'bg-purple/15 text-purple border-purple/25 hover:border-purple/50',
};

const SORT_OPTIONS = [
  { value: 'newest',     labelEn: 'Newest',      labelAr: 'الأحدث' },
  { value: 'price_asc',  labelEn: 'Price: Low',  labelAr: 'السعر: الأقل' },
  { value: 'price_desc', labelEn: 'Price: High', labelAr: 'السعر: الأعلى' },
  { value: 'popular',    labelEn: 'Top Liked',   labelAr: 'الأكثر إعجاباً' },
] as const;

function FilterPanel({
  t, locale, selectedGame, selectedType, onGameChange, onTypeChange,
}: {
  t: ReturnType<typeof useTranslations<'browse'>>;
  locale: string;
  selectedGame: string;
  selectedType: string;
  onGameChange: (g: string) => void;
  onTypeChange: (t: string) => void;
}) {
  return (
    <div className="space-y-7">
      {/* Game filter */}
      <div>
        <p className="text-[11px] font-semibold text-muted uppercase tracking-widest mb-3">{t('filters.game')}</p>
        <div className="space-y-0.5">
          {GAMES.map((game) => {
            const isActive = selectedGame === game;
            return (
              <motion.button
                key={game}
                type="button"
                onClick={() => onGameChange(game)}
                whileTap={{ scale: 0.97 }}
                className={cn(
                  'w-full text-start px-3 py-2 rounded-xl text-sm transition-all duration-200 border',
                  isActive
                    ? `${GAME_COLORS[game] ?? 'bg-purple/15 text-purple border-purple/30'} font-semibold shadow-sm`
                    : 'text-muted hover:text-white hover:bg-white/5 border-transparent'
                )}
              >
                <span className="flex items-center gap-2">
                  {isActive && <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0" />}
                  {game}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-border/60" />

      {/* Type filter */}
      <div>
        <p className="text-[11px] font-semibold text-muted uppercase tracking-widest mb-3">{t('filters.type')}</p>
        <div className="flex flex-wrap gap-2">
          {TYPES.map((type) => {
            const isActive = selectedType === type;
            return (
              <motion.button
                key={type}
                type="button"
                whileTap={{ scale: 0.94 }}
                onClick={() => onTypeChange(type)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200',
                  isActive
                    ? 'bg-purple/20 text-purple border-purple/40 shadow-sm shadow-purple/20'
                    : 'border-border text-muted hover:text-white hover:border-purple/30 hover:bg-white/5'
                )}
              >
                {type}
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-depth">
      <div className="aspect-[4/3] bg-gradient-to-br from-white/5 to-white/3 relative overflow-hidden">
        <div className="absolute inset-0 shimmer" />
      </div>
      <div className="p-4 space-y-3">
        <div className="h-3.5 bg-white/6 rounded-full w-4/5 shimmer" />
        <div className="h-3 bg-white/5 rounded-full w-1/2 shimmer" />
        <div className="flex items-center justify-between pt-1">
          <div className="h-5 bg-white/6 rounded-lg w-20 shimmer" />
          <div className="h-8 bg-white/5 rounded-xl w-24 shimmer" />
        </div>
      </div>
    </div>
  );
}

export default function BrowsePage() {
  const t = useTranslations('browse');
  const locale = useLocale();

  const [listings, setListings]         = useState<Listing[]>([]);
  const [loading, setLoading]           = useState(true);
  const [hasMore, setHasMore]           = useState(false);
  const [filtersOpen, setFiltersOpen]   = useState(false);
  const [selectedGame, setSelectedGame] = useState('All Games');
  const [selectedType, setSelectedType] = useState('All Types');
  const [search, setSearch]             = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortBy, setSortBy]             = useState<ListingFilters['sortBy']>('newest');
  const [page, setPage]                 = useState(0);

  const LIMIT = 18;

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchListings = useCallback(async (pageNum: number, replace: boolean) => {
    setLoading(true);
    try {
      const results = await getListings({
        game: selectedGame,
        type: selectedType,
        search: debouncedSearch,
        sortBy,
        limit: LIMIT + 1,
        offset: pageNum * LIMIT,
      });
      const hasMoreResults = results.length > LIMIT;
      setHasMore(hasMoreResults);
      setListings((prev) => replace ? results.slice(0, LIMIT) : [...prev, ...results.slice(0, LIMIT)]);
    } catch {
      // leave existing listings visible
    } finally {
      setLoading(false);
    }
  }, [selectedGame, selectedType, debouncedSearch, sortBy]);

  useEffect(() => {
    setPage(0);
    fetchListings(0, true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedGame, selectedType, debouncedSearch, sortBy]);

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchListings(next, false);
  };

  const activeFilters = [selectedGame !== 'All Games', selectedType !== 'All Types'].filter(Boolean).length;
  const clearFilters  = () => { setSelectedGame('All Games'); setSelectedType('All Types'); };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 relative">
      {/* Ambient orbs */}
      <div className="absolute -top-20 -right-20 w-80 h-80 bg-purple/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-60 -left-16 w-60 h-60 bg-gold/8 rounded-full blur-[80px] pointer-events-none" />

      {/* Page header */}
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="flex items-center gap-2 mb-1">
          <Gamepad2 className="w-5 h-5 text-purple" />
          <h1 className="text-2xl sm:text-3xl font-bold text-white">{t('title')}</h1>
        </div>
        <p className="text-muted text-sm">{t('subtitle')}</p>
      </motion.div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar — desktop */}
        <aside className="hidden lg:block lg:w-60 shrink-0">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="sticky top-24 max-h-[calc(100vh-120px)] overflow-y-auto bg-surface/80 backdrop-blur-md border border-border/60 rounded-2xl p-5 shadow-depth"
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-white flex items-center gap-2 text-sm">
                <SlidersHorizontal className="w-4 h-4 text-purple" />
                {t('filters.title')}
              </h3>
              {activeFilters > 0 && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-[11px] text-muted hover:text-purple transition-colors"
                >
                  {locale === 'ar' ? 'مسح' : 'Clear'}
                </button>
              )}
            </div>
            <FilterPanel
              t={t} locale={locale}
              selectedGame={selectedGame} selectedType={selectedType}
              onGameChange={setSelectedGame} onTypeChange={setSelectedType}
            />
          </motion.div>
        </aside>

        <div className="flex-1 min-w-0">
          {/* Search + controls row */}
          <motion.div
            className="flex items-center gap-2 mb-4"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Search */}
            <div className="relative flex-1 min-w-0 group">
              <Search className="absolute start-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-focus-within:text-purple pointer-events-none transition-colors duration-200" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={locale === 'ar' ? 'ابحث عن حسابات، ألعاب، سكنات...' : 'Search accounts, games, skins...'}
                className={cn(
                  'w-full bg-surface/80 backdrop-blur-sm border border-border rounded-xl',
                  'ps-10 pe-4 py-2.5 text-sm text-white placeholder:text-muted/60',
                  'focus:outline-none focus:ring-2 focus:ring-purple/40 focus:border-purple/60',
                  'hover:border-purple/30 transition-all duration-200 shadow-depth'
                )}
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute end-3 top-1/2 -translate-y-1/2 text-muted hover:text-white transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Mobile filter toggle */}
            <motion.button
              type="button"
              whileTap={{ scale: 0.94 }}
              onClick={() => setFiltersOpen(true)}
              className={cn(
                'lg:hidden flex items-center gap-1.5 px-3 py-2.5 rounded-xl border text-sm font-medium shrink-0 transition-all',
                activeFilters > 0
                  ? 'bg-purple/15 border-purple/50 text-purple shadow-sm shadow-purple/20'
                  : 'border-border text-muted hover:text-white hover:border-purple/30 bg-surface/80'
              )}
            >
              <SlidersHorizontal className="w-4 h-4" />
              {activeFilters > 0 && (
                <span className="w-5 h-5 rounded-full bg-purple text-white text-[10px] flex items-center justify-center font-bold">
                  {activeFilters}
                </span>
              )}
            </motion.button>
          </motion.div>

          {/* Sort pills */}
          <motion.div
            className="flex items-center gap-2 mb-4 overflow-x-auto pb-1 scrollbar-hide"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="text-xs text-muted shrink-0">{locale === 'ar' ? 'ترتيب:' : 'Sort:'}</span>
            {SORT_OPTIONS.map((opt) => (
              <motion.button
                key={opt.value}
                type="button"
                whileTap={{ scale: 0.95 }}
                onClick={() => setSortBy(opt.value)}
                className={cn(
                  'shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200',
                  sortBy === opt.value
                    ? 'bg-purple/20 text-purple border-purple/40 shadow-sm shadow-purple/20'
                    : 'border-border text-muted hover:text-white hover:border-purple/30 bg-surface/60'
                )}
              >
                {locale === 'ar' ? opt.labelAr : opt.labelEn}
              </motion.button>
            ))}
          </motion.div>

          {/* Active filter chips */}
          <AnimatePresence>
            {activeFilters > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-2 mb-4 overflow-hidden flex-wrap"
              >
                {selectedGame !== 'All Games' && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-purple/15 text-purple border border-purple/30">
                    {selectedGame}
                    <button type="button" onClick={() => setSelectedGame('All Games')} className="hover:text-white transition-colors">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {selectedType !== 'All Types' && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gold/15 text-gold border border-gold/30">
                    {selectedType}
                    <button type="button" onClick={() => setSelectedType('All Types')} className="hover:text-white transition-colors">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-xs text-muted hover:text-purple transition-colors"
                >
                  {locale === 'ar' ? 'مسح الكل' : 'Clear all'}
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Results count */}
          <motion.p
            className="text-xs text-muted mb-5"
            animate={{ opacity: loading ? 0.5 : 1 }}
            transition={{ duration: 0.2 }}
          >
            {loading && listings.length === 0
              ? (locale === 'ar' ? 'جاري البحث...' : 'Searching...')
              : (
                <>
                  <span className="text-white font-semibold">{listings.length}{hasMore ? '+' : ''}</span>
                  {' '}{locale === 'ar' ? 'نتيجة' : 'listings found'}
                </>
              )}
          </motion.p>

          {/* Grid */}
          {listings.length > 0 ? (
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5"
              initial="hidden"
              animate="visible"
              variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.06 } } }}
            >
              {listings.map((listing) => (
                <motion.div
                  key={listing.id}
                  variants={{
                    hidden: { opacity: 0, y: 20, scale: 0.97 },
                    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
                  }}
                >
                  <ListingCard listing={listing} />
                </motion.div>
              ))}
            </motion.div>
          ) : !loading ? (
            /* Empty state */
            <motion.div
              className="text-center py-24"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-surface border border-border mb-5 shadow-depth">
                <Sparkles className="w-8 h-8 text-muted/40" />
                <div className="absolute inset-0 rounded-3xl bg-purple/5" />
              </div>
              <p className="text-white font-semibold text-lg mb-2">
                {locale === 'ar' ? 'لا توجد نتائج' : 'No listings found'}
              </p>
              <p className="text-muted text-sm mb-6 max-w-xs mx-auto">
                {locale === 'ar' ? 'جرب تعديل الفلاتر أو البحث' : 'Try adjusting your filters or search term'}
              </p>
              {activeFilters > 0 && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="px-5 py-2.5 rounded-xl bg-purple/15 border border-purple/30 text-purple text-sm font-medium hover:bg-purple/25 transition-all"
                >
                  {locale === 'ar' ? 'مسح الفلاتر' : 'Clear filters'}
                </button>
              )}
            </motion.div>
          ) : (
            /* Skeleton loaders */
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                >
                  <SkeletonCard />
                </motion.div>
              ))}
            </div>
          )}

          {/* Load more */}
          {hasMore && (
            <div className="text-center mt-12">
              <motion.button
                type="button"
                onClick={loadMore}
                disabled={loading}
                whileTap={{ scale: 0.97 }}
                className={cn(
                  'relative px-8 py-3 rounded-xl border text-sm font-medium transition-all duration-300',
                  'border-border text-muted hover:text-white hover:border-purple/50',
                  'hover:bg-purple/8 hover:shadow-lg hover:shadow-purple/10',
                  'disabled:opacity-40 disabled:cursor-not-allowed',
                  'overflow-hidden group'
                )}
              >
                <span className="relative z-10">
                  {loading
                    ? (locale === 'ar' ? 'جاري التحميل...' : 'Loading...')
                    : t('loadMore')}
                </span>
                {/* Shimmer on hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
              </motion.button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Filter Sheet */}
      <AnimatePresence>
        {filtersOpen && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="lg:hidden fixed inset-0 z-[55] bg-black/70 backdrop-blur-sm"
              onClick={() => setFiltersOpen(false)}
            />
            <motion.div
              key="sheet"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 340, damping: 34 }}
              className="lg:hidden fixed inset-x-0 bottom-0 z-[55] bg-background/95 backdrop-blur-xl border-t border-border/60 rounded-t-3xl flex flex-col max-h-[85dvh] shadow-[0_-8px_40px_rgba(0,0,0,0.6)]"
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-border/80" />
              </div>

              <div className="flex items-center justify-between px-5 py-3 border-b border-border/50 shrink-0">
                <h3 className="font-semibold text-white flex items-center gap-2 text-sm">
                  <SlidersHorizontal className="w-4 h-4 text-purple" />
                  {t('filters.title')}
                  {activeFilters > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full bg-purple/20 text-purple text-[10px] font-bold border border-purple/30">
                      {activeFilters}
                    </span>
                  )}
                </h3>
                <button
                  type="button"
                  onClick={() => setFiltersOpen(false)}
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-muted hover:text-white hover:bg-white/8 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-5 py-5">
                <FilterPanel
                  t={t} locale={locale}
                  selectedGame={selectedGame} selectedType={selectedType}
                  onGameChange={setSelectedGame} onTypeChange={setSelectedType}
                />
              </div>

              <div className="px-5 pt-4 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] border-t border-border/50 shrink-0 flex gap-3">
                {activeFilters > 0 && (
                  <button
                    type="button"
                    onClick={() => { clearFilters(); setFiltersOpen(false); }}
                    className="flex-1 py-3 rounded-xl border border-border text-muted text-sm font-medium hover:text-white hover:border-purple/30 transition-all"
                  >
                    {locale === 'ar' ? 'مسح' : 'Clear'}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setFiltersOpen(false)}
                  className="flex-1 py-3 rounded-xl bg-purple hover:bg-purple-light text-white font-semibold text-sm transition-all shadow-lg shadow-purple/30 hover:shadow-purple/50 hover:-translate-y-0.5 active:translate-y-0"
                >
                  {locale === 'ar' ? 'تطبيق' : 'Apply'}
                  {activeFilters > 0 && ` (${activeFilters})`}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
