import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { getAdminRouteErrorCopy } from '@/lib/localization/admin-route-error-copy';

const ADMIN_ROUTE_ERROR_SHELL_FILES = [
  'app/admin/error.tsx',
  'app/admin/categories/error.tsx',
  'app/admin/customers/error.tsx',
  'app/admin/discounts/error.tsx',
  'app/admin/inquiries/error.tsx',
  'app/admin/media/error.tsx',
  'app/admin/orders/error.tsx',
  'app/admin/products/error.tsx',
  'app/admin/settings/error.tsx'
] as const;

function extractAdminRouteErrorTitleKeys(file: string) {
  const content = readFileSync(file, 'utf8');
  return Array.from(content.matchAll(/<AdminRouteError\b[^>]*\btitle=([\'"])(.*?)\1/g)).map((match) => match[2] ?? '');
}

export function runAdminRouteErrorShellCopyKeyTests() {
  const missing = ADMIN_ROUTE_ERROR_SHELL_FILES.flatMap((file) =>
    extractAdminRouteErrorTitleKeys(file)
      .filter((key) => getAdminRouteErrorCopy(key, 'fa-IR') === key)
      .map((key) => `${file}: ${key}`)
  );

  assert.deepEqual(
    missing,
    [],
    `Admin route error shell titles must have Persian admin route-error copy entries.\n${missing.join('\n')}`
  );

  console.log('admin-route-error-shell-copy-keys.test.ts passed');
}
