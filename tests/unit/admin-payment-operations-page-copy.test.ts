import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { getAdminCopy } from '@/lib/localization/admin-copy';

const repoRoot = process.cwd();
const pageSource = readFileSync(join(repoRoot, 'app/admin/payments/operations/page.tsx'), 'utf8');
const copySource = readFileSync(join(repoRoot, 'lib/localization/admin-copy.ts'), 'utf8');

function assertAdminCopyKey(key: string) {
  assert.ok(
    copySource.includes(`${JSON.stringify(key)}:`) || copySource.includes(`'${key.replace(/'/g, "\\'")}':`),
    `${key} must have Persian admin-copy coverage`
  );
  assert.notEqual(getAdminCopy(key, 'fa'), key, `${key} must resolve to Persian admin copy`);
}

const routeCopyKeys = [
  'Admin / Payments',
  'Payment operations',
  'Read-only Phase 33 landing page for refund and void operation diagnostics. These links surface planning, history, and provider-readiness views without submitting refunds, void authorizations, provider requests, or order/payment mutations.',
  'Back to settlement',
  'Signed in as',
  'Admin authentication is required to view payment operation diagnostics.',
  'Admin authentication is not configured yet.',
  'Execution remains disabled. This page is navigation-only and does not call provider adapters, use Prisma, create operation records, mutate orders/payments, or release inventory/capacity.',
  'Read-only',
  'Provider readiness',
  'Review credential names, endpoint-mapping evidence, validation evidence, and manual-review provider state without provider calls or execution controls.',
  'Operation history',
  'Review migration-gated payment operation records for a specific order without creating records, executing adapters, or mutating order/payment state.',
  'Operation preview',
  'Inspect a static read-only refund/void planning sample without persistence, provider calls, or execution affordances.'
];

for (const key of routeCopyKeys) {
  assert.ok(pageSource.includes(`t(${JSON.stringify(key)})`) || pageSource.includes(`t('${key}`), `${key} must stay wrapped with the admin translator`);
  assertAdminCopyKey(key);
}

assert.ok(pageSource.includes('resolveStorefrontLocale()'), 'payment operations page must resolve the storefront locale');
assert.ok(pageSource.includes('createAdminTranslator(locale)'), 'payment operations page must create the admin translator from the resolved locale');
assert.ok(pageSource.includes('dir={getStorefrontCopyDirection(locale)}'), 'payment operations page must set document direction from the locale');
assert.ok(pageSource.includes('operationLinks.map'), 'payment operations route should keep operation cards data-driven');
assert.ok(pageSource.includes('t(link.label)'), 'operation card labels must stay translated from data keys');
assert.ok(pageSource.includes('t(link.description)'), 'operation card descriptions must stay translated from data keys');

const forbiddenRawJsx = [
  '>Admin / Payments<',
  '>Payment operations<',
  '>Back to settlement<',
  '>Read-only<',
  '>Provider readiness<',
  '>Operation history<',
  '>Operation preview<',
  '>Admin authentication is not configured yet.<'
];

for (const fragment of forbiddenRawJsx) {
  assert.ok(!pageSource.includes(fragment), `payment operations page must not render raw copy fragment ${fragment}`);
}

console.log('admin payment operations page copy guard passed');
