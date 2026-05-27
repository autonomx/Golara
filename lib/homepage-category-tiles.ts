export type HomepageCategoryTile = {
  slug: string;
  title: string;
  subtitle: string;
  href: string;
  image: string;
  palette: {
    dark: string;
    main: string;
    light: string;
    background: string;
  };
};

const categoryImagePrefix = '/seed-images/category-real';

type CategoryPalette = HomepageCategoryTile['palette'];

const defaultPalette: CategoryPalette = { dark: '#78465a', main: '#ca7d9e', light: '#f6d9e7', background: '#fff8fb' };

const paletteBySlug: Record<string, CategoryPalette> = {
  'available-today': { dark: '#8f3f55', main: '#dc8197', light: '#f9d8e0', background: '#fff7fa' },
  daily: { dark: '#ad6940', main: '#df9b62', light: '#f5d3a7', background: '#fff6ea' },
  'cacao-roses': { dark: '#6f4b35', main: '#b87b56', light: '#efd2bd', background: '#fff8f2' },
  'today-vip': { dark: '#51365f', main: '#9d78b7', light: '#eadcf4', background: '#fbf7ff' },
  'flower-boxes': { dark: '#78465a', main: '#ca7d9e', light: '#f6d9e7', background: '#fff8fb' },
  'vip-boxes': { dark: '#51365f', main: '#9d78b7', light: '#eadcf4', background: '#fbf7ff' },
  'standard-boxes': { dark: '#78465a', main: '#ca7d9e', light: '#f6d9e7', background: '#fff8fb' },
  'rose-envelope': { dark: '#8a4356', main: '#d78099', light: '#f9dbe3', background: '#fff7f9' },
  'kids-boxes': { dark: '#5d8ba0', main: '#9ed6e6', light: '#e2f7fb', background: '#f8fdff' },
  bouquets: { dark: '#8f3f55', main: '#dc8197', light: '#f9d8e0', background: '#fff7fa' },
  'vip-bouquets': { dark: '#51365f', main: '#9d78b7', light: '#eadcf4', background: '#fbf7ff' },
  'standard-bouquets': { dark: '#8f3f55', main: '#dc8197', light: '#f9d8e0', background: '#fff7fa' },
  royal: { dark: '#51365f', main: '#9d78b7', light: '#eadcf4', background: '#fbf7ff' },
  'chocolate-eternal-rose': { dark: '#6f4b35', main: '#b87b56', light: '#efd2bd', background: '#fff8f2' },
  'ceremony-design': { dark: '#866343', main: '#d5ab75', light: '#f7e7ca', background: '#fffaf2' },
  birthday: { dark: '#a56540', main: '#e7a664', light: '#ffe3b8', background: '#fff8ec' },
  'birthday-package': { dark: '#a56540', main: '#e7a664', light: '#ffe3b8', background: '#fff8ec' },
  'birthday-box': { dark: '#a56540', main: '#e7a664', light: '#ffe3b8', background: '#fff8ec' },
  'birthday-ceremony-design': { dark: '#866343', main: '#d5ab75', light: '#f7e7ca', background: '#fffaf2' },
  surprise: { dark: '#966147', main: '#eda46f', light: '#ffdfbf', background: '#fff7ef' },
  'cake-balloon': { dark: '#966147', main: '#eda46f', light: '#ffdfbf', background: '#fff7ef' },
  cakes: { dark: '#966147', main: '#eda46f', light: '#ffdfbf', background: '#fff7ef' },
  'birthday-cake': { dark: '#966147', main: '#eda46f', light: '#ffdfbf', background: '#fff7ef' },
  'wedding-ceremony-cake': { dark: '#8f6f7b', main: '#d8a9b7', light: '#f7dfe6', background: '#fff8fa' },
  'kids-cake': { dark: '#5d8ba0', main: '#9ed6e6', light: '#e2f7fb', background: '#f8fdff' },
  'classic-cake': { dark: '#966147', main: '#eda46f', light: '#ffdfbf', background: '#fff7ef' },
  'mini-cake-trio': { dark: '#966147', main: '#eda46f', light: '#ffdfbf', background: '#fff7ef' },
  balloons: { dark: '#966147', main: '#eda46f', light: '#ffdfbf', background: '#fff7ef' },
  pots: { dark: '#496a69', main: '#7fb1aa', light: '#d8efea', background: '#f8fffd' },
  'steel-vases': { dark: '#496a69', main: '#7fb1aa', light: '#d8efea', background: '#f8fffd' },
  'glass-vases': { dark: '#496a69', main: '#7fb1aa', light: '#d8efea', background: '#f8fffd' },
  orchids: { dark: '#735f87', main: '#b69bc9', light: '#eadff4', background: '#fbf8ff' },
  'flower-baskets': { dark: '#7c6042', main: '#c9a171', light: '#f1dfc3', background: '#fff9f0' },
  condolences: { dark: '#4f5b61', main: '#91a1a8', light: '#e1eaee', background: '#f9fcfd' },
  'proposal-ceremony': { dark: '#8a4356', main: '#d78099', light: '#f9dbe3', background: '#fff7f9' },
  proposal: { dark: '#8a4356', main: '#d78099', light: '#f9dbe3', background: '#fff7f9' },
  'bale-boroon': { dark: '#8a4356', main: '#d78099', light: '#f9dbe3', background: '#fff7f9' },
  'baby-flowers': { dark: '#5d8ba0', main: '#9ed6e6', light: '#e2f7fb', background: '#f8fdff' },
  'newborn-flowers': { dark: '#5d8ba0', main: '#9ed6e6', light: '#e2f7fb', background: '#f8fdff' },
  'gender-reveal': { dark: '#5d8ba0', main: '#9ed6e6', light: '#f8ddec', background: '#fdf9ff' },
  weddings: { dark: '#8f6f7b', main: '#d8a9b7', light: '#f7dfe6', background: '#fff8fa' },
  'bridal-bouquet': { dark: '#8f6f7b', main: '#d8a9b7', light: '#f7dfe6', background: '#fff8fa' },
  'bridal-car-design': { dark: '#8f6f7b', main: '#d8a9b7', light: '#f7dfe6', background: '#fff8fa' },
  'groom-boutonniere': { dark: '#8f6f7b', main: '#d8a9b7', light: '#f7dfe6', background: '#fff8fa' },
  'woshe-distance': { dark: '#8f3f55', main: '#dc8197', light: '#f9d8e0', background: '#fff7fa' }
};

export const homepageCategoryTiles: HomepageCategoryTile[] = Object.entries(paletteBySlug).map(([slug, palette]) => ({
  slug,
  title: slug.split('-').map((word) => word[0]?.toUpperCase() + word.slice(1)).join(' '),
  subtitle: 'Original category art',
  href: `/categories/${slug}`,
  image: `${categoryImagePrefix}/${slug}`,
  palette
}));

export function getCategoryPalette(slug: string) {
  return paletteBySlug[slug] ?? defaultPalette;
}

export function findHomepageCategoryTile(slug: string) {
  return homepageCategoryTiles.find((tile) => tile.slug === slug) ?? null;
}
