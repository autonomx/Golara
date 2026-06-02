import assert from 'node:assert/strict';
import {
  createCustomerSensitiveFieldPolicy,
  maskSensitiveEmail,
  maskSensitiveIdentifier,
  maskSensitiveNote,
  maskSensitivePhone
} from '../../lib/customers/customer-privacy';

export async function runCustomerPrivacyTests() {
  assert.deepEqual(createCustomerSensitiveFieldPolicy('staff', false), {
    canRevealSensitive: false,
    revealSensitive: false,
    sensitiveFieldsMasked: true
  });
  assert.deepEqual(createCustomerSensitiveFieldPolicy('staff', true), {
    canRevealSensitive: false,
    revealSensitive: false,
    sensitiveFieldsMasked: true
  });
  assert.deepEqual(createCustomerSensitiveFieldPolicy('owner', true), {
    canRevealSensitive: true,
    revealSensitive: true,
    sensitiveFieldsMasked: false
  });

  assert.equal(maskSensitiveIdentifier('oauth-account-123456'), 'oau******3456');
  assert.equal(maskSensitivePhone('+989123456789'), '+98******6789');
  assert.equal(maskSensitiveEmail('owner@example.invalid'), 'o*****@e****.invalid');
  assert.equal(maskSensitiveNote('Gate code 1234'), '[masked sensitive note]');
  assert.equal(maskSensitiveEmail(null), null);
  assert.equal(maskSensitivePhone(undefined), undefined);

  console.log('customer-privacy.test.ts passed');
}
