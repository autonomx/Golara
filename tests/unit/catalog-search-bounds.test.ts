import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync('app/products/page.tsx', 'utf8');

assert.match(
  source,
  /export const CATALOG_SEARCH_MAX_LENGTH = 80;/,
  'catalog search must keep a bounded server-side search length constant'
);

assert.match(
  source,
  /normalized\.length > CATALOG_SEARCH_MAX_LENGTH \? normalized\.slice\(0, CATALOG_SEARCH_MAX_LENGTH\)\.trimEnd\(\) : normalized/,
  'normalizeSearch must truncate normalized query strings server-side before filtering products'
);

assert.match(
  source,
  /const search = normalizeSearch\(resolvedSearchParams\.q\);/,
  'products page must run query params through normalizeSearch before filtering products'
);

assert.match(
  source,
  /maxLength=\{CATALOG_SEARCH_MAX_LENGTH\}/,
  'catalog search input should expose the same maximum length to browsers'
);

assert.doesNotMatch(
  source,
  /const search = resolvedSearchParams\.q/,
  'products page must not consume raw q query params directly'
);

console.log('catalog search bounds gate passed');
