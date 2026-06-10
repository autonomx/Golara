import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { getAdminCopy } from '@/lib/localization/admin-copy';

const HOMEPAGE_SECTION_FILE = 'components/admin/AdminHomepageSection.tsx';

function findLiteralTranslatorKeys(content: string) {
  const keys = new Set<string>();
  for (const match of content.matchAll(/\bt\('([^']+)'\)/g)) {
    keys.add(match[1] ?? '');
  }
  return [...keys].filter(Boolean).sort();
}

export function runAdminHomepageSectionCopyKeyTests() {
  const content = readFileSync(HOMEPAGE_SECTION_FILE, 'utf8');
  const keys = findLiteralTranslatorKeys(content);
  const missingKeys = keys.filter((key) => getAdminCopy(key, 'fa-IR') === key);

  assert.deepEqual(
    missingKeys,
    [],
    `AdminHomepageSection translator keys must have Persian dictionary entries. Missing keys:\n${missingKeys.join('\n')}`
  );

  console.log('admin-homepage-section-copy-keys.test.ts passed');
}
