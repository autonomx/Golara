import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildSiteAnalyticsSummary } from '../../lib/analytics/site-analytics-summary';

function source(path: string) {
  return readFileSync(path, 'utf8');
}

export async function runSiteAnalyticsSummaryTests() {
  const rangeHelper = source('lib/analytics/admin-analytics-range.ts');
  const service = source('lib/analytics/site-analytics-summary.ts');
  const panel = source('components/admin/AdminSiteAnalyticsPanel.tsx');
  const route = source('app/api/site-analytics/events/route.ts');
  const reporter = source('components/StorefrontSiteAnalyticsReporter.tsx');
  const layout = source('app/layout.tsx');
  const analyticsPage = source('app/admin/analytics/page.tsx');
  const migration = source('prisma/migrations/20260618193000_add_site_analytics_events/migration.sql');

  const now = new Date('2026-06-18T12:00:00Z');
  const rows = [
    { eventType: 'page_view', path: '/', locale: 'en-CA', createdAt: new Date('2026-06-18T10:00:00Z') },
    { eventType: 'page_view', path: '/products/rose', locale: 'en-CA', createdAt: new Date('2026-06-18T11:00:00Z') },
    { eventType: 'product_view', path: '/products/rose', productId: 'rose', locale: 'en-CA', createdAt: new Date('2026-06-18T11:05:00Z') },
    { eventType: 'category_view', path: '/categories/flowers', categoryId: 'flowers', locale: 'en-CA', createdAt: new Date('2026-06-18T11:06:00Z') },
    { eventType: 'search_submitted', path: '/products', searchTerm: 'orchid', locale: 'en-CA', createdAt: new Date('2026-06-17T11:05:00Z') },
    { eventType: 'add_to_cart', path: '/cart', productId: 'rose', locale: 'en-CA', createdAt: new Date('2026-06-17T11:10:00Z') },
    { eventType: 'checkout_started', path: '/cart/checkout', locale: 'en-CA', createdAt: new Date('2026-06-17T11:15:00Z') },
    { eventType: 'payment_method_selected', path: '/cart/checkout', locale: 'en-CA', createdAt: new Date('2026-06-17T11:16:00Z') },
    { eventType: 'checkout_completed', path: '/orders/example', locale: 'en-CA', createdAt: new Date('2026-06-17T11:20:00Z') },
    { eventType: 'page_view', path: '/previous', locale: 'en-CA', createdAt: new Date('2026-05-10T11:20:00Z') },
    { eventType: 'checkout_completed', path: '/orders/previous', locale: 'en-CA', createdAt: new Date('2026-05-10T11:25:00Z') },
    { eventType: 'page_view', path: '/old', locale: 'en-CA', createdAt: new Date('2026-04-01T11:20:00Z') }
  ];
  const summary = buildSiteAnalyticsSummary(rows, now);

  assert.equal(summary.analyticsRangeDays, 30);
  assert.equal(summary.totalEvents, 9);
  assert.equal(summary.recentEvents, 9);
  assert.equal(summary.uniquePaths, 6);
  assert.equal(summary.checkoutFunnel.pageViews, 2);
  assert.equal(summary.checkoutFunnel.productViews, 1);
  assert.equal(summary.checkoutFunnel.addToCart, 1);
  assert.equal(summary.checkoutFunnel.checkoutStarted, 1);
  assert.equal(summary.checkoutFunnel.checkoutCompleted, 1);
  assert.equal(summary.comparison.totalEvents.previousValue, 2);
  assert.equal(summary.comparison.totalEvents.absoluteChange, 7);
  assert.equal(summary.comparison.pageViews.previousValue, 1);
  assert.equal(summary.comparison.checkoutCompleted.previousValue, 1);
  assert.equal(summary.comparison.checkoutCompleted.direction, 'flat');
  assert.equal(summary.topPages[0].label, '/cart/checkout');
  assert.equal(summary.topPages[0].count, 2);
  assert.equal(summary.topProductViews[0].label, 'rose');
  assert.equal(summary.topCategoryViews[0].label, 'flowers');
  assert.equal(summary.topSearchTerms[0].label, 'orchid');
  assert.equal(summary.recentDaily.length, 30);
  assert.equal(summary.recentDaily[29].date, '2026-06-18');
  assert.equal(summary.recentDaily[29].eventCount, 4);

  const sevenDaySummary = buildSiteAnalyticsSummary(rows, now, { rangeDays: 7 });
  assert.equal(sevenDaySummary.analyticsRangeDays, 7);
  assert.equal(sevenDaySummary.totalEvents, 9);
  assert.equal(sevenDaySummary.comparison.totalEvents.previousValue, 0);
  assert.equal(sevenDaySummary.comparison.totalEvents.percentChange, null);
  assert.equal(sevenDaySummary.recentDaily.length, 7);
  assert.equal(sevenDaySummary.recentDaily[0].date, '2026-06-12');
  assert.equal(sevenDaySummary.topPages.some((row) => row.label === '/old'), false);

  assert.match(rangeHelper, /ADMIN_ANALYTICS_RANGE_DAYS = \[7, 30, 90\]/);
  assert.match(rangeHelper, /normalizeAdminAnalyticsRangeDays/);
  assert.match(rangeHelper, /getAdminAnalyticsRangeStart/);
  assert.match(rangeHelper, /getAdminAnalyticsPreviousRangeStart/);
  assert.match(rangeHelper, /isWithinAdminAnalyticsRange/);
  assert.match(rangeHelper, /isWithinAdminAnalyticsPreviousRange/);

  assert.match(service, /export type SiteAnalyticsEventType/);
  assert.match(service, /SITE_ANALYTICS_EVENT_TYPES/);
  assert.match(service, /buildSiteAnalyticsSummary/);
  assert.match(service, /analyticsRangeDays: AdminAnalyticsRangeDays/);
  assert.match(service, /scopedRows = rows\.filter/);
  assert.match(service, /previousRows = rows\.filter/);
  assert.match(service, /export type SiteAnalyticsComparisonSummary/);
  assert.match(service, /comparison: SiteAnalyticsComparisonSummary/);
  assert.match(service, /buildSiteAnalyticsComparison/);
  assert.match(service, /WHERE "createdAt" >= \$\{getAdminAnalyticsPreviousRangeStart\(now, rangeDays\)\}/);
  assert.match(service, /LIMIT 10000/);
  assert.match(service, /topProductViews/);
  assert.match(service, /topCategoryViews/);
  assert.match(service, /siteAnalyticsSummaryService/);
  assert.match(service, /SELECT "eventType", "path", "locale", "productId", "categoryId", "searchTerm", "createdAt"/);
  assert.match(service, /isMissingSiteAnalyticsTableError/);

  assert.match(panel, /export async function AdminSiteAnalyticsPanel/);
  assert.match(panel, /Storefront traffic and funnel/);
  assert.match(panel, /formatRangeLabel\(summary\.analyticsRangeDays/);
  assert.match(panel, /Selected range/);
  assert.match(panel, /AdminAnalyticsTrendChart/);
  assert.match(panel, /AdminAnalyticsBarChart/);
  assert.match(panel, /Events by type/);
  assert.match(panel, /Top pages/);
  assert.match(panel, /Checkout funnel/);
  assert.match(panel, /Top product views/);
  assert.match(panel, /Top category views/);
  assert.match(panel, /formatComparisonDelta/);
  assert.match(panel, /vs previous range/);
  assert.match(panel, /summary\.comparison\.totalEvents/);
  assert.match(panel, /summary\.comparison\.checkoutCompleted/);

  assert.match(route, /assertSameOriginServerAction/);
  assert.match(route, /MAX_BODY_BYTES = 4096/);
  assert.match(route, /normalizePath/);
  assert.match(route, /startsWith\('\/admin\/'\)/);
  assert.match(route, /normalizeMetadata/);
  assert.match(route, /paymentMethodKey/);
  assert.match(route, /recordSiteAnalyticsEvent/);
  assert.match(route, /INSERT INTO "SiteAnalyticsEvent"/);
  assert.match(route, /site_analytics_event_table_missing/);

  assert.match(reporter, /StorefrontSiteAnalyticsReporter/);
  assert.match(reporter, /NEXT_PUBLIC_SITE_ANALYTICS_ENABLED/);
  assert.match(reporter, /navigator\.doNotTrack/);
  assert.match(reporter, /ADMIN_OR_SYSTEM_PATH_PREFIXES/);
  assert.match(reporter, /sendBeacon/);
  assert.match(reporter, /page_view/);
  assert.match(reporter, /product_view/);
  assert.match(reporter, /category_view/);
  assert.match(reporter, /search_submitted/);
  assert.match(reporter, /add_to_cart/);
  assert.match(reporter, /checkout_started/);
  assert.match(reporter, /checkout_completed/);
  assert.match(reporter, /payment_method_selected/);
  assert.doesNotMatch(reporter, /useSearchParams/);

  assert.match(layout, /StorefrontSiteAnalyticsReporter/);
  assert.match(layout, /<StorefrontSiteAnalyticsReporter \/>/);

  assert.match(analyticsPage, /AdminSiteAnalyticsPanel/);
  assert.match(analyticsPage, /siteAnalyticsSummaryService\.summary\(\{ rangeDays \}\)/);
  assert.match(analyticsPage, /EMPTY_SITE_ANALYTICS_SUMMARY/);
  assert.match(analyticsPage, /privacy-safe first-party events/);
  assert.match(analyticsPage, /Analytics range/);
  assert.match(analyticsPage, /ADMIN_ANALYTICS_RANGE_DAYS/);

  assert.match(migration, /CREATE TABLE IF NOT EXISTS "SiteAnalyticsEvent"/);
  assert.match(migration, /anonymousSessionId/);
  assert.match(migration, /JSONB/);
  assert.match(migration, /SiteAnalyticsEvent_eventType_createdAt_idx/);

  console.log('site-analytics-summary.test.ts passed');
}
