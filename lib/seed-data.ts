import type { Category, HomepageContent, Product } from './catalog';
import { getSeedProductImagePath } from './seed-product-images';

export const seedHomepageContent: HomepageContent = {
  eyebrow: 'Luxury floral studio',
  title: 'Flowers for moments worth keeping.',
  body: 'Golara is an editable ecommerce storefront for bouquets, flower boxes, weddings, events, and premium gifts. The test catalog mirrors public Woshe-style product facts while using original product-specific placeholder imagery and editable product copy.',
  primaryCtaLabel: 'Shop catalog',
  primaryCtaHref: '/products',
  secondaryCtaLabel: 'Manage CMS',
  secondaryCtaHref: '/admin',
  panelEyebrow: 'Test catalog parity',
  panelTitle: 'Woshe-style products, original assets',
  panelBody: 'Seed data uses public product names, codes, and prices for realistic testing while descriptions and images remain original placeholders.'
};

const categoryImage = (slug: string) => `/seed-images/category-real/${slug}`;

function seedCategory(input: Omit<Category, 'image' | 'isActive' | 'showOnHomepage'> & { imageSlug?: string; isActive?: boolean; showOnHomepage?: boolean }): Category {
  return { ...input, image: categoryImage(input.imageSlug ?? input.slug), showOnHomepage: input.showOnHomepage ?? true, isActive: input.isActive ?? true };
}

export const seedCategories: Category[] = [
  seedCategory({ slug: 'available-today', title: 'موجود برای امروز Available Today', eyebrow: 'Today', description: 'Today-ready Woshe-style collection for daily, cacao and rose, and VIP selections.', sortOrder: 10 }),
  seedCategory({ slug: 'daily', title: 'Daily', eyebrow: 'Ready today', description: 'Daily ready-to-order arrangements.', parentSlug: 'available-today', sortOrder: 11 }),
  seedCategory({ slug: 'cacao-roses', title: 'Cacao & Roses', eyebrow: 'Chocolate and roses', description: 'Chocolate, rose, and preserved rose gift concepts.', parentSlug: 'available-today', sortOrder: 12 }),
  seedCategory({ slug: 'today-vip', title: 'VIP', eyebrow: 'Today VIP', description: 'Premium arrangements available through sales-assisted ordering.', parentSlug: 'available-today', sortOrder: 13, imageSlug: 'royal' }),

  seedCategory({ slug: 'flower-boxes', title: 'باکس گل Flower Box', eyebrow: 'Flower boxes', description: 'Boxed floral arrangements following the public Woshe flower-box navigation.', sortOrder: 20 }),
  seedCategory({ slug: 'vip-boxes', title: 'باکس VIP VIP Box', eyebrow: 'VIP boxes', description: 'Premium VIP flower boxes and large luxury boxed arrangements.', parentSlug: 'flower-boxes', sortOrder: 21, imageSlug: 'royal' }),
  seedCategory({ slug: 'standard-boxes', title: 'باکس استاندارد Standard Boxes', eyebrow: 'Standard boxes', description: 'Standard boxed flower arrangements.', parentSlug: 'flower-boxes', sortOrder: 22, imageSlug: 'flower-boxes' }),
  seedCategory({ slug: 'rose-envelope', title: 'پاکت رز Woshe Trends', eyebrow: 'Rose envelope', description: 'Rose envelope and trend-led floral gift concepts.', parentSlug: 'flower-boxes', sortOrder: 23 }),
  seedCategory({ slug: 'kids-boxes', title: 'باکس گل کودک Kids Box', eyebrow: 'Kids boxes', description: 'Child-focused flower box and gift designs.', parentSlug: 'flower-boxes', sortOrder: 24, imageSlug: 'baby-flowers' }),

  seedCategory({ slug: 'bouquets', title: 'دسته گل Bouquets', eyebrow: 'Bouquets', description: 'Hand bouquets and wrapped floral gifts.', sortOrder: 30 }),
  seedCategory({ slug: 'vip-bouquets', title: 'دسته گل VIP VIP Bouquets', eyebrow: 'VIP bouquets', description: 'Premium VIP bouquet designs.', parentSlug: 'bouquets', sortOrder: 31, imageSlug: 'royal' }),
  seedCategory({ slug: 'standard-bouquets', title: 'دسته گل استاندارد Bouquets', eyebrow: 'Standard bouquets', description: 'Standard round and hand-tied bouquets.', parentSlug: 'bouquets', sortOrder: 32, imageSlug: 'bouquets' }),

  seedCategory({ slug: 'royal', title: 'وشه رویال Woshe Royal VVIP', eyebrow: 'Royal VVIP', description: 'Royal and VVIP premium floral arrangements.', sortOrder: 40 }),
  seedCategory({ slug: 'chocolate-eternal-rose', title: 'شکلات و رز جاودان Chocolate & Eternal Rose', eyebrow: 'Cacao and roses', description: 'Chocolate, preserved rose, and long-lasting gift concepts.', sortOrder: 45, imageSlug: 'cacao-roses' }),
  seedCategory({ slug: 'ceremony-design', title: 'طراحی مراسم Ceremony Design', eyebrow: 'Ceremony design', description: 'Event, ceremony, and venue floral design.', sortOrder: 50 }),

  seedCategory({ slug: 'birthday', title: 'تولد Birthday', eyebrow: 'Birthday', description: 'Birthday arrangements, packages, and surprise concepts.', sortOrder: 60 }),
  seedCategory({ slug: 'birthday-package', title: 'پکیج تولد Birthday Package', eyebrow: 'Birthday package', description: 'Curated birthday gift packages.', parentSlug: 'birthday', sortOrder: 61, imageSlug: 'birthday' }),
  seedCategory({ slug: 'birthday-box', title: 'باکس تولد Birthday Box', eyebrow: 'Birthday box', description: 'Birthday flower boxes and celebration gifts.', parentSlug: 'birthday', sortOrder: 62, imageSlug: 'birthday' }),
  seedCategory({ slug: 'birthday-ceremony-design', title: 'دیزاین مراسم تولد Birthday Ceremony Design', eyebrow: 'Birthday design', description: 'Birthday event floral styling.', parentSlug: 'birthday', sortOrder: 63, imageSlug: 'ceremony-design' }),
  seedCategory({ slug: 'surprise', title: 'سورپرایز Surprise', eyebrow: 'Surprise', description: 'Surprise flower and celebration gift concepts.', parentSlug: 'birthday', sortOrder: 64, imageSlug: 'cake-balloon' }),

  seedCategory({ slug: 'cake-balloon', title: 'کیک و بادکنک Cake & Balloon', eyebrow: 'Cake and balloon', description: 'Cake, balloon, and celebration add-on gifts.', sortOrder: 70 }),
  seedCategory({ slug: 'cakes', title: 'کیک Cakes', eyebrow: 'Cakes', description: 'Cake category parent for birthday, wedding, kids, classic, and mini cakes.', parentSlug: 'cake-balloon', sortOrder: 71, imageSlug: 'cake-balloon' }),
  seedCategory({ slug: 'birthday-cake', title: 'کیک تولد Birthday Cake', eyebrow: 'Birthday cake', description: 'Birthday cake designs.', parentSlug: 'cakes', sortOrder: 72, imageSlug: 'cake-balloon' }),
  seedCategory({ slug: 'wedding-ceremony-cake', title: 'بله برون و عروسی Wedding & Ceremony Cake', eyebrow: 'Wedding cake', description: 'Wedding and ceremony cakes.', parentSlug: 'cakes', sortOrder: 73, imageSlug: 'weddings' }),
  seedCategory({ slug: 'kids-cake', title: 'کیک کودک Kids Cake', eyebrow: 'Kids cake', description: 'Kids cake designs.', parentSlug: 'cakes', sortOrder: 74, imageSlug: 'baby-flowers' }),
  seedCategory({ slug: 'classic-cake', title: 'کیک کلاسیک Classic Cake', eyebrow: 'Classic cake', description: 'Classic cake designs.', parentSlug: 'cakes', sortOrder: 75, imageSlug: 'cake-balloon' }),
  seedCategory({ slug: 'mini-cake-trio', title: 'مینی کیک سه تایی Mini Cake Trio', eyebrow: 'Mini cake trio', description: 'Mini cake trio designs.', parentSlug: 'cakes', sortOrder: 76, imageSlug: 'cake-balloon' }),
  seedCategory({ slug: 'balloons', title: 'بادکنک Balloon', eyebrow: 'Balloons', description: 'Balloon add-ons and celebration decorations.', parentSlug: 'cake-balloon', sortOrder: 77, imageSlug: 'cake-balloon' }),

  seedCategory({ slug: 'pots', title: 'گلدان ها Pots', eyebrow: 'Pots', description: 'Vase, pot, orchid, and basket arrangements.', sortOrder: 80 }),
  seedCategory({ slug: 'steel-vases', title: 'گلدان های استیل Steel Vases', eyebrow: 'Steel vases', description: 'Modern steel vase arrangements.', parentSlug: 'pots', sortOrder: 81, imageSlug: 'pots' }),
  seedCategory({ slug: 'glass-vases', title: 'گلدان های شیشه ای Glass Vases', eyebrow: 'Glass vases', description: 'Glass vase arrangements.', parentSlug: 'pots', sortOrder: 82, imageSlug: 'pots' }),
  seedCategory({ slug: 'orchids', title: 'ارکیده Orchids', eyebrow: 'Orchids', description: 'Orchid arrangements and potted orchid gifts.', parentSlug: 'pots', sortOrder: 83, imageSlug: 'pots' }),
  seedCategory({ slug: 'flower-baskets', title: 'سبد گل Flower Baskets', eyebrow: 'Flower baskets', description: 'Basket-style flower arrangements.', parentSlug: 'pots', sortOrder: 84, imageSlug: 'pots' }),

  seedCategory({ slug: 'condolences', title: 'عرض تسلیت Condolences', eyebrow: 'Condolences', description: 'Sympathy and condolence flowers.', sortOrder: 90 }),
  seedCategory({ slug: 'proposal-ceremony', title: 'بله برون و خواستگاری Proposal & Bale Boroon', eyebrow: 'Proposal', description: 'Proposal and Bale Boroon ceremony flowers.', sortOrder: 100, imageSlug: 'proposal' }),
  seedCategory({ slug: 'proposal', title: 'خواستگاری Proposal', eyebrow: 'Proposal', description: 'Proposal-ready romantic arrangements.', parentSlug: 'proposal-ceremony', sortOrder: 101 }),
  seedCategory({ slug: 'bale-boroon', title: 'بله برون Bale Boroon', eyebrow: 'Bale Boroon', description: 'Bale Boroon ceremony flowers.', parentSlug: 'proposal-ceremony', sortOrder: 102, imageSlug: 'proposal' }),

  seedCategory({ slug: 'baby-flowers', title: 'تعیین جنسیت و گل نوزاد Baby Flowers', eyebrow: 'Baby flowers', description: 'New baby and gender reveal flowers.', sortOrder: 110 }),
  seedCategory({ slug: 'newborn-flowers', title: 'گل نوزاد Newborn Flowers', eyebrow: 'Newborn flowers', description: 'Newborn flower gifts.', parentSlug: 'baby-flowers', sortOrder: 111, imageSlug: 'baby-flowers' }),
  seedCategory({ slug: 'gender-reveal', title: 'تعیین جنسیت Gender Reveal', eyebrow: 'Gender reveal', description: 'Gender reveal flower and gift concepts.', parentSlug: 'baby-flowers', sortOrder: 112, imageSlug: 'baby-flowers' }),

  seedCategory({ slug: 'weddings', title: 'عروسی Weddings', eyebrow: 'Weddings', description: 'Wedding flowers, bridal bouquets, car design, and groom boutonniere.', sortOrder: 120 }),
  seedCategory({ slug: 'bridal-bouquet', title: 'دسته گل عروس Bridal Bouquet', eyebrow: 'Bridal bouquet', description: 'Bridal bouquet designs.', parentSlug: 'weddings', sortOrder: 121, imageSlug: 'weddings' }),
  seedCategory({ slug: 'bridal-car-design', title: 'دیزاین ماشین عروس Bridal Car Design', eyebrow: 'Bridal car', description: 'Bridal car floral design.', parentSlug: 'weddings', sortOrder: 122, imageSlug: 'weddings' }),
  seedCategory({ slug: 'groom-boutonniere', title: 'پوشت داماد Groom Boutonniere', eyebrow: 'Groom boutonniere', description: 'Groom boutonniere and pocket flower designs.', parentSlug: 'weddings', sortOrder: 123, imageSlug: 'weddings' }),

  seedCategory({ slug: 'woshe-distance', title: 'WOSHE Distance | ارسال به سراسر ایران', eyebrow: 'Distance delivery', description: 'Distance ordering and delivery category inspired by the public Woshe navigation.', sortOrder: 130, showOnHomepage: false, imageSlug: 'bouquets' })
];

const seedCurrency = 'IRR';

type SeedProductInput = Omit<Product, 'currency' | 'image' | 'isActive' | 'bestSeller'> & { bestSeller?: boolean };

function seedProduct(input: SeedProductInput): Product {
  return { ...input, currency: seedCurrency, image: getSeedProductImagePath(input.slug), bestSeller: input.bestSeller ?? true, isActive: true };
}

export const seedProducts: Product[] = [
  seedProduct({ slug: 'vip-box-blue', code: '1004488', title: 'VIP Box - Blue', category: 'vip-boxes', categoryTitle: 'VIP Box', price: 0, requiresQuote: true, availableToday: false, description: 'Premium blue-toned VIP flower box placeholder for high-touch sales-assisted purchase testing.' }),
  seedProduct({ slug: 'signiture-round-baby-pink', code: '1001519', title: 'Signiture Round - Baby Pink', category: 'standard-boxes', categoryTitle: 'Standard Boxes', price: 12800000, availableToday: true, description: 'Soft baby-pink round arrangement placeholder for cart, checkout, and pricing tests.' }),
  seedProduct({ slug: 'imperium-vip-red-roses', code: '1001495', title: 'Imperium VIP - Red Roses', category: 'vip-boxes', categoryTitle: 'VIP Box', price: 0, requiresQuote: true, availableToday: false, description: 'Statement red rose VIP arrangement placeholder for sales-assisted product tests.' }),
  seedProduct({ slug: 'imperium-vip-peach', code: '1001494', title: 'Imperium VIP - Peach', category: 'vip-boxes', categoryTitle: 'VIP Box', price: 0, requiresQuote: true, availableToday: false, description: 'Peach-toned VIP arrangement placeholder for premium catalog coverage.' }),
  seedProduct({ slug: 'woshe-grand-cream', code: '1001471', title: 'Woshe Grand - Cream', category: 'royal', categoryTitle: 'Woshe Royal VVIP', price: 0, requiresQuote: true, availableToday: false, description: 'Large cream-toned arrangement placeholder for premium product display tests.' }),
  seedProduct({ slug: 'woshe-round-hand-bouquet-honey-rose', code: '1001467', title: 'WOSHE Round Hand Bouquet - Honey Rose', category: 'standard-bouquets', categoryTitle: 'Standard Bouquets', price: 18800000, availableToday: true, description: 'Honey rose round bouquet placeholder for realistic bouquet pricing and checkout tests.' }),
  seedProduct({ slug: 'woshe-round-hand-bouquet-ruby-harmony', code: '1001466', title: 'WOSHE Round Hand Bouquet - Ruby Harmony', category: 'standard-bouquets', categoryTitle: 'Standard Bouquets', price: 15800000, availableToday: true, description: 'Ruby-toned round bouquet placeholder for product-card and cart quantity testing.' }),
  seedProduct({ slug: 'woshe-round-hand-bouquet-white-lily', code: '1001464', title: 'Woshe Round Hand Bouquet -White Lily', category: 'standard-bouquets', categoryTitle: 'Standard Bouquets', price: 18800000, availableToday: true, description: 'White lily bouquet placeholder for premium bouquet browsing and checkout tests.' }),
  seedProduct({ slug: 'steel-bloom-wild-1001372', code: '1001372', title: 'Steel Bloom Wild', category: 'steel-vases', categoryTitle: 'Steel Vases', price: 15800000, availableToday: true, description: 'Wild steel-bloom style arrangement placeholder for vase and pot category tests.' }),
  seedProduct({ slug: 'woshe-christmas-collection-round-hand-bouquet', code: '1001187', title: 'Woshe Christmas Collection - Round Hand Bouquet', category: 'standard-bouquets', categoryTitle: 'Standard Bouquets', price: 28000000, availableToday: false, description: 'Seasonal round bouquet placeholder for premium seasonal catalog tests.' }),
  seedProduct({ slug: 'vip-box-red-pink', code: '1001153', title: 'VIP Box - Red Pink', category: 'vip-boxes', categoryTitle: 'VIP Box', price: 0, requiresQuote: true, availableToday: false, description: 'Red and pink VIP box placeholder for call-for-purchase product behavior.' }),
  seedProduct({ slug: 'imperium-pink', code: '1001148', title: 'Imperium - Pink', category: 'standard-boxes', categoryTitle: 'Standard Boxes', price: 0, requiresQuote: true, availableToday: false, description: 'Pink imperium-style flower arrangement placeholder for premium listing tests.' }),
  seedProduct({ slug: 'teddy-bouquet', code: '1001139', title: 'Teddy Bouquet', category: 'birthday-box', categoryTitle: 'Birthday Box', price: 0, requiresQuote: true, availableToday: false, description: 'Birthday teddy bouquet placeholder for celebration gift category tests.' }),
  seedProduct({ slug: 'steel-bloom-wild-1001110', code: '1001110', title: 'Steel Bloom Wild', category: 'steel-vases', categoryTitle: 'Steel Vases', price: 15800000, availableToday: true, description: 'Alternate steel-bloom placeholder with shared title and unique product code.' }),
  seedProduct({ slug: 'autumn-design-2', code: '1001090', title: 'Autumn design 2', category: 'daily', categoryTitle: 'Daily', price: 21800000, availableToday: true, description: 'Autumn-toned design placeholder for seasonal color and price coverage.' }),
  seedProduct({ slug: 'dark-blue-design', code: '1001086', title: 'Dark Blue design', category: 'daily', categoryTitle: 'Daily', price: 17800000, availableToday: true, description: 'Dark blue floral design placeholder for product image and color testing.' }),
  seedProduct({ slug: 'pastel-green-design', code: '1001082', title: 'Pastel Green design', category: 'daily', categoryTitle: 'Daily', price: 21800000, availableToday: true, description: 'Pastel green design placeholder for available-today browsing tests.' }),
  seedProduct({ slug: 'yellow-pink-design', code: '1001077', title: 'Yellow & Pink design', category: 'daily', categoryTitle: 'Daily', price: 21800000, availableToday: true, description: 'Yellow and pink design placeholder for vibrant catalog card testing.' }),
  seedProduct({ slug: 'woshe-round-hand-bouquet-red', code: '1001066', title: 'WOSHE Round Hand Bouquet - Red', category: 'vip-bouquets', categoryTitle: 'VIP Bouquets', price: 48000000, availableToday: true, description: 'Large red round bouquet placeholder for high-value checkout totals.' }),
  seedProduct({ slug: 'woshe-round-hand-bouquet-pink', code: '1001060', title: 'Woshe Round Hand Bouquet-Pink', category: 'standard-bouquets', categoryTitle: 'Standard Bouquets', price: 18800000, availableToday: true, description: 'Pink round bouquet placeholder for bouquet filtering and cart tests.' }),
  seedProduct({ slug: 'cream-pink-design', code: '1001047', title: 'Cream Pink design', category: 'daily', categoryTitle: 'Daily', price: 21800000, availableToday: true, description: 'Cream and pink design placeholder for soft-color product card coverage.' }),
  seedProduct({ slug: 'light-green-design', code: '1001039', title: 'Light Green design', category: 'daily', categoryTitle: 'Daily', price: 12000000, availableToday: true, description: 'Light green design placeholder for lower-price catalog testing.' }),
  seedProduct({ slug: 'pink-roses-pink-belle', code: '1001033', title: 'Pink Roses Pink Belle', category: 'standard-boxes', categoryTitle: 'Standard Boxes', price: 18800000, availableToday: true, description: 'Pink rose belle-style placeholder for rose box product tests.' }),
  seedProduct({ slug: 'maroon-belle', code: '1001010', title: 'Maroon Belle', category: 'standard-boxes', categoryTitle: 'Standard Boxes', price: 18800000, availableToday: true, description: 'Maroon belle-style placeholder for rich-color flower box testing.' })
];
