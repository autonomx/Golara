export type CatalogTranslation = {
  locale: string;
  title: string;
  eyebrow?: string;
  description?: string;
  imageAlt?: string;
  isPublished: boolean;
  updatedAt?: Date;
};

export type Category = {
  id?: string;
  slug: string;
  title: string;
  eyebrow: string;
  description: string;
  image?: string;
  parentId?: string;
  parentSlug?: string;
  parentTitle?: string;
  showOnHomepage?: boolean;
  productCount?: number;
  sortOrder?: number;
  isActive?: boolean;
  updatedAt?: Date;
  translations?: CatalogTranslation[];
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
  requiresQuote?: boolean;
  image: string;
  description: string;
  updatedAt?: Date;
  translations?: CatalogTranslation[];
};

export type MediaItem = {
  id?: string;
  url: string;
  alt: string;
  productId?: string;
  createdAt?: Date;
};

export type CustomerInquiryFollowUp = {
  id: string;
  note: string;
  channel: string;
  createdAt: Date;
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
  followUps?: CustomerInquiryFollowUp[];
  status: string;
  createdAt: Date;
};

export type CheckoutOrderSummary = {
  id: string;
  orderNumber: string;
  status: string;
  checkoutMode: string;
  fulfillmentStatus?: string;
  currency: string;
  totalCents: number;
  customerPhone?: string;
  customerName?: string;
  itemCount: number;
  latestPaymentStatus?: string;
  latestTimelineTitle?: string;
  createdAt: Date;
};

export type AdminAuditLogEntry = {
  id: string;
  action: string;
  entity: string;
  entityId?: string;
  summary: string;
  actorLabel: string;
  actorEmail?: string;
  actorRole: string;
  actorProvider: string;
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

export function productRequiresQuote(product: Product) {
  return Boolean(product.requiresQuote || product.price <= 0);
}

export function formatPrice(product: Product) {
  if (productRequiresQuote(product)) return 'Call for purchase';
  return new Intl.NumberFormat('en-CA', { style: 'currency', currency: product.currency }).format(product.price);
}

export function formatMinorUnitAmount(amountCents: number, currency: string) {
  const amount = amountCents / 100;
  return new Intl.NumberFormat('en-CA', { maximumFractionDigits: 0 }).format(amount) + ` ${currency}`;
}
