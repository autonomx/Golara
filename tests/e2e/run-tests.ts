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
  const schema = source('prisma/schema.prisma');
  const runner = source('tests/e2e/lifecycle/run-tests.ts');
  const dbHarness = source('tests/e2e/lifecycle/test-db.ts');
  const catalogFixtures = source('tests/e2e/lifecycle/fixtures/catalog-fixtures.ts');
  const cartFixtures = source('tests/e2e/lifecycle/fixtures/cart-fixtures.ts');
  const customerFixtures = source('tests/e2e/lifecycle/fixtures/customer-fixtures.ts');
  const orderFixtures = source('tests/e2e/lifecycle/fixtures/order-fixtures.ts');
  const paymentFulfillmentFixtures = source('tests/e2e/lifecycle/fixtures/payment-fulfillment-fixtures.ts');
  const serviceLifecycleFixtures = [
    'tests/e2e/lifecycle/fixtures/service-lifecycle-fixtures.ts',
    'tests/e2e/lifecycle/fixtures/service-lifecycle-context.ts',
    'tests/e2e/lifecycle/fixtures/service-catalog-cart-flow.ts',
    'tests/e2e/lifecycle/fixtures/service-primary-order-flow.ts',
    'tests/e2e/lifecycle/fixtures/service-auth-stock-flow.ts',
    'tests/e2e/lifecycle/fixtures/service-cancellation-admin-flow.ts',
    'tests/e2e/lifecycle/fixtures/service-webhook-flow.ts'
  ].map(source).join('\n');

  assert.match(pkg, /"test:e2e:lifecycle":\s*"node --require \.\/tests\/setup\/server-only-register\.cjs --import tsx tests\/e2e\/lifecycle\/run-tests\.ts"/);
  assert.match(dbHarness, /E2E_DATABASE_URL/);
  assert.match(dbHarness, /skipping local database lifecycle E2E suite/);
  assert.match(runner, /resetLifecycleDatabase/);
  assert.match(runner, /SELECT 1 AS ok/);
  assert.match(runner, /createLifecycleChannel/);
  assert.match(runner, /createLifecycleCustomer/);
  assert.match(runner, /createLifecycleCartWithItem/);
  assert.match(runner, /createLifecycleCheckoutOrderFromCart/);
  assert.match(runner, /markLifecyclePaymentSucceeded/);
  assert.match(runner, /scheduleLifecycleFulfillment/);
  assert.match(runner, /runLifecycleServiceRepositoryScenario/);
  assert.match(runner, /must not match DATABASE_URL/);
  assert.match(runner, /reservedQuantity/);
  assert.match(dbHarness, /assertSafeLifecycleDatabaseUrl/);
  assert.match(dbHarness, /Refusing to run lifecycle E2E/);
  assert.match(dbHarness, /createLifecyclePrismaClient/);
  assert.match(dbHarness, /resetLifecycleDatabase/);
  assert.match(dbHarness, /postgresql?:/);
  assert.match(dbHarness, /golara_e2e/);
  assert.match(schema, /model CheckoutFulfillmentShipment/);
  assert.match(schema, /model PaymentSettlementReconciliation/);
  for (const marker of [
    'createLifecycleChannel',
    'createLifecycleCategory',
    'createLifecycleProductType',
    'createLifecycleProductWithVariantAndStock',
    'e2e-default',
    'e2e-roses',
    'E2E-ROSE-001-STANDARD'
  ]) {
    assert.match(catalogFixtures, new RegExp(marker));
  }
  for (const marker of ['createLifecycleCustomer', '+16045559001', 'customer.e2e@golara.test']) {
    assert.match(customerFixtures, new RegExp(marker.replace('+', '\\+')));
  }
  for (const marker of ['createLifecycleCartWithItem', 'e2e-cart-token', 'cartItem']) {
    assert.match(cartFixtures, new RegExp(marker));
  }
  for (const marker of [
    'createLifecycleCheckoutOrderFromCart',
    'E2E-ORDER-1001',
    'checkoutPaymentAttempt',
    'order.created',
    'inventoryStockReservation',
    'reservedQuantity'
  ]) {
    assert.match(orderFixtures, new RegExp(marker));
  }
  for (const marker of [
    'ensureLifecycleShipmentTable',
    'simulateLifecyclePaymentFailure',
    'markLifecyclePaymentSucceeded',
    'scheduleLifecycleFulfillment',
    'CheckoutFulfillmentShipment',
    'payment.failed',
    'payment.succeeded',
    'fulfillment.scheduled',
    'adminAuditLog',
    'fulfillmentMethodSetting',
    'fulfillmentCapacityReservation'
  ]) {
    assert.match(paymentFulfillmentFixtures, new RegExp(marker));
  }
  for (const marker of [
    'runLifecycleServiceRepositoryScenario',
    'addCartItem',
    'updateCartItem',
    'createOrderDraft',
    'createCheckoutPaymentAttempt',
    'reserveFulfillmentCapacity',
    'transitionCheckoutOrderStatus',
    'transitionCheckoutFulfillmentStatus',
    'createAdminFulfillmentShipment',
    'handlePaymentWebhookRoute',
    'recordPaymentWebhookEvent',
    'linkCustomerAccount',
    'createCustomerSession',
    'verifyCustomerOtp',
    'assignAdminOrderCustomer',
    'updateAdminOrderLineItemQuantity',
    'listAdminCheckoutOrderPage',
    'getAdminCheckoutOrder',
    'getAdminCustomerDetail',
    'markOrderManualPayment',
    'canTransitionCheckoutPaymentStatus',
    'checkoutAttemptStatusForResult',
    'clearCart',
    'hashCustomerSessionToken',
    'Insufficient inventory',
    'Insufficient fulfillment capacity',
    'Address does not belong',
    'before confirmation',
    'missing_or_expired',
    'too_many_attempts',
    'e2e-white-lily-bouquet',
    'e2e-boundary-stock',
    'e2e-non-tracked-stock',
    'e2e-race-stock',
    'Promise.allSettled',
    'e2e-cad-checkout',
    'en-CA',
    'CAD',
    'trackInventory: false',
    'to_regclass',
    'record should not be called for invalid payload',
    'duplicate',
    'verified_paid',
    'refunded',
    'cancelled',
    'released',
    'manual_pending',
    'pending_payment',
    'committed'
  ]) {
    assert.match(serviceLifecycleFixtures, new RegExp(marker));
  }
}

function runE2eApiHarnessContractTests() {
  const pkg = source('package.json');
  const apiRunner = source('tests/e2e/api/run-tests.ts');

  assert.match(pkg, /"test:e2e:api":\s*"node --require \.\/tests\/setup\/server-only-register\.cjs --import tsx tests\/e2e\/api\/run-tests\.ts"/);
  assert.match(apiRunner, /startNextServer/);
  assert.match(apiRunner, /E2E_DATABASE_URL/);
  assert.match(apiRunner, /DATABASE_URL/);
  assert.match(apiRunner, /CookieJar/);
  assert.match(apiRunner, /runPublicReadRouteTests/);
  assert.match(apiRunner, /runCartAndCheckoutPageTests/);
  assert.match(apiRunner, /runAccountAndAdminPageTests/);
  assert.match(apiRunner, /runOrderReturnRouteTests/);
  assert.match(apiRunner, /runWebhookRouteTests/);
  assert.match(apiRunner, /stripe-signature/);
  assert.match(apiRunner, /x-zarinpal-signature/);
  assert.match(apiRunner, /invalid_signature/);
  assert.match(apiRunner, /duplicate/);
  assert.match(apiRunner, /verified_paid/);
  assert.equal(existsSync('tests/e2e/api/run-tests.ts'), true);
}

function runE2eScriptContractTests() {
  const pkg = source('package.json');
  assert.match(pkg, /"test:e2e":\s*"node --require \.\/tests\/setup\/server-only-register\.cjs --import tsx tests\/e2e\/run-tests\.ts"/);
  assert.match(pkg, /"test:e2e:routes":\s*"npm run smoke:routes:local"/);
  assert.match(pkg, /"test:all"/);
  assert.equal(existsSync('tests/e2e/run-tests.ts'), true);
  assert.equal(existsSync('tests/e2e/lifecycle/run-tests.ts'), true);
  assert.equal(existsSync('tests/e2e/lifecycle/test-db.ts'), true);
  assert.equal(existsSync('tests/e2e/lifecycle/fixtures/catalog-fixtures.ts'), true);
  assert.equal(existsSync('tests/e2e/lifecycle/fixtures/cart-fixtures.ts'), true);
  assert.equal(existsSync('tests/e2e/lifecycle/fixtures/customer-fixtures.ts'), true);
  assert.equal(existsSync('tests/e2e/lifecycle/fixtures/order-fixtures.ts'), true);
  assert.equal(existsSync('tests/e2e/lifecycle/fixtures/payment-fulfillment-fixtures.ts'), true);
  assert.equal(existsSync('tests/e2e/lifecycle/fixtures/service-lifecycle-fixtures.ts'), true);
  assert.equal(existsSync('tests/e2e/lifecycle/fixtures/service-lifecycle-context.ts'), true);
  assert.equal(existsSync('tests/e2e/lifecycle/fixtures/service-catalog-cart-flow.ts'), true);
  assert.equal(existsSync('tests/e2e/lifecycle/fixtures/service-primary-order-flow.ts'), true);
  assert.equal(existsSync('tests/e2e/lifecycle/fixtures/service-auth-stock-flow.ts'), true);
  assert.equal(existsSync('tests/e2e/lifecycle/fixtures/service-cancellation-admin-flow.ts'), true);
  assert.equal(existsSync('tests/e2e/lifecycle/fixtures/service-webhook-flow.ts'), true);
}

async function main() {
  runE2eSmokeRouteCoverageTests();
  runE2eLocalHarnessTests();
  runE2eCriticalPathCoverageTests();
  runE2ePaymentContractCoverageTests();
  runE2eLifecycleDbHarnessContractTests();
  runE2eApiHarnessContractTests();
  runE2eScriptContractTests();
  console.log('e2e smoke tests passed');
}

main().catch((error) => {
  console.error(error);
  throw error;
});
