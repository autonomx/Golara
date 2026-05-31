import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function readSource(path: string) {
  return readFileSync(path, 'utf8');
}

function assertExportsRequireRole(source: string, role: 'owner' | 'staff', exportNames: string[]) {
  for (const exportName of exportNames) {
    const pattern = new RegExp(`export\\s+async\\s+function\\s+${exportName}\\b[\\s\\S]*?assertAdminRole\\('${role}'\\)`, 'm');
    assert.match(source, pattern, `${exportName} must require ${role} role`);
  }
}

function assertSourceDoesNotRequireRole(source: string, role: 'owner' | 'staff', context: string) {
  assert.doesNotMatch(source, new RegExp(`assertAdminRole\\('${role}'\\)`), `${context} must not require ${role} role`);
}

export async function runAdminRoleBoundaryTests() {
  const cmsActions = readSource('app/admin/actions.ts');
  const inquiryActions = readSource('app/admin/inquiry-actions.ts');

  assert.match(cmsActions, /async function ensureCanWriteCms\(\)[\s\S]*?assertAdminRole\('owner'\)/);
  assertSourceDoesNotRequireRole(cmsActions, 'staff', 'CMS catalog/homepage/media action file');

  assertExportsRequireRole(inquiryActions, 'staff', ['saveInquiryAction', 'addInquiryFollowUpAction']);
  assertSourceDoesNotRequireRole(inquiryActions, 'owner', 'inquiry action file');

  console.log('admin-role-boundary.test.ts passed');
}
