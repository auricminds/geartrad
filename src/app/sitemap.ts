import { MetadataRoute } from 'next';

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

export default function sitemap(): MetadataRoute.Sitemap {
  return [
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
}
