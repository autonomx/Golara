import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { createAdminTranslator } from '@/lib/localization/admin-copy';

const source = readFileSync('app/admin/payments/alerts/page.tsx', 'utf8');

const keys = [
  'Admin / Payments',
  'Webhook alerts',
  'Review payment webhook events that need operator attention, retries, or provider dashboard follow-up.',
  'Settlement',
  'Back to orders',
  'Signed in as',
  'Admin authentication is required to view webhook alerts.',
  'Admin authentication is not configured yet.'
];

assert.match(source, /resolveStorefrontLocale\(\)/, 'expected storefront locale resolution');
assert.match(source, /createAdminTranslator\(locale\)/, 'expected admin translator creation');

for (const key of keys) {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  assert.match(source, new RegExp(`t\\('${escaped}'\\)`), `expected translated usage for ${key}`);
}

for (const rawText of [
  '>Admin / Payments<',
  '>Webhook alerts<',
  '>Review payment webhook events that need operator attention, retries, or provider dashboard follow-up.<',
  '>Settlement<',
  '>Back to orders<',
  '>Admin authentication is required to view webhook alerts.<',
  '>Admin authentication is not configured yet.<'
]) {
  assert.ok(!source.includes(rawText), `expected no direct JSX text ${rawText}`);
}

for (const locale of ['en', 'fa'] as const) {
  const t = createAdminTranslator(locale);

  for (const key of keys) {
    assert.notEqual(t(key), key, `expected ${locale} dictionary entry for ${key}`);
    assert.ok(t(key).trim().length > 0, `expected non-empty ${locale} value for ${key}`);
  }
}
