export const dynamic = 'force-static';

export function GET() {
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

Sitemap: https://geartrad.com/sitemap.xml`;

  return new Response(text, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
