import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { getAdminCopy } from '@/lib/localization/admin-copy';

const CATALOG_CONTROLS_FILE = 'components/admin/AdminCatalogControls.tsx';

function findTranslatorKeys(content: string) {
  const keys = new Set<string>();

  for (const match of content.matchAll(/\bt\('([^']+)'\)/g)) {
    keys.add(match[1] ?? '');
  }

  for (const match of content.matchAll(/\b(?:label|detail): '([^']+)'/g)) {
    keys.add(match[1] ?? '');
  }

  return [...keys].filter(Boolean).sort();
}

export function runAdminCatalogControlsCopyKeyTests() {
  const content = readFileSync(CATALOG_CONTROLS_FILE, 'utf8');
  const keys = findTranslatorKeys(content);
  const missingKeys = keys.filter((key) => getAdminCopy(key, 'fa-IR') === key);

  assert.deepEqual(
    missingKeys,
    [],
    `AdminCatalogControls translator keys must have Persian dictionary entries. Missing keys:\n${missingKeys.join('\n')}`
  );

  console.log('admin-catalog-controls-copy-keys.test.ts passed');
}
