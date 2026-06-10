import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { getAdminCopy } from '@/lib/localization/admin-copy';

const CATALOG_SHARED_CONTROLS_FILE = 'components/admin/AdminCatalogSharedControls.tsx';

function findTranslatorKeys(content: string) {
  const keys = new Set<string>();

  for (const match of content.matchAll(/\bt\('([^']+)'\)/g)) {
    keys.add(match[1] ?? '');
  }

  return [...keys].filter(Boolean).sort();
}

export function runAdminCatalogSharedControlsCopyKeyTests() {
  const content = readFileSync(CATALOG_SHARED_CONTROLS_FILE, 'utf8');
  const keys = findTranslatorKeys(content);
  const missingKeys = keys.filter((key) => getAdminCopy(key, 'fa-IR') === key);

  assert.deepEqual(
    missingKeys,
    [],
    `AdminCatalogSharedControls translator keys must have Persian dictionary entries. Missing keys:\n${missingKeys.join('\n')}`
  );

  console.log('admin-catalog-shared-controls-copy-keys.test.ts passed');
}
