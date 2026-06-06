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

function hasWriteBoundaryProtection(content: string) {
  return /auth|session|admin|rate|csrf/i.test(content) || /verifyPaymentWebhookSignature/.test(content);
}

export async function runRouteHandlerContractTests() {
  const routes = walk('app').filter((file) => file.endsWith('/route.ts') || file.endsWith('/route.tsx'));
  assert.ok(routes.length > 0, 'route handler files should exist');

  for (const file of routes) {
    const content = source(file);
    assert.match(content, /export\s+async\s+function\s+(GET|POST|PUT|PATCH|DELETE)/, `${file} should export at least one route handler`);
    if (/export\s+async\s+function\s+(POST|PUT|PATCH|DELETE)/.test(content)) {
      assert.ok(hasWriteBoundaryProtection(content), `${file} write handler should include visible boundary protection or webhook signature verification`);
    }
  }

  const smoke = source('tools/smoke-routes.mjs');
  for (const path of ['/', '/products', '/cart', '/account/login', '/account/orders', '/sitemap.xml', '/robots.txt']) {
    assert.match(smoke, new RegExp(`path: '${path.replace('/', '\\/')}'|path: '${path}'`));
  }

  console.log('route-handler-contracts.test.ts passed');
}
