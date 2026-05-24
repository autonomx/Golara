import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Golara | Luxury Flowers & Gifts',
  description: 'An editable luxury flower and gift storefront for bouquets, boxes, weddings, and special moments.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
