import type { MetadataRoute } from 'next';
import { absoluteSiteUrl } from '@/lib/site-metadata';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/api']
      }
    ],
    sitemap: absoluteSiteUrl('/sitemap.xml')
  };
}
