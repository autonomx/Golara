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

export const homepageBannerSlides = [
  { image: '/homepage/banners/banner1.jpeg', alt: 'Golara floral delivery banner' },
  { image: '/homepage/banners/banner2.jpeg', alt: 'Golara available today banner' },
  { image: '/homepage/banners/banner3.jpeg', alt: 'Golara floral studio banner' },
  { image: '/homepage/banners/banner4.jpeg', alt: 'Golara distance banner' }
];

export function homepageCategoryImage(slug: string) {
  const filename = categoryImageBySlug[slug] ?? `${slug}.jpg`;
  return `${CATEGORY_BASE}/${filename}`;
}
