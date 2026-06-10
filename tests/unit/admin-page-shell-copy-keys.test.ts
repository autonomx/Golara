import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { getAdminPageShellCopy } from '@/lib/localization/admin-page-shell-copy';

const ADMIN_PAGE_SHELL_FILE = 'components/admin/AdminPageShell.tsx';

function findTranslatorKeys(content: string) {
  const keys = new Set<string>();

  for (const match of content.matchAll(/\bt\('([^']+)'\)/g)) {
    keys.add(match[1] ?? '');
  }

  for (const match of content.matchAll(/\b(?:label|description): '([^']+)'/g)) {
    keys.add(match[1] ?? '');
  }

  for (const match of content.matchAll(/\bnavLabels:\s*Record<AdminNavKey, string>\s*=\s*\{([\s\S]*?)\};/m)) {
    for (const valueMatch of (match[1] ?? '').matchAll(/:\s*'([^']+)'/g)) {
      keys.add(valueMatch[1] ?? '');
    }
  }

  return [...keys].filter(Boolean).sort();
}

export function runAdminPageShellCopyKeyTests() {
  const content = readFileSync(ADMIN_PAGE_SHELL_FILE, 'utf8');
  const keys = findTranslatorKeys(content);
  const missingKeys = keys.filter((key) => getAdminPageShellCopy(key, 'fa-IR') === key);

  assert.deepEqual(
    missingKeys,
    [],
    `AdminPageShell translator keys must have Persian dictionary entries. Missing keys:\n${missingKeys.join('\n')}`
  );

  console.log('admin-page-shell-copy-keys.test.ts passed');
}
