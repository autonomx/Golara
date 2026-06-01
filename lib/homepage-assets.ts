const CATEGORY_BASE = '/homepage/categories';

const categoryImageBySlug: Record<string, string> = {
  'available-today': 'birthday.jpg',
  daily: 'birthday.jpg',
  'flower-boxes': 'flower-boxes.jpg',
  'standard-boxes': 'standard-flower-box.jpg',
  'vip-boxes': 'vip-flower-box.jpg',
  bouquets: 'bouquets.jpg',
  'standard-bouquets': 'standard-bouquet.jpg',
  'vip-bouquets': 'vip-bouquet.jpg',
  'woshe-royal': 'woshe-royal.jpg',
  birthday: 'birthday.jpg',
  'birthday-package': 'birthday-packages.jpg',
  'birthday-box': 'birthday-box.jpg',
  'ceremony-design': 'ceremony-design.jpg',
  weddings: 'wedding.jpg',
  condolence: 'condolence.jpg',
  balloons: 'balloons.jpg',
  cakes: 'cakes.jpg'
};

export type HomepageBannerSlide = {
  image: string;
  alt: string;
  eyebrow: string;
  title: string;
  body: string;
};

export const homepageBannerSlides: HomepageBannerSlide[] = [
  {
    image: '/homepage/banners/banner1.jpeg',
    alt: 'Golara floral delivery banner',
    eyebrow: 'Same-day floral gifting',
    title: 'Arrangements ready for the moment',
    body: 'Layered bouquets, VIP boxes, and refined seasonal stems prepared with a premium studio finish.'
  },
  {
    image: '/homepage/banners/banner2.jpeg',
    alt: 'Golara available today banner',
    eyebrow: 'Fresh today',
    title: 'Soft palettes with serious presence',
    body: 'Choose romantic pinks, porcelain whites, or dramatic berry tones for gifting that feels considered.'
  },
  {
    image: '/homepage/banners/banner3.jpeg',
    alt: 'Golara floral studio banner',
    eyebrow: 'Golara floral studio',
    title: 'Designed to feel personal',
    body: 'Premium boxes and hand bouquets made for birthdays, ceremonies, celebrations, and everyday tenderness.'
  },
  {
    image: '/homepage/banners/banner4.jpeg',
    alt: 'Golara distance banner',
    eyebrow: 'Distance delivery',
    title: 'Send flowers beautifully',
    body: 'A polished storefront experience for browsing, ordering, and selecting floral gifts with confidence.'
  }
];

const bestSellerImageBySlug: Record<string, string> = {
  'vip-box-blue': '/homepage/best-seller/dsc09807.jpeg',
  'signiture-round-baby-pink': '/homepage/best-seller/dsc01904_1_1.jpeg',
  'imperium-vip-red-roses': '/homepage/best-seller/4u1a9169.jpeg',
  'imperium-vip-peach': '/homepage/best-seller/dsc09074.jpeg',
  'woshe-grand-cream': '/homepage/best-seller/dsc09367_1.jpeg',
  'woshe-round-hand-bouquet-honey-rose': '/homepage/best-seller/4u1a1444.jpeg',
  'woshe-round-hand-bouquet-ruby-harmony': '/homepage/best-seller/dsc01892.jpeg',
  'woshe-round-hand-bouquet-white-lily': '/homepage/best-seller/11_jpg.jpeg',
  'autumn-design-2': '/homepage/best-seller/01_jpg_3.jpeg',
  'steel-bloom-wild-1001372': '/homepage/best-seller/steel_bloom.jpeg',
  'woshe-christmas-collection-round-hand-bouquet': '/homepage/best-seller/4u1a0378.jpeg',
  'vip-box-red-pink': '/homepage/best-seller/4u1a5074.jpeg',
  'imperium-pink': '/homepage/best-seller/imperium_pink.jpeg',
  'teddy-bouquet': '/homepage/best-seller/4u1a4869.jpeg',
  'steel-bloom-wild-1001110': '/homepage/best-seller/dsc01555.jpeg',
  'dark-blue-design': '/homepage/best-seller/img_8181.jpeg',
  'pastel-green-design': '/homepage/best-seller/4u1a3379.jpeg',
  'yellow-pink-design': '/homepage/best-seller/982ebb5a-06d7-4674-b990-5533d828cf23.jpeg',
  'woshe-round-hand-bouquet-red': '/homepage/best-seller/dsc01902.jpeg',
  'woshe-round-hand-bouquet-pink': '/homepage/best-seller/img_3595.jpeg',
  'cream-pink-design': '/homepage/best-seller/4u1a8936.jpeg',
  'light-green-design': '/homepage/best-seller/dsc00044.jpeg',
  'pink-roses-pink-belle': '/homepage/best-seller/01_jpg_3.jpeg',
  'maroon-belle': '/homepage/best-seller/steel_bloom.jpeg'
};

export function homepageBestSellerImage(slug: string) {
  return bestSellerImageBySlug[slug] ?? `/homepage/best-seller/${slug}.jpeg`;
}

export function homepageCategoryImage(slug: string) {
  const filename = categoryImageBySlug[slug] ?? `${slug}.jpg`;
  return `${CATEGORY_BASE}/${filename}`;
}
