import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // rebuild hourly

const _envBase = process.env.NEXT_PUBLIC_SITE_URL ?? '';
const BASE = _envBase.includes('geartrad.com') ? _envBase : 'https://geartrad.com';

interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq: string;
  priority: string;
  alt?: [string, string][];
}

function buildUrl({ loc, lastmod, changefreq, priority, alt }: SitemapUrl): string {
  const altTags = alt
    ? alt.map(([lang, href]) => `\n    <xhtml:link rel="alternate" hreflang="${lang}" href="${href}"/>`).join('')
    : '';
  return `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod ?? new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>${altTags}
  </url>`;
}

export async function GET() {
  const today = new Date().toISOString().split('T')[0];

  // ── Static pages ────────────────────────────────────────────────────────
  const staticUrls: SitemapUrl[] = [
    { loc: `${BASE}/en`, alt: [['en', `${BASE}/en`], ['ar', `${BASE}/ar`], ['x-default', `${BASE}/en`]], changefreq: 'daily', priority: '1.0' },
    { loc: `${BASE}/ar`, changefreq: 'daily', priority: '1.0' },
    { loc: `${BASE}/en/browse`, alt: [['en', `${BASE}/en/browse`], ['ar', `${BASE}/ar/browse`]], changefreq: 'hourly', priority: '0.95' },
    { loc: `${BASE}/ar/browse`, changefreq: 'hourly', priority: '0.95' },
    // Game-specific browse pages (SEO landing pages)
    ...(['Valorant', 'Fortnite', 'CS2', 'PUBG+Mobile', 'League+of+Legends', 'FIFA', 'Call+of+Duty', 'Apex+Legends'].flatMap((game) => [
      { loc: `${BASE}/en/browse?game=${game}`, changefreq: 'daily', priority: '0.85' },
      { loc: `${BASE}/ar/browse?game=${game}`, changefreq: 'daily', priority: '0.85' },
    ])),
    // Type-specific browse pages
    ...(['Account', 'Skin', 'Weapon', 'Bundle'].flatMap((type) => [
      { loc: `${BASE}/en/browse?type=${type}`, changefreq: 'daily', priority: '0.8' },
      { loc: `${BASE}/ar/browse?type=${type}`, changefreq: 'daily', priority: '0.8' },
    ])),
    { loc: `${BASE}/en/top-accounts`, changefreq: 'daily', priority: '0.8' },
    { loc: `${BASE}/ar/top-accounts`, changefreq: 'daily', priority: '0.8' },
    { loc: `${BASE}/en/bestsellers`, changefreq: 'daily', priority: '0.8' },
    { loc: `${BASE}/ar/bestsellers`, changefreq: 'daily', priority: '0.8' },
    { loc: `${BASE}/en/sell`, changefreq: 'weekly', priority: '0.7' },
    { loc: `${BASE}/ar/sell`, changefreq: 'weekly', priority: '0.7' },
    { loc: `${BASE}/en/about`, changefreq: 'monthly', priority: '0.5' },
    { loc: `${BASE}/ar/about`, changefreq: 'monthly', priority: '0.5' },
    { loc: `${BASE}/en/help`, changefreq: 'monthly', priority: '0.5' },
    { loc: `${BASE}/ar/help`, changefreq: 'monthly', priority: '0.5' },
    { loc: `${BASE}/en/safety`, changefreq: 'monthly', priority: '0.5' },
    { loc: `${BASE}/ar/safety`, changefreq: 'monthly', priority: '0.5' },
    { loc: `${BASE}/en/advertise`, changefreq: 'monthly', priority: '0.4' },
    { loc: `${BASE}/en/privacy`, changefreq: 'yearly', priority: '0.3' },
    { loc: `${BASE}/en/terms`, changefreq: 'yearly', priority: '0.3' },
    { loc: `${BASE}/en/careers`, changefreq: 'monthly', priority: '0.3' },
  ];

  // ── Dynamic listing pages ────────────────────────────────────────────────
  let listingUrls: SitemapUrl[] = [];
  try {
    const db = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
    const { data: listings } = await db
      .from('listings')
      .select('id, created_at')
      .eq('is_available', true)
      .order('created_at', { ascending: false })
      .limit(5000); // cap at 5000 — Google limit per sitemap is 50k URLs

    if (listings) {
      listingUrls = listings.map(({ id, created_at }) => ({
        loc: `${BASE}/en/listing/${id}`,
        lastmod: created_at ? created_at.split('T')[0] : today,
        alt: [
          ['en', `${BASE}/en/listing/${id}`],
          ['ar', `${BASE}/ar/listing/${id}`],
        ],
        changefreq: 'weekly',
        priority: '0.75',
      }));
    }
  } catch {
    // If DB fetch fails, still return static pages
  }

  const allUrls = [...staticUrls, ...listingUrls];
  const urlTags = allUrls.map(buildUrl).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urlTags}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
