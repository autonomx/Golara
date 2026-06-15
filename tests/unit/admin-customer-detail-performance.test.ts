import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';

const source = readFileSync('lib/customers/customer-repository.ts', 'utf8');
const detailStart = source.indexOf('export async function getAdminCustomerDetail');
assert.ok(detailStart >= 0, 'Expected getAdminCustomerDetail to exist.');
const detailSource = source.slice(detailStart);

assert.ok(
  detailSource.includes('_count: { select: { items: true } }'),
  'Expected customer detail recent orders to use Prisma _count for item counts.'
);
assert.ok(
  detailSource.includes('itemCount: order._count.items'),
  'Expected customer detail itemCount to map from order._count.items.'
);
assert.ok(
  !detailSource.includes('items: { select: { id: true } }'),
  'Customer detail should not select every order item id just to count items.'
);
assert.ok(
  detailSource.includes('paymentAttempts: { select: { status: true }, orderBy: { createdAt: \'desc\' }, take: 1 }'),
  'Expected customer detail to retain the latest payment status lookup.'
);

console.log('admin customer detail performance guard passed');
