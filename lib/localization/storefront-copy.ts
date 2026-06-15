export type StorefrontCopyLocale = 'en' | 'fa';

export type StorefrontCopyKey =
  | 'brand.name'
  | 'home.collectionsEyebrow'
  | 'home.collectionsTitle'
  | 'home.collectionsBody'
  | 'home.collectionsCtaLabel'
  | 'home.favoritesEyebrow'
  | 'home.favoritesTitle'
  | 'home.heroPrimaryCtaFallback'
  | 'home.heroSecondaryCtaFallback'
  | 'home.heroTertiaryCtaFallback'
  | 'home.heroTrustOneFallback'
  | 'home.heroTrustTwoFallback'
  | 'home.heroTrustThreeFallback'
  | 'home.heroStudioBadgeFallback'
  | 'home.footerShopTitle'
  | 'home.footerServiceTitle'
  | 'home.footerBody'
  | 'home.footerServiceBody'
  | 'home.footerAllProducts'
  | 'home.footerOccasions'
  | 'home.footerBestSellers'
  | 'header.announcement'
  | 'header.primaryNavigation'
  | 'header.accountLabel'
  | 'header.cartLabel'
  | 'header.cartWithItemsLabel'
  | 'language.switcherLabel'
  | 'language.fa'
  | 'language.en'
  | 'nav.catalog'
  | 'nav.occasions'
  | 'nav.availableToday'
  | 'nav.bestSellers'
  | 'catalog.eyebrow'
  | 'catalog.title'
  | 'catalog.body'
  | 'catalog.searchLabel'
  | 'catalog.searchPlaceholder'
  | 'catalog.searchSubmit'
  | 'catalog.searchClear'
  | 'catalog.showingSearchResults'
  | 'catalog.showingProducts'
  | 'catalog.emptyTitle'
  | 'catalog.emptyBody'
  | 'catalog.emptyCta'
  | 'categories.eyebrow'
  | 'categories.title'
  | 'categories.body'
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
  | 'product.variant'
  | 'product.viewLabel'
  | 'product.interestedMessage'
  | 'product.contactForPrice'
  | 'product.cartUnavailableNote'
  | 'common.home';

type StorefrontCopyRegistry = Record<StorefrontCopyLocale, Record<StorefrontCopyKey, string>>;

export const storefrontCopy: StorefrontCopyRegistry = {
  en: {
    'brand.name': 'Golara',
    'home.collectionsEyebrow': 'Categories',
    'home.collectionsTitle': 'Shop by category',
    'home.collectionsBody': 'Browse by the moment you are buying for, from birthdays and weddings to sympathy, baby flowers, and same-day gifts.',
    'home.collectionsCtaLabel': 'See all occasions',
    'home.favoritesEyebrow': 'Customer favorites',
    'home.favoritesTitle': 'Best sellers',
    'home.heroPrimaryCtaFallback': 'Shop available today',
    'home.heroSecondaryCtaFallback': 'All products',
    'home.heroTertiaryCtaFallback': 'Best sellers',
    'home.heroTrustOneFallback': 'Same-day options',
    'home.heroTrustTwoFallback': 'Premium finish',
    'home.heroTrustThreeFallback': 'Sales guidance',
    'home.heroStudioBadgeFallback': 'Golara studio selection',
    'home.footerShopTitle': 'Shop',
    'home.footerServiceTitle': 'Service',
    'home.footerBody': 'A luxury floral storefront for bouquets, flower boxes, weddings, events, and premium gifting.',
    'home.footerServiceBody': 'Same-day availability, premium boxes, event flowers, and staff-assisted ordering.',
    'home.footerAllProducts': 'All products',
    'home.footerOccasions': 'Occasions',
    'home.footerBestSellers': 'Best sellers',
    'header.announcement': 'Same-day flowers, occasion gifts, and guided VIP arrangements',
    'header.primaryNavigation': 'Primary navigation',
    'header.accountLabel': 'Account',
    'header.cartLabel': 'Cart',
    'header.cartWithItemsLabel': 'Cart with {count} items',
    'language.switcherLabel': 'Storefront language',
    'language.fa': 'Persian',
    'language.en': 'English',
    'nav.catalog': 'Catalog',
    'nav.occasions': 'Occasions',
    'nav.availableToday': 'Available today',
    'nav.bestSellers': 'Best sellers',
    'catalog.eyebrow': 'Catalog',
    'catalog.title': 'All products',
    'catalog.body': 'Browse the full Golara catalog, including bouquets, flower boxes, occasion gifts, and premium arrangements.',
    'catalog.searchLabel': 'Search products',
    'catalog.searchPlaceholder': 'Search by flower, color, product code, or occasion...',
    'catalog.searchSubmit': 'Search',
    'catalog.searchClear': 'Clear',
    'catalog.showingSearchResults': 'Showing {count} results for “{search}”',
    'catalog.showingProducts': 'Showing {count} products',
    'catalog.emptyTitle': 'No products found',
    'catalog.emptyBody': 'Try searching for a color, bouquet, box, occasion, or product code.',
    'catalog.emptyCta': 'View all products',
    'categories.eyebrow': 'Collections',
    'categories.title': 'Browse all floral collections',
    'categories.body': 'Choose a collection to view its products or continue into its subcategories.',
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
    'product.variant': 'Variant',
    'product.viewLabel': 'View {title}',
    'product.interestedMessage': 'I am interested in {title}.',
    'product.contactForPrice': 'Contact for price',
    'product.cartUnavailableNote': 'Cart checkout is available when the database-backed product catalog is enabled.',
    'common.home': 'Home'
  },
  fa: {
    'brand.name': 'گلارا',
    'home.collectionsEyebrow': 'دسته‌بندی‌ها',
    'home.collectionsTitle': 'خرید بر اساس دسته‌بندی',
    'home.collectionsBody': 'بر اساس مناسبت انتخاب کنید؛ از تولد و عروسی تا تسلیت، گل نوزاد و هدایای آماده همان‌روز.',
    'home.collectionsCtaLabel': 'مشاهده همه مناسبت‌ها',
    'home.favoritesEyebrow': 'محبوب مشتریان',
    'home.favoritesTitle': 'پرفروش‌ها',
    'home.heroPrimaryCtaFallback': 'خرید گزینه‌های آماده امروز',
    'home.heroSecondaryCtaFallback': 'همه محصولات',
    'home.heroTertiaryCtaFallback': 'پرفروش‌ها',
    'home.heroTrustOneFallback': 'گزینه‌های همان‌روز',
    'home.heroTrustTwoFallback': 'اجرای لوکس',
    'home.heroTrustThreeFallback': 'راهنمایی فروش',
    'home.heroStudioBadgeFallback': 'انتخاب ویژه استودیو گلارا',
    'home.footerShopTitle': 'خرید',
    'home.footerServiceTitle': 'خدمات',
    'home.footerBody': 'فروشگاه گل لوکس برای دسته‌گل، باکس گل، عروسی، مراسم و هدیه‌های خاص.',
    'home.footerServiceBody': 'ارسال همان‌روز، باکس‌های لوکس، گل‌آرایی مراسم و ثبت سفارش با راهنمایی تیم فروش.',
    'home.footerAllProducts': 'همه محصولات',
    'home.footerOccasions': 'مناسبت‌ها',
    'home.footerBestSellers': 'پرفروش‌ها',
    'header.announcement': 'گل‌های همان‌روز، هدیه‌های مناسبتی، و راهنمایی برای سفارش‌های ویژه',
    'header.primaryNavigation': 'ناوبری اصلی',
    'header.accountLabel': 'حساب کاربری',
    'header.cartLabel': 'سبد خرید',
    'header.cartWithItemsLabel': 'سبد خرید با {count} کالا',
    'language.switcherLabel': 'زبان فروشگاه',
    'language.fa': 'فارسی',
    'language.en': 'انگلیسی',
    'nav.catalog': 'کاتالوگ',
    'nav.occasions': 'مناسبت‌ها',
    'nav.availableToday': 'آماده امروز',
    'nav.bestSellers': 'پرفروش‌ها',
    'catalog.eyebrow': 'کاتالوگ',
    'catalog.title': 'همه محصولات',
    'catalog.body': 'همه محصولات گلارا را ببینید؛ از دسته‌گل و باکس گل تا هدیه‌های مناسبتی و چیدمان‌های لوکس.',
    'catalog.searchLabel': 'جستجوی محصولات',
    'catalog.searchPlaceholder': 'جستجو بر اساس گل، رنگ، کد محصول یا مناسبت...',
    'catalog.searchSubmit': 'جستجو',
    'catalog.searchClear': 'پاک کردن',
    'catalog.showingSearchResults': 'نمایش {count} نتیجه برای «{search}»',
    'catalog.showingProducts': 'نمایش {count} محصول',
    'catalog.emptyTitle': 'محصولی پیدا نشد',
    'catalog.emptyBody': 'رنگ، دسته‌گل، باکس، مناسبت یا کد محصول دیگری را جستجو کنید.',
    'catalog.emptyCta': 'مشاهده همه محصولات',
    'categories.eyebrow': 'مجموعه‌ها',
    'categories.title': 'مشاهده همه مجموعه‌های گل',
    'categories.body': 'یک مجموعه را انتخاب کنید تا محصولات آن را ببینید یا وارد زیرمجموعه‌های دقیق‌تر شوید.',
    'category.exploreEyebrow': 'کاوش',
    'category.subcategoriesTitle': 'زیرمجموعه‌ها',
    'category.productsEyebrow': 'محصولات',
    'category.allInCollection': 'همه محصولات این مجموعه',
    'category.empty': 'هنوز محصولی به این دسته اختصاص داده نشده است. در بخش مدیریت محصول اضافه کنید یا یک زیرمجموعه را انتخاب کنید.',
    'product.bestSeller': 'پرفروش',
    'product.availableToday': 'آماده امروز',
    'product.preOrderRequired': 'نیازمند پیش‌سفارش',
    'product.addToCart': 'افزودن به سبد خرید',
    'product.orderByWhatsApp': 'سفارش از واتساپ',
    'product.quantity': 'تعداد',
    'product.variant': 'مدل',
    'product.viewLabel': 'مشاهده {title}',
    'product.interestedMessage': 'به {title} علاقه‌مند هستم.',
    'product.contactForPrice': 'تماس برای قیمت',
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

export function formatStorefrontCopy(key: StorefrontCopyKey, locale: string | null | undefined, values: Record<string, string | number>) {
  let message = getStorefrontCopy(key, locale);
  for (const [name, value] of Object.entries(values)) {
    message = message.replaceAll(`{${name}}`, String(value));
  }
  return message;
}
