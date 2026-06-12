import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { redactLogValue } from '@/lib/security/redacted-logging';

function assertNoRawCustomerErrorLogging(source: string, label: string) {
  assert.doesNotMatch(source, /console\.(?:warn|error)\([^\n]*(?:error|err|caught)\)/, `${label} must not log raw caught errors`);
}

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
  const cartActionSource = readFileSync('app/cart/actions.ts', 'utf8');
  const productCheckoutActionSource = readFileSync('app/products/[slug]/checkout-actions.ts', 'utf8');
  const cartCheckoutActionSource = readFileSync('app/cart/checkout/actions.ts', 'utf8');

  assert.match(profileActionSource, /warnWithRedactedError\('account', 'failed to update profile', error\)/);
  assertNoRawCustomerErrorLogging(profileActionSource, 'account profile actions');

  assert.match(addressActionSource, /warnWithRedactedError\('account', 'failed to add address', error\)/);
  assert.match(addressActionSource, /warnWithRedactedError\('account', 'failed to update address', error\)/);
  assert.match(addressActionSource, /warnWithRedactedError\('account', 'failed to set default address', error\)/);
  assert.match(addressActionSource, /warnWithRedactedError\('account', 'failed to delete address', error\)/);
  assertNoRawCustomerErrorLogging(addressActionSource, 'account address actions');

  assert.match(cartActionSource, /warnWithRedactedError\('cart', 'failed to add item', error\)/);
  assert.match(cartActionSource, /warnWithRedactedError\('cart', 'failed to update item', error\)/);
  assert.match(cartActionSource, /warnWithRedactedError\('cart', 'failed to remove item', error\)/);
  assert.match(cartActionSource, /warnWithRedactedError\('cart', 'failed to clear cart', error\)/);
  assertNoRawCustomerErrorLogging(cartActionSource, 'cart actions');

  assert.match(productCheckoutActionSource, /warnWithRedactedError\('checkout', 'failed to create order draft', error\)/);
  assertNoRawCustomerErrorLogging(productCheckoutActionSource, 'product checkout actions');

  assert.match(cartCheckoutActionSource, /warnWithRedactedError\('cart', 'failed to create checkout order', error\)/);
  assertNoRawCustomerErrorLogging(cartCheckoutActionSource, 'cart checkout actions');

  console.log('redacted-logging.test.ts passed');
}
