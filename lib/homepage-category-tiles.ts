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

const categoryImagePrefix = '/seed-images/category';

export const homepageCategoryTiles: HomepageCategoryTile[] = [
  {
    slug: 'weddings',
    title: 'عروسی Weddings',
    subtitle: 'Bridal flowers',
    href: '/categories/weddings',
    image: `${categoryImagePrefix}/weddings`,
    palette: { dark: '#8f6f7b', main: '#d8a9b7', light: '#f7dfe6', background: '#fff8fa' }
  },
  {
    slug: 'baby-flowers',
    title: 'گل نوزاد Baby Flowers',
    subtitle: 'New baby gifts',
    href: '/categories/birthday',
    image: `${categoryImagePrefix}/baby-flowers`,
    palette: { dark: '#5d8ba0', main: '#9ed6e6', light: '#e2f7fb', background: '#f8fdff' }
  },
  {
    slug: 'proposal',
    title: 'خواستگاری Proposal',
    subtitle: 'Ceremony moments',
    href: '/categories/weddings',
    image: `${categoryImagePrefix}/proposal`,
    palette: { dark: '#8a4356', main: '#d78099', light: '#f9dbe3', background: '#fff7f9' }
  },
  {
    slug: 'flower-boxes',
    title: 'باکس گل Flower Box',
    subtitle: 'Signature boxes',
    href: '/categories/flower-boxes',
    image: `${categoryImagePrefix}/flower-boxes`,
    palette: { dark: '#78465a', main: '#ca7d9e', light: '#f6d9e7', background: '#fff8fb' }
  },
  {
    slug: 'birthday',
    title: 'تولد Birthday',
    subtitle: 'Celebration gifts',
    href: '/categories/birthday',
    image: `${categoryImagePrefix}/birthday`,
    palette: { dark: '#a56540', main: '#e7a664', light: '#ffe3b8', background: '#fff8ec' }
  },
  {
    slug: 'pots',
    title: 'گلدان ها Pots',
    subtitle: 'Vase designs',
    href: '/categories/pots',
    image: `${categoryImagePrefix}/pots`,
    palette: { dark: '#496a69', main: '#7fb1aa', light: '#d8efea', background: '#f8fffd' }
  },
  {
    slug: 'ceremony-design',
    title: 'طراحی مراسم Ceremony',
    subtitle: 'Event styling',
    href: '/categories/weddings',
    image: `${categoryImagePrefix}/ceremony-design`,
    palette: { dark: '#866343', main: '#d5ab75', light: '#f7e7ca', background: '#fffaf2' }
  },
  {
    slug: 'royal',
    title: 'وشه رویال Royal',
    subtitle: 'Premium line',
    href: '/categories/vip',
    image: `${categoryImagePrefix}/royal`,
    palette: { dark: '#51365f', main: '#9d78b7', light: '#eadcf4', background: '#fbf7ff' }
  },
  {
    slug: 'condolences',
    title: 'عرض تسلیت Condolences',
    subtitle: 'Sympathy flowers',
    href: '/categories/condolences',
    image: `${categoryImagePrefix}/condolences`,
    palette: { dark: '#4f5b61', main: '#91a1a8', light: '#e1eaee', background: '#f9fcfd' }
  },
  {
    slug: 'cake-balloon',
    title: 'کیک و بادکنک Cake & Balloon',
    subtitle: 'Celebration add-ons',
    href: '/categories/cake-balloon',
    image: `${categoryImagePrefix}/cake-balloon`,
    palette: { dark: '#966147', main: '#eda46f', light: '#ffdfbf', background: '#fff7ef' }
  },
  {
    slug: 'bouquets',
    title: 'دسته گل Bouquets',
    subtitle: 'Hand bouquets',
    href: '/categories/bouquets',
    image: `${categoryImagePrefix}/bouquets`,
    palette: { dark: '#8f3f55', main: '#dc8197', light: '#f9d8e0', background: '#fff7fa' }
  }
];

export function findHomepageCategoryTile(slug: string) {
  return homepageCategoryTiles.find((tile) => tile.slug === slug) ?? null;
}
