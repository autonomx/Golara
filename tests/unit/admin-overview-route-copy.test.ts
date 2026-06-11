import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync('app/admin/page.tsx', 'utf8');

assert.match(source, /AdminConsolePage/, 'admin overview route should delegate to the localized admin console shell');
assert.match(source, /searchParams=\{searchParams\}/, 'admin overview route should pass search params into the localized admin console shell');
assert.match(source, /activeNavKey="overview"/, 'admin overview route should keep overview navigation active');

for (const rawFragment of [
  '>Overview<',
  '>Admin overview<',
  '>Dashboard<',
  '>Dashboard overview<',
  '>Admin dashboard<'
]) {
  assert.ok(!source.includes(rawFragment), `admin overview route should not render raw route-local copy ${rawFragment}`);
}

console.log('admin-overview-route-copy.test.ts passed');
