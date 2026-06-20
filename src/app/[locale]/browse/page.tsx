'use client';

import { useTranslations, useLocale } from 'next-intl';
import { useState, useEffect, useCallback } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { ListingCard } from '@/components/listing/ListingCard';
import { getListings, ListingFilters } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { Listing } from '@/types';

const GAMES = ['All Games', 'Valorant', 'Fortnite', 'League of Legends', 'PUBG Mobile', 'CS2', 'Apex Legends', 'FIFA', 'Call of Duty'];
const TYPES = ['All Types', 'Account', 'Skin', 'Weapon', 'Bundle', 'Ticket'];
const SORT_OPTIONS = [
  { value: 'newest',     labelEn: 'Newest',       labelAr: 'الأحدث' },
  { value: 'price_asc',  labelEn: 'Price: Low',   labelAr: 'السعر: الأقل' },
  { value: 'price_desc', labelEn: 'Price: High',  labelAr: 'السعر: الأعلى' },
  { value: 'popular',    labelEn: 'Most Liked',   labelAr: 'الأكثر إعجاباً' },
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
    <div className="space-y-6">
      <div>
        <label className="text-xs font-medium text-muted uppercase tracking-wider mb-2 block">{t('filters.game')}</label>
        <div className="space-y-1">
          {GAMES.map((game) => (
            <button
              key={game}
              type="button"
              onClick={() => onGameChange(game)}
              className={cn(
                'w-full text-start px-3 py-2 rounded-xl text-sm transition-all',
                selectedGame === game ? 'bg-purple/10 text-purple font-medium' : 'text-muted hover:text-white hover:bg-white/5'
              )}
            >
              {game}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="text-xs font-medium text-muted uppercase tracking-wider mb-2 block">{t('filters.type')}</label>
        <div className="space-y-1">
          {TYPES.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => onTypeChange(type)}
              className={cn(
                'w-full text-start px-3 py-2 rounded-xl text-sm transition-all',
                selectedType === type ? 'bg-purple/10 text-purple font-medium' : 'text-muted hover:text-white hover:bg-white/5'
              )}
            >
              {type}
            </button>
          ))}
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

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
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
      const trimmed = results.slice(0, LIMIT);
      setHasMore(hasMoreResults);
      setListings((prev) => replace ? trimmed : [...prev, ...trimmed]);
    } catch {
      // Network error — leave existing listings visible, just stop loading
    } finally {
      setLoading(false);
    }
  }, [selectedGame, selectedType, debouncedSearch, sortBy]);

  // Reset to page 0 on filter/search/sort change
  useEffect(() => {
    setPage(0);
    fetchListings(0, true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedGame, selectedType, debouncedSearch, sortBy]);

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchListings(nextPage, false);
  };

  const activeFilters = [selectedGame !== 'All Games', selectedType !== 'All Types'].filter(Boolean).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-1">{t('title')}</h1>
        <p className="text-muted">{t('subtitle')}</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar — desktop */}
        <aside className="hidden lg:block lg:w-64 shrink-0">
          <div className="sticky top-24 max-h-[calc(100vh-120px)] overflow-y-auto bg-surface border border-border rounded-2xl p-5 space-y-6">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-purple" />
              {t('filters.title')}
            </h3>
            <FilterPanel
              t={t} locale={locale}
              selectedGame={selectedGame} selectedType={selectedType}
              onGameChange={setSelectedGame} onTypeChange={setSelectedType}
            />
          </div>
        </aside>

        <div className="flex-1 min-w-0">
          {/* Search + controls */}
          <div className="flex items-center gap-2 mb-4">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={locale === 'ar' ? 'ابحث عن حسابات، ألعاب، سكنات...' : 'Search accounts, games, skins...'}
                className="w-full bg-surface border border-border rounded-xl ps-10 pe-4 py-2.5 text-sm text-white placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-purple/50 focus:border-purple transition-all"
              />
            </div>

            <button
              type="button"
              onClick={() => setFiltersOpen(true)}
              className={cn(
                'lg:hidden flex items-center gap-1.5 px-3 py-2.5 rounded-xl border text-sm font-medium shrink-0 transition-all',
                activeFilters > 0 ? 'bg-purple/10 border-purple text-purple' : 'border-border text-muted hover:text-white hover:border-purple/40'
              )}
            >
              <SlidersHorizontal className="w-4 h-4" />
              {activeFilters > 0 && (
                <span className="w-4 h-4 rounded-full bg-purple text-white text-[10px] flex items-center justify-center font-bold shrink-0">
                  {activeFilters}
                </span>
              )}
            </button>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as ListingFilters['sortBy'])}
              className="bg-surface border border-border rounded-xl px-2.5 py-2.5 text-sm text-muted focus:outline-none focus:ring-2 focus:ring-purple/50 shrink-0"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {locale === 'ar' ? o.labelAr : o.labelEn}
                </option>
              ))}
            </select>
          </div>

          {/* Results count */}
          <p className="text-sm text-muted mb-4">
            {loading && listings.length === 0
              ? (locale === 'ar' ? 'جاري البحث...' : 'Searching...')
              : `${listings.length}${hasMore ? '+' : ''} ${locale === 'ar' ? 'نتيجة' : 'listings found'}`}
          </p>

          {/* Grid */}
          {listings.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          ) : !loading ? (
            <div className="text-center py-24">
              <p className="text-white font-semibold text-lg mb-2">
                {locale === 'ar' ? 'لا توجد نتائج' : 'No listings found'}
              </p>
              <p className="text-muted text-sm">
                {locale === 'ar' ? 'جرب تعديل الفلاتر أو البحث' : 'Try adjusting your filters or search'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-surface border border-border rounded-2xl overflow-hidden animate-pulse">
                  <div className="aspect-[4/3] bg-white/5" />
                  <div className="p-4 space-y-2">
                    <div className="h-3 bg-white/5 rounded-full w-3/4" />
                    <div className="h-3 bg-white/5 rounded-full w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {hasMore && (
            <div className="text-center mt-10">
              <button
                type="button"
                onClick={loadMore}
                disabled={loading}
                className="px-8 py-3 rounded-xl border border-border text-muted hover:text-white hover:border-purple/40 transition-all text-sm font-medium disabled:opacity-50"
              >
                {loading ? (locale === 'ar' ? 'جاري التحميل...' : 'Loading...') : t('loadMore')}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Filter Sheet */}
      {filtersOpen && (
        <>
          <button
            type="button"
            className="lg:hidden fixed inset-0 z-[55] bg-black/60 cursor-default"
            onClick={() => setFiltersOpen(false)}
            aria-label="Close filters"
          />
          <div className="lg:hidden fixed inset-x-0 bottom-0 z-[55] bg-background border-t border-border rounded-t-2xl flex flex-col max-h-[82dvh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-purple" />
                {t('filters.title')}
              </h3>
              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-muted hover:text-white hover:bg-white/5 transition-all"
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
            <div className="px-5 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] border-t border-border shrink-0">
              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                className="w-full py-3 rounded-xl bg-purple hover:bg-purple-light text-white font-semibold transition-all shadow-lg shadow-purple/25"
              >
                {locale === 'ar' ? 'تطبيق الفلاتر' : 'Apply Filters'}
                {activeFilters > 0 && ` (${activeFilters})`}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
