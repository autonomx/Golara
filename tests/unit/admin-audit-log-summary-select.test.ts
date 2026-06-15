import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { adminAuditLogSummaryExcludedFields, adminAuditLogSummarySelect } from '../../lib/admin/admin-audit-log-summary-select';

const selectedFields = Object.entries(adminAuditLogSummarySelect)
  .filter(([, selected]) => selected === true)
  .map(([field]) => field)
  .sort();

assert.deepEqual(selectedFields, [
  'action',
  'actorEmail',
  'actorLabel',
  'actorProvider',
  'actorRole',
  'createdAt',
  'entity',
  'entityId',
  'id',
  'summary'
]);

assert.deepEqual([...adminAuditLogSummaryExcludedFields].sort(), ['actorType', 'metadata']);

const source = readFileSync('lib/admin/admin-audit-log-summary-select.ts', 'utf8');
assert.match(source, /satisfies Prisma\.AdminAuditLogSelect/);
assert.doesNotMatch(source, /metadata:\s*true/);
assert.doesNotMatch(source, /actorType:\s*true/);
assert.match(source, /AdminAuditLogGetPayload/);

console.log('admin-audit-log-summary-select.test.ts passed');
