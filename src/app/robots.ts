import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/*/mod/', '/*/auth/', '/*/checkout/', '/*/orders/', '/*/dashboard/', '/*/profile/', '/*/chat/', '/api/'],
    },
    sitemap: 'https://geartrad.com/sitemap.xml',
  };
}
