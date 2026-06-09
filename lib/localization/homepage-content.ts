import type { HomepageContent } from '@/lib/catalog';

const lookup: Record<'en' | 'fa', Partial<HomepageContent>> = {
  en: {
    eyebrow: 'Luxury floral studio',
    title: 'Flowers for moments worth keeping',
    body: 'Golara is a premium flower and gift storefront for bouquets, flower boxes, weddings, events, and special gifts.',
    primaryCtaLabel: 'Shop catalog',
    primaryCtaHref: '/products',
    secondaryCtaLabel: 'Content dashboard',
    secondaryCtaHref: '/admin',
    tertiaryCtaLabel: 'Best sellers',
    tertiaryCtaHref: '/#best-sellers',
    trustItemOne: 'Same-day options',
    trustItemTwo: 'Premium finish',
    trustItemThree: 'Sales guidance',
    studioBadge: 'Golara studio selection',
    collectionsEyebrow: 'Categories',
    collectionsTitle: 'Shop by category',
    collectionsBody: 'Browse by occasion, from birthdays and weddings to sympathy, baby flowers, and ready-today gifts.',
    collectionsCtaLabel: 'See all occasions',
    collectionsCtaHref: '/categories',
    footerBody: 'A luxury floral storefront for bouquets, flower boxes, weddings, events, and premium gifting.',
    footerServiceBody: 'Ready-today flowers, premium boxes, event florals, and guided ordering.'
  },
  fa: {
    eyebrow: 'استودیوی لوکس گل',
    title: 'گل‌هایی برای لحظه‌های ماندگار',
    body: 'گلارا فروشگاه آنلاین گل و هدیه لوکس برای دسته‌گل، باکس گل، عروسی، مراسم و هدیه‌های خاص است.',
    primaryCtaLabel: 'مشاهده کاتالوگ',
    primaryCtaHref: '/products',
    secondaryCtaLabel: 'داشبورد محتوا',
    secondaryCtaHref: '/admin',
    tertiaryCtaLabel: 'پرفروش‌ها',
    tertiaryCtaHref: '/#best-sellers',
    trustItemOne: 'گزینه‌های آماده امروز',
    trustItemTwo: 'اجرای لوکس',
    trustItemThree: 'راهنمایی فروش',
    studioBadge: 'انتخاب ویژه استودیو گلارا',
    collectionsEyebrow: 'دسته‌بندی‌ها',
    collectionsTitle: 'خرید بر اساس دسته‌بندی',
    collectionsBody: 'بر اساس مناسبت انتخاب کنید؛ از تولد و عروسی تا تسلیت، گل نوزاد و هدایای آماده امروز.',
    collectionsCtaLabel: 'مشاهده همه مناسبت‌ها',
    collectionsCtaHref: '/categories',
    footerBody: 'فروشگاه گل لوکس برای دسته‌گل، باکس گل، عروسی، مراسم و هدیه‌های خاص.',
    footerServiceBody: 'گل‌های آماده امروز، باکس‌های لوکس، گل‌آرایی مراسم و ثبت سفارش با راهنمایی تیم فروش.'
  }
};

function localeKey(locale?: string | null) {
  return locale?.toLowerCase().startsWith('fa') ? 'fa' : 'en';
}

export function selectHomepageContentForLocale(homepage: HomepageContent, locale?: string | null): HomepageContent {
  return {
    ...homepage,
    ...lookup[localeKey(locale)],
    heroImage: homepage.heroImage,
    heroImageAlt: homepage.heroImageAlt
  };
}
