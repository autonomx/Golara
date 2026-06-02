#!/usr/bin/env node

import { readFileSync } from 'node:fs';

const legacyAllowedViolations = new Set([
  'app/admin/actions.ts: must not import the Prisma client directly; route writes through lib/cms service wrappers',
  'app/admin/actions.ts: must not call prisma.* directly'
]);

const guardedActionFiles = [
  {
    path: 'app/admin/actions.ts',
    forbiddenImports: [
      {
        pattern: /import\s*\{[^}]*\bprisma\b[^}]*\}\s*from\s*['"]@\/lib\/prisma['"]/,
        message: 'must not import the Prisma client directly; route writes through lib/cms service wrappers'
      },
      {
        pattern: /from ['"]@\/lib\/admin-audit-log['"]/,
        message: 'must not import audit logging directly; service wrappers own audit payloads'
      }
    ],
    forbiddenReferences: [
      {
        pattern: /\bprisma\./,
        message: 'must not call prisma.* directly'
      },
      {
        pattern: /\brecordAdminAuditLog\b/,
        message: 'must not call recordAdminAuditLog directly'
      }
    ]
  },
  {
    path: 'app/admin/inquiry-actions.ts',
    forbiddenImports: [
      {
        pattern: /import\s*\{[^}]*\bprisma\b[^}]*\}\s*from\s*['"]@\/lib\/prisma['"]/,
        message: 'must not import the Prisma client directly; route writes through lib/cms service wrappers'
      },
      {
        pattern: /from ['"]@\/lib\/admin-audit-log['"]/,
        message: 'must not import audit logging directly; service wrappers own audit payloads'
      }
    ],
    forbiddenReferences: [
      {
        pattern: /\bprisma\./,
        message: 'must not call prisma.* directly'
      },
      {
        pattern: /\brecordAdminAuditLog\b/,
        message: 'must not call recordAdminAuditLog directly'
      }
    ]
  },
  {
    path: 'app/products/[slug]/actions.ts',
    forbiddenImports: [
      {
        pattern: /import\s*\{[^}]*\bprisma\b[^}]*\}\s*from\s*['"]@\/lib\/prisma['"]/,
        message: 'must not import the Prisma client directly; route writes through lib/inquiries service wrappers'
      },
      {
        pattern: /from ['"]@\/lib\/notifications\/inquiry-notifications['"]/,
        message: 'must not import inquiry notification delivery directly; public inquiry service owns notification dispatch'
      }
    ],
    forbiddenReferences: [
      {
        pattern: /\bprisma\./,
        message: 'must not call prisma.* directly'
      },
      {
        pattern: /\bnotifyNewInquiry\b/,
        message: 'must not call notifyNewInquiry directly'
      }
    ]
  }
];

const failures = [];
const allowedFailures = [];
for (const file of guardedActionFiles) {
  const source = readFileSync(file.path, 'utf8');
  for (const check of [...file.forbiddenImports, ...file.forbiddenReferences]) {
    if (!check.pattern.test(source)) continue;
    const failure = `${file.path}: ${check.message}`;
    if (legacyAllowedViolations.has(failure)) {
      allowedFailures.push(failure);
    } else {
      failures.push(failure);
    }
  }
}

if (failures.length > 0) {
  console.error('Action service-boundary check failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  if (allowedFailures.length > 0) {
    console.error('Allowed legacy violations were also present:');
    for (const failure of allowedFailures) console.error(`- ${failure}`);
  }
  process.exit(1);
}

if (allowedFailures.length > 0) {
  console.log('action service-boundary checks passed with legacy allowlist:');
  for (const failure of allowedFailures) console.log(`- ${failure}`);
} else {
  console.log(`action service-boundary checks passed (${guardedActionFiles.length} files)`);
}
