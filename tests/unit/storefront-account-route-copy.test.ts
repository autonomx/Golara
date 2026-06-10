import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { customerCopy } from '@/lib/localization/customer-copy';

const source = readFileSync('app/account/page.tsx', 'utf8');

function has(fragment: string) {
  assert.ok(source.includes(fragment), `Expected account route source to include: ${fragment}`);
}

function hasCustomerCopy(key: keyof typeof customerCopy.en) {
  assert.ok(customerCopy.en[key], `Expected English customer copy for ${key}`);
  assert.ok(customerCopy.fa[key], `Expected Persian customer copy for ${key}`);
}

for (const key of [
  'account.eyebrow',
  'account.title',
  'account.subtitle',
  'account.profileTitle',
  'account.editProfile',
  'account.orderHistory',
  'account.signOut',
  'account.signInTitle',
  'account.signInBody',
  'account.signInWithPhone',
  'account.continueShopping',
  'account.savedAddresses',
  'account.noSavedAddresses',
  'account.accountsUnavailableTitle',
  'account.accountsUnavailableBody',
  'account.status.signedOut',
  'account.status.sessionRequired',
  'common.name',
  'common.phone',
  'common.email',
  'common.locale',
  'common.notSet',
  'common.default',
  'common.cityNotSet'
] as const) {
  hasCustomerCopy(key);
}

for (const fragment of [
  'resolveStorefrontLocale()',
  'const locale = session?.customer.locale || storefrontLocale;',
  'getCustomerCopyDirection(locale)',
  "const copy = (key: Parameters<typeof getCustomerCopy>[0]) => getCustomerCopy(key, locale)",
  '<SiteHeader locale={locale} />',
  "if (status === 'signed-out') return 'account.status.signedOut'",
  "if (status === 'session-required') return 'account.status.sessionRequired'",
  "copy('account.eyebrow')",
  "copy('account.title')",
  "copy('account.subtitle')",
  "copy('account.accountsUnavailableTitle')",
  "copy('account.accountsUnavailableBody')",
  "copy('account.profileTitle')",
  "copy('account.editProfile')",
  "copy('account.orderHistory')",
  "copy('account.signOut')",
  "copy('account.savedAddresses')",
  "copy('account.noSavedAddresses')",
  "copy('account.signInTitle')",
  "copy('account.signInBody')",
  "copy('account.signInWithPhone')",
  "copy('account.continueShopping')",
  "copy('common.name')",
  "copy('common.phone')",
  "copy('common.email')",
  "copy('common.locale')",
  "copy('common.notSet')",
  "copy('common.default')",
  "copy('common.cityNotSet')"
]) {
  has(fragment);
}

console.log('storefront account route copy guard passed');
