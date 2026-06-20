export const dynamic = 'force-dynamic';

export function GET() {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://geartrad.com';

  const text = `User-agent: *
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

# Crawl-delay: be respectful of server resources
Crawl-delay: 1

Sitemap: ${base}/api/sitemap`;

  return new Response(text, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
