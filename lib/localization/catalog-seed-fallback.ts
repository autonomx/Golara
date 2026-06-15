import type { Category, Product } from '@/lib/catalog';
import type { SupportedLocale } from '@/lib/i18n/locales';

type AdminLocale = 'en' | 'fa';

type CategoryCopy = Pick<Category, 'title' | 'eyebrow' | 'description'>;
type ProductCopy = Pick<Product, 'title' | 'description'> & { categoryTitle?: string };

const englishCategoryCopy: Record<string, CategoryCopy> = {
  'available-today': { title: 'Available Today', eyebrow: 'Today', description: 'Today-ready Woshe-style collection for daily, cacao and rose, and VIP selections.' },
  daily: { title: 'Daily', eyebrow: 'Ready today', description: 'Daily ready-to-order arrangements.' },
  'cacao-roses': { title: 'Cacao & Roses', eyebrow: 'Chocolate and roses', description: 'Chocolate, rose, and preserved rose gift concepts.' },
  'today-vip': { title: 'VIP', eyebrow: 'Today VIP', description: 'Premium arrangements available through sales-assisted ordering.' },
  'flower-boxes': { title: 'Flower Box', eyebrow: 'Flower boxes', description: 'Boxed floral arrangements following the public Woshe flower-box navigation.' },
  'vip-boxes': { title: 'VIP Box', eyebrow: 'VIP boxes', description: 'Premium VIP flower boxes and large luxury boxed arrangements.' },
  'standard-boxes': { title: 'Standard Boxes', eyebrow: 'Standard boxes', description: 'Standard boxed flower arrangements.' },
  'rose-envelope': { title: 'Woshe Trends', eyebrow: 'Rose envelope', description: 'Rose envelope and trend-led floral gift concepts.' },
  'kids-boxes': { title: 'Kids Box', eyebrow: 'Kids boxes', description: 'Child-focused flower box and gift designs.' },
  bouquets: { title: 'Bouquets', eyebrow: 'Bouquets', description: 'Hand bouquets and wrapped floral gifts.' },
  'vip-bouquets': { title: 'VIP Bouquets', eyebrow: 'VIP bouquets', description: 'Premium VIP bouquet designs.' },
  'standard-bouquets': { title: 'Standard Bouquets', eyebrow: 'Standard bouquets', description: 'Standard round and hand-tied bouquets.' },
  royal: { title: 'Woshe Royal VVIP', eyebrow: 'Royal VVIP', description: 'Royal and VVIP premium floral arrangements.' },
  'chocolate-eternal-rose': { title: 'Chocolate & Eternal Rose', eyebrow: 'Cacao and roses', description: 'Chocolate, preserved rose, and long-lasting gift concepts.' },
  'ceremony-design': { title: 'Ceremony Design', eyebrow: 'Ceremony design', description: 'Event, ceremony, and venue floral design.' },
  birthday: { title: 'Birthday', eyebrow: 'Birthday', description: 'Birthday arrangements, packages, and surprise concepts.' },
  'birthday-package': { title: 'Birthday Package', eyebrow: 'Birthday package', description: 'Curated birthday gift packages.' },
  'birthday-box': { title: 'Birthday Box', eyebrow: 'Birthday box', description: 'Birthday flower boxes and celebration gifts.' },
  'birthday-ceremony-design': { title: 'Birthday Ceremony Design', eyebrow: 'Birthday design', description: 'Birthday event floral styling.' },
  surprise: { title: 'Surprise', eyebrow: 'Surprise', description: 'Surprise flower and celebration gift concepts.' },
  'cake-balloon': { title: 'Cake & Balloon', eyebrow: 'Cake and balloon', description: 'Cake, balloon, and celebration add-on gifts.' },
  cakes: { title: 'Cakes', eyebrow: 'Cakes', description: 'Cake category parent for birthday, wedding, kids, classic, and mini cakes.' },
  'birthday-cake': { title: 'Birthday Cake', eyebrow: 'Birthday cake', description: 'Birthday cake designs.' },
  'wedding-ceremony-cake': { title: 'Wedding & Ceremony Cake', eyebrow: 'Wedding cake', description: 'Wedding and ceremony cakes.' },
  'kids-cake': { title: 'Kids Cake', eyebrow: 'Kids cake', description: 'Kids cake designs.' },
  'classic-cake': { title: 'Classic Cake', eyebrow: 'Classic cake', description: 'Classic cake designs.' },
  'mini-cake-trio': { title: 'Mini Cake Trio', eyebrow: 'Mini cake trio', description: 'Mini cake trio designs.' },
  balloons: { title: 'Balloons', eyebrow: 'Balloons', description: 'Balloon add-ons and celebration decorations.' },
  pots: { title: 'Pots', eyebrow: 'Pots', description: 'Vase, pot, orchid, and basket arrangements.' },
  'steel-vases': { title: 'Steel Vases', eyebrow: 'Steel vases', description: 'Modern steel vase arrangements.' },
  'glass-vases': { title: 'Glass Vases', eyebrow: 'Glass vases', description: 'Glass vase arrangements.' },
  orchids: { title: 'Orchids', eyebrow: 'Orchids', description: 'Orchid arrangements and potted orchid gifts.' },
  'flower-baskets': { title: 'Flower Baskets', eyebrow: 'Flower baskets', description: 'Basket-style flower arrangements.' },
  condolences: { title: 'Condolences', eyebrow: 'Condolences', description: 'Sympathy and condolence flowers.' },
  'proposal-ceremony': { title: 'Proposal & Bale Boroon', eyebrow: 'Proposal', description: 'Proposal and Bale Boroon ceremony flowers.' },
  proposal: { title: 'Proposal', eyebrow: 'Proposal', description: 'Proposal-ready romantic arrangements.' },
  'bale-boroon': { title: 'Bale Boroon', eyebrow: 'Bale Boroon', description: 'Bale Boroon ceremony flowers.' },
  'baby-flowers': { title: 'Baby Flowers', eyebrow: 'Baby flowers', description: 'New baby and gender reveal flowers.' },
  'newborn-flowers': { title: 'Newborn Flowers', eyebrow: 'Newborn flowers', description: 'Newborn flower gifts.' },
  'gender-reveal': { title: 'Gender Reveal', eyebrow: 'Gender reveal', description: 'Gender reveal flower and gift concepts.' },
  weddings: { title: 'Weddings', eyebrow: 'Weddings', description: 'Wedding flowers, bridal bouquets, car design, and groom boutonniere.' },
  'bridal-bouquet': { title: 'Bridal Bouquet', eyebrow: 'Bridal bouquet', description: 'Bridal bouquet designs.' },
  'bridal-car-design': { title: 'Bridal Car Design', eyebrow: 'Bridal car', description: 'Bridal car floral design.' },
  'groom-boutonniere': { title: 'Groom Boutonniere', eyebrow: 'Groom boutonniere', description: 'Groom boutonniere and pocket flower designs.' },
  'woshe-distance': { title: 'WOSHE Distance', eyebrow: 'Distance delivery', description: 'Distance ordering and delivery category inspired by the public Woshe navigation.' }
};

const persianCategoryCopy: Record<string, CategoryCopy> = {
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

const categoryCopyByLocale: Record<AdminLocale, Record<string, CategoryCopy>> = {
  en: englishCategoryCopy,
  fa: persianCategoryCopy
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

export function getLocalizedCategorySeedCopy(slug: string | undefined, locale?: SupportedLocale | string | null): CategoryCopy | undefined {
  if (!slug) return undefined;
  return categoryCopyByLocale[localeKey(locale)][slug];
}

function localizeSeedCategory(category: Category, locale?: SupportedLocale | string | null): Category {
  const localized = getLocalizedCategorySeedCopy(category.slug, locale);
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
  return categories.map((category) => localizeSeedCategory(category, locale));
}

export function localizeSeedProducts(products: Product[], locale?: SupportedLocale | string | null, categories: Category[] = []): Product[] {
  if (localeKey(locale) !== 'fa') return products;
  const localizedCategories = localizeSeedCategories(categories, locale);
  const categoryTitleBySlug = new Map(localizedCategories.map((category) => [category.slug, category.title]));
  return products.map((product) => localizeSeedProduct(product, categoryTitleBySlug));
}
