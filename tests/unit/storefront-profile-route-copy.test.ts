import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { customerCopy } from '@/lib/localization/customer-copy';

const source = readFileSync('app/account/profile/page.tsx', 'utf8');

function has(fragment: string) {
  assert.ok(source.includes(fragment), `Expected profile route source to include: ${fragment}`);
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
  "copy('common.accountOverview')"
]) {
  has(fragment);
}

console.log('storefront profile route copy guard passed');
