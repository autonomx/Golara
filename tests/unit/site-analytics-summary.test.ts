import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildSiteAnalyticsSummary } from '../../lib/analytics/site-analytics-summary';

function source(path: string) {
  return readFileSync(path, 'utf8');
}

export async function runSiteAnalyticsSummaryTests() {
  const service = source('lib/analytics/site-analytics-summary.ts');
  const panel = source('components/admin/AdminSiteAnalyticsPanel.tsx');
  const route = source('app/api/site-analytics/events/route.ts');
  const reporter = source('components/StorefrontSiteAnalyticsReporter.tsx');
  const layout = source('app/layout.tsx');
  const analyticsPage = source('app/admin/analytics/page.tsx');
  const migration = source('prisma/migrations/20260618193000_add_site_analytics_events/migration.sql');

  const now = new Date('2026-06-18T12:00:00Z');
  const summary = buildSiteAnalyticsSummary([
    { eventType: 'page_view', path: '/', locale: 'en-CA', createdAt: new Date('2026-06-18T10:00:00Z') },
    { eventType: 'page_view', path: '/products/rose', locale: 'en-CA', createdAt: new Date('2026-06-18T11:00:00Z') },
    { eventType: 'product_view', path: '/products/rose', productId: 'rose', locale: 'en-CA', createdAt: new Date('2026-06-18T11:05:00Z') },
    { eventType: 'search_submitted', path: '/search', searchTerm: 'orchid', locale: 'en-CA', createdAt: new Date('2026-06-17T11:05:00Z') },
    { eventType: 'add_to_cart', path: '/cart', locale: 'en-CA', createdAt: new Date('2026-06-17T11:10:00Z') },
    { eventType: 'checkout_started', path: '/checkout', locale: 'en-CA', createdAt: new Date('2026-06-17T11:15:00Z') },
    { eventType: 'checkout_completed', path: '/orders/example', locale: 'en-CA', createdAt: new Date('2026-06-17T11:20:00Z') }
  ], now);

  assert.equal(summary.totalEvents, 7);
  assert.equal(summary.recentEvents, 7);
  assert.equal(summary.uniquePaths, 5);
  assert.equal(summary.checkoutFunnel.pageViews, 2);
  assert.equal(summary.checkoutFunnel.productViews, 1);
  assert.equal(summary.checkoutFunnel.addToCart, 1);
  assert.equal(summary.checkoutFunnel.checkoutStarted, 1);
  assert.equal(summary.checkoutFunnel.checkoutCompleted, 1);
  assert.equal(summary.topPages[0].label, '/products/rose');
  assert.equal(summary.topPages[0].count, 2);
  assert.equal(summary.topSearchTerms[0].label, 'orchid');
  assert.equal(summary.recentDaily.length, 30);
  assert.equal(summary.recentDaily[29].date, '2026-06-18');
  assert.equal(summary.recentDaily[29].eventCount, 3);

  assert.match(service, /export type SiteAnalyticsEventType/);
  assert.match(service, /SITE_ANALYTICS_EVENT_TYPES/);
  assert.match(service, /buildSiteAnalyticsSummary/);
  assert.match(service, /siteAnalyticsSummaryService/);
  assert.match(service, /SELECT "eventType", "path", "locale", "productId", "categoryId", "searchTerm", "createdAt" FROM "SiteAnalyticsEvent"/);
  assert.match(service, /isMissingSiteAnalyticsTableError/);

  assert.match(panel, /export async function AdminSiteAnalyticsPanel/);
  assert.match(panel, /Storefront traffic and funnel/);
  assert.match(panel, /AdminAnalyticsTrendChart/);
  assert.match(panel, /AdminAnalyticsBarChart/);
  assert.match(panel, /Events by type/);
  assert.match(panel, /Top pages/);
  assert.match(panel, /Checkout funnel/);

  assert.match(route, /assertSameOriginServerAction/);
  assert.match(route, /MAX_BODY_BYTES = 4096/);
  assert.match(route, /normalizePath/);
  assert.match(route, /startsWith\('\/admin\/'\)/);
  assert.match(route, /recordSiteAnalyticsEvent/);
  assert.match(route, /INSERT INTO "SiteAnalyticsEvent"/);
  assert.match(route, /site_analytics_event_table_missing/);

  assert.match(reporter, /StorefrontSiteAnalyticsReporter/);
  assert.match(reporter, /NEXT_PUBLIC_SITE_ANALYTICS_ENABLED/);
  assert.match(reporter, /navigator\.doNotTrack/);
  assert.match(reporter, /ADMIN_OR_SYSTEM_PATH_PREFIXES/);
  assert.match(reporter, /sendBeacon/);
  assert.match(reporter, /page_view/);

  assert.match(layout, /StorefrontSiteAnalyticsReporter/);
  assert.match(layout, /<StorefrontSiteAnalyticsReporter \/>/);

  assert.match(analyticsPage, /AdminSiteAnalyticsPanel/);
  assert.match(analyticsPage, /siteAnalyticsSummaryService\.summary/);
  assert.match(analyticsPage, /EMPTY_SITE_ANALYTICS_SUMMARY/);
  assert.match(analyticsPage, /privacy-safe first-party events/);

  assert.match(migration, /CREATE TABLE IF NOT EXISTS "SiteAnalyticsEvent"/);
  assert.match(migration, /anonymousSessionId/);
  assert.match(migration, /JSONB/);
  assert.match(migration, /SiteAnalyticsEvent_eventType_createdAt_idx/);

  console.log('site-analytics-summary.test.ts passed');
}
