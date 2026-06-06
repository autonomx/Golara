import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

function source(path: string) {
  return readFileSync(path, 'utf8');
}

function walk(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    const stats = statSync(path);
    if (stats.isDirectory()) return walk(path);
    return [path.replace(/\\/g, '/')];
  });
}

function runRouteSmokeContractTests() {
  const smoke = source('tools/smoke-routes.mjs');
  const requiredRoutes = ['/', '/products', '/cart', '/account/login', '/sitemap.xml', '/robots.txt', '/account/orders'];
  for (const route of requiredRoutes) assert.match(smoke, new RegExp(`path: '${route.replace('/', '\\/')}'|path: '${route}'`));
  assert.match(smoke, /expectedStatuses/);
  assert.match(smoke, /expectedContent/);
  assert.match(smoke, /expectedAnyContent/);
  assert.match(smoke, /redirect: 'manual'/);
}

function isProtectedWriteRoute(content: string) {
  return /auth|admin|session|csrf|rate/i.test(content) || /verifyPaymentWebhookSignature/.test(content);
}

function runApiRouteInventoryTests() {
  const routeFiles = walk('app').filter((file) => file.endsWith('/route.ts') || file.endsWith('/route.tsx'));
  const unsafeWriteRoutes = routeFiles.filter((file) => {
    const content = source(file);
    return /export\s+async\s+function\s+(POST|PUT|PATCH|DELETE)\b/.test(content) && !isProtectedWriteRoute(content);
  });

  assert.deepEqual(unsafeWriteRoutes, [], `Write API routes should include visible auth/session/csrf/rate protections or webhook signature verification: ${unsafeWriteRoutes.join(', ')}`);
}

function runPaymentWebhookRouteContractTests() {
  const stripe = source('app/api/webhooks/payments/stripe/route.ts');
  const zarinpal = source('app/api/webhooks/payments/zarinpal/route.ts');

  for (const [provider, route] of [['stripe', stripe], ['zarinpal', zarinpal]] as const) {
    assert.match(route, /export async function POST/);
    assert.match(route, /request\.text\(\)/);
    assert.match(route, /verifyPaymentWebhookSignature/);
    assert.match(route, new RegExp(`provider: '${provider}'`));
    assert.match(route, /invalid_signature/);
    assert.match(route, /handlePaymentWebhookRoute/);
    assert.match(route, /paymentWebhookService\.record/);
  }
}

function runServerActionBoundaryTests() {
  const actionFiles = walk('app').filter((file) => /actions?\.ts$/.test(file));
  const expectedFiles = [
    'app/admin/order-actions.ts',
    'app/admin/settings/actions.ts'
  ];
  for (const file of expectedFiles) assert.ok(actionFiles.includes(file), `${file} should be covered as a server action module`);

  for (const file of actionFiles) {
    const content = source(file);
    assert.match(content, /'use server'|"use server"/, `${file} should declare server action mode`);
  }
}

function runPublicApiFallbackContractTests() {
  const publicInquiry = source('tests/unit/public-inquiry-service.test.ts');
  const checkout = source('tests/unit/checkout-state-machine.test.ts');
  const payment = source('tests/unit/payment-result-core.test.ts');
  const notifications = source('tests/unit/order-notification-actions-flow.test.ts');

  assert.match(publicInquiry, /runPublicInquiryServiceTests/);
  assert.match(checkout, /runCheckoutStateMachineTests/);
  assert.match(payment, /runPaymentResultCoreTests/);
  assert.match(notifications, /runOrderNotificationActionsFlowTests/);
}

function runApiSuiteScriptTests() {
  const pkg = source('package.json');
  assert.match(pkg, /"test:api":\s*"node --require \.\/tests\/setup\/server-only-register\.cjs --import tsx tests\/api\/run-tests\.ts"/);
  assert.match(pkg, /"test:all"/);
}

async function main() {
  runRouteSmokeContractTests();
  runApiRouteInventoryTests();
  runPaymentWebhookRouteContractTests();
  runServerActionBoundaryTests();
  runPublicApiFallbackContractTests();
  runApiSuiteScriptTests();
  console.log('api contract tests passed');
}

main().catch((error) => {
  console.error(error);
  throw error;
});
