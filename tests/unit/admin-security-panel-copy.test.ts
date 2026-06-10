import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { getAdminCopy } from '@/lib/localization/admin-copy';

const repoRoot = process.cwd();
const panelSource = readFileSync(join(repoRoot, 'components/admin/AdminSecurityPanel.tsx'), 'utf8');
const copySource = readFileSync(join(repoRoot, 'lib/localization/admin-copy.ts'), 'utf8');

const directKeys = [
  'Security',
  'OTP auth activity',
  'PII-safe summary of recent customer OTP request, delivery, and verification events. Raw phone numbers, IP addresses, user agents, and OTP codes are not shown.',
  'Database is not configured, so OTP security activity is unavailable in seeded preview mode.',
  'No recent hashed activity.',
  'Hash',
  'Events',
  'Generated',
  'Hashes are truncated for display; hover to inspect the full hash.'
];

for (const key of directKeys) {
  assert.ok(panelSource.includes(`t(${JSON.stringify(key)})`) || panelSource.includes(`t('${key.replace(/'/g, "\\'")}')`), `${key} must stay wrapped with the admin translator`);
  assert.ok(copySource.includes(`${JSON.stringify(key)}:`) || copySource.includes(`'${key.replace(/'/g, "\\'")}':`), `${key} must have Persian admin-copy coverage`);
  assert.notEqual(getAdminCopy(key, 'fa'), key, `${key} must resolve to Persian admin copy`);
}

const titledHashTables = ['Top phone hashes', 'Top IP hashes'];
for (const key of titledHashTables) {
  assert.ok(panelSource.includes(`title=${JSON.stringify(key)}`), `${key} must remain routed through HashTable title`);
  assert.ok(panelSource.includes('t(title)'), 'HashTable titles must stay wrapped with the admin translator');
  assert.notEqual(getAdminCopy(key, 'fa'), key, `${key} must resolve to Persian admin copy`);
}

const eventLabels = [
  'Requests allowed',
  'Requests blocked',
  'Delivery failures',
  'Verify failures',
  'Verify blocked',
  'Verify successes'
];
for (const key of eventLabels) {
  assert.ok(panelSource.includes(`${key}'`), `${key} must remain in the event-label map`);
}
assert.ok(panelSource.includes('t(EVENT_LABELS[eventType])'), 'event labels must stay wrapped with the admin translator');
assert.ok(panelSource.includes('createAdminTranslator(locale)'), 'security panel must create the admin translator from the provided locale');

const forbiddenRawJsx = [
  '>Security<',
  '>OTP auth activity<',
  '>No recent hashed activity.<',
  '>Hash<',
  '>Events<',
  '>Top phone hashes<',
  '>Top IP hashes<' 
];

for (const fragment of forbiddenRawJsx) {
  assert.ok(!panelSource.includes(fragment), `security panel must not render raw copy fragment ${fragment}`);
}

console.log('admin security panel copy guard passed');
