import assert from 'node:assert/strict';
import { SECRET_PATTERNS, scanContent, shouldScanPath } from '../../tools/check-secrets.mjs';

function joinParts(...parts: string[]) {
  return parts.join('');
}

export async function runSecretScanningGateTests() {
  assert.ok(SECRET_PATTERNS.length >= 6);

  const secretSamples = [
    { label: 'private-key-block', value: joinParts('-----BEGIN ', 'PRIVATE KEY-----\nabc\n-----END PRIVATE KEY-----') },
    { label: 'aws-access-key', value: joinParts('AK', 'IA', 'ABCDEFGHIJKLMNOP') },
    { label: 'github-token', value: joinParts('gh', 'p_', 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJ123456') },
    { label: 'stripe-secret-key', value: joinParts('sk', '_live_', 'abcdefghijklmnopqrstuvwxyz123456') },
    { label: 'stripe-webhook-secret', value: joinParts('wh', 'sec_', 'abcdefghijklmnopqrstuvwxyz123456') },
    { label: 'slack-token', value: joinParts('xo', 'xb-', '123456789012-abcdefghijklmnopqr') }
  ];

  for (const sample of secretSamples) {
    const findings = scanContent(`SECRET=${sample.value}`, 'fixture.txt');
    assert.ok(findings.some((finding) => finding.pattern === sample.label), `expected ${sample.label} to be detected`);
  }

  assert.deepEqual(scanContent('ADMIN_PASSWORD="replace-this-password"\nSTRIPE_SECRET_KEY=""', '.env.example'), []);
  assert.equal(shouldScanPath('app/api/example/route.ts'), true);
  assert.equal(shouldScanPath('docs/SECURITY_AUDIT_REPORT.md'), true);
  assert.equal(shouldScanPath('.env.example'), false);
  assert.equal(shouldScanPath('package-lock.json'), false);
  assert.equal(shouldScanPath('public/logo.png'), false);

  console.log('secret-scanning-gate.test.ts passed');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runSecretScanningGateTests().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
