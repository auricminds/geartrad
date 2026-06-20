import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const securityHeaders = [
  // Never render this site inside an iframe — prevents clickjacking
  { key: 'X-Frame-Options', value: 'DENY' },
  // Stop browsers from MIME-sniffing responses
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Only send origin when navigating to HTTPS; hide full URL from HTTP
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Force HTTPS for 2 years, include subdomains
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  // Disable unnecessary browser features
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
  // DNS prefetch control
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  // Legacy XSS protection for older browsers
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  {
    key: 'Content-Security-Policy',
    value: [
      // Default: only same-origin
      "default-src 'self'",
      // Scripts: Next.js requires unsafe-inline for RSC hydration; eval removed
      "script-src 'self' 'unsafe-inline'",
      // Styles: inline needed for Tailwind + Framer Motion
      "style-src 'self' 'unsafe-inline'",
      // Images: self, data URIs, blob (previews), Supabase storage, Unsplash, DiceBear
      "img-src 'self' data: blob: https://images.unsplash.com https://api.dicebear.com https://*.supabase.co",
      // Connections: Supabase API + Realtime, blockchain APIs for crypto verification
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://blockstream.info https://apilist.tronscanapi.com https://api.etherscan.io",
      // No iframes — prevents clickjacking at CSP level too
      "frame-src 'none'",
      // No web workers from external sources
      "worker-src 'self' blob:",
      // Fonts: self only
      "font-src 'self'",
      // No plugins ever
      "object-src 'none'",
      // No <base> tag hijacking
      "base-uri 'self'",
      // Forms only post to same origin
      "form-action 'self'",
      // Only load media from trusted sources
      "media-src 'self' blob: https://*.supabase.co",
    ].join('; '),
  },
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'api.dicebear.com' },
      { protocol: 'https', hostname: '*.supabase.co' },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
