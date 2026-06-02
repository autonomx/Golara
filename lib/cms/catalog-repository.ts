import 'server-only';

import type { Prisma } from '@prisma/client';
import type { AdminAuditLogEntry, CatalogTranslation, Category, CustomerInquiry, HomepageContent, MediaItem, Product } from '@/lib/catalog';
import { prisma } from '@/lib/prisma';
import { readWithSeedFallback } from '@/lib/cms/repository-fallback-policy';
import { seedCategories, seedHomepageContent, seedProducts } from '@/lib/seed-data';
import { localizedField, selectTranslatedContent, type TranslationLike } from '@/lib/i18n/translated-content';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=1200&q=80';
const INQUIRY_STATUSES = ['new', 'contacted', 'confirmed', 'fulfilled', 'cancelled'];
const DEFAULT_INQUIRY_PAGE_SIZE = 10;

export type InquiryStatusCount = { status: string; count: number };

export type InquiryPage = {
  inquiries: CustomerInquiry[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
};

export type AdminAuditLogFilters = { action?: string; entity?: string; actor?: string; search?: string };

type CatalogReadOptions = { locale?: string | null; includeTranslations?: boolean };

type DbCategoryTranslation = TranslationLike & {
  title: string;
  eyebrow: string | null;
  description: string | null;
  imageAlt: string | null;
  updatedAt?: Date;
};

type DbProductTranslation = TranslationLike & {
  title: string;
  description: string | null;
  imageAlt: string | null;
  updatedAt?: Date;
};

type DbHomepageTranslation = TranslationLike & {
  title: string | null;
  subtitle: string | null;
  body: string | null;
  payload: Prisma.JsonValue | null;
};

type DbCategory = {
  id: string;
  slug: string;
  title: string;
  eyebrow: string;
  description: string;
  imageUrl: string | null;
  parentId: string | null;
  parent?: { slug: string; title: string; translations?: DbCategoryTranslation[] } | null;
  showOnHomepage: boolean;
  sortOrder: number;
  isActive: boolean;
  translations?: DbCategoryTranslation[];
};

type DbProduct = {
  id: string;
  slug: string;
  code: string;
  title: string;
  description: string;
  priceCents: number;
  currency: string;
  availableToday: boolean;
  bestSeller: boolean;
  requiresQuote: boolean;
  isActive: boolean;
  categoryId: string;
  imageUrl: string;
  category?: DbCategory;
  images?: { url: string; alt: string }[];
  translations?: DbProductTranslation[];
};

type DbFollowUp = { id: string; note: string; channel: string; createdAt: Date };

type DbInquiry = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  message: string;
  productId: string | null;
  deliveryDate: Date | null;
  deliveryNotes: string | null;
  staffNotes: string | null;
  status: string;
  assignedAdminId: string | null;
  assignedAdminLabel: string | null;
  assignedAdminEmail: string | null;
  assignedAdminRole: string | null;
  assignedAt: Date | null;
  createdAt: Date;
  product?: { title: string } | null;
  followUps?: DbFollowUp[];
};

type DbAuditLog = {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  summary: string;
  actorLabel: string;
  actorEmail: string | null;
  actorRole: string;
  actorProvider: string;
  createdAt: Date;
};

type InquiryWhere = Prisma.CustomerInquiryWhereInput;
type AuditLogWhere = Prisma.AdminAuditLogWhereInput;

const categoryInclude = { parent: { select: { slug: true, title: true, translations: true } }, translations: true } satisfies Prisma.CategoryInclude;
const productInclude = { category: { include: categoryInclude }, images: true, translations: true } satisfies Prisma.ProductInclude;

function bySortThenTitle(a: Category, b: Category) {
  return (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.title.localeCompare(b.title);
}

function isKnownInquiryStatus(status?: string) {
  return Boolean(status && INQUIRY_STATUSES.includes(status));
}

function emptyInquiryCounts(): InquiryStatusCount[] {
  return INQUIRY_STATUSES.map((status) => ({ status, count: 0 }));
}

function normalizePage(page?: number) {
  if (!page || !Number.isFinite(page)) return 1;
  return Math.max(1, Math.floor(page));
}

function normalizeSearch(search?: string) {
  const normalized = search?.trim();
  return normalized || undefined;
}

function buildInquiryWhere(status?: string, search?: string): InquiryWhere {
  const where: InquiryWhere = {};
  const normalizedSearch = normalizeSearch(search);

  if (isKnownInquiryStatus(status)) where.status = status;

  if (normalizedSearch) {
    where.OR = [
      { name: { contains: normalizedSearch, mode: 'insensitive' } },
      { email: { contains: normalizedSearch, mode: 'insensitive' } },
      { phone: { contains: normalizedSearch, mode: 'insensitive' } },
      { message: { contains: normalizedSearch, mode: 'insensitive' } },
      { deliveryNotes: { contains: normalizedSearch, mode: 'insensitive' } },
      { staffNotes: { contains: normalizedSearch, mode: 'insensitive' } },
      { assignedAdminLabel: { contains: normalizedSearch, mode: 'insensitive' } },
      { assignedAdminEmail: { contains: normalizedSearch, mode: 'insensitive' } },
      { product: { title: { contains: normalizedSearch, mode: 'insensitive' } } }
    ];
  }

  return where;
}

function buildAuditLogWhere(filters: AdminAuditLogFilters = {}): AuditLogWhere {
  const where: AuditLogWhere = {};
  const action = normalizeSearch(filters.action);
  const entity = normalizeSearch(filters.entity);
  const actor = normalizeSearch(filters.actor);
  const search = normalizeSearch(filters.search);

  if (action) where.action = { contains: action, mode: 'insensitive' };
  if (entity) where.entity = { contains: entity, mode: 'insensitive' };
  if (actor) {
    where.OR = [
      { actorLabel: { contains: actor, mode: 'insensitive' } },
      { actorEmail: { contains: actor, mode: 'insensitive' } },
      { actorRole: { contains: actor, mode: 'insensitive' } },
      { actorProvider: { contains: actor, mode: 'insensitive' } }
    ];
  }
  if (search) {
    const searchClauses: AuditLogWhere[] = [
      { summary: { contains: search, mode: 'insensitive' } },
      { action: { contains: search, mode: 'insensitive' } },
      { entity: { contains: search, mode: 'insensitive' } },
      { entityId: { contains: search, mode: 'insensitive' } },
      { actorLabel: { contains: search, mode: 'insensitive' } },
      { actorEmail: { contains: search, mode: 'insensitive' } }
    ];
    where.AND = [...(Array.isArray(where.AND) ? where.AND : where.AND ? [where.AND] : []), { OR: searchClauses }];
  }

  return where;
}

function makeInquiryPage(inquiries: CustomerInquiry[], total: number, page: number, pageSize: number): InquiryPage {
  return { inquiries, total, page, pageSize, pageCount: Math.max(1, Math.ceil(total / pageSize)) };
}

function localizeCategory(category: DbCategory, options: CatalogReadOptions = {}) {
  const selection = selectTranslatedContent({ translations: category.translations, base: category, requestedLocale: options.locale });
  const parentSelection = category.parent ? selectTranslatedContent({ translations: category.parent.translations, base: category.parent, requestedLocale: options.locale }) : undefined;

  return {
    title: localizedField({ selection, field: 'title' }),
    eyebrow: localizedField({ selection, field: 'eyebrow' }),
    description: localizedField({ selection, field: 'description' }),
    parentTitle: parentSelection ? localizedField({ selection: parentSelection, field: 'title' }) : undefined
  };
}

function localizeProduct(product: DbProduct, options: CatalogReadOptions = {}) {
  const selection = selectTranslatedContent({ translations: product.translations, base: product, requestedLocale: options.locale });
  return {
    title: localizedField({ selection, field: 'title' }),
    description: localizedField({ selection, field: 'description' })
  };
}

function mapCategoryTranslations(translations?: DbCategoryTranslation[]): CatalogTranslation[] | undefined {
  if (!translations?.length) return undefined;
  return translations.map((translation) => ({
    locale: translation.locale,
    title: translation.title,
    eyebrow: translation.eyebrow ?? undefined,
    description: translation.description ?? undefined,
    imageAlt: translation.imageAlt ?? undefined,
    isPublished: translation.isPublished !== false,
    updatedAt: translation.updatedAt
  }));
}

function mapProductTranslations(translations?: DbProductTranslation[]): CatalogTranslation[] | undefined {
  if (!translations?.length) return undefined;
  return translations.map((translation) => ({
    locale: translation.locale,
    title: translation.title,
    description: translation.description ?? undefined,
    imageAlt: translation.imageAlt ?? undefined,
    isPublished: translation.isPublished !== false,
    updatedAt: translation.updatedAt
  }));
}

function mapCategory(category: DbCategory, options: CatalogReadOptions = {}): Category {
  const localized = localizeCategory(category, options);
  return {
    id: category.id,
    slug: category.slug,
    title: localized.title,
    eyebrow: localized.eyebrow,
    description: localized.description,
    image: category.imageUrl ?? undefined,
    parentId: category.parentId ?? undefined,
    parentSlug: category.parent?.slug,
    parentTitle: localized.parentTitle,
    showOnHomepage: category.showOnHomepage,
    sortOrder: category.sortOrder,
    isActive: category.isActive,
    translations: options.includeTranslations ? mapCategoryTranslations(category.translations) : undefined
  };
}

function mapProduct(product: DbProduct, options: CatalogReadOptions = {}): Product {
  const image = product.imageUrl || product.images?.[0]?.url || FALLBACK_IMAGE;
  const localized = localizeProduct(product, options);
  const localizedCategory = product.category ? localizeCategory(product.category, options) : undefined;

  return {
    id: product.id,
    slug: product.slug,
    code: product.code,
    title: localized.title,
    category: product.category?.slug ?? '',
    categoryId: product.categoryId,
    categoryTitle: localizedCategory?.title,
    price: product.priceCents / 100,
    currency: product.currency,
    availableToday: product.availableToday,
    bestSeller: product.bestSeller,
    requiresQuote: product.requiresQuote || product.priceCents <= 0,
    isActive: product.isActive,
    image,
    description: localized.description,
    translations: options.includeTranslations ? mapProductTranslations(product.translations) : undefined
  };
}

function mapInquiry(inquiry: DbInquiry): CustomerInquiry {
  return {
    id: inquiry.id,
    name: inquiry.name ?? undefined,
    email: inquiry.email ?? undefined,
    phone: inquiry.phone ?? undefined,
    message: inquiry.message,
    productId: inquiry.productId ?? undefined,
    productTitle: inquiry.product?.title,
    deliveryDate: inquiry.deliveryDate ?? undefined,
    deliveryNotes: inquiry.deliveryNotes ?? undefined,
    staffNotes: inquiry.staffNotes ?? undefined,
    assignee: inquiry.assignedAdminId || inquiry.assignedAdminLabel || inquiry.assignedAdminEmail || inquiry.assignedAdminRole || inquiry.assignedAt ? {
      adminId: inquiry.assignedAdminId ?? undefined,
      label: inquiry.assignedAdminLabel ?? undefined,
      email: inquiry.assignedAdminEmail ?? undefined,
      role: inquiry.assignedAdminRole ?? undefined,
      assignedAt: inquiry.assignedAt ?? undefined
    } : undefined,
    followUps: inquiry.followUps?.map((followUp) => ({ id: followUp.id, note: followUp.note, channel: followUp.channel, createdAt: followUp.createdAt })),
    status: inquiry.status,
    createdAt: inquiry.createdAt
  };
}

function mapAuditLog(log: DbAuditLog): AdminAuditLogEntry {
  return {
    id: log.id,
    action: log.action,
    entity: log.entity,
    entityId: log.entityId ?? undefined,
    summary: log.summary,
    actorLabel: log.actorLabel,
    actorEmail: log.actorEmail ?? undefined,
    actorRole: log.actorRole,
    actorProvider: log.actorProvider,
    createdAt: log.createdAt
  };
}

function metadataObject(value: Prisma.JsonValue | null | undefined): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function mediaCategoryFromMetadata(value: Prisma.JsonValue | null | undefined) {
  const mediaCategory = metadataObject(value).mediaCategory;
  return typeof mediaCategory === 'string' ? mediaCategory : 'general';
}

function fallbackMedia(): MediaItem[] {
  const seen = new Set<string>();
  return seedProducts
    .filter((product) => {
      if (seen.has(product.image)) return false;
      seen.add(product.image);
      return true;
    })
    .map((product) => ({ url: product.image, alt: product.title, mediaCategory: 'product', sourceType: 'seed', storageProvider: 'seed' }));
}

function payloadObject(value: unknown): Partial<HomepageContent> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value as Partial<HomepageContent>;
}

function localizedHomepageContent(section: { title: string; subtitle: string | null; body: string | null; payload: Prisma.JsonValue; translations?: DbHomepageTranslation[] }, options: CatalogReadOptions = {}): HomepageContent {
  const base = {
    title: section.title,
    subtitle: section.subtitle,
    body: section.body,
    payload: section.payload
  };
  const selection = selectTranslatedContent({ translations: section.translations, base, requestedLocale: options.locale });
  const translationPayload = selection.translation?.payload ? payloadObject(selection.translation.payload) : {};

  return {
    ...seedHomepageContent,
    eyebrow: localizedField({ selection, field: 'subtitle' }) || seedHomepageContent.eyebrow,
    title: localizedField({ selection, field: 'title' }) || seedHomepageContent.title,
    body: localizedField({ selection, field: 'body' }) || seedHomepageContent.body,
    ...payloadObject(section.payload),
    ...translationPayload
  };
}

async function readWithFallback<T>(readFromDb: () => Promise<T>, fallback: () => T): Promise<T> {
  return readWithSeedFallback(readFromDb, fallback, 'catalog repository read');
}

export async function listAdminAuditLogs(filters: AdminAuditLogFilters = {}, limit = 12): Promise<AdminAuditLogEntry[]> {
  const safeLimit = Math.max(1, Math.min(50, Math.floor(limit)));
  return readWithFallback(async () => {
    const logs = await prisma.adminAuditLog.findMany({ where: buildAuditLogWhere(filters), orderBy: { createdAt: 'desc' }, take: safeLimit });
    return logs.map(mapAuditLog);
  }, () => []);
}

export async function listInquiryStatusCounts(search?: string): Promise<InquiryStatusCount[]> {
  return readWithFallback(async () => {
    const normalizedSearch = normalizeSearch(search);
    if (!normalizedSearch) {
      const grouped = await prisma.customerInquiry.groupBy({ by: ['status'], _count: { _all: true } });
      const counts = new Map(grouped.map((item) => [item.status, item._count._all]));
      return INQUIRY_STATUSES.map((status) => ({ status, count: counts.get(status) ?? 0 }));
    }
    return Promise.all(INQUIRY_STATUSES.map(async (status) => ({ status, count: await prisma.customerInquiry.count({ where: buildInquiryWhere(status, normalizedSearch) }) })));
  }, emptyInquiryCounts);
}

export async function listInquiries(status?: string, search?: string): Promise<CustomerInquiry[]> {
  return readWithFallback(async () => {
    const inquiries = await prisma.customerInquiry.findMany({ where: buildInquiryWhere(status, search), include: { product: { select: { title: true } }, followUps: { orderBy: { createdAt: 'desc' } } }, orderBy: { createdAt: 'desc' } });
    return inquiries.map(mapInquiry);
  }, () => []);
}

export async function listInquiryPage(status?: string, page?: number, pageSize = DEFAULT_INQUIRY_PAGE_SIZE, search?: string): Promise<InquiryPage> {
  const normalizedPage = normalizePage(page);
  const normalizedPageSize = Math.max(1, Math.min(50, Math.floor(pageSize)));
  return readWithFallback(async () => {
    const where = buildInquiryWhere(status, search);
    const [total, inquiries] = await Promise.all([
      prisma.customerInquiry.count({ where }),
      prisma.customerInquiry.findMany({ where, include: { product: { select: { title: true } }, followUps: { orderBy: { createdAt: 'desc' } } }, orderBy: { createdAt: 'desc' }, skip: (normalizedPage - 1) * normalizedPageSize, take: normalizedPageSize })
    ]);
    return makeInquiryPage(inquiries.map(mapInquiry), total, normalizedPage, normalizedPageSize);
  }, () => makeInquiryPage([], 0, normalizedPage, normalizedPageSize));
}

export async function listMedia(): Promise<MediaItem[]> {
  return readWithFallback(async () => {
    const media = await prisma.media.findMany({ orderBy: { createdAt: 'desc' } });
    return media.map((item) => ({
      id: item.id,
      url: item.url,
      alt: item.alt,
      mediaCategory: mediaCategoryFromMetadata(item.metadata),
      sourceType: item.sourceType,
      storageProvider: item.storageProvider ?? undefined,
      mimeType: item.mimeType ?? undefined,
      sizeBytes: item.sizeBytes ?? undefined,
      productId: item.productId ?? undefined,
      createdAt: item.createdAt
    }));
  }, fallbackMedia);
}

export async function listCategories(options: CatalogReadOptions = {}): Promise<Category[]> {
  return readWithFallback(async () => {
    const categories = await prisma.category.findMany({ where: { isActive: true }, include: categoryInclude, orderBy: [{ sortOrder: 'asc' }, { title: 'asc' }] });
    return categories.map((category) => mapCategory(category, options));
  }, () => [...seedCategories].filter((category) => category.isActive !== false).sort(bySortThenTitle));
}

export async function listHomepageCategories(options: CatalogReadOptions = {}): Promise<Category[]> {
  return readWithFallback(async () => {
    const categories = await prisma.category.findMany({ where: { isActive: true, showOnHomepage: true }, include: categoryInclude, orderBy: [{ sortOrder: 'asc' }, { title: 'asc' }] });
    return categories.map((category) => mapCategory(category, options));
  }, () => [...seedCategories].filter((category) => category.isActive !== false && category.showOnHomepage !== false).sort(bySortThenTitle));
}

export async function listAdminCategories(): Promise<Category[]> {
  return readWithFallback(async () => {
    const categories = await prisma.category.findMany({ include: categoryInclude, orderBy: [{ sortOrder: 'asc' }, { title: 'asc' }] });
    return categories.map((category) => mapCategory(category, { includeTranslations: true }));
  }, () => [...seedCategories].sort(bySortThenTitle));
}

export async function getCategoryBySlug(slug: string, options: CatalogReadOptions = {}): Promise<Category | undefined> {
  const categories = await listCategories(options);
  return categories.find((category) => category.slug === slug);
}

export async function listProducts(options: CatalogReadOptions = {}): Promise<Product[]> {
  return readWithFallback(async () => {
    const products = await prisma.product.findMany({ where: { isActive: true, category: { isActive: true } }, include: productInclude, orderBy: [{ bestSeller: 'desc' }, { title: 'asc' }] });
    return products.map((product) => mapProduct(product, options));
  }, () => seedProducts.filter((product) => product.isActive !== false));
}

export async function listAdminProducts(): Promise<Product[]> {
  return readWithFallback(async () => {
    const products = await prisma.product.findMany({ include: productInclude, orderBy: [{ title: 'asc' }] });
    return products.map((product) => mapProduct(product, { includeTranslations: true }));
  }, () => seedProducts);
}

export async function getProductBySlug(slug: string, options: CatalogReadOptions = {}): Promise<Product | undefined> {
  return readWithFallback(async () => {
    const product = await prisma.product.findUnique({ where: { slug }, include: productInclude });
    if (!product || !product.isActive || !product.category?.isActive) return undefined;
    return mapProduct(product, options);
  }, () => seedProducts.find((product) => product.slug === slug && product.isActive !== false));
}

export async function listProductsByCategorySlug(slug: string, options: CatalogReadOptions = {}): Promise<Product[]> {
  return readWithFallback(async () => {
    const products = await prisma.product.findMany({ where: { isActive: true, category: { slug, isActive: true } }, include: productInclude, orderBy: [{ bestSeller: 'desc' }, { title: 'asc' }] });
    return products.map((product) => mapProduct(product, options));
  }, () => seedProducts.filter((product) => product.category === slug && product.isActive !== false));
}

export async function getHomepageContent(options: CatalogReadOptions = {}): Promise<HomepageContent> {
  return readWithFallback(async () => {
    const section = await prisma.homepageSection.findUnique({ where: { key: 'home.hero' }, include: { translations: true } });
    if (!section?.isActive) return seedHomepageContent;
    return localizedHomepageContent(section, options);
  }, () => seedHomepageContent);
}
