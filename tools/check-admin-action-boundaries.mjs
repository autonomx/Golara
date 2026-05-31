#!/usr/bin/env node

import { readFileSync } from 'node:fs';

const ADMIN_ACTION_PATHS = ['app/admin/actions.ts', 'app/admin/inquiry-actions.ts'];

const forbiddenImports = [
  {
    pattern: /import\s*\{[^}]*\bprisma\b[^}]*\}\s*from\s*['"]@\/lib\/prisma['"]/,
    message: 'must not import the Prisma client directly; route writes through lib/cms service wrappers'
  },
  {
    pattern: /from ['"]@\/lib\/admin-audit-log['"]/,
    message: 'must not import audit logging directly; service wrappers own audit payloads'
  }
];

const forbiddenReferences = [
  {
    pattern: /\bprisma\./,
    message: 'must not call prisma.* directly'
  },
  {
    pattern: /\brecordAdminAuditLog\b/,
    message: 'must not call recordAdminAuditLog directly'
  }
];

const failures = [];
for (const filePath of ADMIN_ACTION_PATHS) {
  const source = readFileSync(filePath, 'utf8');
  for (const check of [...forbiddenImports, ...forbiddenReferences]) {
    if (check.pattern.test(source)) failures.push(`${filePath}: ${check.message}`);
  }
}

if (failures.length > 0) {
  console.error('Admin action service-boundary check failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`admin action service-boundary checks passed (${ADMIN_ACTION_PATHS.length} files)`);
