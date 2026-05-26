import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { NextRequest, NextResponse } from 'next/server';

const intlMiddleware = createMiddleware(routing);

// ─── Rate limiting store (per edge instance) ──────────────────────────────────
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= limit) return false;
  entry.count++;
  return true;
}

let cleanupCounter = 0;
function maybeCleanup() {
  if (++cleanupCounter < 500) return;
  cleanupCounter = 0;
  const now = Date.now();
  for (const [key, val] of rateLimitMap.entries()) {
    if (now > val.resetAt) rateLimitMap.delete(key);
  }
}

// ─── Blocked path patterns ────────────────────────────────────────────────────
const BLOCKED_PATTERNS = [
  /\.(php|asp|aspx|jsp|cgi|sh|bash|env|git|svn|htaccess|htpasswd|sql|bak|backup|config|ini|log)$/i,
  /\/(wp-admin|wp-login|administrator|phpmyadmin|cpanel|webmail|xmlrpc)/i,
  /\/(\.\.\/|\.\.\\)/,
  /<script|javascript:|data:text\/html/i,
  /\bunion\b.*\bselect\b/i,
  /etc\/passwd/i,
];

const SITEMAP_XML = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
  <url><loc>https://geartrad.com/en</loc><lastmod>2026-05-26</lastmod><changefreq>daily</changefreq><priority>1.0</priority><xhtml:link rel="alternate" hreflang="en" href="https://geartrad.com/en"/><xhtml:link rel="alternate" hreflang="ar" href="https://geartrad.com/ar"/></url>
  <url><loc>https://geartrad.com/ar</loc><lastmod>2026-05-26</lastmod><changefreq>daily</changefreq><priority>1.0</priority></url>
  <url><loc>https://geartrad.com/en/browse</loc><lastmod>2026-05-26</lastmod><changefreq>hourly</changefreq><priority>0.9</priority></url>
  <url><loc>https://geartrad.com/ar/browse</loc><lastmod>2026-05-26</lastmod><changefreq>hourly</changefreq><priority>0.9</priority></url>
  <url><loc>https://geartrad.com/en/top-accounts</loc><lastmod>2026-05-26</lastmod><changefreq>daily</changefreq><priority>0.8</priority></url>
  <url><loc>https://geartrad.com/ar/top-accounts</loc><lastmod>2026-05-26</lastmod><changefreq>daily</changefreq><priority>0.8</priority></url>
  <url><loc>https://geartrad.com/en/bestsellers</loc><lastmod>2026-05-26</lastmod><changefreq>daily</changefreq><priority>0.8</priority></url>
  <url><loc>https://geartrad.com/ar/bestsellers</loc><lastmod>2026-05-26</lastmod><changefreq>daily</changefreq><priority>0.8</priority></url>
  <url><loc>https://geartrad.com/en/sell</loc><lastmod>2026-05-26</lastmod><changefreq>monthly</changefreq><priority>0.7</priority></url>
  <url><loc>https://geartrad.com/ar/sell</loc><lastmod>2026-05-26</lastmod><changefreq>monthly</changefreq><priority>0.7</priority></url>
  <url><loc>https://geartrad.com/en/about</loc><lastmod>2026-05-26</lastmod><changefreq>monthly</changefreq><priority>0.5</priority></url>
  <url><loc>https://geartrad.com/ar/about</loc><lastmod>2026-05-26</lastmod><changefreq>monthly</changefreq><priority>0.5</priority></url>
  <url><loc>https://geartrad.com/en/help</loc><lastmod>2026-05-26</lastmod><changefreq>monthly</changefreq><priority>0.5</priority></url>
  <url><loc>https://geartrad.com/ar/help</loc><lastmod>2026-05-26</lastmod><changefreq>monthly</changefreq><priority>0.5</priority></url>
  <url><loc>https://geartrad.com/en/safety</loc><lastmod>2026-05-26</lastmod><changefreq>monthly</changefreq><priority>0.5</priority></url>
  <url><loc>https://geartrad.com/en/privacy</loc><lastmod>2026-05-26</lastmod><changefreq>yearly</changefreq><priority>0.3</priority></url>
  <url><loc>https://geartrad.com/en/terms</loc><lastmod>2026-05-26</lastmod><changefreq>yearly</changefreq><priority>0.3</priority></url>
</urlset>`;

const ROBOTS_TXT = `User-agent: *\nAllow: /\nDisallow: /*/mod/\nDisallow: /*/auth/\nDisallow: /*/checkout/\nDisallow: /*/orders/\nDisallow: /*/dashboard/\nDisallow: /*/profile/\nDisallow: /*/chat/\nDisallow: /api/\n\nSitemap: https://geartrad.com/sitemap.xml`;

export default function middleware(req: NextRequest) {
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

  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'unknown';

  maybeCleanup();

  // Block malicious paths
  if (BLOCKED_PATTERNS.some((re) => re.test(pathname))) {
    return new NextResponse('Not Found', { status: 404 });
  }

  // Rate limit: auth pages (10 per minute per IP)
  if (pathname.includes('/auth/')) {
    if (!rateLimit(`auth:${ip}`, 10, 60_000)) {
      return new NextResponse('Too many requests. Please wait before trying again.', {
        status: 429,
        headers: { 'Retry-After': '60' },
      });
    }
  }

  // Rate limit: payment API (5 per minute per IP)
  if (pathname.startsWith('/api/payment/')) {
    if (!rateLimit(`pay:${ip}`, 5, 60_000)) {
      return new NextResponse(
        JSON.stringify({ error: 'Too many payment requests. Please wait.' }),
        { status: 429, headers: { 'Content-Type': 'application/json', 'Retry-After': '60' } },
      );
    }
    return NextResponse.next();
  }

  // All other API routes skip intl
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Intl routing for page routes
  return intlMiddleware(req);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|logo.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?|ttf|eot)).*)'],
};
