import { NextRequest, NextResponse } from 'next/server';

const SITEMAP_XML = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
  <url>
    <loc>https://geartrad.com/en</loc>
    <lastmod>2026-05-26</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
    <xhtml:link rel="alternate" hreflang="en" href="https://geartrad.com/en"/>
    <xhtml:link rel="alternate" hreflang="ar" href="https://geartrad.com/ar"/>
  </url>
  <url>
    <loc>https://geartrad.com/ar</loc>
    <lastmod>2026-05-26</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://geartrad.com/en/browse</loc>
    <lastmod>2026-05-26</lastmod>
    <changefreq>hourly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://geartrad.com/ar/browse</loc>
    <lastmod>2026-05-26</lastmod>
    <changefreq>hourly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://geartrad.com/en/top-accounts</loc>
    <lastmod>2026-05-26</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://geartrad.com/ar/top-accounts</loc>
    <lastmod>2026-05-26</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://geartrad.com/en/bestsellers</loc>
    <lastmod>2026-05-26</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://geartrad.com/ar/bestsellers</loc>
    <lastmod>2026-05-26</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://geartrad.com/en/sell</loc>
    <lastmod>2026-05-26</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://geartrad.com/ar/sell</loc>
    <lastmod>2026-05-26</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://geartrad.com/en/about</loc>
    <lastmod>2026-05-26</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>https://geartrad.com/ar/about</loc>
    <lastmod>2026-05-26</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>https://geartrad.com/en/help</loc>
    <lastmod>2026-05-26</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>https://geartrad.com/ar/help</loc>
    <lastmod>2026-05-26</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>https://geartrad.com/en/safety</loc>
    <lastmod>2026-05-26</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>https://geartrad.com/en/privacy</loc>
    <lastmod>2026-05-26</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>
  <url>
    <loc>https://geartrad.com/en/terms</loc>
    <lastmod>2026-05-26</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>
</urlset>`;

const ROBOTS_TXT = `User-agent: *
Allow: /
Disallow: /*/mod/
Disallow: /*/auth/
Disallow: /*/checkout/
Disallow: /*/orders/
Disallow: /*/dashboard/
Disallow: /*/profile/
Disallow: /*/chat/
Disallow: /api/

Sitemap: https://geartrad.com/sitemap.xml`;

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname === '/sitemap.xml') {
    return new NextResponse(SITEMAP_XML, {
      headers: { 'Content-Type': 'application/xml; charset=utf-8' },
    });
  }

  if (pathname === '/robots.txt') {
    return new NextResponse(ROBOTS_TXT, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }
}

export const config = {
  matcher: ['/sitemap.xml', '/robots.txt'],
};
