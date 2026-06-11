import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync('app/admin/readiness/page.tsx', 'utf8');

assert.match(source, /AdminConsolePage/, 'readiness route should delegate to the localized admin console shell');
assert.match(source, /forcedTab="overview"/, 'readiness route should force the localized overview tab');
assert.match(source, /overviewSection="readiness"/, 'readiness route should select the readiness overview section');
assert.match(source, /activeNavKey="readiness"/, 'readiness route should keep readiness navigation active');

for (const rawFragment of [
  '>Readiness<',
  '>Overview<',
  '>Admin readiness<',
  '>Production readiness<'
]) {
  assert.ok(!source.includes(rawFragment), `readiness route should not render raw route-local copy ${rawFragment}`);
}

console.log('admin-readiness-route-copy.test.ts passed');
