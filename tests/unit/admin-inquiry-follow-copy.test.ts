import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';

const source = readFileSync('components/admin/InquiryFollowUpSummary.tsx', 'utf8');

function assertIncludes(fragment: string) {
  assert.ok(source.includes(fragment), `Expected InquiryFollowUpSummary source to include: ${fragment}`);
}

function assertNotIncludes(fragment: string) {
  assert.ok(!source.includes(fragment), `Expected InquiryFollowUpSummary source not to include: ${fragment}`);
}

const englishCopy = ['Follow-ups', 'Latest', 'No follow-up activity yet.'];
const persianCopy = ['پیگیری‌ها', 'آخرین', 'هنوز هیچ فعالیت پیگیری ثبت نشده است.'];

assertIncludes("type AdminLocale = 'en' | 'fa';");
assertIncludes('const copy = {');
assertIncludes('const activeLocale = locale ?? await resolveStorefrontLocale();');
assertIncludes('const labels = copy[localeKey(activeLocale)];');
assertIncludes("new Intl.DateTimeFormat(localeKey(locale) === 'fa' ? 'fa-IR' : 'en-CA'");
assertIncludes('{labels.followUps}: {followUps.length}');
assertIncludes('{labels.latest} {formatDate(latest.createdAt, activeLocale)}');
assertIncludes('{labels.empty}');

for (const label of englishCopy) {
  assertIncludes(label);
}

for (const label of persianCopy) {
  assertIncludes(label);
}

assertNotIncludes('>Follow-ups<');
assertNotIncludes('>Latest<');
assertNotIncludes('>No follow-up activity yet.<');

console.log('admin inquiry follow-up copy guard passed');
