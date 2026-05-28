import 'server-only';

import type { Prisma } from '@prisma/client';
import type { AdminAuditLogEntry, Category, CustomerInquiry, HomepageContent, MediaItem, Product } from '@/lib/catalog';
import { prisma } from '@/lib/prisma';
import { readWithSeedFallback } from '@/lib/cms/repository-fallback-policy';
import { seedCategories, seedHomepageContent, seedProducts } from '@/lib/seed-data';

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

type DbCategory = {
  id: string;
  slug: string;
  title: string;
  eyebrow: string;
  description: string;
  imageUrl: string | null;
  parentId: string | null;
  parent?: { slug: string; title: string } | null;
  showOnHomepage: boolean;
  sortOrder: number;
  isActive: boolean;
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

function mapCategory(category: DbCategory): Category {
  return {
    id: category.id,
    slug: category.slug,
    title: category.title,
    eyebrow: category.eyebrow,
    description: category.description,
    image: category.imageUrl ?? undefined,
    parentId: category.parentId ?? undefined,
    parentSlug: category.parent?.slug,
    parentTitle: category.parent?.title,
    showOnHomepage: category.showOnHomepage,
    sortOrder: category.sortOrder,
    isActive: category.isActive
  };
}

function mapProduct(product: DbProduct): Product {
  const image = product.imageUrl || product.images?.[0]?.url || FALLBACK_IMAGE;

  return {
    id: product.id,
    slug: product.slug,
    code: product.code,
    title: product.title,
    category: product.category?.slug ?? '',
    categoryId: product.categoryId,
    categoryTitle: product.category?.title,
    price: product.priceCents / 100,
    currency: product.currency,
    availableToday: product.availableToday,
    bestSeller: product.bestSeller,
    requiresQuote: product.requiresQuote || product.priceCents <= 0,
    isActive: product.isActive,
    image,
    description: product.description
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

function fallbackMedia(): MediaItem[] {
  const seen = new Set<string>();
  return seedProducts
    .filter((product) => {
      if (seen.has(product.image)) return false;
      seen.add(product.image);
      return true;
    })
    .map((product) => ({ url: product.image, alt: product.title }));
}

function payloadObject(value: unknown): Partial<HomepageContent> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value as Partial<HomepageContent>;
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
    return media.map((item) => ({ id: item.id, url: item.url, alt: item.alt, productId: item.productId ?? undefined, createdAt: item.createdAt }));
  }, fallbackMedia);
}

export async function listCategories(): Promise<Category[]> {
  return readWithFallback(async () => {
    const categories = await prisma.category.findMany({ where: { isActive: true }, include: { parent: { select: { slug: true, title: true } } }, orderBy: [{ sortOrder: 'asc' }, { title: 'asc' }] });
    return categories.map(mapCategory);
  }, () => [...seedCategories].filter((category) => category.isActive !== false).sort(bySortThenTitle));
}

export async function listHomepageCategories(): Promise<Category[]> {
  return readWithFallback(async () => {
    const categories = await prisma.category.findMany({ where: { isActive: true, showOnHomepage: true }, include: { parent: { select: { slug: true, title: true } } }, orderBy: [{ sortOrder: 'asc' }, { title: 'asc' }] });
    return categories.map(mapCategory);
  }, () => [...seedCategories].filter((category) => category.isActive !== false && category.showOnHomepage !== false).sort(bySortThenTitle));
}

export async function listAdminCategories(): Promise<Category[]> {
  return readWithFallback(async () => {
    const categories = await prisma.category.findMany({ include: { parent: { select: { slug: true, title: true } } }, orderBy: [{ sortOrder: 'asc' }, { title: 'asc' }] });
    return categories.map(mapCategory);
  }, () => [...seedCategories].sort(bySortThenTitle));
}

export async function getCategoryBySlug(slug: string): Promise<Category | undefined> {
  const categories = await listCategories();
  return categories.find((category) => category.slug === slug);
}

export async function listProducts(): Promise<Product[]> {
  return readWithFallback(async () => {
    const products = await prisma.product.findMany({ where: { isActive: true, category: { isActive: true } }, include: { category: { include: { parent: { select: { slug: true, title: true } } } }, images: true }, orderBy: [{ bestSeller: 'desc' }, { title: 'asc' }] });
    return products.map(mapProduct);
  }, () => seedProducts.filter((product) => product.isActive !== false));
}

export async function listAdminProducts(): Promise<Product[]> {
  return readWithFallback(async () => {
    const products = await prisma.product.findMany({ include: { category: { include: { parent: { select: { slug: true, title: true } } } }, images: true }, orderBy: [{ title: 'asc' }] });
    return products.map(mapProduct);
  }, () => seedProducts);
}

export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  return readWithFallback(async () => {
    const product = await prisma.product.findUnique({ where: { slug }, include: { category: { include: { parent: { select: { slug: true, title: true } } } }, images: true } });
    if (!product || !product.isActive || !product.category?.isActive) return undefined;
    return mapProduct(product);
  }, () => seedProducts.find((product) => product.slug === slug && product.isActive !== false));
}

export async function listProductsByCategorySlug(slug: string): Promise<Product[]> {
  return readWithFallback(async () => {
    const products = await prisma.product.findMany({ where: { isActive: true, category: { slug, isActive: true } }, include: { category: { include: { parent: { select: { slug: true, title: true } } } }, images: true }, orderBy: [{ bestSeller: 'desc' }, { title: 'asc' }] });
    return products.map(mapProduct);
  }, () => seedProducts.filter((product) => product.category === slug && product.isActive !== false));
}

export async function getHomepageContent(): Promise<HomepageContent> {
  return readWithFallback(async () => {
    const section = await prisma.homepageSection.findUnique({ where: { key: 'home.hero' } });
    if (!section?.isActive) return seedHomepageContent;
    return { ...seedHomepageContent, eyebrow: section.subtitle ?? seedHomepageContent.eyebrow, title: section.title, body: section.body ?? seedHomepageContent.body, ...payloadObject(section.payload) };
  }, () => seedHomepageContent);
}
