import { createElement } from 'react';
import type { Category, Product } from '@/lib/catalog';
import { absoluteSiteUrl, siteMetadata } from '@/lib/site-metadata';

function absoluteImageUrl(image: string) {
  if (image.startsWith('http://') || image.startsWith('https://')) return image;
  return absoluteSiteUrl(image);
}

export function serializeJsonLd(data: unknown) {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

export function buildOrganizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: siteMetadata.name,
    url: absoluteSiteUrl('/'),
    logo: absoluteSiteUrl('/logo.png'),
    description: siteMetadata.description
  };
}

export function buildWebSiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteMetadata.name,
    url: absoluteSiteUrl('/'),
    description: siteMetadata.description
  };
}

export function buildBreadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteSiteUrl(item.path)
    }))
  };
}

export function buildCategoryBreadcrumbJsonLd(category: Category) {
  return buildBreadcrumbJsonLd([
    { name: siteMetadata.name, path: '/' },
    { name: category.title, path: `/categories/${category.slug}` }
  ]);
}

export function buildProductBreadcrumbJsonLd(product: Product, category?: Category | null) {
  return buildBreadcrumbJsonLd([
    { name: siteMetadata.name, path: '/' },
    { name: category?.title || product.categoryTitle || product.category, path: `/categories/${product.category}` },
    { name: product.title, path: `/products/${product.slug}` }
  ]);
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
  return createElement('script', {
    type: 'application/ld+json',
    dangerouslySetInnerHTML: { __html: serializeJsonLd(data) }
  });
}
