import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

type HeaderShape = {
  eyebrow?: string;
  title?: string;
  description?: string;
  action?: {
    href?: string;
    label?: string;
  };
};

const ADMIN_CONSOLE_PAGE = 'app/admin/AdminConsolePage.tsx';
const REQUIRED_HEADER_FIELDS = ['eyebrow', 'title', 'description'] as const;

function extractObjectLiteral(source: string, marker: string) {
  const markerIndex = source.indexOf(marker);
  assert.notEqual(markerIndex, -1, `${marker} should exist in ${ADMIN_CONSOLE_PAGE}`);

  const start = source.indexOf('{', markerIndex);
  assert.notEqual(start, -1, `${marker} should have an object literal`);

  let depth = 0;
  for (let index = start; index < source.length; index += 1) {
    const char = source[index];
    if (char === '{') depth += 1;
    if (char === '}') depth -= 1;
    if (depth === 0) return source.slice(start, index + 1);
  }

  throw new Error(`${marker} object literal should be balanced`);
}

function parseHeaderRecord(source: string, marker: string): Record<string, HeaderShape> {
  const literal = extractObjectLiteral(source, marker);
  return Function(`return (${literal});`)() as Record<string, HeaderShape>;
}

function assertCompleteHeaderMap(label: string, headers: Record<string, HeaderShape>) {
  for (const [key, header] of Object.entries(headers)) {
    for (const field of REQUIRED_HEADER_FIELDS) {
      assert.equal(typeof header[field], 'string', `${label}.${key}.${field} should be a string`);
      assert.ok(header[field]?.trim(), `${label}.${key}.${field} should not be empty`);
    }

    if (header.action) {
      assert.equal(typeof header.action.href, 'string', `${label}.${key}.action.href should be a string`);
      assert.ok(header.action.href?.trim(), `${label}.${key}.action.href should not be empty`);
      assert.equal(typeof header.action.label, 'string', `${label}.${key}.action.label should be a string`);
      assert.ok(header.action.label?.trim(), `${label}.${key}.action.label should not be empty`);
    }
  }
}

export function runAdminConsoleModuleHeaderCopyGuardTests() {
  const source = readFileSync(ADMIN_CONSOLE_PAGE, 'utf8');
  const englishHeaders = parseHeaderRecord(source, 'const en: Record<string, AdminModuleHeader> =');
  const persianHeaders = parseHeaderRecord(source, 'const fa: Record<string, AdminModuleHeader> =');

  assert.deepEqual(
    Object.keys(persianHeaders).sort(),
    Object.keys(englishHeaders).sort(),
    'AdminConsolePage module-header Persian copy should cover the same module keys as English copy.'
  );

  assertCompleteHeaderMap('en', englishHeaders);
  assertCompleteHeaderMap('fa', persianHeaders);

  for (const [key, englishHeader] of Object.entries(englishHeaders)) {
    const persianHeader = persianHeaders[key];
    assert.ok(persianHeader, `fa.${key} should exist`);
    assert.equal(
      Boolean(persianHeader.action),
      Boolean(englishHeader.action),
      `fa.${key}.action presence should match en.${key}.action`
    );
  }

  console.log('admin-console-module-header-copy-guard.test.ts passed');
}
