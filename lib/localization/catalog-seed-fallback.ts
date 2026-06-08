import type { Category, Product } from '@/lib/catalog';
import type { SupportedLocale } from '@/lib/i18n/locales';

type AdminLocale = 'en' | 'fa';

type CategoryCopy = Pick<Category, 'title' | 'eyebrow' | 'description'>;
type ProductCopy = Pick<Product, 'title' | 'description'> & { categoryTitle?: string };

const categoryCopy: Record<string, CategoryCopy> = {
  'available-today': { title: 'آماده امروز', eyebrow: 'امروز', description: 'گل‌آرایی‌های آماده سفارش برای امروز.' },
  daily: { title: 'گل‌های روزانه', eyebrow: 'آماده امروز', description: 'گل‌آرایی‌های روزانه آماده سفارش.' },
  'cacao-roses': { title: 'شکلات و رز', eyebrow: 'شکلات و رز', description: 'هدیه‌های شکلاتی، رز و رز جاودان.' },
  'today-vip': { title: 'ویژه امروز', eyebrow: 'ویژه امروز', description: 'گل‌آرایی‌های لوکس با سفارش مشاوره‌ای.' },
  'flower-boxes': { title: 'باکس گل', eyebrow: 'باکس گل', description: 'چیدمان‌های گل در باکس‌های هدیه.' },
  'vip-boxes': { title: 'باکس ویژه', eyebrow: 'باکس ویژه', description: 'باکس‌های لوکس و بزرگ گل.' },
  'standard-boxes': { title: 'باکس استاندارد', eyebrow: 'باکس استاندارد', description: 'باکس‌های استاندارد گل برای هدیه.' },
  'rose-envelope': { title: 'پاکت رز', eyebrow: 'پاکت رز', description: 'پاکت رز و هدیه‌های گل ترند.' },
  'kids-boxes': { title: 'باکس کودک', eyebrow: 'باکس کودک', description: 'باکس گل و هدیه برای کودک.' },
  bouquets: { title: 'دسته‌گل', eyebrow: 'دسته‌گل', description: 'دسته‌گل‌های دستی و کاغذپیچ.' },
  'vip-bouquets': { title: 'دسته‌گل ویژه', eyebrow: 'دسته‌گل ویژه', description: 'دسته‌گل‌های لوکس و خاص.' },
  'standard-bouquets': { title: 'دسته‌گل استاندارد', eyebrow: 'دسته‌گل استاندارد', description: 'دسته‌گل‌های گرد و دستی.' },
  royal: { title: 'رویال ویژه', eyebrow: 'رویال', description: 'گل‌آرایی‌های بزرگ و ممتاز.' },
  'chocolate-eternal-rose': { title: 'شکلات و رز جاودان', eyebrow: 'کاکائو و رز', description: 'هدیه‌های شکلات، رز جاودان و گل ماندگار.' },
  'ceremony-design': { title: 'طراحی مراسم', eyebrow: 'طراحی مراسم', description: 'طراحی گل برای رویداد، مراسم و فضا.' },
  birthday: { title: 'تولد', eyebrow: 'تولد', description: 'گل، پکیج و هدیه برای تولد.' },
  'birthday-package': { title: 'پکیج تولد', eyebrow: 'پکیج تولد', description: 'پکیج‌های هدیه تولد.' },
  'birthday-box': { title: 'باکس تولد', eyebrow: 'باکس تولد', description: 'باکس گل و هدیه جشن تولد.' },
  'birthday-ceremony-design': { title: 'دیزاین تولد', eyebrow: 'دیزاین تولد', description: 'گل‌آرایی و طراحی مراسم تولد.' },
  surprise: { title: 'سورپرایز', eyebrow: 'سورپرایز', description: 'گل و هدیه برای سورپرایز.' },
  'cake-balloon': { title: 'کیک و بادکنک', eyebrow: 'کیک و بادکنک', description: 'کیک، بادکنک و هدیه‌های مکمل جشن.' },
  cakes: { title: 'کیک', eyebrow: 'کیک', description: 'کیک‌های تولد، عروسی، کودک و کلاسیک.' },
  'birthday-cake': { title: 'کیک تولد', eyebrow: 'کیک تولد', description: 'کیک‌های مناسب تولد.' },
  'wedding-ceremony-cake': { title: 'کیک عروسی و مراسم', eyebrow: 'کیک عروسی', description: 'کیک‌های عروسی و مراسم.' },
  'kids-cake': { title: 'کیک کودک', eyebrow: 'کیک کودک', description: 'کیک‌های مناسب کودک.' },
  'classic-cake': { title: 'کیک کلاسیک', eyebrow: 'کیک کلاسیک', description: 'کیک‌های کلاسیک.' },
  'mini-cake-trio': { title: 'مینی‌کیک سه‌تایی', eyebrow: 'مینی‌کیک', description: 'مجموعه مینی‌کیک سه‌تایی.' },
  balloons: { title: 'بادکنک', eyebrow: 'بادکنک', description: 'بادکنک و تزئینات جشن.' },
  pots: { title: 'گلدان و سبد', eyebrow: 'گلدان', description: 'گلدان، ارکیده و سبد گل.' },
  'steel-vases': { title: 'گلدان استیل', eyebrow: 'گلدان استیل', description: 'گل‌آرایی با گلدان استیل مدرن.' },
  'glass-vases': { title: 'گلدان شیشه‌ای', eyebrow: 'گلدان شیشه‌ای', description: 'گل‌آرایی با گلدان شیشه‌ای.' },
  orchids: { title: 'ارکیده', eyebrow: 'ارکیده', description: 'ارکیده و گلدان ارکیده.' },
  'flower-baskets': { title: 'سبد گل', eyebrow: 'سبد گل', description: 'گل‌آرایی در سبد.' },
  condolences: { title: 'تسلیت', eyebrow: 'تسلیت', description: 'گل‌های مناسب همدردی و تسلیت.' },
  'proposal-ceremony': { title: 'خواستگاری و بله‌برون', eyebrow: 'خواستگاری', description: 'گل‌های مراسم خواستگاری و بله‌برون.' },
  proposal: { title: 'خواستگاری', eyebrow: 'خواستگاری', description: 'گل‌آرایی عاشقانه برای خواستگاری.' },
  'bale-boroon': { title: 'بله‌برون', eyebrow: 'بله‌برون', description: 'گل‌های مراسم بله‌برون.' },
  'baby-flowers': { title: 'گل نوزاد', eyebrow: 'گل نوزاد', description: 'گل نوزاد و جشن تعیین جنسیت.' },
  'newborn-flowers': { title: 'گل نوزاد', eyebrow: 'نوزاد', description: 'هدیه گل برای نوزاد.' },
  'gender-reveal': { title: 'تعیین جنسیت', eyebrow: 'تعیین جنسیت', description: 'گل و هدیه جشن تعیین جنسیت.' },
  weddings: { title: 'عروسی', eyebrow: 'عروسی', description: 'گل عروسی، دسته‌گل عروس و تزئینات.' },
  'bridal-bouquet': { title: 'دسته‌گل عروس', eyebrow: 'دسته‌گل عروس', description: 'طراحی دسته‌گل عروس.' },
  'bridal-car-design': { title: 'دیزاین ماشین عروس', eyebrow: 'ماشین عروس', description: 'گل‌آرایی ماشین عروس.' },
  'groom-boutonniere': { title: 'گل کت داماد', eyebrow: 'داماد', description: 'گل کت و گل جیب داماد.' },
  'woshe-distance': { title: 'ارسال به سراسر ایران', eyebrow: 'ارسال راه دور', description: 'سفارش و ارسال گل به شهرهای ایران.' }
};

const productTitleCopy: Record<string, string> = {
  'vip-box-blue': 'باکس ویژه آبی',
  'signiture-round-baby-pink': 'باکس گرد صورتی ملایم',
  'imperium-vip-red-roses': 'باکس ویژه رز قرمز',
  'imperium-vip-peach': 'باکس ویژه هلویی',
  'woshe-grand-cream': 'چیدمان بزرگ کرم',
  'woshe-round-hand-bouquet-honey-rose': 'دسته‌گل گرد رز عسلی',
  'woshe-round-hand-bouquet-ruby-harmony': 'دسته‌گل گرد یاقوتی',
  'woshe-round-hand-bouquet-white-lily': 'دسته‌گل گرد لیلیوم سفید',
  'steel-bloom-wild-1001372': 'گل‌آرایی استیل وحشی',
  'woshe-christmas-collection-round-hand-bouquet': 'دسته‌گل گرد فصلی',
  'vip-box-red-pink': 'باکس ویژه قرمز و صورتی',
  'imperium-pink': 'باکس صورتی امپریوم',
  'teddy-bouquet': 'دسته‌گل تدی',
  'steel-bloom-wild-1001110': 'گل‌آرایی استیل وحشی',
  'autumn-design-2': 'چیدمان پاییزی ۲',
  'dark-blue-design': 'چیدمان آبی تیره',
  'pastel-green-design': 'چیدمان سبز پاستلی',
  'yellow-pink-design': 'چیدمان زرد و صورتی',
  'woshe-round-hand-bouquet-red': 'دسته‌گل گرد قرمز',
  'woshe-round-hand-bouquet-pink': 'دسته‌گل گرد صورتی',
  'cream-pink-design': 'چیدمان کرم و صورتی',
  'light-green-design': 'چیدمان سبز روشن',
  'pink-roses-pink-belle': 'رز صورتی بل',
  'maroon-belle': 'بل زرشکی'
};

function localeKey(locale?: SupportedLocale | string | null): AdminLocale {
  return locale?.toLowerCase().startsWith('fa') ? 'fa' : 'en';
}

function localizeSeedCategory(category: Category): Category {
  const localized = categoryCopy[category.slug];
  if (!localized) return category;
  return { ...category, ...localized };
}

function localizeSeedProduct(product: Product, categoryTitleBySlug: Map<string, string>): Product {
  const title = productTitleCopy[product.slug] ?? product.title;
  const categoryTitle = categoryTitleBySlug.get(product.category) ?? product.categoryTitle;
  return {
    ...product,
    title,
    categoryTitle,
    description: `${title} برای نمایش و تست کاتالوگ فروشگاه.`
  };
}

export function localizeSeedCategories(categories: Category[], locale?: SupportedLocale | string | null): Category[] {
  if (localeKey(locale) !== 'fa') return categories;
  return categories.map(localizeSeedCategory);
}

export function localizeSeedProducts(products: Product[], locale?: SupportedLocale | string | null, categories: Category[] = []): Product[] {
  if (localeKey(locale) !== 'fa') return products;
  const localizedCategories = localizeSeedCategories(categories, locale);
  const categoryTitleBySlug = new Map(localizedCategories.map((category) => [category.slug, category.title]));
  return products.map((product) => localizeSeedProduct(product, categoryTitleBySlug));
}
