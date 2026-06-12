import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const APP_API_ROOT = 'app/api';

const APPROVED_PUBLIC_API_ROUTES = new Set([
  'app/api/webhooks/payments/stripe/route.ts',
  'app/api/webhooks/payments/zarinpal/route.ts'
]);

const AUTH_BOUNDARY_MARKERS = [
  'assertAdminAuthenticated',
  'assertAdminRole',
  'assertSameOriginServerAction',
  'requireApiToken',
  'assertApiToken',
  'validateApiToken',
  'verifyApiToken',
  'verifyPaymentWebhookSignature'
];

function normalizePath(path: string) {
  return path.replace(/\\/g, '/');
}

function listApiRouteFiles(root = APP_API_ROOT): string[] {
  if (!existsSync(root)) return [];

  const results: string[] = [];
  const visit = (directory: string) => {
    for (const entry of readdirSync(directory)) {
      const path = join(directory, entry);
      const stats = statSync(path);
      if (stats.isDirectory()) {
        visit(path);
        continue;
      }
      if (entry === 'route.ts') results.push(normalizePath(path));
    }
  };

  visit(root);
  return results.sort();
}

function hasAuthBoundary(source: string) {
  return AUTH_BOUNDARY_MARKERS.some((marker) => source.includes(marker));
}

export async function runPublicApiAllowlistGateTests() {
  const routeFiles = listApiRouteFiles();
  assert.ok(routeFiles.length > 0, 'expected at least one app/api route to audit');

  const unexpectedPublicRoutes: string[] = [];
  const approvedRoutesMissingWebhookGuards: string[] = [];

  for (const routeFile of routeFiles) {
    const source = readFileSync(routeFile, 'utf8');
    if (APPROVED_PUBLIC_API_ROUTES.has(routeFile)) {
      if (!source.includes('validatePaymentWebhookRawBody') || !source.includes('verifyPaymentWebhookSignature')) {
        approvedRoutesMissingWebhookGuards.push(routeFile);
      }
      continue;
    }

    if (!hasAuthBoundary(source)) unexpectedPublicRoutes.push(routeFile);
  }

  assert.deepEqual(approvedRoutesMissingWebhookGuards, [], 'approved public webhook routes must keep raw body and signature guards');
  assert.deepEqual(
    unexpectedPublicRoutes,
    [],
    `new app/api routes must use an auth/same-origin/API-token boundary or be explicitly added to APPROVED_PUBLIC_API_ROUTES: ${unexpectedPublicRoutes.join(', ')}`
  );

  assert.deepEqual(
    [...APPROVED_PUBLIC_API_ROUTES].sort(),
    ['app/api/webhooks/payments/stripe/route.ts', 'app/api/webhooks/payments/zarinpal/route.ts'],
    'public API allowlist should stay narrow and reviewable'
  );

  console.log('public-api-allowlist-gate.test.ts passed');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runPublicApiAllowlistGateTests().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
