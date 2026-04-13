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
  {
    key: 'Content-Security-Policy',
    value: [
      // Default: only same-origin
      "default-src 'self'",
      // Scripts: Next.js inline scripts + self (nonce-based would be stronger but needs middleware)
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accept.paymob.com",
      // Styles: inline needed for Tailwind + Framer Motion
      "style-src 'self' 'unsafe-inline'",
      // Images: self, data URIs, Supabase storage, Unsplash, DiceBear
      "img-src 'self' data: blob: https://images.unsplash.com https://api.dicebear.com https://*.supabase.co",
      // Connections: Supabase API + Realtime, Paymob
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://accept.paymob.com",
      // iFrames: only Paymob payment iframe
      "frame-src https://accept.paymob.com",
      // Fonts: self only
      "font-src 'self'",
      // No plugins ever
      "object-src 'none'",
      // No <base> tag hijacking
      "base-uri 'self'",
      // Forms only post to same origin
      "form-action 'self' https://accept.paymob.com",
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
