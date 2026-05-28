export const dynamic = 'force-dynamic';

export function GET() {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://geartrad.com';

  const text = `User-agent: *
Allow: /
Disallow: /*/mod/
Disallow: /*/auth/
Disallow: /*/checkout/
Disallow: /*/orders/
Disallow: /*/dashboard/
Disallow: /*/profile/
Disallow: /*/chat/
Disallow: /api/

Sitemap: ${base}/sitemap.xml`;

  return new Response(text, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
