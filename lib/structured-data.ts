import type { Product } from '@/lib/catalog';
import { absoluteSiteUrl, siteMetadata } from '@/lib/site-metadata';

function absoluteImageUrl(image: string) {
  if (image.startsWith('http://') || image.startsWith('https://')) return image;
  return absoluteSiteUrl(image);
}

export function buildProductJsonLd(product: Product) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description: product.description,
    image: absoluteImageUrl(product.image),
    sku: product.code,
    brand: {
      '@type': 'Brand',
      name: siteMetadata.name
    },
    offers: {
      '@type': 'Offer',
      url: absoluteSiteUrl(`/products/${product.slug}`),
      priceCurrency: product.currency,
      price: product.price,
      availability: product.availableToday ? 'https://schema.org/InStock' : 'https://schema.org/LimitedAvailability'
    }
  };
}

export function JsonLdScript({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  );
}
