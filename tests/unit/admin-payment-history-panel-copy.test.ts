import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { getAdminCopy } from '@/lib/localization/admin-copy';

const repoRoot = process.cwd();
const panelSource = readFileSync(join(repoRoot, 'components/admin/AdminPaymentOperationHistoryPanel.tsx'), 'utf8');
const copySource = readFileSync(join(repoRoot, 'lib/localization/admin-copy.ts'), 'utf8');

const requiredKeys = [
  'Payments',
  'Read-only',
  'Requested by',
  'Created',
  'Last updated',
  'This panel does not render refund or void execution controls.'
];

for (const key of requiredKeys) {
  assert.ok(panelSource.includes(`t(${JSON.stringify(key)})`), `${key} must stay wrapped with the admin translator`);
  assert.ok(copySource.includes(`${JSON.stringify(key)}:`) || copySource.includes(`'${key.replace(/'/g, "\\'")}':`), `${key} must have Persian admin-copy coverage`);
  assert.notEqual(getAdminCopy(key, 'fa'), key, `${key} must resolve to Persian admin copy`);
}

assert.ok(panelSource.includes('createAdminTranslator(locale)'), 'payment history panel must create the admin translator from the provided locale');
assert.ok(panelSource.includes('t(view.heading)'), 'payment history heading must be translated from the view model');
assert.ok(panelSource.includes('t(view.summary)'), 'payment history summary must be translated from the view model');
assert.ok(panelSource.includes('t(summary.label)'), 'summary row labels must be translated');
assert.ok(panelSource.includes('t(filter.label)'), 'filter labels must be translated');
assert.ok(panelSource.includes('t(String(filter.value))'), 'filter values must be translated');
assert.ok(panelSource.includes('t(facet.label)'), 'facet labels must be translated');
assert.ok(panelSource.includes('t(row.statusLabel)'), 'row status labels must be translated');
assert.ok(panelSource.includes('t(detail.label)'), 'detail row labels must be translated');

const wrappedFragments = [
  'No payment operation records have been persisted for this order.',
  'This panel does not render refund or void execution controls.'
];

for (const fragment of wrappedFragments) {
  assert.ok(panelSource.includes(`t('${fragment}`), `payment history panel copy fragment must stay wrapped: ${fragment}`);
}

const forbiddenRawJsx = [
  '>Payments<',
  '>Read-only<',
  '>Requested by<',
  '>Created<',
  '>Last updated<',
  '>This panel does not render refund or void execution controls.<'
];

for (const fragment of forbiddenRawJsx) {
  assert.ok(!panelSource.includes(fragment), `payment history panel must not render raw copy fragment ${fragment}`);
}

console.log('admin payment history panel copy guard passed');
