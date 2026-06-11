import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync('app/admin/orders/page.tsx', 'utf8');

assert.match(source, /AdminConsolePage/, 'admin orders route should delegate to the localized admin console shell');
assert.match(source, /searchParams=\{searchParams\}/, 'admin orders route should pass search params into the localized admin console shell');
assert.match(source, /forcedTab="sales"/, 'admin orders route should keep the localized sales workspace selected');
assert.match(source, /salesSection="orders"/, 'admin orders route should keep the localized orders sales section selected');
assert.match(source, /activeNavKey="orders"/, 'admin orders route should keep orders navigation active');

for (const rawFragment of [
  '>Orders<',
  '>Admin orders<',
  '>Order history<',
  '>Sales orders<',
  '>Orders dashboard<'
]) {
  assert.ok(!source.includes(rawFragment), `admin orders route should not render raw route-local copy ${rawFragment}`);
}

console.log('admin-orders-route-copy.test.ts passed');
