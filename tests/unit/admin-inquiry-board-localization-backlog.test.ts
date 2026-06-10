import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';

const source = readFileSync('components/admin/InquiryBoard.tsx', 'utf8');

function assertIncludes(fragment: string) {
  assert.ok(source.includes(fragment), `Expected InquiryBoard source to include: ${fragment}`);
}

const remainingInlineCopy = [
  'Total inquiries',
  'Needs first review',
  'Ready to fulfill',
  'Closed',
  'Active pipeline',
  'Waiting on customer',
  'Search name, phone, email, notes, product...',
  'Assignment filter',
  'All owners',
  'Staff queue',
  'Owner queue'
];

assertIncludes("import { createAdminTranslator } from '@/lib/localization/admin-copy';");
assertIncludes("import { InquiryContactActions } from '@/components/admin/InquiryContactActions';");
assertIncludes("import { InquiryDeliveryBadge } from '@/components/admin/InquiryDeliveryBadge';");
assertIncludes("import { InquiryEmptyState } from '@/components/admin/InquiryEmptyState';");
assertIncludes("import { InquiryFollowUpSummary } from '@/components/admin/InquiryFollowUpSummary';");

for (const label of remainingInlineCopy) {
  assertIncludes(label);
}

console.log('admin inquiry board localization backlog guard passed');
