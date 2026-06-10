import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { getAdminCopy } from '@/lib/localization/admin-copy';
import { getAdminPageShellCopy } from '@/lib/localization/admin-page-shell-copy';

const COMPONENT_PATH = 'components/admin/AdminDashboardChrome.tsx';

function extractLiteralTranslatorKeys(source: string) {
  return Array.from(source.matchAll(/\bt\(\s*['"]([^'"]+)['"]\s*\)/g), (match) => match[1]).sort();
}

function unique(values: string[]) {
  return Array.from(new Set(values));
}

function translatedInPersian(key: string) {
  return getAdminCopy(key, 'fa-IR') !== key || getAdminPageShellCopy(key, 'fa-IR') !== key;
}

export function runAdminDashboardChromeCopyKeyTests() {
  const source = readFileSync(COMPONENT_PATH, 'utf8');
  const keys = unique(extractLiteralTranslatorKeys(source));
  const missing = keys.filter((key) => !translatedInPersian(key));

  assert.deepEqual(
    missing,
    [],
    `AdminDashboardChrome translator keys must have Persian admin dictionary coverage: ${missing.join(', ')}`
  );

  console.log('admin-dashboard-chrome-copy-keys.test.ts passed');
}
