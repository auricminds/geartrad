import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { NextRequest, NextResponse } from 'next/server';

const intlMiddleware = createMiddleware(routing);

// ── Rate limiting (per edge instance) ────────────────────────────────────────
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

// ── Blocked path patterns (scanners, exploits, probes) ───────────────────────
const BLOCKED_PATH_PATTERNS = [
  /\.(php|asp|aspx|jsp|cgi|sh|bash|env|git|svn|htaccess|htpasswd|sql|bak|backup|config|ini|log)$/i,
  /\/(wp-admin|wp-login|administrator|phpmyadmin|cpanel|webmail|xmlrpc|wp-content|wp-includes)/i,
  /\/(\.\.\/|\.\.\\)/,
  /<script|javascript:|data:text\/html/i,
  /\bunion\b.*\bselect\b/i,
  /etc\/passwd/i,
  /\/\.(env|git|ssh|aws|docker)/i,
];

// ── Blocked user-agents (automated scanners / vulnerability tools) ────────────
const BLOCKED_UA_PATTERN = /sqlmap|nikto|nmap|masscan|nuclei|zgrab|dirbuster|gobuster|havij|acunetix|nessus|openvas|w3af|skipfish|wapiti|grabber|burpsuite|zaproxy/i;

// Always use the canonical production domain — never the Vercel preview URL
const BASE = (() => {
  const env = process.env.NEXT_PUBLIC_SITE_URL ?? '';
  return env.includes('geartrad.com') ? env : 'https://geartrad.com';
})();

// ── Inline sitemap (Edge-safe, no DB) — /api/sitemap has the full version ────
const SITEMAP_XML = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
  <url><loc>${BASE}/en</loc><changefreq>daily</changefreq><priority>1.0</priority><xhtml:link rel="alternate" hreflang="en" href="${BASE}/en"/><xhtml:link rel="alternate" hreflang="ar" href="${BASE}/ar"/><xhtml:link rel="alternate" hreflang="x-default" href="${BASE}/en"/></url>
  <url><loc>${BASE}/ar</loc><changefreq>daily</changefreq><priority>1.0</priority></url>
  <url><loc>${BASE}/en/browse</loc><changefreq>hourly</changefreq><priority>0.95</priority></url>
  <url><loc>${BASE}/ar/browse</loc><changefreq>hourly</changefreq><priority>0.95</priority></url>
  <url><loc>${BASE}/en/browse?game=Valorant</loc><changefreq>daily</changefreq><priority>0.85</priority></url>
  <url><loc>${BASE}/en/browse?game=Fortnite</loc><changefreq>daily</changefreq><priority>0.85</priority></url>
  <url><loc>${BASE}/en/browse?game=CS2</loc><changefreq>daily</changefreq><priority>0.85</priority></url>
  <url><loc>${BASE}/en/browse?game=PUBG+Mobile</loc><changefreq>daily</changefreq><priority>0.85</priority></url>
  <url><loc>${BASE}/en/browse?game=League+of+Legends</loc><changefreq>daily</changefreq><priority>0.85</priority></url>
  <url><loc>${BASE}/en/browse?game=FIFA</loc><changefreq>daily</changefreq><priority>0.85</priority></url>
  <url><loc>${BASE}/en/browse?game=Call+of+Duty</loc><changefreq>daily</changefreq><priority>0.85</priority></url>
  <url><loc>${BASE}/en/browse?game=Apex+Legends</loc><changefreq>daily</changefreq><priority>0.85</priority></url>
  <url><loc>${BASE}/en/browse?type=Account</loc><changefreq>daily</changefreq><priority>0.8</priority></url>
  <url><loc>${BASE}/en/browse?type=Skin</loc><changefreq>daily</changefreq><priority>0.8</priority></url>
  <url><loc>${BASE}/en/browse?type=Weapon</loc><changefreq>daily</changefreq><priority>0.8</priority></url>
  <url><loc>${BASE}/en/browse?type=Bundle</loc><changefreq>daily</changefreq><priority>0.8</priority></url>
  <url><loc>${BASE}/ar/browse?game=Valorant</loc><changefreq>daily</changefreq><priority>0.8</priority></url>
  <url><loc>${BASE}/ar/browse?game=Fortnite</loc><changefreq>daily</changefreq><priority>0.8</priority></url>
  <url><loc>${BASE}/ar/browse?game=CS2</loc><changefreq>daily</changefreq><priority>0.8</priority></url>
  <url><loc>${BASE}/ar/browse?type=Account</loc><changefreq>daily</changefreq><priority>0.8</priority></url>
  <url><loc>${BASE}/en/top-accounts</loc><changefreq>daily</changefreq><priority>0.8</priority></url>
  <url><loc>${BASE}/ar/top-accounts</loc><changefreq>daily</changefreq><priority>0.8</priority></url>
  <url><loc>${BASE}/en/bestsellers</loc><changefreq>daily</changefreq><priority>0.8</priority></url>
  <url><loc>${BASE}/ar/bestsellers</loc><changefreq>daily</changefreq><priority>0.8</priority></url>
  <url><loc>${BASE}/en/sell</loc><changefreq>weekly</changefreq><priority>0.7</priority></url>
  <url><loc>${BASE}/ar/sell</loc><changefreq>weekly</changefreq><priority>0.7</priority></url>
  <url><loc>${BASE}/en/advertise</loc><changefreq>monthly</changefreq><priority>0.4</priority></url>
  <url><loc>${BASE}/en/about</loc><changefreq>monthly</changefreq><priority>0.5</priority></url>
  <url><loc>${BASE}/ar/about</loc><changefreq>monthly</changefreq><priority>0.5</priority></url>
  <url><loc>${BASE}/en/help</loc><changefreq>monthly</changefreq><priority>0.5</priority></url>
  <url><loc>${BASE}/ar/help</loc><changefreq>monthly</changefreq><priority>0.5</priority></url>
  <url><loc>${BASE}/en/safety</loc><changefreq>monthly</changefreq><priority>0.5</priority></url>
  <url><loc>${BASE}/ar/safety</loc><changefreq>monthly</changefreq><priority>0.5</priority></url>
  <url><loc>${BASE}/en/careers</loc><changefreq>monthly</changefreq><priority>0.3</priority></url>
  <url><loc>${BASE}/en/privacy</loc><changefreq>yearly</changefreq><priority>0.3</priority></url>
  <url><loc>${BASE}/en/terms</loc><changefreq>yearly</changefreq><priority>0.3</priority></url>
</urlset>`;

// Robots points to /api/sitemap for the full dynamic version (includes live listings)
const ROBOTS_TXT = `User-agent: *
Allow: /
Allow: /en/browse
Allow: /ar/browse
Allow: /en/listing/
Allow: /ar/listing/
Allow: /en/seller/
Allow: /ar/seller/
Allow: /sitemap.xml
Disallow: /*/mod/
Disallow: /*/auth/
Disallow: /*/checkout/
Disallow: /*/orders/
Disallow: /*/dashboard/
Disallow: /*/profile/
Disallow: /*/chat/
Disallow: /*/wishlist/
Disallow: /*/verify/
Disallow: /api/
Crawl-delay: 1

Sitemap: ${BASE}/api/sitemap`;

export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'unknown';

  maybeCleanup();

  // ── Serve sitemap and robots directly from Edge (fast, no cold start) ────
  if (pathname === '/sitemap.xml') {
    return new NextResponse(SITEMAP_XML, {
      headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600' },
    });
  }

  if (pathname === '/robots.txt') {
    return new NextResponse(ROBOTS_TXT, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=86400' },
    });
  }

  // ── Block malicious user-agents ──────────────────────────────────────────
  const ua = req.headers.get('user-agent') ?? '';
  if (BLOCKED_UA_PATTERN.test(ua)) {
    return new NextResponse(null, { status: 403 });
  }

  // ── Block malicious path patterns ────────────────────────────────────────
  if (BLOCKED_PATH_PATTERNS.some((re) => re.test(pathname))) {
    return new NextResponse('Not Found', { status: 404 });
  }

  // ── Rate limit: auth pages — 10 per minute per IP ────────────────────────
  if (pathname.includes('/auth/')) {
    if (!rateLimit(`auth:${ip}`, 10, 60_000)) {
      return new NextResponse('Too many requests. Please wait before trying again.', {
        status: 429,
        headers: { 'Retry-After': '60', 'Content-Type': 'text/plain' },
      });
    }
  }

  // ── Rate limit: upload endpoints — 30 per 10 min per IP ─────────────────
  if (pathname.startsWith('/api/listings/upload-image') || pathname.startsWith('/api/auth/upload-id')) {
    if (!rateLimit(`upload:${ip}`, 30, 10 * 60_000)) {
      return new NextResponse(
        JSON.stringify({ error: 'Too many uploads. Please wait.' }),
        { status: 429, headers: { 'Content-Type': 'application/json', 'Retry-After': '600' } },
      );
    }
    return NextResponse.next();
  }

  // ── Rate limit: listing creation — 20 per 10 min per IP ─────────────────
  if (pathname.startsWith('/api/listings/create')) {
    if (!rateLimit(`create:${ip}`, 20, 10 * 60_000)) {
      return new NextResponse(
        JSON.stringify({ error: 'Too many requests. Please wait.' }),
        { status: 429, headers: { 'Content-Type': 'application/json', 'Retry-After': '600' } },
      );
    }
    return NextResponse.next();
  }

  // ── Rate limit: payment API — 10 per minute per IP ───────────────────────
  if (pathname.startsWith('/api/payment/')) {
    if (!rateLimit(`pay:${ip}`, 10, 60_000)) {
      return new NextResponse(
        JSON.stringify({ error: 'Too many payment requests. Please wait.' }),
        { status: 429, headers: { 'Content-Type': 'application/json', 'Retry-After': '60' } },
      );
    }
    return NextResponse.next();
  }

  // ── Rate limit: mod actions — 60 per 10 min per IP ───────────────────────
  if (pathname.startsWith('/api/mod/')) {
    if (!rateLimit(`mod:${ip}`, 60, 10 * 60_000)) {
      return new NextResponse(
        JSON.stringify({ error: 'Too many requests.' }),
        { status: 429, headers: { 'Content-Type': 'application/json', 'Retry-After': '600' } },
      );
    }
    return NextResponse.next();
  }

  // ── General API rate limit — 120 per minute per IP ───────────────────────
  if (pathname.startsWith('/api/')) {
    if (!rateLimit(`api:${ip}`, 120, 60_000)) {
      return new NextResponse(
        JSON.stringify({ error: 'Too many requests. Slow down.' }),
        { status: 429, headers: { 'Content-Type': 'application/json', 'Retry-After': '60' } },
      );
    }
    return NextResponse.next();
  }

  // ── next-intl locale routing for page routes ─────────────────────────────
  return intlMiddleware(req);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|logo.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?|ttf|eot)).*)'],
};
