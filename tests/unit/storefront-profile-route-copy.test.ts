import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { getCustomerLocaleOptionLabel } from '@/lib/localization/customer-locale-options';
import { customerCopy } from '@/lib/localization/customer-copy';

const source = readFileSync('app/account/profile/page.tsx', 'utf8');
const allowlist = readFileSync('tests/fixtures/localization-source-audit-allowlist.txt', 'utf8');

function has(fragment: string) {
  assert.ok(source.includes(fragment), `Expected profile route source to include: ${fragment}`);
}

function lacks(fragment: string) {
  assert.ok(!source.includes(fragment), `Expected profile route source not to include: ${fragment}`);
}

function hasCustomerCopy(key: keyof typeof customerCopy.en) {
  assert.ok(customerCopy.en[key], `Expected English customer copy for ${key}`);
  assert.ok(customerCopy.fa[key], `Expected Persian customer copy for ${key}`);
}

for (const key of [
  'profile.eyebrow',
  'profile.title',
  'profile.subtitle',
  'profile.displayName',
  'profile.updateProfile',
  'profile.verifiedPhone',
  'profile.phoneDeferredNote',
  'profile.unavailableBody',
  'profile.status.updated',
  'profile.status.databaseRequired',
  'profile.status.failed',
  'common.accountOverview',
  'common.email',
  'common.locale'
] as const) {
  hasCustomerCopy(key);
}

assert.equal(getCustomerLocaleOptionLabel('fa-IR', 'en-CA'), 'Persian / Iran');
assert.equal(getCustomerLocaleOptionLabel('en-CA', 'en-CA'), 'English / Canada');
assert.equal(getCustomerLocaleOptionLabel('fa-IR', 'fa-IR'), 'فارسی / ایران');
assert.equal(getCustomerLocaleOptionLabel('en-CA', 'fa-IR'), 'انگلیسی / کانادا');
assert.ok(!allowlist.includes('app/account/profile/page.tsx'), 'profile route should not be source-audit allowlisted');

for (const fragment of [
  'resolveStorefrontLocale',
  'const storefrontLocale = await resolveStorefrontLocale();',
  'getCustomerCopyDirection(storefrontLocale)',
  'getCustomerCopy(key, storefrontLocale)',
  '<SiteHeader locale={storefrontLocale} />',
  'const locale = session.customer.locale;',
  'getCustomerCopyDirection(locale)',
  'getCustomerCopy(key, locale)',
  '<SiteHeader locale={locale} />',
  "if (status === 'updated') return 'profile.status.updated'",
  "if (status === 'database-required') return 'profile.status.databaseRequired'",
  "if (status === 'failed') return 'profile.status.failed'",
  "copy('profile.eyebrow')",
  "copy('profile.title')",
  "copy('profile.subtitle')",
  "copy('profile.unavailableBody')",
  "copy('profile.displayName')",
  "copy('common.email')",
  "copy('common.locale')",
  "copy('profile.verifiedPhone')",
  "copy('profile.phoneDeferredNote')",
  "copy('profile.updateProfile')",
  "copy('common.accountOverview')",
  'getCustomerLocaleOptionLabel',
  "localeOptionLabel('fa-IR')",
  "localeOptionLabel('en-CA')"
]) {
  has(fragment);
}

for (const fragment of ['Persian / Iran', 'English / Canada']) {
  lacks(fragment);
}

console.log('storefront profile route copy guard passed');
