import type { Category, HomepageContent, Product } from './catalog';

export const seedHomepageContent: HomepageContent = {
  eyebrow: 'Luxury floral studio',
  title: 'Flowers for moments worth keeping.',
  body: 'Golara is an editable ecommerce storefront for bouquets, flower boxes, weddings, events, and premium gifts. The admin panel lets the shop owner update products, prices, images, categories, and homepage sections without touching code.',
  primaryCtaLabel: 'Shop catalog',
  primaryCtaHref: '/products',
  secondaryCtaLabel: 'Manage CMS',
  secondaryCtaHref: '/admin',
  panelEyebrow: 'Signature editability',
  panelTitle: 'CMS without Joomla',
  panelBody: 'Product cards, featured collections, banners, availability badges, and call-to-action text are stored as editable content records when a database is configured.'
};

export const seedCategories: Category[] = [
  { slug: 'bouquets', title: 'Bouquets', eyebrow: 'Everyday flowers', description: 'Hand-tied seasonal bouquets for birthdays, romance, thank-you gifts, and same-day moments.', sortOrder: 10, isActive: true },
  { slug: 'flower-boxes', title: 'Flower Boxes', eyebrow: 'Signature gifts', description: 'Premium round and hat-box arrangements with layered roses, orchids, and soft seasonal accents.', sortOrder: 20, isActive: true },
  { slug: 'weddings', title: 'Weddings', eyebrow: 'Ceremony design', description: 'Bridal bouquets, aisle florals, reception centerpieces, and full ceremony styling.', sortOrder: 30, isActive: true },
  { slug: 'events', title: 'Events', eyebrow: 'Luxury styling', description: 'Floral installations for birthdays, proposals, corporate events, and private celebrations.', sortOrder: 40, isActive: true }
];

export const seedProducts: Product[] = [
  { slug: 'blush-rose-signature-box', code: 'GL-1001', title: 'Blush Rose Signature Box', category: 'flower-boxes', categoryTitle: 'Flower Boxes', price: 185, currency: 'CAD', availableToday: true, bestSeller: true, isActive: true, image: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?auto=format&fit=crop&w=1200&q=80', description: 'A soft luxury rose box with blush, ivory, and seasonal accent blooms.' },
  { slug: 'garden-romance-bouquet', code: 'GL-1002', title: 'Garden Romance Bouquet', category: 'bouquets', categoryTitle: 'Bouquets', price: 125, currency: 'CAD', availableToday: true, bestSeller: true, isActive: true, image: 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=1200&q=80', description: 'A loose garden-style bouquet designed for warm romantic gifting.' },
  { slug: 'ivory-orchid-basket', code: 'GL-1003', title: 'Ivory Orchid Basket', category: 'flower-boxes', categoryTitle: 'Flower Boxes', price: 210, currency: 'CAD', availableToday: false, bestSeller: false, isActive: true, image: 'https://images.unsplash.com/photo-1487070183336-b863922373d4?auto=format&fit=crop&w=1200&q=80', description: 'Elegant white orchids and premium greens arranged in a keepsake basket.' },
  { slug: 'ceremony-rose-arch', code: 'GL-2001', title: 'Ceremony Rose Arch', category: 'weddings', categoryTitle: 'Weddings', price: 950, currency: 'CAD', availableToday: false, bestSeller: false, isActive: true, image: 'https://images.unsplash.com/photo-1529634597503-139d3726fed5?auto=format&fit=crop&w=1200&q=80', description: 'A custom floral arch concept for ceremonies, proposals, and editorial event styling.' },
  { slug: 'birthday-bloom-set', code: 'GL-3001', title: 'Birthday Bloom Set', category: 'events', categoryTitle: 'Events', price: 165, currency: 'CAD', availableToday: true, bestSeller: false, isActive: true, image: 'https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&w=1200&q=80', description: 'A celebratory floral set designed for birthday tables and intimate gatherings.' },
  { slug: 'classic-white-bouquet', code: 'GL-1004', title: 'Classic White Bouquet', category: 'bouquets', categoryTitle: 'Bouquets', price: 140, currency: 'CAD', availableToday: true, bestSeller: false, isActive: true, image: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=1200&q=80', description: 'A timeless white and green bouquet for condolences, hosting, or refined gifting.' }
];
