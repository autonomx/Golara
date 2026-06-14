import type { Metadata } from 'next';
import { getStorefrontCloudinaryImage } from '@/lib/media/cloudinary-image';

export const siteMetadata = {
  name: 'Golara',
  title: 'Golara | Luxury Flowers & Gifts',
  description: 'An editable luxury flower and gift storefront for bouquets, boxes, weddings, and special moments.',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://golara.example',
  image: '/og-image.png'
};

export function absoluteSiteUrl(path = '/') {
  const baseUrl = siteMetadata.url.replace(/\/$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}`;
}

export function buildPageMetadata(input: { title?: string; description?: string; path?: string; image?: string; index?: boolean } = {}): Metadata {
  const title = input.title || siteMetadata.title;
  const description = input.description || siteMetadata.description;
  const path = input.path || '/';
  const image = getStorefrontCloudinaryImage(input.image || siteMetadata.image, 'socialPreview');
  const shouldIndex = input.index ?? true;

  return {
    title,
    description,
    robots: shouldIndex ? undefined : { index: false, follow: false },
    metadataBase: new URL(siteMetadata.url),
    alternates: {
      canonical: path
    },
    openGraph: {
      type: 'website',
      siteName: siteMetadata.name,
      title,
      description,
      url: absoluteSiteUrl(path),
      images: [{ url: image, alt: title }]
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image]
    }
  };
}
