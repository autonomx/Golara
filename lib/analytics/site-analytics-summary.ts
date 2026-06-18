import 'server-only';

import { hasDatabase, prisma } from '@/lib/prisma';

export type SiteAnalyticsEventType =
  | 'page_view'
  | 'product_view'
  | 'category_view'
  | 'search_submitted'
  | 'add_to_cart'
  | 'checkout_started'
  | 'checkout_completed'
  | 'payment_method_selected';

export type SiteAnalyticsSourceRow = {
  eventType: string;
  path: string;
  locale?: string | null;
  productId?: string | null;
  categoryId?: string | null;
  searchTerm?: string | null;
  createdAt: Date;
};

type RawSiteAnalyticsSourceRow = Omit<SiteAnalyticsSourceRow, 'createdAt'> & {
  createdAt: Date | string;
};

export type SiteAnalyticsBreakdownRow = {
  label: string;
  count: number;
};

export type SiteAnalyticsDailyPoint = {
  date: string;
  eventCount: number;
};

export type SiteAnalyticsFunnel = {
  pageViews: number;
  productViews: number;
  addToCart: number;
  checkoutStarted: number;
  checkoutCompleted: number;
};

export type SiteAnalyticsSummary = {
  totalEvents: number;
  recentEvents: number;
  uniquePaths: number;
  byEventType: SiteAnalyticsBreakdownRow[];
  topPages: SiteAnalyticsBreakdownRow[];
  topProductViews: SiteAnalyticsBreakdownRow[];
  topCategoryViews: SiteAnalyticsBreakdownRow[];
  topSearchTerms: SiteAnalyticsBreakdownRow[];
  checkoutFunnel: SiteAnalyticsFunnel;
  recentDaily: SiteAnalyticsDailyPoint[];
  generatedAt: Date;
};

const DAY_MS = 24 * 60 * 60 * 1000;
const RECENT_DAILY_POINT_COUNT = 30;
const TOP_ROW_LIMIT = 8;

export const SITE_ANALYTICS_EVENT_TYPES = new Set<SiteAnalyticsEventType>([
  'page_view',
  'product_view',
  'category_view',
  'search_submitted',
  'add_to_cart',
  'checkout_started',
  'checkout_completed',
  'payment_method_selected'
]);

export const EMPTY_SITE_ANALYTICS_SUMMARY: SiteAnalyticsSummary = {
  totalEvents: 0,
  recentEvents: 0,
  uniquePaths: 0,
  byEventType: [],
  topPages: [],
  topProductViews: [],
  topCategoryViews: [],
  topSearchTerms: [],
  checkoutFunnel: {
    pageViews: 0,
    productViews: 0,
    addToCart: 0,
    checkoutStarted: 0,
    checkoutCompleted: 0
  },
  recentDaily: [],
  generatedAt: new Date(0)
};

function normalizeEventType(value?: string | null): SiteAnalyticsEventType | 'unknown' {
  const normalized = value?.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || '';
  return SITE_ANALYTICS_EVENT_TYPES.has(normalized as SiteAnalyticsEventType) ? normalized as SiteAnalyticsEventType : 'unknown';
}

function normalizePath(value?: string | null) {
  const trimmed = value?.trim() || '/';
  if (!trimmed.startsWith('/')) return '/';
  return trimmed.slice(0, 180) || '/';
}

function normalizeLabel(value?: string | null, fallback = 'Unknown') {
  const trimmed = value?.trim();
  return trimmed ? trimmed.slice(0, 120) : fallback;
}

function startOfUtcDay(value: Date) {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
}

function utcDateKey(value: Date) {
  return startOfUtcDay(value).toISOString().slice(0, 10);
}

function incrementBucket(map: Map<string, number>, key: string, amount = 1) {
  map.set(key, (map.get(key) ?? 0) + amount);
}

function buildBreakdownRows(map: Map<string, number>, limit = TOP_ROW_LIMIT): SiteAnalyticsBreakdownRow[] {
  return Array.from(map.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .slice(0, limit);
}

function buildRecentDailyPoints(rows: SiteAnalyticsSourceRow[], now: Date): SiteAnalyticsDailyPoint[] {
  const end = startOfUtcDay(now);
  const start = new Date(end.getTime() - (RECENT_DAILY_POINT_COUNT - 1) * DAY_MS);
  const buckets = new Map<string, number>();

  for (let offset = 0; offset < RECENT_DAILY_POINT_COUNT; offset += 1) {
    const day = new Date(start.getTime() + offset * DAY_MS);
    buckets.set(utcDateKey(day), 0);
  }

  for (const row of rows) {
    const day = startOfUtcDay(row.createdAt);
    if (day < start || day > end) continue;
    const key = utcDateKey(day);
    if (!buckets.has(key)) continue;
    incrementBucket(buckets, key);
  }

  return Array.from(buckets.entries()).map(([date, eventCount]) => ({ date, eventCount }));
}

export function buildSiteAnalyticsSummary(rows: SiteAnalyticsSourceRow[], now = new Date()): SiteAnalyticsSummary {
  const recentCutoff = new Date(now.getTime() - 30 * DAY_MS);
  const typeBuckets = new Map<string, number>();
  const pathBuckets = new Map<string, number>();
  const productBuckets = new Map<string, number>();
  const categoryBuckets = new Map<string, number>();
  const searchBuckets = new Map<string, number>();
  const pathSet = new Set<string>();
  const funnel: SiteAnalyticsFunnel = {
    pageViews: 0,
    productViews: 0,
    addToCart: 0,
    checkoutStarted: 0,
    checkoutCompleted: 0
  };
  let recentEvents = 0;

  for (const row of rows) {
    const eventType = normalizeEventType(row.eventType);
    const path = normalizePath(row.path);
    incrementBucket(typeBuckets, eventType);
    incrementBucket(pathBuckets, path);
    pathSet.add(path);

    if (row.createdAt >= recentCutoff) recentEvents += 1;

    if (eventType === 'page_view') funnel.pageViews += 1;
    if (eventType === 'product_view') {
      funnel.productViews += 1;
      incrementBucket(productBuckets, normalizeLabel(row.productId, path));
    }
    if (eventType === 'category_view') {
      incrementBucket(categoryBuckets, normalizeLabel(row.categoryId, path));
    }
    if (eventType === 'add_to_cart') funnel.addToCart += 1;
    if (eventType === 'checkout_started') funnel.checkoutStarted += 1;
    if (eventType === 'checkout_completed') funnel.checkoutCompleted += 1;

    if (eventType === 'search_submitted') {
      incrementBucket(searchBuckets, normalizeLabel(row.searchTerm, 'Unknown search'));
    }
  }

  return {
    totalEvents: rows.length,
    recentEvents,
    uniquePaths: pathSet.size,
    byEventType: buildBreakdownRows(typeBuckets),
    topPages: buildBreakdownRows(pathBuckets),
    topProductViews: buildBreakdownRows(productBuckets),
    topCategoryViews: buildBreakdownRows(categoryBuckets),
    topSearchTerms: buildBreakdownRows(searchBuckets),
    checkoutFunnel: funnel,
    recentDaily: buildRecentDailyPoints(rows, now),
    generatedAt: now
  };
}

function normalizeRawSiteAnalyticsRows(rows: RawSiteAnalyticsSourceRow[]): SiteAnalyticsSourceRow[] {
  return rows.map((row) => ({
    ...row,
    createdAt: row.createdAt instanceof Date ? row.createdAt : new Date(row.createdAt)
  })).filter((row) => !Number.isNaN(row.createdAt.getTime()));
}

function isMissingSiteAnalyticsTableError(error: unknown) {
  const code = typeof error === 'object' && error && 'code' in error ? String((error as { code?: unknown }).code) : '';
  const message = error instanceof Error ? error.message : '';
  return code === 'P2021' || code === 'P2022' || /SiteAnalyticsEvent|site analytics/i.test(message);
}

export const siteAnalyticsSummaryService = {
  async summary(): Promise<SiteAnalyticsSummary> {
    if (!hasDatabase()) return { ...EMPTY_SITE_ANALYTICS_SUMMARY, generatedAt: new Date() };

    try {
      const rows = await prisma.$queryRaw<RawSiteAnalyticsSourceRow[]>`
        SELECT "eventType", "path", "locale", "productId", "categoryId", "searchTerm", "createdAt"
        FROM "SiteAnalyticsEvent"
        ORDER BY "createdAt" DESC
        LIMIT 5000
      `;

      return buildSiteAnalyticsSummary(normalizeRawSiteAnalyticsRows(rows));
    } catch (error) {
      if (isMissingSiteAnalyticsTableError(error)) {
        return { ...EMPTY_SITE_ANALYTICS_SUMMARY, generatedAt: new Date() };
      }
      throw error;
    }
  }
};
