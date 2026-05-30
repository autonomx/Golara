import type { Category } from './catalog';

const CATEGORY_IMAGE_BASE_PATH = '/seed-images/category-real';

export const seedCategoryImageAliases: Record<string, string> = {
  'today-vip': 'royal',
  'vip-boxes': 'royal',
  'standard-boxes': 'flower-boxes',
  'kids-boxes': 'baby-flowers',
  'vip-bouquets': 'royal',
  'standard-bouquets': 'bouquets',
  'chocolate-eternal-rose': 'cacao-roses',
  'birthday-package': 'birthday',
  'birthday-box': 'birthday',
  'birthday-ceremony-design': 'ceremony-design',
  surprise: 'cake-balloon',
  cakes: 'cake-balloon',
  'birthday-cake': 'cake-balloon',
  'wedding-ceremony-cake': 'weddings',
  'kids-cake': 'baby-flowers',
  'classic-cake': 'cake-balloon',
  'mini-cake-trio': 'cake-balloon',
  balloons: 'cake-balloon',
  'steel-vases': 'pots',
  'glass-vases': 'pots',
  orchids: 'pots',
  'flower-baskets': 'pots',
  'proposal-ceremony': 'proposal',
  'bale-boroon': 'proposal',
  'newborn-flowers': 'baby-flowers',
  'gender-reveal': 'baby-flowers',
  'bridal-bouquet': 'weddings',
  'bridal-car-design': 'weddings',
  'groom-boutonniere': 'weddings',
  'woshe-distance': 'bouquets'
};

export function getSeedCategoryImagePath(slug: string) {
  const imageSlug = seedCategoryImageAliases[slug] ?? slug;
  return `${CATEGORY_IMAGE_BASE_PATH}/${imageSlug}`;
}

export function resolveCategoryImagePath(category: Pick<Category, 'image' | 'slug'>) {
  return category.image || getSeedCategoryImagePath(category.slug);
}
