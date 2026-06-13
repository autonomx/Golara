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
    adminAuthSource,
    /event:\s*['"]admin_authorization['"],[\s\S]*?outcome:\s*['"]denied['"],[\s\S]*?requiredRole,[\s\S]*?authenticated:\s*false/,
    'unauthenticated admin authorization denials should emit a bounded security event'
  );
  assert.match(
    adminAuthSource,
    /event:\s*['"]admin_authorization['"],[\s\S]*?outcome:\s*['"]denied['"],[\s\S]*?requiredRole,[\s\S]*?actualRole:\s*identity\.role,[\s\S]*?authenticated:\s*true/,
    'insufficient-role admin authorization denials should emit a bounded security event'
  );
  assert.doesNotMatch(
    adminAuthSource,
    /event:\s*['"]admin_authorization['"][\s\S]*?(label|email|cookie|password|FormData)/,
    'admin authorization security events must not include labels, emails, cookies, passwords, or raw form data'
  );

  assert.match(
    eventLoggerSource,
    /event:\s*['"]admin_authorization['"]/,
    'admin security event logger should accept authorization-denial events'
  );
  assert.match(
    eventLoggerSource,
    /outcome:\s*['"]denied['"]/,
    'admin authorization security events should use a bounded denied outcome'
  );
  assert.match(
    eventLoggerSource,
    /requiredRole:\s*input\.requiredRole/,
    'admin authorization security events should include only bounded required-role metadata'
  );
  assert.match(
    eventLoggerSource,
    /actualRole:\s*input\.actualRole/,
    'admin authorization security events should include only bounded actual-role metadata'
  );
  assert.match(
    eventLoggerSource,
    /authenticated:\s*input\.authenticated/,
    'admin authorization security events should include only bounded authentication-state metadata'
  );
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
    'failed admin login and authorization-denial events should use structured warning logging'
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
  assert.doesNotMatch(
    eventLoggerSource,
    /(email|label|cookie)/i,
    'admin authorization security event logger must not expose admin labels, emails, or cookies'
  );

  console.log('admin-login-security-events.test.ts passed');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runAdminLoginSecurityEventTests().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
