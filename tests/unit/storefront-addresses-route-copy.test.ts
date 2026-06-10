import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { getAddressBookCopy, getAddressBookStatusCopy } from '@/lib/localization/customer-address-copy';

const source = readFileSync('app/account/addresses/page.tsx', 'utf8');

function has(fragment: string) {
  assert.ok(source.includes(fragment), `Expected addresses route source to include: ${fragment}`);
}

for (const key of [
  'eyebrow',
  'title',
  'subtitle',
  'unavailable',
  'accountOverview',
  'addTitle',
  'label',
  'recipient',
  'phone',
  'city',
  'line1',
  'line2',
  'notes',
  'useDefault',
  'save',
  'empty',
  'defaultBadge',
  'makeDefault',
  'delete',
  'update',
  'cityNotSet',
  'status.added',
  'status.updated',
  'status.defaultUpdated',
  'status.deleted',
  'status.databaseRequired',
  'status.failed'
] as const) {
  assert.ok(getAddressBookCopy(key, 'en'), `Expected English address copy for ${key}`);
  assert.ok(getAddressBookCopy(key, 'fa'), `Expected Persian address copy for ${key}`);
}

for (const status of [
  'added',
  'updated',
  'default-updated',
  'deleted',
  'database-required',
  'failed'
] as const) {
  assert.ok(getAddressBookStatusCopy(status, 'en'), `Expected English address status copy for ${status}`);
  assert.ok(getAddressBookStatusCopy(status, 'fa'), `Expected Persian address status copy for ${status}`);
}

for (const fragment of [
  'resolveStorefrontLocale',
  'const storefrontLocale = await resolveStorefrontLocale();',
  'getCustomerCopyDirection(storefrontLocale)',
  'getAddressBookCopy(key, storefrontLocale)',
  '<SiteHeader locale={storefrontLocale} />',
  'const locale = session.customer.locale;',
  'getCustomerCopyDirection(locale)',
  'getAddressBookCopy(key, locale)',
  '<SiteHeader locale={locale} />',
  'getAddressBookStatusCopy(status, locale)',
  "copy('eyebrow')",
  "copy('title')",
  "copy('subtitle')",
  "copy('unavailable')",
  "copy('accountOverview')",
  "copy('addTitle')",
  "copy('label')",
  "copy('recipient')",
  "copy('phone')",
  "copy('city')",
  "copy('line1')",
  "copy('line2')",
  "copy('notes')",
  "copy('useDefault')",
  "copy('save')",
  "copy('empty')",
  "copy('defaultBadge')",
  "copy('makeDefault')",
  "copy('delete')",
  "copy('update')",
  "copy('cityNotSet')"
]) {
  has(fragment);
}

console.log('storefront addresses route copy guard passed');
