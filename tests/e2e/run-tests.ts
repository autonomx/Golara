import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

function source(path: string) {
  return readFileSync(path, 'utf8');
}

function runE2eSmokeRouteCoverageTests() {
  const smoke = source('tools/smoke-routes.mjs');
  const routes = [
    { path: '/', purpose: 'homepage loads public catalog shell' },
    { path: '/products', purpose: 'product listing loads' },
    { path: '/cart', purpose: 'cart loads' },
    { path: '/account/login', purpose: 'customer login loads' },
    { path: '/account/orders', purpose: 'protected customer orders handles unauthenticated users' },
    { path: '/sitemap.xml', purpose: 'SEO sitemap responds' },
    { path: '/robots.txt', purpose: 'robots metadata responds' }
  ];

  for (const route of routes) {
    assert.match(smoke, new RegExp(`path: '${route.path.replace('/', '\\/')}'|path: '${route.path}'`), `${route.path} should be covered: ${route.purpose}`);
  }
  assert.match(smoke, /SMOKE_BASE_URL/);
  assert.match(smoke, /SMOKE_TIMEOUT_MS/);
  assert.match(smoke, /All \$\{results\.length\} smoke route checks passed/);
}

function runE2eLocalHarnessTests() {
  const localHarness = source('tools/run-smoke-routes-local.mjs');
  assert.match(localHarness, /npm.*run.*dev|next dev|spawn/);
  assert.match(localHarness, /npm run smoke:routes/);
  assert.match(localHarness, /SMOKE_BASE_URL/);
}

function runE2eCriticalPathCoverageTests() {
  const unitRunner = source('tests/unit/run-tests.ts');
  const functionalRunner = source('tests/functional/run-tests.ts');
  const apiRunner = source('tests/api/run-tests.ts');
  const smoke = source('tools/smoke-routes.mjs');

  const criticalUnitGuards = [
    'runCheckoutStateMachineTests',
    'runCheckoutPaymentProviderTests',
    'runPublicInquiryServiceTests',
    'runAdminAuthCoreTests',
    'runAdminModuleAccessTests',
    'runOrderNotificationActionsFlowTests',
    'runLaunchReadinessHealthTests'
  ];
  for (const guard of criticalUnitGuards) assert.match(unitRunner, new RegExp(guard));

  assert.match(functionalRunner, /runAdminOverviewFunctionalCoverageTests/);
  assert.match(functionalRunner, /runCheckoutPaymentFunctionalCoverageTests/);
  assert.match(functionalRunner, /runMigrationCoverageFunctionalTests/);
  assert.match(apiRunner, /runServerActionBoundaryTests/);
  assert.match(apiRunner, /runApiRouteInventoryTests/);
  assert.match(apiRunner, /runPaymentWebhookRouteContractTests/);
  assert.match(smoke, /homepage/);
  assert.match(smoke, /product listing/);
  assert.match(smoke, /account login/);
}

function runE2ePaymentContractCoverageTests() {
  const returnCore = source('lib/checkout/order-return-route-core.ts');
  const paymentResult = source('lib/checkout/payment-result-core.ts');
  const stripeWebhook = source('app/api/webhooks/payments/stripe/route.ts');
  const zarinpalWebhook = source('app/api/webhooks/payments/zarinpal/route.ts');
  const providerReadinessPage = source('app/admin/payments/operations/providers/page.tsx');

  for (const marker of ['normalizeHostedCheckoutReturnStatus', 'cancelled', 'checkout_session_id', 'checkoutReturnSuccessUrl']) assert.match(returnCore, new RegExp(marker));
  for (const marker of ['paid', 'failed', 'cancelled']) assert.match(paymentResult, new RegExp(marker));
  for (const route of [stripeWebhook, zarinpalWebhook]) {
    assert.match(route, /request\.text\(\)/);
    assert.match(route, /verifyPaymentWebhookSignature/);
    assert.match(route, /handlePaymentWebhookRoute/);
  }
  for (const marker of ['AdminPaymentOperationProviderReadinessPanel', 'Execution remains disabled', 'order/payment mutations']) assert.match(providerReadinessPage, new RegExp(marker));
}

function runE2eLifecycleDbHarnessContractTests() {
  const pkg = source('package.json');
  const runner = source('tests/e2e/lifecycle/run-tests.ts');
  const dbHarness = source('tests/e2e/lifecycle/test-db.ts');

  assert.match(pkg, /"test:e2e:lifecycle":\s*"node --require \.\/tests\/setup\/server-only-register\.cjs --import tsx tests\/e2e\/lifecycle\/run-tests\.ts"/);
  assert.match(dbHarness, /E2E_DATABASE_URL/);
  assert.match(dbHarness, /skipping local database lifecycle E2E suite/);
  assert.match(runner, /resetLifecycleDatabase/);
  assert.match(runner, /SELECT 1 AS ok/);
  assert.match(dbHarness, /assertSafeLifecycleDatabaseUrl/);
  assert.match(dbHarness, /Refusing to run lifecycle E2E/);
  assert.match(dbHarness, /createLifecyclePrismaClient/);
  assert.match(dbHarness, /resetLifecycleDatabase/);
  assert.match(dbHarness, /postgresql?:/);
  assert.match(dbHarness, /golara_e2e/);
}

function runE2eScriptContractTests() {
  const pkg = source('package.json');
  assert.match(pkg, /"test:e2e":\s*"node --require \.\/tests\/setup\/server-only-register\.cjs --import tsx tests\/e2e\/run-tests\.ts"/);
  assert.match(pkg, /"test:e2e:routes":\s*"npm run smoke:routes:local"/);
  assert.match(pkg, /"test:all"/);
  assert.equal(existsSync('tests/e2e/run-tests.ts'), true);
  assert.equal(existsSync('tests/e2e/lifecycle/run-tests.ts'), true);
  assert.equal(existsSync('tests/e2e/lifecycle/test-db.ts'), true);
}

async function main() {
  runE2eSmokeRouteCoverageTests();
  runE2eLocalHarnessTests();
  runE2eCriticalPathCoverageTests();
  runE2ePaymentContractCoverageTests();
  runE2eLifecycleDbHarnessContractTests();
  runE2eScriptContractTests();
  console.log('e2e smoke tests passed');
}

main().catch((error) => {
  console.error(error);
  throw error;
});
