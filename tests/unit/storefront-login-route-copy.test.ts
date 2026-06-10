import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { customerCopy } from '@/lib/localization/customer-copy';
import { getLoginStatusCopy } from '@/lib/localization/account-flow-copy';

const source = readFileSync('app/account/login/page.tsx', 'utf8');

function has(fragment: string) {
  assert.ok(source.includes(fragment), `Expected login route source to include: ${fragment}`);
}

function hasCustomerCopy(key: keyof typeof customerCopy.en) {
  assert.ok(customerCopy.en[key], `Expected English customer copy for ${key}`);
  assert.ok(customerCopy.fa[key], `Expected Persian customer copy for ${key}`);
}

for (const key of [
  'login.eyebrow',
  'login.title',
  'login.longSubtitle',
  'login.unavailableTitle',
  'login.unavailableBody',
  'login.requestTitle',
  'login.requestSafetyNote',
  'login.phoneLabel',
  'login.requestCode',
  'login.verifyTitle',
  'login.codeFor',
  'login.codeLabel',
  'login.verifyAndSignIn',
  'login.requestFirst',
  'common.accountOverview',
  'common.backToCheckout'
] as const) {
  hasCustomerCopy(key);
}

for (const status of [
  'code-sent',
  'cooldown',
  'rate_limited',
  'missing_or_expired',
  'invalid_code',
  'too_many_attempts',
  'database-required',
  'request-failed',
  'verify-failed'
] as const) {
  assert.ok(getLoginStatusCopy(status, 'en'), `Expected English login status copy for ${status}`);
  assert.ok(getLoginStatusCopy(status, 'fa'), `Expected Persian login status copy for ${status}`);
}

for (const fragment of [
  'resolveStorefrontLocale()',
  'getCustomerCopyDirection(locale)',
  "const copy = (key: Parameters<typeof getCustomerCopy>[0]) => getCustomerCopy(key, locale)",
  'getLoginStatusCopy(status, locale)',
  '<SiteHeader locale={locale} />',
  "copy('login.eyebrow')",
  "copy('login.title')",
  "copy('login.longSubtitle')",
  "copy('login.unavailableTitle')",
  "copy('login.unavailableBody')",
  "copy('login.requestTitle')",
  "copy('login.requestSafetyNote')",
  "copy('login.phoneLabel')",
  "copy('login.requestCode')",
  "copy('login.verifyTitle')",
  "copy('login.codeFor')",
  "copy('login.codeLabel')",
  "copy('login.verifyAndSignIn')",
  "copy('login.requestFirst')",
  "copy('common.accountOverview')",
  "copy('common.backToCheckout')"
]) {
  has(fragment);
}

console.log('storefront login route copy guard passed');
