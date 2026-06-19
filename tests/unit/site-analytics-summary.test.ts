import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildSiteAnalyticsSummary } from '../../lib/analytics/site-analytics-summary';
import { SITE_ANALYTICS_RAW_EVENT_RETENTION_DAYS, buildSiteAnalyticsRetentionSummary } from '../../lib/analytics/site-analytics-retention';

function source(path: string) {
  return readFileSync(path, 'utf8');
}

export async function runSiteAnalyticsSummaryTests() {
  const rangeHelper = source('lib/analytics/admin-analytics-range.ts');
  const service = source('lib/analytics/site-analytics-summary.ts');
  const retentionService = source('lib/analytics/site-analytics-retention.ts');
  const retentionPanel = source('components/admin/AdminSiteAnalyticsRetentionStatusPanel.tsx');
  const panel = source('components/admin/AdminSiteAnalyticsPanel.tsx');
  const route = source('app/api/site-analytics/events/route.ts');
  const reporter = source('components/StorefrontSiteAnalyticsReporter.tsx');
  const layout = source('app/layout.tsx');
  const analyticsPage = source('app/admin/analytics/page.tsx');
  const exportRoute = source('app/admin/analytics/export/route.ts');
  const migration = source('prisma/migrations/20260618193000_add_site_analytics_events/migration.sql');

  const now = new Date('2026-06-18T12:00:00Z');
  const rows = [
    { eventType: 'page_view', path: '/', locale: 'en-CA', metadata: { utmSource: 'google', utmMedium: 'cpc', utmCampaign: 'spring-launch', referrerDomain: 'search.example' }, createdAt: new Date('2026-06-18T10:00:00Z') },
    { eventType: 'page_view', path: '/products/rose', locale: 'en-CA', metadata: { utmSource: 'newsletter', utmMedium: 'email', utmCampaign: 'spring-launch' }, createdAt: new Date('2026-06-18T11:00:00Z') },
    { eventType: 'product_view', path: '/products/rose', productId: 'rose', locale: 'en-CA', metadata: { utmSource: 'newsletter', utmCampaign: 'spring-launch' }, createdAt: new Date('2026-06-18T11:05:00Z') },
    { eventType: 'product_view', path: '/products/rose', productId: 'rose', locale: 'en-CA', createdAt: new Date('2026-06-18T11:07:00Z') },
    { eventType: 'category_view', path: '/categories/flowers', categoryId: 'flowers', locale: 'en-CA', metadata: { referrerDomain: 'partner.example' }, createdAt: new Date('2026-06-18T11:06:00Z') },
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
  assert.equal(summary.totalEvents, 10);
  assert.equal(summary.recentEvents, 10);
  assert.equal(summary.uniquePaths, 6);
  assert.equal(summary.checkoutFunnel.pageViews, 2);
  assert.equal(summary.checkoutFunnel.productViews, 2);
  assert.equal(summary.checkoutFunnel.addToCart, 1);
  assert.equal(summary.checkoutFunnel.checkoutStarted, 1);
  assert.equal(summary.checkoutFunnel.checkoutCompleted, 1);
  assert.equal(summary.comparison.totalEvents.previousValue, 2);
  assert.equal(summary.comparison.totalEvents.absoluteChange, 8);
  assert.equal(summary.comparison.pageViews.previousValue, 1);
  assert.equal(summary.comparison.checkoutCompleted.previousValue, 1);
  assert.equal(summary.comparison.checkoutCompleted.direction, 'flat');
  assert.equal(summary.topPages[0].label, '/cart/checkout');
  assert.equal(summary.topPages[0].count, 2);
  assert.equal(summary.topProductViews[0].label, 'rose');
  assert.equal(summary.topProductViews[0].count, 2);
  assert.equal(summary.productConversions[0].label, 'rose');
  assert.equal(summary.productConversions[0].productViews, 2);
  assert.equal(summary.productConversions[0].addToCart, 1);
  assert.equal(summary.productConversions[0].viewToCartRatePercent, 50);
  assert.equal(summary.topCategoryViews[0].label, 'flowers');
  assert.equal(summary.topSearchTerms[0].label, 'orchid');
  assert.equal(summary.topTrafficSources[0].label, 'Direct/unknown');
  assert.equal(summary.topTrafficSources[0].count, 7);
  assert.equal(summary.topTrafficSources.some((row) => row.label === 'newsletter'), true);
  assert.equal(summary.topTrafficCampaigns[0].label, 'spring-launch');
  assert.equal(summary.topTrafficCampaigns[0].count, 3);
  assert.equal(summary.topReferrerDomains.some((row) => row.label === 'search.example'), true);
  assert.equal(summary.topReferrerDomains.some((row) => row.label === 'partner.example'), true);
  assert.equal(summary.recentDaily.length, 30);
  assert.equal(summary.recentDaily[29].date, '2026-06-18');
  assert.equal(summary.recentDaily[29].eventCount, 5);

  const sevenDaySummary = buildSiteAnalyticsSummary(rows, now, { rangeDays: 7 });
  assert.equal(sevenDaySummary.analyticsRangeDays, 7);
  assert.equal(sevenDaySummary.totalEvents, 10);
  assert.equal(sevenDaySummary.comparison.totalEvents.previousValue, 0);
  assert.equal(sevenDaySummary.comparison.totalEvents.percentChange, null);
  assert.equal(sevenDaySummary.recentDaily.length, 7);
  assert.equal(sevenDaySummary.recentDaily[0].date, '2026-06-12');
  assert.equal(sevenDaySummary.topPages.some((row) => row.label === '/old'), false);

  const retention = buildSiteAnalyticsRetentionSummary({
    totalEventCount: BigInt(12),
    retainedEventCount: '10',
    staleEventCount: 2,
    oldestEventAt: '2025-11-01T00:00:00.000Z',
    newestEventAt: new Date('2026-06-18T10:00:00Z')
  }, now);
  assert.equal(SITE_ANALYTICS_RAW_EVENT_RETENTION_DAYS, 180);
  assert.equal(retention.databaseConfigured, true);
  assert.equal(retention.tableAvailable, true);
  assert.equal(retention.totalEventCount, 12);
  assert.equal(retention.retainedEventCount, 10);
  assert.equal(retention.staleEventCount, 2);
  assert.equal(retention.cutoffAt.toISOString(), '2025-12-20T12:00:00.000Z');
  assert.equal(retention.oldestEventAt?.toISOString(), '2025-11-01T00:00:00.000Z');
  assert.equal(retention.newestEventAt?.toISOString(), '2026-06-18T10:00:00.000Z');

  assert.match(rangeHelper, /ADMIN_ANALYTICS_RANGE_DAYS = \[7, 30, 90\]/);
  assert.match(rangeHelper, /normalizeAdminAnalyticsRangeDays/);
  assert.match(rangeHelper, /getAdminAnalyticsRangeStart/);
  assert.match(rangeHelper, /getAdminAnalyticsPreviousRangeStart/);
  assert.match(rangeHelper, /isWithinAdminAnalyticsRange/);
  assert.match(rangeHelper, /isWithinAdminAnalyticsPreviousRange/);

  assert.match(service, /export type SiteAnalyticsEventType/);
  assert.match(service, /export type SiteAnalyticsAttributionMetadata/);
  assert.match(service, /export type SiteAnalyticsProductConversionRow/);
  assert.match(service, /SITE_ANALYTICS_EVENT_TYPES/);
  assert.match(service, /buildSiteAnalyticsSummary/);
  assert.match(service, /analyticsRangeDays: AdminAnalyticsRangeDays/);
  assert.match(service, /scopedRows = rows\.filter/);
  assert.match(service, /previousRows = rows\.filter/);
  assert.match(service, /export type SiteAnalyticsComparisonSummary/);
  assert.match(service, /comparison: SiteAnalyticsComparisonSummary/);
  assert.match(service, /buildSiteAnalyticsComparison/);
  assert.match(service, /topTrafficSources/);
  assert.match(service, /topTrafficCampaigns/);
  assert.match(service, /topReferrerDomains/);
  assert.match(service, /productConversions/);
  assert.match(service, /buildProductConversionRows/);
  assert.match(service, /viewToCartRatePercent/);
  assert.match(service, /normalizeMetadata/);
  assert.match(service, /metadata: normalizeMetadata\(row\.metadata\)/);
  assert.match(service, /WHERE "createdAt" >= \$\{getAdminAnalyticsPreviousRangeStart\(now, rangeDays\)\}/);
  assert.match(service, /LIMIT 10000/);
  assert.match(service, /topProductViews/);
  assert.match(service, /topCategoryViews/);
  assert.match(service, /siteAnalyticsSummaryService/);
  assert.match(service, /SELECT "eventType", "path", "locale", "productId", "categoryId", "searchTerm", "metadata", "createdAt"/);
  assert.match(service, /isMissingSiteAnalyticsTableError/);

  assert.match(retentionService, /SITE_ANALYTICS_RAW_EVENT_RETENTION_DAYS = 180/);
  assert.match(retentionService, /export type SiteAnalyticsRetentionSummary/);
  assert.match(retentionService, /buildSiteAnalyticsRetentionSummary/);
  assert.match(retentionService, /siteAnalyticsRetentionService/);
  assert.match(retentionService, /COUNT\(\*\) AS "totalEventCount"/);
  assert.match(retentionService, /COUNT\(\*\) FILTER \(WHERE "createdAt" >= \$\{cutoffAt\}\) AS "retainedEventCount"/);
  assert.match(retentionService, /COUNT\(\*\) FILTER \(WHERE "createdAt" < \$\{cutoffAt\}\) AS "staleEventCount"/);
  assert.match(retentionService, /MIN\("createdAt"\) AS "oldestEventAt"/);
  assert.match(retentionService, /MAX\("createdAt"\) AS "newestEventAt"/);
  assert.match(retentionService, /isMissingSiteAnalyticsTableError/);
  assert.doesNotMatch(retentionService, /\$queryRawUnsafe|\$executeRawUnsafe/);

  assert.match(retentionPanel, /AdminSiteAnalyticsRetentionStatusPanel/);
  assert.match(retentionPanel, /Raw event retention status/);
  assert.match(retentionPanel, /Site analytics table is not available yet/);
  assert.match(retentionPanel, /Automated cleanup is still planned/);
  assert.match(retentionPanel, /site-analytics-retention-status/);

  assert.match(panel, /export async function AdminSiteAnalyticsPanel/);
  assert.match(panel, /Storefront traffic and funnel/);
  assert.match(panel, /campaign attribution/);
  assert.match(panel, /product view-to-cart conversion/);
  assert.match(panel, /formatRangeLabel\(summary\.analyticsRangeDays/);
  assert.match(panel, /Selected range/);
  assert.match(panel, /AdminAnalyticsTrendChart/);
  assert.match(panel, /AdminAnalyticsBarChart/);
  assert.match(panel, /Events by type/);
  assert.match(panel, /Top pages/);
  assert.match(panel, /Checkout funnel/);
  assert.match(panel, /Top product views/);
  assert.match(panel, /Product view-to-cart conversion/);
  assert.match(panel, /summary\.productConversions/);
  assert.match(panel, /view-to-cart/);
  assert.match(panel, /Top category views/);
  assert.match(panel, /Top traffic sources/);
  assert.match(panel, /Top campaigns/);
  assert.match(panel, /Top referrer domains/);
  assert.match(panel, /summary\.topTrafficSources/);
  assert.match(panel, /summary\.topTrafficCampaigns/);
  assert.match(panel, /summary\.topReferrerDomains/);
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
  assert.match(route, /utmSource/);
  assert.match(route, /utmMedium/);
  assert.match(route, /utmCampaign/);
  assert.match(route, /referrerDomain/);
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
  assert.match(reporter, /utm_source/);
  assert.match(reporter, /utm_medium/);
  assert.match(reporter, /utm_campaign/);
  assert.match(reporter, /referrerDomain/);
  assert.match(reporter, /sessionStorage/);
  assert.doesNotMatch(reporter, /useSearchParams/);

  assert.match(layout, /StorefrontSiteAnalyticsReporter/);
  assert.match(layout, /<StorefrontSiteAnalyticsReporter \/>/);

  assert.match(analyticsPage, /AdminSiteAnalyticsPanel/);
  assert.match(analyticsPage, /AdminSiteAnalyticsRetentionStatusPanel/);
  assert.match(analyticsPage, /siteAnalyticsSummaryService\.summary\(\{ rangeDays \}\)/);
  assert.match(analyticsPage, /siteAnalyticsRetentionService\.summary\(\)/);
  assert.match(analyticsPage, /emptySiteAnalyticsRetentionSummary/);
  assert.match(analyticsPage, /site-analytics-retention-status/);
  assert.match(analyticsPage, /Retention status/);
  assert.match(analyticsPage, /EMPTY_SITE_ANALYTICS_SUMMARY/);
  assert.match(analyticsPage, /privacy-safe first-party events/);
  assert.match(analyticsPage, /Analytics range/);
  assert.match(analyticsPage, /ADMIN_ANALYTICS_RANGE_DAYS/);

  assert.match(exportRoute, /top_traffic_sources/);
  assert.match(exportRoute, /top_traffic_campaigns/);
  assert.match(exportRoute, /top_referrer_domains/);
  assert.match(exportRoute, /product_conversion/);
  assert.match(exportRoute, /view_to_cart_percent/);
  assert.match(exportRoute, /full URLs are not exported/);

  assert.match(migration, /CREATE TABLE IF NOT EXISTS "SiteAnalyticsEvent"/);
  assert.match(migration, /anonymousSessionId/);
  assert.match(migration, /JSONB/);
  assert.match(migration, /SiteAnalyticsEvent_eventType_createdAt_idx/);

  console.log('site-analytics-summary.test.ts passed');
}
