import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { getAdminCopy } from '@/lib/localization/admin-copy';

const CATEGORY_SECTION_FILE = 'components/admin/AdminCategorySection.tsx';

function findTranslatorKeys(content: string) {
  const keys = new Set<string>();

  for (const match of content.matchAll(/\bt\('([^']+)'\)/g)) {
    keys.add(match[1] ?? '');
  }

  return [...keys].filter(Boolean).sort();
}

export function runAdminCategorySectionCopyKeyTests() {
  const content = readFileSync(CATEGORY_SECTION_FILE, 'utf8');
  const keys = findTranslatorKeys(content);
  const missingKeys = keys.filter((key) => getAdminCopy(key, 'fa-IR') === key);

  assert.deepEqual(
    missingKeys,
    [],
    `AdminCategorySection translator keys must have Persian dictionary entries. Missing keys:\n${missingKeys.join('\n')}`
  );

  console.log('admin-category-section-copy-keys.test.ts passed');
}
