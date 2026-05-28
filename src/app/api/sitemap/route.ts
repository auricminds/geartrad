export const dynamic = 'force-dynamic';

export function GET() {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://geartrad.com';
  const today = new Date().toISOString().split('T')[0];

  const urls = [
    { loc: `${base}/en`,             alt: [['en', `${base}/en`], ['ar', `${base}/ar`]], changefreq: 'daily',   priority: '1.0' },
    { loc: `${base}/ar`,             changefreq: 'daily',   priority: '1.0' },
    { loc: `${base}/en/browse`,      changefreq: 'hourly',  priority: '0.9' },
    { loc: `${base}/ar/browse`,      changefreq: 'hourly',  priority: '0.9' },
    { loc: `${base}/en/top-accounts`,changefreq: 'daily',   priority: '0.8' },
    { loc: `${base}/ar/top-accounts`,changefreq: 'daily',   priority: '0.8' },
    { loc: `${base}/en/bestsellers`, changefreq: 'daily',   priority: '0.8' },
    { loc: `${base}/ar/bestsellers`, changefreq: 'daily',   priority: '0.8' },
    { loc: `${base}/en/sell`,        changefreq: 'monthly', priority: '0.7' },
    { loc: `${base}/ar/sell`,        changefreq: 'monthly', priority: '0.7' },
    { loc: `${base}/en/about`,       changefreq: 'monthly', priority: '0.5' },
    { loc: `${base}/ar/about`,       changefreq: 'monthly', priority: '0.5' },
    { loc: `${base}/en/help`,        changefreq: 'monthly', priority: '0.5' },
    { loc: `${base}/ar/help`,        changefreq: 'monthly', priority: '0.5' },
    { loc: `${base}/en/safety`,      changefreq: 'monthly', priority: '0.5' },
    { loc: `${base}/en/privacy`,     changefreq: 'yearly',  priority: '0.3' },
    { loc: `${base}/en/terms`,       changefreq: 'yearly',  priority: '0.3' },
  ];

  const urlTags = urls.map(({ loc, alt, changefreq, priority }) => `  <url>
    <loc>${loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>${alt ? alt.map(([lang, href]) => `\n    <xhtml:link rel="alternate" hreflang="${lang}" href="${href}"/>`).join('') : ''}
  </url>`).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urlTags}
</urlset>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
}
