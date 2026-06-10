import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';

const source = readFileSync('components/admin/InquiryEmptyState.tsx', 'utf8');

function assertIncludes(fragment: string) {
  assert.ok(source.includes(fragment), `Expected InquiryEmptyState source to include: ${fragment}`);
}

function assertNotIncludes(fragment: string) {
  assert.ok(!source.includes(fragment), `Expected InquiryEmptyState source not to include: ${fragment}`);
}

const englishCopy = [
  'assigned to you',
  'assigned to another owner',
  'without an owner',
  'No inquiries match this view.',
  'No customer inquiries yet.',
  'Try clearing the search or switching to another status filter.',
  'New product inquiries will appear here after customers submit the inquiry form.',
  'Clear assignment filter',
  'Clear all inquiry filters'
];

const persianCopy = [
  'اختصاص‌یافته به شما',
  'اختصاص‌یافته به مالک دیگر',
  'بدون مالک',
  'هیچ درخواستی با این نما مطابق نیست.',
  'هنوز هیچ درخواست مشتری ثبت نشده است.',
  'جستجو را پاک کنید یا وضعیت دیگری را انتخاب کنید.',
  'درخواست‌های جدید محصول پس از ارسال فرم توسط مشتریان اینجا نمایش داده می‌شوند.',
  'پاک کردن فیلتر مالک',
  'پاک کردن همه فیلترهای درخواست'
];

assertIncludes("type AdminLocale = 'en' | 'fa';");
assertIncludes('const copy: Record<AdminLocale, InquiryEmptyStateCopy>');
assertIncludes('const activeLocale = locale ?? await resolveStorefrontLocale();');
assertIncludes('const labels = copy[localeKey(activeLocale)];');
assertIncludes('function assignmentLabel(assignmentFilter: InquiryAssignmentQueueFilter | undefined, labels: InquiryEmptyStateCopy)');
assertIncludes('labels.noMatchingAssignment(assignment)');
assertIncludes('{hasFilters ? labels.noMatches : labels.noInquiries}');
assertIncludes('{labels.clearAssignment}');
assertIncludes('{labels.clearAll}');

for (const label of englishCopy) {
  assertIncludes(label);
}

for (const label of persianCopy) {
  assertIncludes(label);
}

assertNotIncludes('>No inquiries match this view.<');
assertNotIncludes('>No customer inquiries yet.<');
assertNotIncludes('>Clear assignment filter<');
assertNotIncludes('>Clear all inquiry filters<');

console.log('admin inquiry empty-state copy guard passed');
