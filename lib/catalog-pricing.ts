import { formatMinorUnitAmount, type Product } from '@/lib/catalog';

export function productRequiresQuote(product: Product) {
  return Boolean(product.requiresQuote || product.price <= 0);
}

export function formatPrice(product: Product, locale = 'en-CA') {
  if (productRequiresQuote(product)) return locale.toLowerCase().startsWith('fa') ? 'تماس برای قیمت' : 'Contact for price';
  return formatMinorUnitAmount(product.price, product.currency, locale);
}
