import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function extractFunctionBody(source: string, functionName: string) {
  const marker = `export async function ${functionName}`;
  const start = source.indexOf(marker);
  assert.notEqual(start, -1, `${functionName} should be exported`);
  const nextExport = source.indexOf('\nexport async function ', start + marker.length);
  return source.slice(start, nextExport === -1 ? source.length : nextExport);
}

export async function runCustomerSessionExpiryGateTests() {
  const source = readFileSync('lib/customers/customer-account-repository.ts', 'utf8');
  const getSession = extractFunctionBody(source, 'getCustomerSession');
  const revokeSession = extractFunctionBody(source, 'revokeCustomerSession');
  const expireOld = extractFunctionBody(source, 'expireOldCustomerSessions');

  assert.match(
    getSession,
    /tokenHash:\s*hashCustomerSessionToken\(normalized\)/,
    'getCustomerSession should look up only the hashed provided token'
  );
  assert.match(getSession, /revokedAt:\s*null/, 'getCustomerSession should reject revoked sessions');
  assert.match(getSession, /expiresAt:\s*\{\s*gt:\s*new Date\(\)\s*\}/, 'getCustomerSession should reject expired sessions');
  assert.doesNotMatch(getSession, /expiresAt:\s*\{\s*gte:/, 'getCustomerSession should not accept sessions at the exact expiry boundary');

  assert.match(
    revokeSession,
    /tokenHash:\s*hashCustomerSessionToken\(normalized\)/,
    'revokeCustomerSession should target the hashed provided token'
  );
  assert.match(revokeSession, /revokedAt:\s*null/, 'revokeCustomerSession should only mutate active sessions');
  assert.match(revokeSession, /data:\s*\{\s*revokedAt:\s*new Date\(\)\s*\}/, 'revokeCustomerSession should stamp revokedAt');

  assert.match(expireOld, /revokedAt:\s*null/, 'expireOldCustomerSessions should only revoke active sessions');
  assert.match(expireOld, /expiresAt:\s*\{\s*lte:\s*new Date\(\)\s*\}/, 'expireOldCustomerSessions should revoke sessions at or past expiry');
  assert.match(expireOld, /data:\s*\{\s*revokedAt:\s*new Date\(\)\s*\}/, 'expireOldCustomerSessions should stamp revokedAt');

  console.log('customer-session-expiry-gate.test.ts passed');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runCustomerSessionExpiryGateTests().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
