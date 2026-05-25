import { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';

const SITE_URL = 'https://geartrad.com';
const LOCALES = ['en', 'ar'];

function urls(path: string, priority: number, changefreq: MetadataRoute.Sitemap[0]['changeFrequency']) {
  return LOCALES.map((locale) => ({
    url: `${SITE_URL}/${locale}${path}`,
    lastModified: new Date(),
    changeFrequency: changefreq,
    priority,
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    ...urls('', 1.0, 'daily'),
    ...urls('/browse', 0.9, 'hourly'),
    ...urls('/top-accounts', 0.8, 'daily'),
    ...urls('/bestsellers', 0.8, 'daily'),
    ...urls('/sell', 0.7, 'monthly'),
    ...urls('/about', 0.5, 'monthly'),
    ...urls('/help', 0.5, 'monthly'),
    ...urls('/safety', 0.5, 'monthly'),
    ...urls('/privacy', 0.3, 'yearly'),
    ...urls('/terms', 0.3, 'yearly'),
  ];

  // Dynamic listing pages
  let listingRoutes: MetadataRoute.Sitemap = [];
  let sellerRoutes: MetadataRoute.Sitemap = [];

  try {
    const db = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: listings } = await db
      .from('listings')
      .select('id, updated_at')
      .eq('is_available', true)
      .limit(5000);

    if (listings) {
      listingRoutes = listings.flatMap((l) =>
        LOCALES.map((locale) => ({
          url: `${SITE_URL}/${locale}/listing/${l.id}`,
          lastModified: new Date(l.updated_at ?? Date.now()),
          changeFrequency: 'weekly' as const,
          priority: 0.8,
        }))
      );
    }

    const { data: sellers } = await db
      .from('profiles')
      .select('id, updated_at')
      .in('account_type', ['seller', 'both'])
      .limit(2000);

    if (sellers) {
      sellerRoutes = sellers.flatMap((s) =>
        LOCALES.map((locale) => ({
          url: `${SITE_URL}/${locale}/seller/${s.id}`,
          lastModified: new Date(s.updated_at ?? Date.now()),
          changeFrequency: 'weekly' as const,
          priority: 0.6,
        }))
      );
    }
  } catch {
    // If DB unavailable during build, return static routes only
  }

  return [...staticRoutes, ...listingRoutes, ...sellerRoutes];
}
