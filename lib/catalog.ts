export type CatalogTranslation = {
  locale: string;
  title: string;
  eyebrow?: string;
  description?: string;
  imageAlt?: string;
  isPublished: boolean;
  updatedAt?: Date;
};

export type HomepageTranslation = {
  locale: string;
  eyebrow?: string;
  title?: string;
  body?: string;
  primaryCtaLabel?: string;
  primaryCtaHref?: string;
  secondaryCtaLabel?: string;
  secondaryCtaHref?: string;
  panelEyebrow?: string;
  panelTitle?: string;
  panelBody?: string;
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
  productTypeId?: string;
  productTypeName?: string;
  price: number;
  currency: string;
  availableToday: boolean;
  bestSeller?: boolean;
  isActive?: boolean;
  requiresQuote?: boolean;
  image: string;
  description: string;
  seoTitle?: string;
  seoDescription?: string;
  canonicalPath?: string;
  seoIndex?: boolean;
  collections?: Collection[];
  updatedAt?: Date;
  translations?: CatalogTranslation[];
  attributeValues?: ProductAttributeValue[];
  variants?: ProductVariant[];
};

export type ProductType = {
  id: string;
  slug: string;
  name: string;
  description?: string;
  isActive: boolean;
  sortOrder: number;
  productCount?: number;
  updatedAt?: Date;
};

export type ProductAttribute = {
  id: string;
  slug: string;
  name: string;
  description?: string;
  inputType: string;
  appliesTo: string;
  unit?: string;
  options?: string[];
  isFilterable: boolean;
  isRequired: boolean;
  isActive: boolean;
  sortOrder: number;
  updatedAt?: Date;
};

export type ProductAttributeValue = {
  id: string;
  attributeId: string;
  productId?: string;
  variantId?: string;
  value: string;
  updatedAt?: Date;
};

export type WarehouseLocation = {
  id: string;
  slug: string;
  name: string;
  description?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  region?: string;
  countryCode: string;
  postalCode?: string;
  phone?: string;
  isActive: boolean;
  sortOrder: number;
  updatedAt?: Date;
};

export type ProductVariantLocationStock = {
  id: string;
  variantId: string;
  locationId: string;
  locationSlug?: string;
  locationName?: string;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  lowStockThreshold?: number;
  updatedAt?: Date;
};

export type Collection = {
  id: string;
  slug: string;
  title: string;
  description?: string;
  isActive: boolean;
  sortOrder: number;
  productCount?: number;
  updatedAt?: Date;
};

export type ProductVariant = {
  id: string;
  productId: string;
  sku: string;
  name: string;
  price: number;
  currency: string;
  image?: string;
  stockQuantity: number;
  trackInventory?: boolean;
  lowStockThreshold?: number;
  isActive: boolean;
  sortOrder: number;
  attributeValues?: ProductAttributeValue[];
  locationStocks?: ProductVariantLocationStock[];
  updatedAt?: Date;
};

export type MediaSourceType = 'external' | 'upload' | 'seed' | 'generated';

export type MediaItem = {
  id?: string;
  url: string;
  alt: string;
  mediaCategory?: string;
  sourceType?: string;
  storageProvider?: string;
  mimeType?: string;
  sizeBytes?: number;
  productId?: string;
  createdAt?: Date;
};

export type CustomerInquiryFollowUp = {
  id: string;
  note: string;
  channel: string;
  createdAt: Date;
};

export type CustomerInquiryAssignee = {
  adminId?: string;
  label?: string;
  email?: string;
  role?: string;
  assignedAt?: Date;
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
  assignee?: CustomerInquiryAssignee;
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
