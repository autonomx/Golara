import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const pageSource = readFileSync('app/admin/payments/settlement/page.tsx', 'utf8');
const copySource = readFileSync('lib/localization/admin-copy.ts', 'utf8');

const labels = [
  'Admin / Payments',
  'Payment settlement',
  'Payment operations',
  'Provider readiness',
  'Operation history',
  'Preview operations',
  'Back to orders',
  'Signed in as',
  'Admin authentication is required to view settlement data.',
  'Admin authentication is not configured yet.'
];

assert.match(pageSource, /resolveStorefrontLocale\(\)/, 'expected route locale resolution');
assert.match(pageSource, /createAdminTranslator\(locale\)/, 'expected route translator');
assert.match(pageSource, /locale=\{locale\}/, 'expected localized admin shell');

for (const label of labels) {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  assert.match(pageSource, new RegExp(`t\\('${escaped}'\\)`), `expected translated source for ${label}`);
  assert.match(copySource, new RegExp(`'${escaped}':\\s*{\\s*en:\\s*'[^']+',\\s*fa:\\s*'[^']+'`), `expected bilingual copy for ${label}`);
}

for (const rawText of [
  '>Admin / Payments<',
  '>Payment settlement<',
  '>Payment operations<',
  '>Provider readiness<',
  '>Operation history<',
  '>Preview operations<',
  '>Back to orders<'
]) {
  assert.ok(!pageSource.includes(rawText), `expected no direct JSX text ${rawText}`);
}
