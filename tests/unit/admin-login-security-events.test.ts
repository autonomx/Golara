import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

export async function runAdminLoginSecurityEventTests() {
  const adminAuthSource = readFileSync('lib/admin-auth.ts', 'utf8');
  const eventLoggerSource = readFileSync('lib/security/admin-security-events.ts', 'utf8');

  for (const outcome of ['success', 'failure', 'throttled', 'unconfigured']) {
    assert.match(
      adminAuthSource,
      new RegExp(`logAdminSecurityEvent\\(\\{\\s*event:\\s*['"]admin_login['"],\\s*outcome:\\s*['"]${outcome}['"]`, 's'),
      `admin login ${outcome} outcome should emit a safe security event`
    );
  }

  assert.match(
    eventLoggerSource,
    /redactLogValue\(/,
    'admin security event logger should redact reason text before logging'
  );
  assert.match(
    eventLoggerSource,
    /slice\(0,\s*160\)/,
    'admin security event reasons should be bounded before logging'
  );
  assert.match(
    eventLoggerSource,
    /console\.info\(message,\s*payload\)/,
    'successful admin login events should use structured info logging'
  );
  assert.match(
    eventLoggerSource,
    /console\.warn\(message,\s*payload\)/,
    'failed admin login events should use structured warning logging'
  );
  assert.doesNotMatch(
    eventLoggerSource,
    /password/i,
    'admin security event logger must not accept or mention password values'
  );
  assert.doesNotMatch(
    eventLoggerSource,
    /FormData/,
    'admin security event logger must not log raw request form data'
  );

  console.log('admin-login-security-events.test.ts passed');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runAdminLoginSecurityEventTests().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
