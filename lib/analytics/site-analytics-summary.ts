import 'server-only';

import { buildAnalyticsComparisonDelta, type AnalyticsComparisonDelta } from '@/lib/analytics/analytics-comparison';
import {
  getAdminAnalyticsPreviousRangeStart,
  isWithinAdminAnalyticsPreviousRange,
  isWithinAdminAnalyticsRange,
  resolveAdminAnalyticsRange,
  startOfUtcDay,
  type AdminAnalyticsRangeInput,
  type AdminAnalyticsResolvedRange
} from '@/lib/analytics/admin-analytics-range';
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

export type SiteAnalyticsAttributionMetadata = {
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  referrerDomain?: string | null;
};

export type SiteAnalyticsSourceRow = {
  eventType: string;
  path: string;
  locale?: string | null;
  productId?: string | null;
  categoryId?: string | null;
  searchTerm?: string | null;
  metadata?: SiteAnalyticsAttributionMetadata | null;
  createdAt: Date;
};

type StoredSiteAnalyticsSourceRow = Omit<SiteAnalyticsSourceRow, 'createdAt' | 'metadata'> & {
  metadata?: unknown;
  createdAt: Date | string;
};

export type SiteAnalyticsBreakdownRow = {
  label: string;
  count: number;
};

export type SiteAnalyticsProductConversionRow = {
  label: string;
  productViews: number;
  addToCart: number;
  viewToCartRatePercent: number;
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

export type SiteAnalyticsComparisonSummary = {
  totalEvents: AnalyticsComparisonDelta;
  uniquePaths: AnalyticsComparisonDelta;
  pageViews: AnalyticsComparisonDelta;
  productViews: AnalyticsComparisonDelta;
  checkoutCompleted: AnalyticsComparisonDelta;
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
  topTrafficSources: SiteAnalyticsBreakdownRow[];
  topTrafficCampaigns: SiteAnalyticsBreakdownRow[];
  topReferrerDomains: SiteAnalyticsBreakdownRow[];
  productConversions: SiteAnalyticsProductConversionRow[];
  checkoutFunnel: SiteAnalyticsFunnel;
  comparison: SiteAnalyticsComparisonSummary;
  recentDaily: SiteAnalyticsDailyPoint[];
  analyticsRangeDays: number;
  analyticsRangeLabel: string;
  analyticsRangeMode: 'preset' | 'custom';
  analyticsRangeStart: Date;
  analyticsRangeEnd: Date;
  generatedAt: Date;
};

export type SiteAnalyticsSummaryOptions = {
  rangeDays?: AdminAnalyticsRangeInput;
  start?: AdminAnalyticsRangeInput;
  end?: AdminAnalyticsRangeInput;
  analyticsRange?: AdminAnalyticsResolvedRange;
};

const DAY_MS = 24 * 60 * 60 * 1000;
const TOP_ROW_LIMIT = 8;
const ZERO_DELTA = buildAnalyticsComparisonDelta(0, 0);
const EMPTY_RANGE = resolveAdminAnalyticsRange(new Date(0));

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
  topTrafficSources: [],
  topTrafficCampaigns: [],
  topReferrerDomains: [],
  productConversions: [],
  checkoutFunnel: {
    pageViews: 0,
    productViews: 0,
    addToCart: 0,
    checkoutStarted: 0,
    checkoutCompleted: 0
  },
  comparison: {
    totalEvents: ZERO_DELTA,
    uniquePaths: ZERO_DELTA,
    pageViews: ZERO_DELTA,
    productViews: ZERO_DELTA,
    checkoutCompleted: ZERO_DELTA
  },
  recentDaily: [],
  analyticsRangeDays: 30,
  analyticsRangeLabel: EMPTY_RANGE.label,
  analyticsRangeMode: EMPTY_RANGE.mode,
  analyticsRangeStart: EMPTY_RANGE.startDate,
  analyticsRangeEnd: EMPTY_RANGE.endDate,
  generatedAt: new Date(0)
};

function resolveSummaryRange(now: Date, options: SiteAnalyticsSummaryOptions) {
  return options.analyticsRange ?? resolveAdminAnalyticsRange(now, {
    range: options.rangeDays,
    start: options.start,
    end: options.end
  });
}

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

function normalizeOptionalLabel(value: unknown) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim().replace(/\s+/g, ' ');
  return trimmed ? trimmed.slice(0, 120) : null;
}

function normalizeMetadata(value: unknown): SiteAnalyticsAttributionMetadata | null {
  let parsed = value;
  if (typeof value === 'string') {
    try {
      parsed = JSON.parse(value) as unknown;
    } catch {
      return null;
    }
  }
  if (typeof parsed !== 'object' || !parsed || Array.isArray(parsed)) return null;
  const source = parsed as Record<string, unknown>;
  return {
    utmSource: normalizeOptionalLabel(source.utmSource),
    utmMedium: normalizeOptionalLabel(source.utmMedium),
    utmCampaign: normalizeOptionalLabel(source.utmCampaign),
    referrerDomain: normalizeOptionalLabel(source.referrerDomain)
  };
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

function buildProductConversionRows(buckets: Map<string, { productViews: number; addToCart: number }>, limit = TOP_ROW_LIMIT): SiteAnalyticsProductConversionRow[] {
  return Array.from(buckets.entries())
    .map(([label, bucket]) => ({
      label,
      productViews: bucket.productViews,
      addToCart: bucket.addToCart,
      viewToCartRatePercent: bucket.productViews ? Math.round((bucket.addToCart / bucket.productViews) * 1000) / 10 : 0
    }))
    .filter((row) => row.productViews > 0 || row.addToCart > 0)
    .sort((a, b) => b.addToCart - a.addToCart || b.productViews - a.productViews || b.viewToCartRatePercent - a.viewToCartRatePercent || a.label.localeCompare(b.label))
    .slice(0, limit);
}

function buildRecentDailyPoints(rows: SiteAnalyticsSourceRow[], range: AdminAnalyticsResolvedRange): SiteAnalyticsDailyPoint[] {
  const buckets = new Map<string, number>();

  for (let offset = 0; offset < range.rangeDays; offset += 1) {
    const day = new Date(range.startDate.getTime() + offset * DAY_MS);
    buckets.set(utcDateKey(day), 0);
  }

  for (const row of rows) {
    const day = startOfUtcDay(row.createdAt);
    if (day < range.startDate || day > range.endDate) continue;
    const key = utcDateKey(day);
    if (!buckets.has(key)) continue;
    incrementBucket(buckets, key);
  }

  return Array.from(buckets.entries()).map(([date, eventCount]) => ({ date, eventCount }));
}

type SiteComparisonSnapshot = {
  totalEvents: number;
  uniquePaths: number;
  pageViews: number;
  productViews: number;
  checkoutCompleted: number;
};

function buildSiteComparisonSnapshot(rows: SiteAnalyticsSourceRow[]): SiteComparisonSnapshot {
  const pathSet = new Set<string>();
  let pageViews = 0;
  let productViews = 0;
  let checkoutCompleted = 0;

  for (const row of rows) {
    const eventType = normalizeEventType(row.eventType);
    pathSet.add(normalizePath(row.path));
    if (eventType === 'page_view') pageViews += 1;
    if (eventType === 'product_view') productViews += 1;
    if (eventType === 'checkout_completed') checkoutCompleted += 1;
  }

  return {
    totalEvents: rows.length,
    uniquePaths: pathSet.size,
    pageViews,
    productViews,
    checkoutCompleted
  };
}

function buildSiteAnalyticsComparison(current: SiteComparisonSnapshot, previous: SiteComparisonSnapshot): SiteAnalyticsComparisonSummary {
  return {
    totalEvents: buildAnalyticsComparisonDelta(current.totalEvents, previous.totalEvents),
    uniquePaths: buildAnalyticsComparisonDelta(current.uniquePaths, previous.uniquePaths),
    pageViews: buildAnalyticsComparisonDelta(current.pageViews, previous.pageViews),
    productViews: buildAnalyticsComparisonDelta(current.productViews, previous.productViews),
    checkoutCompleted: buildAnalyticsComparisonDelta(current.checkoutCompleted, previous.checkoutCompleted)
  };
}

export function buildSiteAnalyticsSummary(rows: SiteAnalyticsSourceRow[], now = new Date(), options: SiteAnalyticsSummaryOptions = {}): SiteAnalyticsSummary {
  const analyticsRange = resolveSummaryRange(now, options);
  const scopedRows = rows.filter((row) => isWithinAdminAnalyticsRange(row.createdAt, now, analyticsRange));
  const previousRows = rows.filter((row) => isWithinAdminAnalyticsPreviousRange(row.createdAt, now, analyticsRange));
  const recentCutoff = analyticsRange.startDate;
  const typeBuckets = new Map<string, number>();
  const pathBuckets = new Map<string, number>();
  const productBuckets = new Map<string, number>();
  const productConversionBuckets = new Map<string, { productViews: number; addToCart: number }>();
  const categoryBuckets = new Map<string, number>();
  const searchBuckets = new Map<string, number>();
  const sourceBuckets = new Map<string, number>();
  const campaignBuckets = new Map<string, number>();
  const referrerBuckets = new Map<string, number>();
  const pathSet = new Set<string>();
  const funnel: SiteAnalyticsFunnel = {
    pageViews: 0,
    productViews: 0,
    addToCart: 0,
    checkoutStarted: 0,
    checkoutCompleted: 0
  };
  let recentEvents = 0;

  for (const row of scopedRows) {
    const eventType = normalizeEventType(row.eventType);
    const path = normalizePath(row.path);
    const metadata = row.metadata ?? null;
    const productLabel = normalizeLabel(row.productId, path);
    incrementBucket(typeBuckets, eventType);
    incrementBucket(pathBuckets, path);
    incrementBucket(sourceBuckets, normalizeLabel(metadata?.utmSource, 'Direct/unknown'));
    pathSet.add(path);

    if (metadata?.utmCampaign) incrementBucket(campaignBuckets, normalizeLabel(metadata.utmCampaign));
    if (metadata?.referrerDomain) incrementBucket(referrerBuckets, normalizeLabel(metadata.referrerDomain));

    if (row.createdAt >= recentCutoff) recentEvents += 1;

    if (eventType === 'page_view') funnel.pageViews += 1;
    if (eventType === 'product_view') {
      funnel.productViews += 1;
      incrementBucket(productBuckets, productLabel);
      const bucket = productConversionBuckets.get(productLabel) ?? { productViews: 0, addToCart: 0 };
      bucket.productViews += 1;
      productConversionBuckets.set(productLabel, bucket);
    }
    if (eventType === 'category_view') {
      incrementBucket(categoryBuckets, normalizeLabel(row.categoryId, path));
    }
    if (eventType === 'add_to_cart') {
      funnel.addToCart += 1;
      const bucket = productConversionBuckets.get(productLabel) ?? { productViews: 0, addToCart: 0 };
      bucket.addToCart += 1;
      productConversionBuckets.set(productLabel, bucket);
    }
    if (eventType === 'checkout_started') funnel.checkoutStarted += 1;
    if (eventType === 'checkout_completed') funnel.checkoutCompleted += 1;

    if (eventType === 'search_submitted') {
      incrementBucket(searchBuckets, normalizeLabel(row.searchTerm, 'Unknown search'));
    }
  }

  const currentSnapshot: SiteComparisonSnapshot = {
    totalEvents: scopedRows.length,
    uniquePaths: pathSet.size,
    pageViews: funnel.pageViews,
    productViews: funnel.productViews,
    checkoutCompleted: funnel.checkoutCompleted
  };
  const previousSnapshot = buildSiteComparisonSnapshot(previousRows);

  return {
    totalEvents: scopedRows.length,
    recentEvents,
    uniquePaths: pathSet.size,
    byEventType: buildBreakdownRows(typeBuckets),
    topPages: buildBreakdownRows(pathBuckets),
    topProductViews: buildBreakdownRows(productBuckets),
    topCategoryViews: buildBreakdownRows(categoryBuckets),
    topSearchTerms: buildBreakdownRows(searchBuckets),
    topTrafficSources: buildBreakdownRows(sourceBuckets),
    topTrafficCampaigns: buildBreakdownRows(campaignBuckets),
    topReferrerDomains: buildBreakdownRows(referrerBuckets),
    productConversions: buildProductConversionRows(productConversionBuckets),
    checkoutFunnel: funnel,
    comparison: buildSiteAnalyticsComparison(currentSnapshot, previousSnapshot),
    recentDaily: buildRecentDailyPoints(scopedRows, analyticsRange),
    analyticsRangeDays: analyticsRange.rangeDays,
    analyticsRangeLabel: analyticsRange.label,
    analyticsRangeMode: analyticsRange.mode,
    analyticsRangeStart: analyticsRange.startDate,
    analyticsRangeEnd: analyticsRange.endDate,
    generatedAt: now
  };
}

function normalizeStoredSiteAnalyticsRows(rows: StoredSiteAnalyticsSourceRow[]): SiteAnalyticsSourceRow[] {
  return rows.map((row) => ({
    ...row,
    metadata: normalizeMetadata(row.metadata),
    createdAt: row.createdAt instanceof Date ? row.createdAt : new Date(row.createdAt)
  })).filter((row) => !Number.isNaN(row.createdAt.getTime()));
}

function isMissingSiteAnalyticsTableError(error: unknown) {
  const code = typeof error === 'object' && error && 'code' in error ? String((error as { code?: unknown }).code) : '';
  const message = error instanceof Error ? error.message : '';
  return code === 'P2021' || code === 'P2022' || /SiteAnalyticsEvent|site analytics/i.test(message);
}

export const siteAnalyticsSummaryService = {
  async summary(options: SiteAnalyticsSummaryOptions = {}): Promise<SiteAnalyticsSummary> {
    const now = new Date();
    const analyticsRange = resolveSummaryRange(now, options);
    if (!hasDatabase()) {
      return {
        ...EMPTY_SITE_ANALYTICS_SUMMARY,
        analyticsRangeDays: analyticsRange.rangeDays,
        analyticsRangeLabel: analyticsRange.label,
        analyticsRangeMode: analyticsRange.mode,
        analyticsRangeStart: analyticsRange.startDate,
        analyticsRangeEnd: analyticsRange.endDate,
        generatedAt: now
      };
    }

    try {
      const rows = await prisma.$queryRaw<StoredSiteAnalyticsSourceRow[]>`
        SELECT "eventType", "path", "locale", "productId", "categoryId", "searchTerm", "metadata", "createdAt"
        FROM "SiteAnalyticsEvent"
        WHERE "createdAt" >= ${getAdminAnalyticsPreviousRangeStart(now, analyticsRange)}
        ORDER BY "createdAt" DESC
        LIMIT 10000
      `;

      return buildSiteAnalyticsSummary(normalizeStoredSiteAnalyticsRows(rows), now, { analyticsRange });
    } catch (error) {
      if (isMissingSiteAnalyticsTableError(error)) {
        return {
          ...EMPTY_SITE_ANALYTICS_SUMMARY,
          analyticsRangeDays: analyticsRange.rangeDays,
          analyticsRangeLabel: analyticsRange.label,
          analyticsRangeMode: analyticsRange.mode,
          analyticsRangeStart: analyticsRange.startDate,
          analyticsRangeEnd: analyticsRange.endDate,
          generatedAt: now
        };
      }
      throw error;
    }
  }
};
