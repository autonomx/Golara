import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { getAdminCopy } from '@/lib/localization/admin-copy';

const PANEL_FILE = 'components/admin/AdminTranslationPanel.tsx';
const IMPLICIT_COMPLETION_KEYS = ['Missing', 'Draft', 'Complete', 'Needs copy'] as const;

function findLiteralTranslatorKeys(content: string) {
  const keys = new Set<string>();
  for (const match of content.matchAll(/\bt\('([^']+)'\)/g)) {
    keys.add(match[1] ?? '');
  }
  for (const key of IMPLICIT_COMPLETION_KEYS) {
    keys.add(key);
  }
  return [...keys].filter(Boolean).sort();
}

export function runAdminTranslationPanelCopyKeyTests() {
  const content = readFileSync(PANEL_FILE, 'utf8');
  const keys = findLiteralTranslatorKeys(content);
  const missingKeys = keys.filter((key) => getAdminCopy(key, 'fa-IR') === key);

  assert.deepEqual(
    missingKeys,
    [],
    `AdminTranslationPanel translator keys must have Persian dictionary entries. Missing keys:\n${missingKeys.join('\n')}`
  );

  console.log('admin-translation-panel-copy-keys.test.ts passed');
}
