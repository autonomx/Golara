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

export const seedCategories: Category[] = [
  { slug: 'available-today', title: 'Available Today', eyebrow: 'Daily selection', description: 'Ready-to-order arrangements inspired by the public Woshe daily and VIP catalog structure.', image: categoryImage('bouquets'), showOnHomepage: true, sortOrder: 10, isActive: true },
  { slug: 'vip', title: 'VIP', eyebrow: 'Premium line', description: 'Large premium flower boxes, hand bouquets, and statement arrangements for luxury gifting tests.', image: categoryImage('royal'), showOnHomepage: true, sortOrder: 20, isActive: true },
  { slug: 'flower-boxes', title: 'Flower Boxes', eyebrow: 'Signature gifts', description: 'Boxed floral arrangements, rose boxes, and premium packaged gifts for ecommerce testing.', image: categoryImage('flower-boxes'), showOnHomepage: true, sortOrder: 30, isActive: true },
  { slug: 'bouquets', title: 'Bouquets', eyebrow: 'Hand bouquets', description: 'Round and hand-tied bouquet products for listing, cart, checkout, and order-history tests.', image: categoryImage('bouquets'), showOnHomepage: true, sortOrder: 40, isActive: true },
  { slug: 'birthday', title: 'Birthday', eyebrow: 'Celebration gifts', description: 'Birthday flowers and gift-style arrangements for seasonal storefront testing.', image: categoryImage('birthday'), showOnHomepage: true, sortOrder: 50, isActive: true },
  { slug: 'pots', title: 'Pots', eyebrow: 'Vases and pots', description: 'Potted, vase, and steel-bloom arrangements for testing broader product categories.', image: categoryImage('pots'), showOnHomepage: true, sortOrder: 60, isActive: true },
  { slug: 'cake-balloon', title: 'Cake & Balloon', eyebrow: 'Add-on gifts', description: 'Cake, balloon, and celebration add-on category placeholders for navigation parity.', image: categoryImage('cake-balloon'), showOnHomepage: true, sortOrder: 70, isActive: true },
  { slug: 'weddings', title: 'Weddings', eyebrow: 'Ceremony design', description: 'Wedding, proposal, and ceremony design category placeholders for future event products.', image: categoryImage('weddings'), showOnHomepage: true, sortOrder: 80, isActive: true },
  { slug: 'condolences', title: 'Condolences', eyebrow: 'Sympathy flowers', description: 'Sympathy and condolence arrangement placeholders for full catalog coverage.', image: categoryImage('condolences'), showOnHomepage: true, sortOrder: 90, isActive: true },
  { slug: 'baby-flowers', title: 'Baby Flowers', eyebrow: 'New baby gifts', description: 'Pastel arrangements and gentle gift designs for new baby celebrations.', image: categoryImage('baby-flowers'), parentSlug: 'birthday', showOnHomepage: true, sortOrder: 100, isActive: true },
  { slug: 'proposal', title: 'Proposal', eyebrow: 'Romantic moments', description: 'Romantic proposal flowers and ceremony-ready arrangements.', image: categoryImage('proposal'), parentSlug: 'weddings', showOnHomepage: true, sortOrder: 110, isActive: true },
  { slug: 'ceremony-design', title: 'Ceremony Design', eyebrow: 'Event styling', description: 'Ceremony, aisle, and event floral design placeholders.', image: categoryImage('ceremony-design'), parentSlug: 'weddings', showOnHomepage: true, sortOrder: 120, isActive: true },
  { slug: 'royal', title: 'Royal', eyebrow: 'Premium collection', description: 'Royal and VVIP floral arrangement placeholders for luxury navigation.', image: categoryImage('royal'), parentSlug: 'vip', showOnHomepage: true, sortOrder: 130, isActive: true }
];

const seedCurrency = 'IRR';

type SeedProductInput = Omit<Product, 'currency' | 'image' | 'isActive' | 'bestSeller'> & {
  bestSeller?: boolean;
};

function seedProduct(input: SeedProductInput): Product {
  return {
    ...input,
    currency: seedCurrency,
    image: getSeedProductImagePath(input.slug),
    bestSeller: input.bestSeller ?? true,
    isActive: true
  };
}

export const seedProducts: Product[] = [
  seedProduct({ slug: 'vip-box-blue', code: '1004488', title: 'VIP Box - Blue', category: 'vip', categoryTitle: 'VIP', price: 0, requiresQuote: true, availableToday: false, description: 'Premium blue-toned VIP flower box placeholder for high-touch sales-assisted purchase testing.' }),
  seedProduct({ slug: 'signiture-round-baby-pink', code: '1001519', title: 'Signiture Round - Baby Pink', category: 'flower-boxes', categoryTitle: 'Flower Boxes', price: 12800000, availableToday: true, description: 'Soft baby-pink round arrangement placeholder for cart, checkout, and pricing tests.' }),
  seedProduct({ slug: 'imperium-vip-red-roses', code: '1001495', title: 'Imperium VIP - Red Roses', category: 'vip', categoryTitle: 'VIP', price: 0, requiresQuote: true, availableToday: false, description: 'Statement red rose VIP arrangement placeholder for sales-assisted product tests.' }),
  seedProduct({ slug: 'imperium-vip-peach', code: '1001494', title: 'Imperium VIP - Peach', category: 'vip', categoryTitle: 'VIP', price: 0, requiresQuote: true, availableToday: false, description: 'Peach-toned VIP arrangement placeholder for premium catalog coverage.' }),
  seedProduct({ slug: 'woshe-grand-cream', code: '1001471', title: 'Woshe Grand - Cream', category: 'vip', categoryTitle: 'VIP', price: 0, requiresQuote: true, availableToday: false, description: 'Large cream-toned arrangement placeholder for premium product display tests.' }),
  seedProduct({ slug: 'woshe-round-hand-bouquet-honey-rose', code: '1001467', title: 'WOSHE Round Hand Bouquet - Honey Rose', category: 'bouquets', categoryTitle: 'Bouquets', price: 18800000, availableToday: true, description: 'Honey rose round bouquet placeholder for realistic bouquet pricing and checkout tests.' }),
  seedProduct({ slug: 'woshe-round-hand-bouquet-ruby-harmony', code: '1001466', title: 'WOSHE Round Hand Bouquet - Ruby Harmony', category: 'bouquets', categoryTitle: 'Bouquets', price: 15800000, availableToday: true, description: 'Ruby-toned round bouquet placeholder for product-card and cart quantity testing.' }),
  seedProduct({ slug: 'woshe-round-hand-bouquet-white-lily', code: '1001464', title: 'Woshe Round Hand Bouquet -White Lily', category: 'bouquets', categoryTitle: 'Bouquets', price: 18800000, availableToday: true, description: 'White lily bouquet placeholder for premium bouquet browsing and checkout tests.' }),
  seedProduct({ slug: 'steel-bloom-wild-1001372', code: '1001372', title: 'Steel Bloom Wild', category: 'pots', categoryTitle: 'Pots', price: 15800000, availableToday: true, description: 'Wild steel-bloom style arrangement placeholder for vase and pot category tests.' }),
  seedProduct({ slug: 'woshe-christmas-collection-round-hand-bouquet', code: '1001187', title: 'Woshe Christmas Collection - Round Hand Bouquet', category: 'bouquets', categoryTitle: 'Bouquets', price: 28000000, availableToday: false, description: 'Seasonal round bouquet placeholder for premium seasonal catalog tests.' }),
  seedProduct({ slug: 'vip-box-red-pink', code: '1001153', title: 'VIP Box - Red Pink', category: 'vip', categoryTitle: 'VIP', price: 0, requiresQuote: true, availableToday: false, description: 'Red and pink VIP box placeholder for call-for-purchase product behavior.' }),
  seedProduct({ slug: 'imperium-pink', code: '1001148', title: 'Imperium - Pink', category: 'flower-boxes', categoryTitle: 'Flower Boxes', price: 0, requiresQuote: true, availableToday: false, description: 'Pink imperium-style flower arrangement placeholder for premium listing tests.' }),
  seedProduct({ slug: 'teddy-bouquet', code: '1001139', title: 'Teddy Bouquet', category: 'birthday', categoryTitle: 'Birthday', price: 0, requiresQuote: true, availableToday: false, description: 'Birthday teddy bouquet placeholder for celebration gift category tests.' }),
  seedProduct({ slug: 'steel-bloom-wild-1001110', code: '1001110', title: 'Steel Bloom Wild', category: 'pots', categoryTitle: 'Pots', price: 15800000, availableToday: true, description: 'Alternate steel-bloom placeholder with shared title and unique product code.' }),
  seedProduct({ slug: 'autumn-design-2', code: '1001090', title: 'Autumn design 2', category: 'available-today', categoryTitle: 'Available Today', price: 21800000, availableToday: true, description: 'Autumn-toned design placeholder for seasonal color and price coverage.' }),
  seedProduct({ slug: 'dark-blue-design', code: '1001086', title: 'Dark Blue design', category: 'available-today', categoryTitle: 'Available Today', price: 17800000, availableToday: true, description: 'Dark blue floral design placeholder for product image and color testing.' }),
  seedProduct({ slug: 'pastel-green-design', code: '1001082', title: 'Pastel Green design', category: 'available-today', categoryTitle: 'Available Today', price: 21800000, availableToday: true, description: 'Pastel green design placeholder for available-today browsing tests.' }),
  seedProduct({ slug: 'yellow-pink-design', code: '1001077', title: 'Yellow & Pink design', category: 'available-today', categoryTitle: 'Available Today', price: 21800000, availableToday: true, description: 'Yellow and pink design placeholder for vibrant catalog card testing.' }),
  seedProduct({ slug: 'woshe-round-hand-bouquet-red', code: '1001066', title: 'WOSHE Round Hand Bouquet - Red', category: 'bouquets', categoryTitle: 'Bouquets', price: 48000000, availableToday: true, description: 'Large red round bouquet placeholder for high-value checkout totals.' }),
  seedProduct({ slug: 'woshe-round-hand-bouquet-pink', code: '1001060', title: 'Woshe Round Hand Bouquet-Pink', category: 'bouquets', categoryTitle: 'Bouquets', price: 18800000, availableToday: true, description: 'Pink round bouquet placeholder for bouquet filtering and cart tests.' }),
  seedProduct({ slug: 'cream-pink-design', code: '1001047', title: 'Cream Pink design', category: 'available-today', categoryTitle: 'Available Today', price: 21800000, availableToday: true, description: 'Cream and pink design placeholder for soft-color product card coverage.' }),
  seedProduct({ slug: 'light-green-design', code: '1001039', title: 'Light Green design', category: 'available-today', categoryTitle: 'Available Today', price: 12000000, availableToday: true, description: 'Light green design placeholder for lower-price catalog testing.' }),
  seedProduct({ slug: 'pink-roses-pink-belle', code: '1001033', title: 'Pink Roses Pink Belle', category: 'flower-boxes', categoryTitle: 'Flower Boxes', price: 18800000, availableToday: true, description: 'Pink rose belle-style placeholder for rose box product tests.' }),
  seedProduct({ slug: 'maroon-belle', code: '1001010', title: 'Maroon Belle', category: 'flower-boxes', categoryTitle: 'Flower Boxes', price: 18800000, availableToday: true, description: 'Maroon belle-style placeholder for rich-color flower box testing.' })
];
