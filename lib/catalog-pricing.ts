import { formatMinorUnitAmount, type Product } from '@/lib/catalog';

export function productRequiresQuote(product: Product) {
  return Boolean(product.requiresQuote || product.price <= 0);
}

export function formatPrice(product: Product) {
  if (productRequiresQuote(product)) return 'Contact for price';
  return formatMinorUnitAmount(product.price, product.currency);
}
