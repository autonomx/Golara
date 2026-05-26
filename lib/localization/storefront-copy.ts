export type StorefrontCopyLocale = 'en' | 'fa';

export type StorefrontCopyKey =
  | 'home.collectionsEyebrow'
  | 'home.collectionsTitle'
  | 'home.favoritesEyebrow'
  | 'home.favoritesTitle'
  | 'product.bestSeller'
  | 'product.availableToday'
  | 'product.preOrderRequired'
  | 'product.addToCart'
  | 'product.orderByWhatsApp'
  | 'product.quantity'
  | 'product.cartUnavailableNote'
  | 'common.home';

type StorefrontCopyRegistry = Record<StorefrontCopyLocale, Record<StorefrontCopyKey, string>>;

export const storefrontCopy: StorefrontCopyRegistry = {
  en: {
    'home.collectionsEyebrow': 'Collections',
    'home.collectionsTitle': 'Shop by occasion',
    'home.favoritesEyebrow': 'Favorites',
    'home.favoritesTitle': 'Best sellers',
    'product.bestSeller': 'Best seller',
    'product.availableToday': 'Available today',
    'product.preOrderRequired': 'Pre-order required',
    'product.addToCart': 'Add to cart',
    'product.orderByWhatsApp': 'Order by WhatsApp',
    'product.quantity': 'Quantity',
    'product.cartUnavailableNote': 'Cart checkout is available when the database-backed product catalog is enabled.',
    'common.home': 'Home'
  },
  fa: {
    'home.collectionsEyebrow': 'مجموعه‌ها',
    'home.collectionsTitle': 'خرید بر اساس مناسبت',
    'home.favoritesEyebrow': 'محبوب‌ها',
    'home.favoritesTitle': 'پرفروش‌ها',
    'product.bestSeller': 'پرفروش',
    'product.availableToday': 'امروز موجود است',
    'product.preOrderRequired': 'نیازمند پیش‌سفارش',
    'product.addToCart': 'افزودن به سبد خرید',
    'product.orderByWhatsApp': 'سفارش از طریق واتساپ',
    'product.quantity': 'تعداد',
    'product.cartUnavailableNote': 'پرداخت سبد خرید زمانی فعال است که کاتالوگ محصول مبتنی بر پایگاه داده فعال باشد.',
    'common.home': 'خانه'
  }
};

export function normalizeStorefrontCopyLocale(locale?: string | null): StorefrontCopyLocale {
  return locale?.toLowerCase().startsWith('fa') ? 'fa' : 'en';
}

export function getStorefrontCopy(key: StorefrontCopyKey, locale?: string | null): string {
  const normalizedLocale = normalizeStorefrontCopyLocale(locale);
  return storefrontCopy[normalizedLocale][key] ?? storefrontCopy.en[key];
}

export function getStorefrontCopyDirection(locale?: string | null): 'ltr' | 'rtl' {
  return normalizeStorefrontCopyLocale(locale) === 'fa' ? 'rtl' : 'ltr';
}
