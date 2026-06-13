import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const diagnosticPages = [
  'app/admin/payments/operations/page.tsx',
  'app/admin/payments/operations/providers/page.tsx',
  'app/admin/payments/operations/history/page.tsx',
  'app/admin/payments/operations/preview/page.tsx'
];

function assertOwnerOnlyDiagnosticPage(path: string) {
  const source = readFileSync(path, 'utf8');
  assert.match(source, /import\s+\{[^}]*assertAdminRole[^}]*\}\s+from\s+'@\/lib\/admin-auth'/, `${path} should import assertAdminRole`);
  assert.match(source, /await\s+assertAdminRole\('owner'\)/, `${path} should require the owner role before rendering diagnostics`);
  assert.doesNotMatch(source, /isAdminAuthenticated\(/, `${path} should not rely on generic admin authentication for diagnostics`);
  assert.doesNotMatch(source, /authenticated\s*\?/, `${path} should not conditionally render diagnostics for any authenticated admin`);
}

export async function runAdminDiagnosticsOwnerGateTests() {
  for (const page of diagnosticPages) {
    assertOwnerOnlyDiagnosticPage(page);
  }
  console.log('admin-diagnostics-owner-gate.test.ts passed');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runAdminDiagnosticsOwnerGateTests().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
