import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';

const source = readFileSync('app/admin/products/page.tsx', 'utf8');

for (const fragment of [
  'const sessionPromise = requireAdminRouteSession();',
  'const searchParamsPromise = searchParams;',
  'const localePromise = resolveStorefrontLocale();',
  'const productsPromise = listAdminProducts();',
  'await sessionPromise;',
  'const [resolvedSearchParams, locale, products] = await Promise.all([',
  'searchParamsPromise,',
  'localePromise,',
  'productsPromise'
]) {
  assert.ok(source.includes(fragment), `Expected admin products page to include performance fragment: ${fragment}`);
}

const sessionAwaitIndex = source.indexOf('await sessionPromise;');
const promiseAllIndex = source.indexOf('await Promise.all([');
const productsPromiseIndex = source.indexOf('const productsPromise = listAdminProducts();');
assert.ok(productsPromiseIndex > -1, 'Expected products read to be started as a promise.');
assert.ok(sessionAwaitIndex > productsPromiseIndex, 'Expected products read to start before awaiting the admin session.');
assert.ok(promiseAllIndex > sessionAwaitIndex, 'Expected parallel reads to settle after the admin session boundary.');

for (const sequentialFragment of [
  'const resolvedSearchParams = await searchParams;',
  'const locale = await resolveStorefrontLocale();',
  'const products = await listAdminProducts();'
]) {
  assert.ok(!source.includes(sequentialFragment), `Expected admin products page not to use sequential fragment: ${sequentialFragment}`);
}

console.log('admin products page performance guard passed');
