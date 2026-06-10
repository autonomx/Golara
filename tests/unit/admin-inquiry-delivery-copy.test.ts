import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync('components/admin/InquiryDeliveryBadge.tsx', 'utf8');

function assertContains(fragment: string) {
  assert.ok(source.includes(fragment), `Expected InquiryDeliveryBadge.tsx to include ${fragment}`);
}

function assertNotContains(fragment: string) {
  assert.ok(!source.includes(fragment), `Expected InquiryDeliveryBadge.tsx not to include ${fragment}`);
}

const copyKeys = ['noDate', 'past', 'today', 'inDay', 'inDays'] as const;

for (const key of copyKeys) {
  assertContains(`${key}:`);
}

assertContains("import { resolveStorefrontLocale } from '@/lib/i18n/resolve-locale';");
assertContains('const activeLocale = locale ?? await resolveStorefrontLocale();');
assertContains('const labels = copy[localeKey(locale)];');
assertContains("locale?.toLowerCase().startsWith('fa') ? 'fa' : 'en'");
assertContains('label: labels.noDate');
assertContains('label: labels.past');
assertContains('label: labels.today');
assertContains('label: labels.inDay(days)');
assertContains('label: labels.inDays(days)');

assertContains("noDate: 'No delivery date'");
assertContains("past: 'Past delivery date'");
assertContains("today: 'Due today'");
assertContains("inDay: (days: number) => `Due in ${days} day${days === 1 ? '' : 's'}`");
assertContains("inDays: (days: number) => `Due in ${days} days`");
assertContains("noDate: '\u0628\u062f\u0648\u0646 \u062a\u0627\u0631\u06cc\u062e \u062a\u062d\u0648\u06cc\u0644'");
assertContains("past: '\u062a\u0627\u0631\u06cc\u062e \u062a\u062d\u0648\u06cc\u0644 \u06af\u0630\u0634\u062a\u0647'");
assertContains("today: '\u0645\u0648\u0639\u062f \u0627\u0645\u0631\u0648\u0632'");

assertNotContains('>No delivery date<');
assertNotContains('>Past delivery date<');
assertNotContains('>Due today<');

console.log('admin inquiry delivery copy guard passed');
