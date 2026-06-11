import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { customerProfileCompletionPath, isCustomerProfileComplete, safeCustomerProfileReturnTo } from '../../lib/customers/customer-profile-completion';
import { getCustomerCopy } from '../../lib/localization/customer-copy';

const repoRoot = process.cwd();
const loginActionsSource = readFileSync(join(repoRoot, 'app/account/login/actions.ts'), 'utf8');
const loginPageSource = readFileSync(join(repoRoot, 'app/account/login/page.tsx'), 'utf8');
const profileActionsSource = readFileSync(join(repoRoot, 'app/account/profile/actions.ts'), 'utf8');
const profilePageSource = readFileSync(join(repoRoot, 'app/account/profile/page.tsx'), 'utf8');

export async function runCustomerRegistrationFlowTests() {
  assert.equal(isCustomerProfileComplete({ displayName: 'Ava Rose' }), true, 'named customers should not be forced through profile completion');
  assert.equal(isCustomerProfileComplete({ displayName: '   ' }), false, 'blank names should keep the profile incomplete');
  assert.equal(isCustomerProfileComplete({}), false, 'new phone-only accounts should be treated as incomplete');

  assert.equal(safeCustomerProfileReturnTo('/cart/checkout'), '/cart/checkout', 'checkout return paths should be preserved');
  assert.equal(safeCustomerProfileReturnTo('//evil.test'), '/account', 'protocol-relative return paths must be rejected');
  assert.equal(safeCustomerProfileReturnTo('/account/login?returnTo=/cart/checkout'), '/account', 'login return loops must be rejected');
  assert.equal(customerProfileCompletionPath('/cart/checkout'), '/account/profile?status=complete-profile&returnTo=%2Fcart%2Fcheckout', 'completion path should preserve the safe checkout return path');

  assert.ok(loginActionsSource.includes('isCustomerProfileComplete(account.customer) ? returnTo : customerProfileCompletionPath(returnTo)'), 'OTP verification must send phone-only accounts to profile completion before returning to checkout/account');
  assert.ok(loginPageSource.includes("copy('login.title')"), 'login page must source the registration-aware title from customer copy');
  assert.equal(getCustomerCopy('login.title', 'en-CA'), 'Sign in or create account', 'English login title must clarify registration');
  assert.equal(getCustomerCopy('account.signInWithPhone', 'en-CA'), 'Sign in or create account', 'account CTA must clarify registration');

  assert.ok(profilePageSource.includes("status === 'complete-profile'"), 'profile page must render a dedicated completion mode');
  assert.ok(profilePageSource.includes('name="returnTo"'), 'profile completion form must preserve the destination return path');
  assert.ok(profilePageSource.includes('required={completingProfile}'), 'profile completion should require a display name while allowing normal profile edits');
  assert.ok(profileActionsSource.includes("profilePath('missing-name', returnTo)"), 'profile action must keep incomplete registrations on the profile page until a name is provided');
  assert.ok(profileActionsSource.includes('redirectTarget = returnTo || profilePath'), 'profile action must return completed registrations to the original checkout/account destination');

  console.log('customer-registration-flow.test.ts passed');
}
