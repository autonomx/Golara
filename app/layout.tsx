import type { Metadata } from 'next';
import { SkipLink } from '@/components/SkipLink';
import { buildPageMetadata } from '@/lib/site-metadata';
import { buildOrganizationJsonLd, buildWebSiteJsonLd, JsonLdScript } from '@/lib/structured-data';
import './globals.css';

export const metadata: Metadata = buildPageMetadata();

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SkipLink />
        <JsonLdScript data={buildOrganizationJsonLd()} />
        <JsonLdScript data={buildWebSiteJsonLd()} />
        {children}
      </body>
    </html>
  );
}
