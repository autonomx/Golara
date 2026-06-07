import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

function source(path: string) {
  return readFileSync(path, 'utf8');
}

function pkgScripts() {
  return (JSON.parse(source('package.json')) as { scripts: Record<string, string> }).scripts;
}

function assertExists(path: string) {
  assert.equal(existsSync(path), true, `${path} should exist`);
}

function assertContains(path: string, markers: string[]) {
  const content = source(path);
  for (const marker of markers) assert.match(content, new RegExp(marker.replaceAll('+', '\\+')), `${path} should contain ${marker}`);
}

function runE2eSmokeRouteCoverageTests() {
  assertContains('tools/smoke-routes.mjs', ['homepage', 'product listing', 'account login', 'SMOKE_BASE_URL']);
}

function runE2eLocalHarnessTests() {
  assertContains('tools/run-smoke-routes-local.mjs', ['npm run smoke:routes', 'SMOKE_BASE_URL']);
}

function runE2eCriticalPathCoverageTests() {
  assertContains('tests/unit/run-tests.ts', ['runCheckoutStateMachineTests', 'runCheckoutPaymentProviderTests']);
  assertContains('tests/functional/run-tests.ts', ['runCheckoutPaymentFunctionalCoverageTests']);
  assertContains('tests/api/run-tests.ts', ['runApiRouteInventoryTests']);
}

function runE2ePaymentContractCoverageTests() {
  assertContains('lib/checkout/payment-result-core.ts', ['paid', 'failed', 'cancelled']);
  assertContains('app/api/webhooks/payments/stripe/route.ts', ['request.text', 'verifyPaymentWebhookSignature']);
  assertContains('app/api/webhooks/payments/zarinpal/route.ts', ['request.text', 'verifyPaymentWebhookSignature']);
}

function runE2eLifecycleDbHarnessContractTests() {
  const scripts = pkgScripts();
  assert.equal(scripts['test:e2e:lifecycle']?.includes('tests/e2e/lifecycle/run-tests.ts'), true);
  assertContains('tests/e2e/lifecycle/test-db.ts', ['assertSafeLifecycleDatabaseUrl', 'resetLifecycleDatabase']);
  assertContains('tests/e2e/lifecycle/run-tests.ts', ['resetLifecycleDatabase', 'runLifecycleServiceRepositoryScenario']);
}

function runE2eApiHarnessContractTests() {
  const scripts = pkgScripts();
  assert.equal(scripts['test:e2e:api']?.includes('tests/e2e/api/run-tests.ts'), true);
  assertContains('tests/e2e/api/run-tests.ts', ['prepareApiFixture', 'startNextServer', 'runPublicReadRouteTests', 'runCartBoundaryTests', 'runLocaleCurrencyMatrixTests', 'runCartCheckoutNegativeTests', 'runAccountWebhookNegativeTests', 'runAdminAuthBoundaryTests', 'runAdminExportBoundaryTests', 'runAdminBoundaryPostTests', 'runWebhookRouteTests']);
  assertContains('tests/e2e/api/shared.ts', ['E2E_DATABASE_URL', 'DATABASE_URL', 'CookieJar', 'submitServerAction']);
  assertContains('tests/e2e/api/storefront-account-tests.ts', ['API checkout action order', 'API E2E Inquiry Customer']);
  assertContains('tests/e2e/api/cart-boundary-tests.ts', ['api-e2e-zero-quantity-cart', 'api-e2e-remove-line-cart', 'api-e2e-unknown-cart-token', 'api-e2e-inactive-line-cart', 'API Boundary Deluxe']);
  assertContains('tests/e2e/api/locale-currency-tests.ts', ['api-e2e-locale-currency-cart', 'en-CA', 'CAD', 'API E2E Locale Customer', 'API E2E CAD checkout order']);
  assertContains('tests/e2e/api/cart-checkout-negative-tests.ts', ['API negative checkout should not create order', 'api-e2e-missing-phone-checkout-cart', 'api-e2e-invalid-delivery-date-cart', 'API inactive variant checkout should release cart', 'API insufficient stock checkout should release cart', 'API concurrent checkout guard', 'api-e2e-empty-checkout-cart']);
  assertContains('tests/e2e/api/account-webhook-negative-tests.ts', ['api-other-customer', 'api-e2e-logout-session-token', 'too_many_attempts', 'missing_or_expired', 'cs_api_e2e_unknown_reference', 'A000000000000000000000000gapapi']);
  assertContains('tests/e2e/api/admin-auth-boundary-tests.ts', ['tampered-admin-session-cookie', '/admin/products/export', '/admin/orders/csv']);
  assertContains('tests/e2e/api/admin-export-boundary-tests.ts', ['API-E2E-CSV-1001', 'CSV "Quoted", Customer', 'API CSV "Quoted", Bouquet']);
  assertContains('tests/e2e/api/admin-mutation-boundary-tests.ts', ['API-E2E-ADMIN-BOUNDARY-1001', 'missing-product-id', 'missing-variant-id']);
  assertContains('tests/e2e/api/admin-content-tests.ts', ['store-settings-updated', 'homepage-updated', 'media-created']);
  assertContains('tests/e2e/api/admin-catalog-tests.ts', ['API-E2E-PREMIUM-001', 'variant-location-stock-updated']);
  assertContains('tests/e2e/api/admin-order-tests.ts', ['API-E2E-ADMIN-EDIT-1001', 'manual-payment-refunded', 'API E2E admin discount clamp', "quantity', '0'"]);
  assertContains('tests/e2e/api/webhook-tests.ts', ['invalid_signature', 'duplicate', 'verified_paid', 'api-e2e-invalid-zarinpal-signature', 'evt_api_e2e_missing_reference', 'amount_mismatch', 'currency_mismatch']);
  assertContains('tests/e2e/api/boundary-tests.ts', ['invalid_code', 'expired-customer-session', 'failed_after_paid']);
}

function runE2eScriptContractTests() {
  const scripts = pkgScripts();
  assert.equal(scripts['test:e2e']?.includes('tests/e2e/run-tests.ts'), true);
  assert.equal(scripts['test:e2e:routes'], 'npm run smoke:routes:local');
  for (const path of [
    'tests/e2e/api/run-tests.ts',
    'tests/e2e/api/shared.ts',
    'tests/e2e/api/fixture.ts',
    'tests/e2e/api/storefront-account-tests.ts',
    'tests/e2e/api/cart-boundary-tests.ts',
    'tests/e2e/api/locale-currency-tests.ts',
    'tests/e2e/api/cart-checkout-negative-tests.ts',
    'tests/e2e/api/account-webhook-negative-tests.ts',
    'tests/e2e/api/admin-auth-boundary-tests.ts',
    'tests/e2e/api/admin-export-boundary-tests.ts',
    'tests/e2e/api/admin-mutation-boundary-tests.ts',
    'tests/e2e/api/admin-content-tests.ts',
    'tests/e2e/api/admin-catalog-tests.ts',
    'tests/e2e/api/admin-order-tests.ts',
    'tests/e2e/api/webhook-tests.ts',
    'tests/e2e/api/boundary-tests.ts',
    'tests/e2e/lifecycle/run-tests.ts',
    'tests/e2e/lifecycle/test-db.ts',
    'tools/smoke-routes.mjs',
    'tools/run-smoke-routes-local.mjs'
  ]) {
    assertExists(path);
  }
}

function main() {
  runE2eSmokeRouteCoverageTests();
  runE2eLocalHarnessTests();
  runE2eCriticalPathCoverageTests();
  runE2ePaymentContractCoverageTests();
  runE2eLifecycleDbHarnessContractTests();
  runE2eApiHarnessContractTests();
  runE2eScriptContractTests();
  console.log('e2e smoke tests passed');
}

main();
