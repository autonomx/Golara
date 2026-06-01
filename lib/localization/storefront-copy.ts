export type StorefrontCopyLocale = 'en' | 'fa';

export type StorefrontCopyKey =
  | 'home.collectionsEyebrow'
  | 'home.collectionsTitle'
  | 'home.favoritesEyebrow'
  | 'home.favoritesTitle'
  | 'nav.catalog'
  | 'catalog.eyebrow'
  | 'catalog.title'
  | 'catalog.body'
  | 'category.exploreEyebrow'
  | 'category.subcategoriesTitle'
  | 'category.productsEyebrow'
  | 'category.allInCollection'
  | 'category.empty'
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
    'home.collectionsEyebrow': 'Occasions',
    'home.collectionsTitle': 'Shop by occasion',
    'home.favoritesEyebrow': 'Customer favorites',
    'home.favoritesTitle': 'Best sellers',
    'nav.catalog': 'Catalog',
    'catalog.eyebrow': 'Catalog',
    'catalog.title': 'All products',
    'catalog.body': 'The catalog is now wired through the CMS data layer. With DATABASE_URL configured, products are loaded from Prisma; otherwise seeded content is used for previews.',
    'category.exploreEyebrow': 'Explore',
    'category.subcategoriesTitle': 'Subcategories',
    'category.productsEyebrow': 'Products',
    'category.allInCollection': 'All in this collection',
    'category.empty': 'No products are assigned to this category yet. Add products in the admin CMS or choose a subcategory above.',
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
    'home.collectionsEyebrow': 'مناسبت‌ها',
    'home.collectionsTitle': 'خرید بر اساس مناسبت',
    'home.favoritesEyebrow': 'محبوب مشتریان',
    'home.favoritesTitle': 'پرفروش‌ها',
    'nav.catalog': 'کاتالوگ',
    'catalog.eyebrow': 'کاتالوگ',
    'catalog.title': 'همه محصولات',
    'catalog.body': 'کاتالوگ اکنون از لایه داده CMS خوانده می‌شود. با تنظیم DATABASE_URL محصولات از Prisma بارگذاری می‌شوند؛ در غیر این صورت محتوای نمونه برای پیش‌نمایش استفاده می‌شود.',
    'category.exploreEyebrow': 'کاوش',
    'category.subcategoriesTitle': 'زیرمجموعه‌ها',
    'category.productsEyebrow': 'محصولات',
    'category.allInCollection': 'همه محصولات این مجموعه',
    'category.empty': 'هنوز محصولی به این دسته اختصاص داده نشده است. در CMS ادمین محصول اضافه کنید یا یک زیرمجموعه را انتخاب کنید.',
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
