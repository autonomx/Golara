export type Category = {
  slug: string;
  title: string;
  eyebrow: string;
  description: string;
};

export type Product = {
  slug: string;
  code: string;
  title: string;
  category: string;
  price: number;
  currency: 'CAD';
  availableToday: boolean;
  bestSeller?: boolean;
  image: string;
  description: string;
};

export const categories: Category[] = [
  { slug: 'bouquets', title: 'Bouquets', eyebrow: 'Everyday flowers', description: 'Hand-tied seasonal bouquets for birthdays, romance, thank-you gifts, and same-day moments.' },
  { slug: 'flower-boxes', title: 'Flower Boxes', eyebrow: 'Signature gifts', description: 'Premium round and hat-box arrangements with layered roses, orchids, and soft seasonal accents.' },
  { slug: 'weddings', title: 'Weddings', eyebrow: 'Ceremony design', description: 'Bridal bouquets, aisle florals, reception centerpieces, and full ceremony styling.' },
  { slug: 'events', title: 'Events', eyebrow: 'Luxury styling', description: 'Floral installations for birthdays, proposals, corporate events, and private celebrations.' }
];

export const products: Product[] = [
  { slug: 'blush-rose-signature-box', code: 'GL-1001', title: 'Blush Rose Signature Box', category: 'flower-boxes', price: 185, currency: 'CAD', availableToday: true, bestSeller: true, image: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?auto=format&fit=crop&w=1200&q=80', description: 'A soft luxury rose box with blush, ivory, and seasonal accent blooms.' },
  { slug: 'garden-romance-bouquet', code: 'GL-1002', title: 'Garden Romance Bouquet', category: 'bouquets', price: 125, currency: 'CAD', availableToday: true, bestSeller: true, image: 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=1200&q=80', description: 'A loose garden-style bouquet designed for warm romantic gifting.' },
  { slug: 'ivory-orchid-basket', code: 'GL-1003', title: 'Ivory Orchid Basket', category: 'flower-boxes', price: 210, currency: 'CAD', availableToday: false, image: 'https://images.unsplash.com/photo-1487070183336-b863922373d4?auto=format&fit=crop&w=1200&q=80', description: 'Elegant white orchids and premium greens arranged in a keepsake basket.' },
  { slug: 'ceremony-rose-arch', code: 'GL-2001', title: 'Ceremony Rose Arch', category: 'weddings', price: 950, currency: 'CAD', availableToday: false, image: 'https://images.unsplash.com/photo-1529634597503-139d3726fed5?auto=format&fit=crop&w=1200&q=80', description: 'A custom floral arch concept for ceremonies, proposals, and editorial event styling.' },
  { slug: 'birthday-bloom-set', code: 'GL-3001', title: 'Birthday Bloom Set', category: 'events', price: 165, currency: 'CAD', availableToday: true, image: 'https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&w=1200&q=80', description: 'A celebratory floral set designed for birthday tables and intimate gatherings.' },
  { slug: 'classic-white-bouquet', code: 'GL-1004', title: 'Classic White Bouquet', category: 'bouquets', price: 140, currency: 'CAD', availableToday: true, image: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=1200&q=80', description: 'A timeless white and green bouquet for condolences, hosting, or refined gifting.' }
];

export function formatPrice(product: Product) {
  return new Intl.NumberFormat('en-CA', { style: 'currency', currency: product.currency }).format(product.price);
}

export function getCategory(slug: string) {
  return categories.find((category) => category.slug === slug);
}

export function getProduct(slug: string) {
  return products.find((product) => product.slug === slug);
}

export function productsForCategory(slug: string) {
  return products.filter((product) => product.category === slug);
}
