import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { getAdminPageShellCopy } from '@/lib/localization/admin-page-shell-copy';

const PAGE_PATH = 'app/admin/AdminConsolePage.tsx';

function extractAdminTabCopy(source: string) {
  const adminTabsMatch = source.match(/const adminTabs = \[([\s\S]*?)\] as const;/);
  assert.ok(adminTabsMatch, 'AdminConsolePage should define the adminTabs array');

  const body = adminTabsMatch[1] ?? '';
  const values = Array.from(body.matchAll(/\b(?:label|description):\s*['"]([^'"]+)['"]/g), (match) => match[1]);
  return Array.from(new Set(values)).sort();
}

export function runAdminConsoleTabCopyKeyTests() {
  const source = readFileSync(PAGE_PATH, 'utf8');
  const keys = extractAdminTabCopy(source);
  const missing = keys.filter((key) => getAdminPageShellCopy(key, 'fa-IR') === key);

  assert.deepEqual(
    missing,
    [],
    `AdminConsolePage admin tab labels/descriptions must have Persian page-shell copy coverage: ${missing.join(', ')}`
  );

  console.log('admin-console-tab-copy-keys.test.ts passed');
}
