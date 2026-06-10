import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { getAdminRouteErrorCopy } from '@/lib/localization/admin-route-error-copy';

const ROUTE_ERROR_COPY_FILE = 'lib/localization/admin-route-error-copy.ts';

function extractDictionaryBlock(content: string, name: 'en' | 'fa') {
  const match = content.match(new RegExp(`const ${name}[^=]*= \\{([\\s\\S]*?)\\n\\}`));
  assert.ok(match?.[1], `Expected ${name} dictionary block in ${ROUTE_ERROR_COPY_FILE}`);
  return match[1];
}

function extractDictionaryKeys(block: string) {
  return [...block.matchAll(/'([^']+)'\s*:/g)].map((match) => match[1] ?? '').filter(Boolean).sort();
}

export function runAdminRouteErrorCopyParityTests() {
  const content = readFileSync(ROUTE_ERROR_COPY_FILE, 'utf8');
  const englishKeys = extractDictionaryKeys(extractDictionaryBlock(content, 'en'));
  const persianKeys = extractDictionaryKeys(extractDictionaryBlock(content, 'fa'));

  assert.deepEqual(persianKeys, englishKeys, 'Admin route error Persian copy keys must match English keys.');

  const fallbackKeys = englishKeys.filter((key) => getAdminRouteErrorCopy(key, 'fa-IR') === key);
  assert.deepEqual(
    fallbackKeys,
    [],
    `Admin route error Persian copy must not fall back to English keys. Missing translations:\n${fallbackKeys.join('\n')}`
  );

  console.log('admin-route-error-copy-parity.test.ts passed');
}
