import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/site-metadata';
import './globals.css';

export const metadata: Metadata = buildPageMetadata();

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
