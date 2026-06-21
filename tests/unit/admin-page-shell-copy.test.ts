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
  assert.equal(getAdminPageShellCopy('Sign in', 'en-CA'), 'Sign in');

  const helperSource = readFileSync('lib/localization/admin-page-shell-copy.ts', 'utf8');
  assert.match(helperSource, /createAdminPageShellTranslator/);
  assert.match(helperSource, /Operations console/);
  assert.match(helperSource, /Payment settlement/);
  assert.match(helperSource, /Overview sections/);
  assert.match(helperSource, /Order analytics/);

  const shellSource = readFileSync('components/admin/AdminPageShell.tsx', 'utf8');
  assert.match(shellSource, /createAdminPageShellTranslator\(locale\)/);
  assert.match(shellSource, /t\('Operations console'\)/);
  assert.match(shellSource, /AdminOverviewJumpNav/);
  assert.match(shellSource, /props\.activeNavKey === 'overview'/);
  assert.match(shellSource, /href: '\/admin\/analytics'/);
  assert.match(shellSource, /key: 'analytics'/);
  assert.match(shellSource, /tab === 'analytics'/);
  assert.doesNotMatch(shellSource, /const copy = \{/);

  const analyticsRangeSource = readFileSync('lib/analytics/admin-analytics-range.ts', 'utf8');
  assert.match(analyticsRangeSource, /ADMIN_ANALYTICS_RANGE_DAYS = \[7, 30, 90, 365\]/);
  assert.match(analyticsRangeSource, /DEFAULT_ADMIN_ANALYTICS_RANGE_DAYS = 30/);
  assert.match(analyticsRangeSource, /resolveAdminAnalyticsRange/);

  const scheduledReportRange = resolveAdminAnalyticsRange(new Date(Date.UTC(2026, 5, 19, 12)), {
    start: '2026-06-01',
    end: '2026-06-15'
  });
  const scheduledReportPreview = buildAdminAnalyticsScheduledReportPreview(scheduledReportRange);
  assert.equal(scheduledReportPreview.status, 'config_plan_only');
  assert.equal(scheduledReportPreview.deliveryEnabled, false);
  assert.equal(scheduledReportPreview.persistenceEnabled, false);
  assert.equal(scheduledReportPreview.businessCsvPath, '/admin/analytics/export?start=2026-06-01&end=2026-06-15&report=business');
  assert.equal(scheduledReportPreview.siteCsvPath, '/admin/analytics/export?start=2026-06-01&end=2026-06-15&report=site');
  assert.deepEqual(scheduledReportPreview.plans.map((plan) => plan.cadence), ['weekly', 'monthly']);
  assert.ok(scheduledReportPreview.configPlans.every((plan) => plan.ownerApprovalRequired));
  assert.ok(scheduledReportPreview.configPlans.every((plan) => plan.active === false));

  const scheduledReportSource = readFileSync('lib/analytics/admin-analytics-scheduled-reports.ts', 'utf8');
  assert.match(scheduledReportSource, /config_plan_only/);
  assert.match(scheduledReportSource, /deliveryEnabled: false/);
  assert.match(scheduledReportSource, /persistenceEnabled: false/);
  assert.doesNotMatch(scheduledReportSource, /sendMail|transport|cron|schedule\.create|setInterval|setTimeout/);

  const layoutPreview = buildAdminAnalyticsLayoutPreview(scheduledReportRange);
  assert.equal(layoutPreview.status, 'tabbed_workspace_active');
  assert.equal(layoutPreview.enabled, true);
  assert.equal(layoutPreview.groupHeadersEnabled, true);
  assert.equal(layoutPreview.collapsibleGroupsEnabled, true);
  assert.equal(layoutPreview.tabsEnabled, true);
  assert.equal(layoutPreview.preservesSectionIndex, true);
  assert.equal(layoutPreview.preservesRangeLinks, true);
  assert.equal(layoutPreview.requiresAccessibleTableFallbacks, true);
  assert.equal(layoutPreview.rangeQuery, 'start=2026-06-01&end=2026-06-15');
  assert.deepEqual(
    layoutPreview.groups.map((group) => group.key),
    ['overview', 'business', 'site', 'products', 'operations', 'privacy-docs']
  );
  assert.ok(layoutPreview.groups.some((group) => group.defaultOpen));
  assert.ok(layoutPreview.groups.every((group) => group.href.startsWith(layoutPreview.workspaceHref)));
  assert.ok(layoutPreview.groups.every((group) => group.tabHref === group.href));
  assert.ok(layoutPreview.groups.every((group) => group.sections.every((section) => section.keepsTableFallback)));

  const layoutSource = readFileSync('lib/analytics/admin-analytics-layout.ts', 'utf8');
  assert.match(layoutSource, /tabbed_workspace_active/);
  assert.match(layoutSource, /groupHeadersEnabled: true/);
  assert.match(layoutSource, /collapsibleGroupsEnabled: true/);
  assert.match(layoutSource, /tabsEnabled: true/);
  assert.match(layoutSource, /requiresAccessibleTableFallbacks: true/);
  assert.match(layoutSource, /adminAnalyticsRangeQueryString/);
  assert.doesNotMatch(layoutSource, /localStorage|sessionStorage|cookies\(|PrismaClient|prisma\.|create\(|update\(|upsert\(|delete\(/);

  const layoutHeaderSource = readFileSync('components/admin/AdminAnalyticsLayoutGroupHeaders.tsx', 'utf8');
  assert.match(layoutHeaderSource, /id="analytics-layout-groups"/);
  assert.match(layoutHeaderSource, /Dashboard groups/);
  assert.match(layoutHeaderSource, /role="tablist"/);
  assert.match(layoutHeaderSource, /role="tab"/);
  assert.match(layoutHeaderSource, /<details/);
  assert.match(layoutHeaderSource, /<summary/);
  assert.match(layoutHeaderSource, /preview\.groups\.map/);
  assert.match(layoutHeaderSource, /preview\.rangeLabel/);
  assert.doesNotMatch(layoutHeaderSource, /useState|onClick|localStorage|sessionStorage|cookies\(/);

  const analyticsRouteSource = readFileSync('app/admin/analytics/page.tsx', 'utf8');
  assert.match(analyticsRouteSource, /activeTab="analytics"/);
  assert.match(analyticsRouteSource, /activeNavKey="analytics"/);
  assert.match(analyticsRouteSource, /buildAdminAnalyticsLayoutPreview\(analyticsRange\)/);
  assert.match(analyticsRouteSource, /AdminAnalyticsLayoutGroupHeaders preview=\{layoutPreview\}/);
  assert.match(analyticsRouteSource, /sectionHref\('analytics-layout-groups', analyticsRange\)/);
  assert.match(analyticsRouteSource, /orderRevenueSummaryService\.summary\(\{ analyticsRange \}\)/);
  assert.match(analyticsRouteSource, /siteAnalyticsSummaryService\.summary\(\{ analyticsRange \}\)/);
  assert.match(analyticsRouteSource, /id="analytics-section-index"/);
  assert.match(analyticsRouteSource, /id="analytics-privacy-retention"/);
  assert.match(analyticsRouteSource, /site-analytics-privacy-retention-policy\.md/);

  const guidancePanelSource = readFileSync('components/admin/AdminAnalyticsGuidancePanel.tsx', 'utf8');
  assert.match(guidancePanelSource, /id="analytics-guidance"/);
  assert.match(guidancePanelSource, /Production validation checklist/);
  assert.match(guidancePanelSource, /Analytics implementation status/);
  assert.match(guidancePanelSource, /Scheduled analytics reports/);
  assert.match(guidancePanelSource, /Saved dashboard views/);

  console.log('admin-page-shell-copy.test.ts passed');
}
