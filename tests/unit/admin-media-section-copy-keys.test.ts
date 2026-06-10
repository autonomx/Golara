import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { getAdminCopy } from '@/lib/localization/admin-copy';

const MEDIA_SECTION_FILE = 'components/admin/AdminMediaSection.tsx';

function findTranslatorKeys(content: string) {
  const keys = new Set<string>();

  for (const match of content.matchAll(/\bt\('([^']+)'\)/g)) {
    keys.add(match[1] ?? '');
  }

  for (const match of content.matchAll(/\b(?:label|type): '([^']+)'/g)) {
    keys.add(match[1] ?? '');
  }

  return [...keys].filter(Boolean).sort();
}

export function runAdminMediaSectionCopyKeyTests() {
  const content = readFileSync(MEDIA_SECTION_FILE, 'utf8');
  const keys = findTranslatorKeys(content);
  const missingKeys = keys.filter((key) => getAdminCopy(key, 'fa-IR') === key);

  assert.deepEqual(
    missingKeys,
    [],
    `AdminMediaSection translator keys must have Persian dictionary entries. Missing keys:\n${missingKeys.join('\n')}`
  );

  console.log('admin-media-section-copy-keys.test.ts passed');
}
