import type { Metadata } from 'next';
import { SkipLink } from '@/components/SkipLink';
import { StorefrontSiteAnalyticsReporter } from '@/components/StorefrontSiteAnalyticsReporter';
import { StorefrontWebVitalsReporter } from '@/components/StorefrontWebVitalsReporter';
import { resolveStorefrontLocale } from '@/lib/i18n/resolve-locale';
import { buildPageMetadata } from '@/lib/site-metadata';
import { buildOrganizationJsonLd, buildWebSiteJsonLd, JsonLdScript } from '@/lib/structured-data';
import './globals.css';

export const metadata: Metadata = buildPageMetadata();

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await resolveStorefrontLocale();

  return (
    <html lang={locale}>
      <head>
        <link rel="preconnect" href="https://res.cloudinary.com" crossOrigin="anonymous" />
      </head>
      <body>
        <SkipLink />
        <StorefrontSiteAnalyticsReporter />
        <StorefrontWebVitalsReporter />
        <JsonLdScript data={buildOrganizationJsonLd()} />
        <JsonLdScript data={buildWebSiteJsonLd()} />
        {children}
      </body>
    </html>
  );
}
