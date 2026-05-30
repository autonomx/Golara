#!/usr/bin/env node

import { readFileSync } from 'node:fs';

const ADMIN_ACTIONS_PATH = 'app/admin/actions.ts';
const source = readFileSync(ADMIN_ACTIONS_PATH, 'utf8');

const forbiddenImports = [
  {
    pattern: /import\s*\{[^}]*\bprisma\b[^}]*\}\s*from\s*['"]@\/lib\/prisma['"]/,
    message: 'admin actions must not import the Prisma client directly; route writes through lib/cms service wrappers'
  },
  {
    pattern: /from ['"]@\/lib\/admin-audit-log['"]/,
    message: 'admin actions must not import audit logging directly; service wrappers own audit payloads'
  }
];

const forbiddenReferences = [
  {
    pattern: /\bprisma\./,
    message: 'admin actions must not call prisma.* directly'
  },
  {
    pattern: /\brecordAdminAuditLog\b/,
    message: 'admin actions must not call recordAdminAuditLog directly'
  }
];

const failures = [];
for (const check of [...forbiddenImports, ...forbiddenReferences]) {
  if (check.pattern.test(source)) failures.push(check.message);
}

if (failures.length > 0) {
  console.error(`Admin action service-boundary check failed for ${ADMIN_ACTIONS_PATH}:`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('admin action service-boundary checks passed');
