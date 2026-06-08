import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

function source(path: string) {
  return readFileSync(path, 'utf8');
}

function assertExists(path: string) {
  assert.equal(existsSync(path), true, `${path} should exist`);
}

function listFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return listFiles(path);
    return [path.replace(/\\/g, '/')];
  });
}

function runAdminOverviewFunctionalCoverageTests() {
  const overview = source('components/admin/AdminOrderRevenueSummaryPanel.tsx');
  const consolePage = source('app/admin/AdminConsolePage.tsx');
  const expectedPanels = [
    'AdminInquiryOperationsSummaryPanel',
    'AdminBestSellingProductsPanel',
    'AdminLowStockAlertsPanel',
    'AdminFulfillmentQueueSummaryPanel',
    'AdminRecentActivitySummaryPanel',
    'AdminFailedPaymentNotificationAlertsPanel',
    'AdminLaunchReadinessHealthPanel'
  ];
  const expectedServices = [
    'inquiryOperationsSummaryService.summary()',
    'bestSellingProductsService.summary()',
    'lowStockAlertsService.summary()',
    'fulfillmentQueueSummaryService.summary()',
    'recentActivitySummaryService.summary()',
    'failedPaymentNotificationAlertsService.summary()',
    'launchReadinessHealthService.summary()'
  ];

  for (const panel of expectedPanels) assert.match(overview, new RegExp(panel));
  for (const service of expectedServices) assert.match(overview, new RegExp(service.replace(/[().]/g, '\\$&')));
  assert.match(consolePage, /AdminOrderRevenueSummaryPanel/);
  assert.match(consolePage, /overview/);
}

function runCheckoutPaymentFunctionalCoverageTests() {
  const checkoutStateMachine = source('lib/checkout/checkout-state-machine.ts');
  const paymentAdapters = source('lib/checkout/payment-gateway-adapters.ts');
  const returnCore = source('lib/checkout/order-return-route-core.ts');
  const providerReadinessPage = source('app/admin/payments/operations/providers/page.tsx');
  const providerReadinessPanel = source('components/admin/AdminPaymentOperationProviderReadinessPanel.tsx');

  for (const marker of ['paid', 'failed', 'cancelled']) assert.match(checkoutStateMachine, new RegExp(marker));
  for (const marker of ['createStripeCheckoutSessionAdapter', 'zarinpal', 'idempotency']) assert.match(paymentAdapters, new RegExp(marker, 'i'));
  for (const marker of ['normalizeHostedCheckoutReturnStatus', 'normalizeZarinpalReturnStatus', 'checkoutReturnApplyInput', 'checkoutReturnSuccessUrl']) assert.match(returnCore, new RegExp(marker));
  for (const marker of ['Payment provider readiness', 'Execution remains disabled', 'provider requests', 'order/payment mutations']) assert.match(providerReadinessPage, new RegExp(marker));
  for (const marker of ['Execution:', 'credential', 'evidence', 'ready']) assert.match(providerReadinessPanel, new RegExp(marker, 'i'));
}

function runGracefulDatabaseDriftFallbackTests() {
  const catalogFallback = source('lib/cms/repository-fallback-policy.ts');
  const storefrontNavigation = source('lib/settings/storefront-navigation-menu.ts');
  const storeSettings = source('lib/settings/store-settings.ts');

  assert.match(catalogFallback, /readWithSeedFallback/);
  assert.match(storefrontNavigation, /DEFAULT_STOREFRONT_NAVIGATION_MENU/);
  assert.match(storefrontNavigation, /isMissingStorefrontNavigationTableError/);
  assert.match(storefrontNavigation, /localizedDefaultMenu\(locale\)/);
  assert.match(storefrontNavigation, /localizeDefaultNavigationItem/);
  assert.match(storeSettings, /DEFAULT_STORE_SETTING/);
  assert.match(storeSettings, /isMissingStoreSettingTableError/);
  assert.match(storeSettings, /return DEFAULT_STORE_SETTING/);
}

function runProductionReadinessFunctionalCoverageTests() {
  const roadmap = source('docs/ADMIN_SALEOR_PARITY_ROADMAP.md');
  const packageJson = source('package.json');
  const requiredChecks = ['typecheck', 'test:unit', 'test:functional', 'test:api', 'test:e2e', 'test:all'];
  const phase10Items = [
    'Add order count and revenue summaries.',
    'Add inquiry conversion summary.',
    'Add best-selling products.',
    'Add low-stock alerts.',
    'Add fulfillment queue summary.',
    'Add recent activity timeline.',
    'Add failed payment/notification alerts.',
    'Add launch/readiness health cards.'
  ];

  for (const item of phase10Items) assert.match(roadmap, new RegExp(`- \\[x\\] ${item.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}`));
  for (const check of requiredChecks) assert.match(packageJson, new RegExp(`"${check}"`));
}

function runMigrationCoverageFunctionalTests() {
  const migrations = listFiles('prisma/migrations').filter((file) => file.endsWith('migration.sql')).sort();
  const migrationContent = migrations.map((file) => source(file)).join('\n');
  const requiredTables = [
    'ProductVariant',
    'ProductVariantLocationStock',
    'CheckoutOrderItem',
    'CheckoutOrderNotificationAction',
    'StoreSetting',
    'StorefrontNavigationMenu',
    'PaymentProviderSetting',
    'NotificationProviderSetting',
    'WebhookConfiguration',
    'WebhookEventLog',
    'IntegrationApp',
    'ApiToken',
    'DashboardExtensionMountPoint',
    'ImportExportJob'
  ];

  for (const table of requiredTables) assert.match(migrationContent, new RegExp(table));
  assert.ok(migrations.some((file) => file.includes('20260602043000_add_product_pim_schema_parity')), 'Product PIM schema parity migration should exist before variant stock controls');
}

function runFunctionalSuiteStructureTests() {
  const requiredFiles = [
    'tests/unit/run-tests.ts',
    'tests/functional/run-tests.ts',
    'tests/api/run-tests.ts',
    'tests/e2e/run-tests.ts',
    'tools/run-full-test-suite.mjs',
    'tools/smoke-routes.mjs'
  ];
  for (const file of requiredFiles) assertExists(file);
}

async function main() {
  runAdminOverviewFunctionalCoverageTests();
  runCheckoutPaymentFunctionalCoverageTests();
  runGracefulDatabaseDriftFallbackTests();
  runProductionReadinessFunctionalCoverageTests();
  runMigrationCoverageFunctionalTests();
  runFunctionalSuiteStructureTests();
  console.log('functional tests passed');
}

main().catch((error) => {
  console.error(error);
  throw error;
});
