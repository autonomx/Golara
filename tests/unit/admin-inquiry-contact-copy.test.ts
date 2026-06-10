import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync('components/admin/InquiryContactActions.tsx', 'utf8');

function assertContains(fragment: string) {
  assert.ok(source.includes(fragment), `Expected InquiryContactActions.tsx to include ${fragment}`);
}

function assertNotContains(fragment: string) {
  assert.ok(!source.includes(fragment), `Expected InquiryContactActions.tsx not to include ${fragment}`);
}

const copyKeys = ['subjectPrefix', 'call', 'whatsapp', 'email'] as const;

for (const key of copyKeys) {
  assertContains(`${key}:`);
}

assertContains("import { resolveStorefrontLocale } from '@/lib/i18n/resolve-locale';");
assertContains('const activeLocale = locale ?? await resolveStorefrontLocale();');
assertContains('const labels = copy[localeKey(activeLocale)];');
assertContains('labels.subjectPrefix');
assertContains('labels.call');
assertContains('labels.whatsapp');
assertContains('labels.email');
assertContains("locale?.toLowerCase().startsWith('fa') ? 'fa' : 'en'");

assertContains("subjectPrefix: 'Golara inquiry'");
assertContains("call: 'Call'");
assertContains("whatsapp: 'WhatsApp'");
assertContains("email: 'Email'");
assertContains("subjectPrefix: '\u062f\u0631\u062e\u0648\u0627\u0633\u062a Golara'");
assertContains("call: '\u062a\u0645\u0627\u0633'");
assertContains("email: '\u0627\u06cc\u0645\u06cc\u0644'");

assertNotContains('>Call<');
assertNotContains('>Email<');

console.log('admin inquiry contact copy guard passed');
