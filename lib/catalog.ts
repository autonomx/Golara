export type Category = {
  id?: string;
  slug: string;
  title: string;
  eyebrow: string;
  description: string;
  sortOrder?: number;
  isActive?: boolean;
};

export type Product = {
  id?: string;
  slug: string;
  code: string;
  title: string;
  category: string;
  categoryId?: string;
  categoryTitle?: string;
  price: number;
  currency: string;
  availableToday: boolean;
  bestSeller?: boolean;
  isActive?: boolean;
  image: string;
  description: string;
};

export type MediaItem = {
  id?: string;
  url: string;
  alt: string;
  productId?: string;
  createdAt?: Date;
};

export type CustomerInquiry = {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  message: string;
  productId?: string;
  productTitle?: string;
  deliveryDate?: Date;
  deliveryNotes?: string;
  staffNotes?: string;
  status: string;
  createdAt: Date;
};

export type HomepageContent = {
  eyebrow: string;
  title: string;
  body: string;
  primaryCtaLabel: string;
  primaryCtaHref: string;
  secondaryCtaLabel: string;
  secondaryCtaHref: string;
  panelEyebrow: string;
  panelTitle: string;
  panelBody: string;
};

export function formatPrice(product: Product) {
  return new Intl.NumberFormat('en-CA', { style: 'currency', currency: product.currency }).format(product.price);
}
