import { NextRequest, NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

// ── Rate limiter (in-memory per Edge instance) ────────────────────────────────
// Limits abusive traffic per IP. Note: each Vercel serverless instance has its
// own store, so this is per-instance — still catches single-source abuse and
// bots that hammer the same function instance.
const rateStore = new Map<string, { count: number; resetAt: number }>();

const RATE_LIMITS: { pattern: RegExp; limit: number; windowMs: number }[] = [
  // Auth: strict — 10 attempts per 15 min per IP
  { pattern: /^\/api\/(auth|mod\/register)/, limit: 10, windowMs: 15 * 60_000 },
  // Listings create/upload: 30 per 10 min
  { pattern: /^\/api\/listings\/(create|upload-image)/, limit: 30, windowMs: 10 * 60_000 },
  // Payment initiation: 20 per 5 min
  { pattern: /^\/api\/payment/, limit: 20, windowMs: 5 * 60_000 },
  // Mod actions: 60 per 10 min
  { pattern: /^\/api\/mod/, limit: 60, windowMs: 10 * 60_000 },
  // All other API routes: 120 per minute
  { pattern: /^\/api\//, limit: 120, windowMs: 60_000 },
];

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-real-ip') ||
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown'
  );
}

function checkRateLimit(ip: string, pathname: string): { allowed: boolean; retryAfter?: number } {
  const rule = RATE_LIMITS.find((r) => r.pattern.test(pathname));
  if (!rule) return { allowed: true };

  const key = `${ip}:${pathname.replace(/\/[a-f0-9-]{36}/gi, '/:id')}`; // normalise UUIDs
  const now = Date.now();
  const entry = rateStore.get(key);

  if (!entry || now > entry.resetAt) {
    rateStore.set(key, { count: 1, resetAt: now + rule.windowMs });
    return { allowed: true };
  }

  entry.count += 1;
  if (entry.count > rule.limit) {
    return { allowed: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
  }

  return { allowed: true };
}

// Periodically prune expired entries to prevent memory leak
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of rateStore.entries()) {
    if (now > val.resetAt) rateStore.delete(key);
  }
}, 60_000);

// ── next-intl routing middleware ─────────────────────────────────────────────
const intlMiddleware = createMiddleware(routing);

// ── Main middleware ──────────────────────────────────────────────────────────
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ── Rate limiting (API routes only) ─────────────────────────────────────
  if (pathname.startsWith('/api/')) {
    const ip = getClientIp(req);
    const { allowed, retryAfter } = checkRateLimit(ip, pathname);

    if (!allowed) {
      return new NextResponse(
        JSON.stringify({ error: 'Too many requests. Please slow down.' }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(retryAfter ?? 60),
            'X-RateLimit-Limit': '120',
            'X-RateLimit-Remaining': '0',
          },
        }
      );
    }

    // ── Request size guard (reject payloads > 10 MB) ─────────────────────
    const contentLength = parseInt(req.headers.get('content-length') ?? '0', 10);
    if (contentLength > 10 * 1024 * 1024) {
      return new NextResponse(
        JSON.stringify({ error: 'Payload too large.' }),
        { status: 413, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // ── Block suspicious user agents (bots / scanners) ───────────────────
    const ua = req.headers.get('user-agent') ?? '';
    const blockedAgents = /sqlmap|nikto|nmap|masscan|nuclei|zgrab|dirbuster|gobuster/i;
    if (blockedAgents.test(ua)) {
      return new NextResponse(null, { status: 403 });
    }

    // For API routes, pass through without intl processing
    return NextResponse.next();
  }

  // ── next-intl locale routing ─────────────────────────────────────────────
  return intlMiddleware(req);
}

export const config = {
  matcher: [
    // Match all API routes for rate limiting
    '/api/:path*',
    // Match locale routes for next-intl (skip static assets)
    '/((?!_next|_vercel|.*\\..*).*)',
  ],
};
