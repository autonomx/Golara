import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildAdminAnalyticsLayoutPreview } from '../../lib/analytics/admin-analytics-layout';
import { resolveAdminAnalyticsRange } from '../../lib/analytics/admin-analytics-range';
import { buildAdminAnalyticsScheduledReportPreview } from '../../lib/analytics/admin-analytics-scheduled-reports';
import { createAdminPageShellTranslator, getAdminPageShellCopy } from '../../lib/localization/admin-page-shell-copy';

export async function runAdminPageShellCopyTests() {
  const fa = createAdminPageShellTranslator('fa-IR');
  assert.equal(fa('Operations console'), 'کنسول عملیات');
  assert.equal(fa('Admin navigation'), 'ناوبری مدیریت');
  assert.equal(fa('Admin workspaces'), 'بخش‌های مدیریت');
  assert.equal(fa('Overview sections'), 'بخش‌های نمای کلی');
  assert.equal(fa('Jump to overview section'), 'رفتن به بخش نمای کلی');
  assert.equal(fa('Security'), 'امنیت');
  assert.equal(fa('Analytics'), 'تحلیل‌ها');
  assert.equal(fa('Order analytics'), 'تحلیل سفارش‌ها');
  assert.equal(fa('Business metrics, orders, inventory, and site signals.'), 'شاخص‌های کسب‌وکار، سفارش‌ها، موجودی و سیگنال‌های سایت.');
  assert.equal(fa('Store'), 'فروشگاه');
  assert.equal(fa('Customer Ops'), 'عملیات مشتری');
  assert.equal(fa('System'), 'سیستم');
  assert.equal(fa('Products, categories, subcategories, and media.'), 'محصولات، دسته‌بندی‌ها، زیرمجموعه‌ها و رسانه‌ها.');
  assert.equal(fa('Payment settlement'), 'تسویه پرداخت');
  assert.equal(fa('Staff access'), 'دسترسی تیم');
  assert.equal(fa('product'), 'محصول');
  assert.equal(fa('products'), 'محصول');
  assert.equal(fa('category'), 'دسته‌بندی');
  assert.equal(fa('categories'), 'دسته‌بندی');
  assert.equal(fa('media'), 'رسانه');
  assert.equal(fa('Unmapped shell key'), 'Unmapped shell key');
  assert.equal(getAdminPageShellCopy('Sign in', 'en-CA'), 'Sign in');

  const helperSource = readFileSync('lib/localization/admin-page-shell-copy.ts', 'utf8');
  assert.match(helperSource, /createAdminPageShellTranslator/);
  assert.match(helperSource, /Operations console/);
  assert.match(helperSource, /Payment settlement/);
  assert.match(helperSource, /Overview sections/);
  assert.match(helperSource, /Jump to overview section/);
  assert.match(helperSource, /Order analytics/);
  assert.match(helperSource, /Business metrics, orders, inventory, and site signals\./);
  assert.match(helperSource, /Store configuration, staff access, and providers\./);

  const shellSource = readFileSync('components/admin/AdminPageShell.tsx', 'utf8');
  assert.match(shellSource, /createAdminPageShellTranslator\(locale\)/);
  assert.match(shellSource, /t\('Operations console'\)/);
  assert.match(shellSource, /t\('Admin navigation'\)/);
  assert.match(shellSource, /t\('Admin workspaces'\)/);
  assert.match(shellSource, /t\('Overview sections'\)/);
  assert.match(shellSource, /AdminOverviewJumpNav/);
  assert.match(shellSource, /props\.activeNavKey === 'overview'/);
  assert.match(shellSource, /href: '\/admin\/analytics'/);
  assert.match(shellSource, /key: 'analytics'/);
  assert.match(shellSource, /tab === 'analytics'/);
  assert.match(shellSource, /href: '#readiness'/);
  assert.match(shellSource, /href: '#security'/);
  assert.match(shellSource, /href: '#order-analytics'/);
  assert.match(shellSource, /href: '#staff-readiness'/);
  assert.match(shellSource, /href: '#audit-log'/);
  assert.match(shellSource, /t\(section\.label\)/);
  assert.match(shellSource, /t\(navLabels\[item\.key\]\)/);
  assert.match(shellSource, /t\(current\.label\)/);
  assert.match(shellSource, /t\(current\.description\)/);
  assert.match(shellSource, /productCount === 1 \? 'product' : 'products'/);
  assert.match(shellSource, /categoryCount === 1 \? 'category' : 'categories'/);
  assert.match(shellSource, /t\('media'\)/);
  assert.doesNotMatch(shellSource, /const copy = \{/);

  const analyticsRangeSource = readFileSync('lib/analytics/admin-analytics-range.ts', 'utf8');
  assert.match(analyticsRangeSource, /ADMIN_ANALYTICS_RANGE_DAYS = \[7, 30, 90, 365\]/);
  assert.match(analyticsRangeSource, /DEFAULT_ADMIN_ANALYTICS_RANGE_DAYS = 30/);
  assert.match(analyticsRangeSource, /normalizeAdminAnalyticsRangeDays/);
  assert.match(analyticsRangeSource, /resolveAdminAnalyticsRange/);
  assert.match(analyticsRangeSource, /getAdminAnalyticsRangeStart/);
  assert.match(analyticsRangeSource, /isWithinAdminAnalyticsRange/);

  const scheduledReportRange = resolveAdminAnalyticsRange(new Date(Date.UTC(2026, 5, 19, 12)), {
    start: '2026-06-01',
    end: '2026-06-15'
  });
  const scheduledReportPreview = buildAdminAnalyticsScheduledReportPreview(scheduledReportRange);
  assert.equal(scheduledReportPreview.status, 'preview_only');
  assert.equal(scheduledReportPreview.deliveryEnabled, false);
  assert.equal(scheduledReportPreview.persistenceEnabled, false);
  assert.equal(scheduledReportPreview.businessCsvPath, '/admin/analytics/export?start=2026-06-01&end=2026-06-15&report=business');
  assert.equal(scheduledReportPreview.siteCsvPath, '/admin/analytics/export?start=2026-06-01&end=2026-06-15&report=site');
  assert.deepEqual(scheduledReportPreview.plans.map((plan) => plan.cadence), ['weekly', 'monthly']);

  const scheduledReportSource = readFileSync('lib/analytics/admin-analytics-scheduled-reports.ts', 'utf8');
  assert.match(scheduledReportSource, /preview_only/);
  assert.match(scheduledReportSource, /deliveryEnabled: false/);
  assert.match(scheduledReportSource, /persistenceEnabled: false/);
  assert.match(scheduledReportSource, /adminAnalyticsRangeQueryString/);
  assert.doesNotMatch(scheduledReportSource, /sendMail|transport|cron|schedule\.create|setInterval|setTimeout/);

  const layoutPreview = buildAdminAnalyticsLayoutPreview(scheduledReportRange);
  assert.equal(layoutPreview.status, 'group_headers_active');
  assert.equal(layoutPreview.enabled, true);
  assert.equal(layoutPreview.groupHeadersEnabled, true);
  assert.equal(layoutPreview.collapsibleGroupsEnabled, false);
  assert.equal(layoutPreview.tabsEnabled, false);
  assert.equal(layoutPreview.preservesSectionIndex, true);
  assert.equal(layoutPreview.preservesRangeLinks, true);
  assert.equal(layoutPreview.requiresAccessibleTableFallbacks, true);
  assert.equal(layoutPreview.rangeQuery, 'start=2026-06-01&end=2026-06-15');
  assert.deepEqual(
    layoutPreview.groups.map((group) => group.key),
    ['overview', 'business', 'site', 'products', 'operations', 'privacy-docs']
  );
  assert.ok(layoutPreview.groups.every((group) => group.href.startsWith(layoutPreview.workspaceHref)));
  assert.ok(layoutPreview.groups.every((group) => group.sections.every((section) => section.keepsTableFallback)));

  const layoutSource = readFileSync('lib/analytics/admin-analytics-layout.ts', 'utf8');
  assert.match(layoutSource, /group_headers_active/);
  assert.match(layoutSource, /groupHeadersEnabled: true/);
  assert.match(layoutSource, /collapsibleGroupsEnabled: false/);
  assert.match(layoutSource, /tabsEnabled: false/);
  assert.match(layoutSource, /requiresAccessibleTableFallbacks: true/);
  assert.match(layoutSource, /adminAnalyticsRangeQueryString/);
  assert.doesNotMatch(layoutSource, /localStorage|sessionStorage|cookies\(|PrismaClient|prisma\.|create\(|update\(|upsert\(|delete\(/);

  const layoutHeaderSource = readFileSync('components/admin/AdminAnalyticsLayoutGroupHeaders.tsx', 'utf8');
  assert.match(layoutHeaderSource, /id="analytics-layout-groups"/);
  assert.match(layoutHeaderSource, /Dashboard groups/);
  assert.match(layoutHeaderSource, /preview\.groups\.map/);
  assert.match(layoutHeaderSource, /preview\.rangeLabel/);
  assert.match(layoutHeaderSource, /Collapsible groups and tabs remain disabled/);
  assert.doesNotMatch(layoutHeaderSource, /details|summary|tablist|localStorage|sessionStorage|cookies\(/);

  const analyticsRouteSource = readFileSync('app/admin/analytics/page.tsx', 'utf8');
  assert.match(analyticsRouteSource, /activeTab="analytics"/);
  assert.match(analyticsRouteSource, /activeNavKey="analytics"/);
  assert.match(analyticsRouteSource, /returnTo=\{returnTo\}/);
  assert.match(analyticsRouteSource, /type SearchParams = Record/);
  assert.match(analyticsRouteSource, /resolveAdminAnalyticsRange\(new Date\(\), \{/);
  assert.match(analyticsRouteSource, /buildAdminAnalyticsLayoutPreview\(analyticsRange\)/);
  assert.match(analyticsRouteSource, /AdminAnalyticsLayoutGroupHeaders preview=\{layoutPreview\}/);
  assert.match(analyticsRouteSource, /sectionHref\('analytics-layout-groups', analyticsRange\)/);
  assert.match(analyticsRouteSource, /name="start"/);
  assert.match(analyticsRouteSource, /name="end"/);
  assert.match(analyticsRouteSource, /ADMIN_ANALYTICS_RANGE_DAYS\.map/);
  assert.match(analyticsRouteSource, /href=\{rangeHref\(days\)\}/);
  assert.match(analyticsRouteSource, /aria-current=\{active \? 'page' : undefined\}/);
  assert.match(analyticsRouteSource, /orderRevenueSummaryService\.summary\(\{ analyticsRange \}\)/);
  assert.match(analyticsRouteSource, /siteAnalyticsSummaryService\.summary\(\{ analyticsRange \}\)/);
  assert.match(analyticsRouteSource, /ownerOnlyAnalyticsControls = identity\.role === 'owner'/);
  assert.match(analyticsRouteSource, /id="analytics-role-visibility"/);
  assert.match(analyticsRouteSource, /exportOwnerOnly/);
  assert.match(analyticsRouteSource, /ownerOnlyAnalyticsControls \? siteAnalyticsRetentionService\.summary\(\)/);
  assert.match(analyticsRouteSource, /retentionOwnerOnly/);
  assert.match(analyticsRouteSource, /AdminOrderRevenueSummaryPanel/);
  assert.match(analyticsRouteSource, /AdminSiteAnalyticsPanel/);
  assert.match(analyticsRouteSource, /AdminAnalyticsGuidancePanel/);
  assert.match(analyticsRouteSource, /orderSummary=\{orderRevenueSummary\}/);
  assert.match(analyticsRouteSource, /productSalesSummary=\{productSalesAnalyticsSummary\}/);
  assert.match(analyticsRouteSource, /categorySalesSummary=\{categorySalesAnalyticsSummary\}/);
  assert.match(analyticsRouteSource, /siteSummary=\{siteAnalyticsSummary\}/);
  assert.match(analyticsRouteSource, /lightweight server-rendered business and site charts/);
  assert.match(analyticsRouteSource, /privacy-safe first-party events/);
  assert.match(analyticsRouteSource, /id="analytics-csv-exports"/);
  assert.match(analyticsRouteSource, /exportHref\('business', analyticsRange\)/);
  assert.match(analyticsRouteSource, /exportHref\('site', analyticsRange\)/);
  assert.match(analyticsRouteSource, /Download business CSV/);
  assert.match(analyticsRouteSource, /Download site CSV/);
  assert.match(analyticsRouteSource, /same summaries and charts shown on this page/);
  assert.match(analyticsRouteSource, /id="analytics-privacy-retention"/);
  assert.match(analyticsRouteSource, /Privacy and retention/);
  assert.match(analyticsRouteSource, /NEXT_PUBLIC_SITE_ANALYTICS_ENABLED=false/);
  assert.match(analyticsRouteSource, /site events up to 180 days/);
  assert.match(analyticsRouteSource, /site-analytics-privacy-retention-policy\.md/);
  assert.match(analyticsRouteSource, /sectionHref\('analytics-privacy-retention', analyticsRange\)/);
  assert.match(analyticsRouteSource, /sectionHref\('analytics-guidance', analyticsRange\)/);
  assert.match(analyticsRouteSource, /Guidance/);
  assert.match(analyticsRouteSource, /id="analytics-section-index"/);
  assert.match(analyticsRouteSource, /sectionHref\('order-analytics', analyticsRange\)/);
  assert.match(analyticsRouteSource, /sectionHref\('business-analytics-charts', analyticsRange\)/);
  assert.match(analyticsRouteSource, /sectionHref\('site-analytics', analyticsRange\)/);
  assert.match(analyticsRouteSource, /sectionHref\('product-analytics', analyticsRange\)/);
  assert.match(analyticsRouteSource, /sectionHref\('inventory-analytics', analyticsRange\)/);
  assert.match(analyticsRouteSource, /sectionHref\('fulfillment-analytics', analyticsRange\)/);
  assert.match(analyticsRouteSource, /sectionHref\('payment-analytics', analyticsRange\)/);
  assert.match(analyticsRouteSource, /sectionHref\('inquiry-operations', analyticsRange\)/);
  assert.match(analyticsRouteSource, /sectionHref\('readiness-analytics', analyticsRange\)/);
  assert.match(analyticsRouteSource, /aria-label=\{labels\.sectionLabel\}/);
  assert.match(analyticsRouteSource, /Jump directly to the analytics area you need/);

  const guidancePanelSource = readFileSync('components/admin/AdminAnalyticsGuidancePanel.tsx', 'utf8');
  assert.match(guidancePanelSource, /id="analytics-guidance"/);
  assert.match(guidancePanelSource, /What to look at next/);
  assert.match(guidancePanelSource, /Current signal summary/);
  assert.match(guidancePanelSource, /When a chart is empty/);
  assert.match(guidancePanelSource, /Production validation checklist/);
  assert.match(guidancePanelSource, /Confirm the SiteAnalyticsEvent migration\/table exists/);
  assert.match(guidancePanelSource, /Visit storefront product, category, search, cart, checkout, and order-confirmation paths/);
  assert.match(guidancePanelSource, /checkout started, payment method selected, and checkout completed events/);
  assert.match(guidancePanelSource, /Download Business CSV and Site CSV as an owner/);
  assert.match(guidancePanelSource, /retention status and stale-event counts/);
  assert.match(guidancePanelSource, /admin-analytics-production-validation-runbook\.md/);
  assert.match(guidancePanelSource, /Open production validation runbook/);
  assert.match(guidancePanelSource, /Analytics implementation status/);
  assert.match(guidancePanelSource, /Preset and custom start\/end date range resolution/);
  assert.match(guidancePanelSource, /Aggregate customer cohort order\/revenue buckets/);
  assert.match(guidancePanelSource, /retention cleanup job/);
  assert.match(guidancePanelSource, /Scheduled analytics reports/);
  assert.match(guidancePanelSource, /Saved dashboard views/);
  assert.match(guidancePanelSource, /Role-specific analytics visibility/);

  console.log('admin-page-shell-copy.test.ts passed');
}
