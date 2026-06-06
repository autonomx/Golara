import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

export async function runPhase36OutboundPreflightProgressTests() {
  const doc = readFileSync('docs/production-roadmap-phase36-outbound-preflight-progress.md', 'utf8');

  for (const pr of ['PR 326', 'PR 327', 'PR 328', 'PR 329', 'PR 330', 'PR 331', 'PR 332', 'PR 333', 'PR 334', 'PR 335', 'PR 336', 'PR 337', 'PR 338']) {
    assert.ok(doc.includes(pr), `progress doc must include ${pr}`);
  }

  for (const boundary of [
    'preflight-only',
    'live outbound delivery',
    'background processing',
    'signing runtime',
    'operator recovery actions',
    'database reads',
    'database writes',
    'admin pages',
    'route handlers'
  ]) {
    assert.ok(doc.includes(boundary), `progress doc must mention ${boundary}`);
  }

  console.log('phase36-outbound-preflight-progress.test.ts passed');
}
