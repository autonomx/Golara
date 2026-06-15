import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';

const source = readFileSync('lib/checkout/admin-order-repository.ts', 'utf8');

assert.ok(source.includes('_count: { items: number }'), 'Order summary DTO should model item counts through Prisma _count.');
assert.ok(source.includes('_count: { select: { items: true } }'), 'Order summary query should request item counts with Prisma _count.');
assert.ok(source.includes('itemCount: order._count.items'), 'Order summary mapping should use the selected count.');
assert.ok(!source.includes('items: { id: string }[]'), 'Order summary DTO should not carry every item id just for counting.');
assert.ok(!source.includes('items: { select: { id: true } }'), 'Order summary query should not load every order item id just for counting.');
assert.ok(source.includes('items: {\n        orderBy: { createdAt: \'asc\' },'), 'Full order detail reads must still include items for detail pages.');

console.log('admin order summary performance guard passed');
