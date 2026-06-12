import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

export async function runCustomerLoginSessionRotationTests() {
  const source = readFileSync('app/account/login/actions.ts', 'utf8');

  assert.match(
    source,
    /import\s+\{[^}]*revokeCustomerSession[^}]*\}\s+from\s+'@\/lib\/customers\/customer-account-repository'/s,
    'customer login actions should import revokeCustomerSession'
  );
  assert.match(
    source,
    /import\s+\{[^}]*getCustomerSessionCookie[^}]*setCustomerSessionCookie[^}]*\}\s+from\s+'@\/lib\/customers\/customer-session-cookie'/s,
    'customer login actions should read the previous browser session before setting a replacement cookie'
  );

  const verifyStart = source.indexOf('export async function verifyCustomerOtpAction');
  assert.ok(verifyStart >= 0, 'verifyCustomerOtpAction must exist');
  const verifyBody = source.slice(verifyStart);
  const previousTokenIndex = verifyBody.indexOf('const previousToken = await getCustomerSessionCookie();');
  const createSessionIndex = verifyBody.indexOf('await createCustomerSession');
  const revokeIndex = verifyBody.indexOf('if (previousToken) await revokeCustomerSession(previousToken);');
  const setCookieIndex = verifyBody.indexOf('await setCustomerSessionCookie(token);');

  assert.ok(previousTokenIndex >= 0, 'successful OTP verification should read the previous browser session token');
  assert.ok(createSessionIndex >= 0, 'successful OTP verification should create a replacement session');
  assert.ok(revokeIndex > createSessionIndex, 'previous token revocation should happen after replacement session creation succeeds');
  assert.ok(setCookieIndex > revokeIndex, 'replacement cookie should be set only after previous token revocation is attempted');

  assert.doesNotMatch(source, /console\.warn\(\s*['"]\[account-login\]/, 'login actions must not raw-log OTP/customer errors');
  assert.match(source, /warnWithRedactedError\('account-login', 'failed to request OTP', error\)/);
  assert.match(source, /warnWithRedactedError\('account-login', 'failed to verify OTP', error\)/);

  console.log('customer-login-session-rotation.test.ts passed');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runCustomerLoginSessionRotationTests().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
