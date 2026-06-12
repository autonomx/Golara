import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { redactLogValue } from '@/lib/security/redacted-logging';

export async function runRedactedLoggingTests() {
  const message = 'Validation failed for email jane.customer@example.com phone +1 604 555 0199 line1: 123 Secret Rose Lane token: abc123 CUSTOMER_OTP_SECRET=supersecret';
  const redacted = redactLogValue(new Error(message));

  assert.doesNotMatch(redacted, /jane\.customer@example\.com/);
  assert.doesNotMatch(redacted, /604 555 0199/);
  assert.doesNotMatch(redacted, /123 Secret Rose Lane/);
  assert.doesNotMatch(redacted, /abc123/);
  assert.doesNotMatch(redacted, /supersecret/);
  assert.match(redacted, /\[redacted-email\]/);
  assert.match(redacted, /\[redacted-phone\]/);
  assert.match(redacted, /line1=\[redacted\]/);
  assert.match(redacted, /token=\[redacted\]/);

  const objectRedacted = redactLogValue({ email: 'buyer@example.com', phone: '+989121234567', notes: 'leave at blue door' });
  assert.doesNotMatch(objectRedacted, /buyer@example\.com/);
  assert.doesNotMatch(objectRedacted, /989121234567/);
  assert.doesNotMatch(objectRedacted, /leave at blue door/);

  const profileActionSource = readFileSync('app/account/profile/actions.ts', 'utf8');
  const addressActionSource = readFileSync('app/account/addresses/actions.ts', 'utf8');

  assert.match(profileActionSource, /warnWithRedactedError\('account', 'failed to update profile', error\)/);
  assert.doesNotMatch(profileActionSource, /console\.warn\('\[account\] failed to update profile', error\)/);

  assert.match(addressActionSource, /warnWithRedactedError\('account', 'failed to add address', error\)/);
  assert.match(addressActionSource, /warnWithRedactedError\('account', 'failed to update address', error\)/);
  assert.match(addressActionSource, /warnWithRedactedError\('account', 'failed to set default address', error\)/);
  assert.match(addressActionSource, /warnWithRedactedError\('account', 'failed to delete address', error\)/);
  assert.doesNotMatch(addressActionSource, /console\.warn\('\[account\] failed to (?:add|update|set default|delete) address', error\)/);

  console.log('redacted-logging.test.ts passed');
}
