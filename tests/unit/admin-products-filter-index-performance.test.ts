import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';

const pageSource = readFileSync('app/admin/products/page.tsx', 'utf8');
const indexSource = readFileSync('lib/admin/admin-product-filter-index.ts', 'utf8');

assert.ok(pageSource.includes('listAdminProductFilterIndex'), 'Expected admin products page to use the lightweight filter index.');
assert.ok(pageSource.includes('const productFilterIndexPromise = listAdminProductFilterIndex();'), 'Expected filter index read to be started as a promise.');
assert.ok(!pageSource.includes('listAdminProducts'), 'Expected admin products page not to run the full admin product loader for pagination.');
assert.ok(pageSource.includes('AdminProductFilterIndexItem'), 'Expected filtering to use the narrow product index type.');

for (const fragment of [
  'select: {',
  'title: true,',
  'code: true,',
  'slug: true,',
  'description: true,',
  'priceCents: true,',
  'availableToday: true,',
  'bestSeller: true,',
  'requiresQuote: true,',
  'isActive: true,',
  'imageUrl: true,',
  'category: { select: { slug: true } }'
]) {
  assert.ok(indexSource.includes(fragment), `Expected lightweight index select to include: ${fragment}`);
}

for (const heavyFragment of [
  'include: productInclude',
  'include: publicProductInclude',
  'variants:',
  'attributeValues:',
  'collections:',
  'translations:'
]) {
  assert.ok(!indexSource.includes(heavyFragment), `Expected lightweight filter index not to include heavy fragment: ${heavyFragment}`);
}

console.log('admin products filter index performance guard passed');
