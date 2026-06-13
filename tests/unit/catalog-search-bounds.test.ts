import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const productsSource = readFileSync('app/products/page.tsx', 'utf8');
const categoriesSource = readFileSync('app/categories/page.tsx', 'utf8');
const categoryDetailSource = readFileSync('app/categories/[slug]/page.tsx', 'utf8');
const repositorySource = readFileSync('lib/cms/catalog-repository.ts', 'utf8');

const storefrontListingSources = [
  ['products page', productsSource],
  ['categories page', categoriesSource],
  ['category detail page', categoryDetailSource]
] as const;

assert.match(
  productsSource,
  /const CATALOG_SEARCH_MAX_LENGTH = 80;/,
  'catalog search must keep a bounded server-side search length constant'
);

assert.equal(
  productsSource.includes('export const CATALOG_SEARCH_MAX_LENGTH'),
  false,
  'catalog search length constant must remain private to the Next.js page module'
);

assert.equal(
  productsSource.includes('export function normalizeSearch'),
  false,
  'catalog search normalizer must remain private to the Next.js page module'
);

assert.match(
  productsSource,
  /normalized\.length > CATALOG_SEARCH_MAX_LENGTH \? normalized\.slice\(0, CATALOG_SEARCH_MAX_LENGTH\)\.trimEnd\(\) : normalized/,
  'normalizeSearch must truncate normalized query strings server-side before filtering products'
);

assert.match(
  productsSource,
  /const search = normalizeSearch\(resolvedSearchParams\.q\);/,
  'products page must run query params through normalizeSearch before filtering products'
);

assert.match(
  productsSource,
  /maxLength=\{CATALOG_SEARCH_MAX_LENGTH\}/,
  'catalog search input should expose the same maximum length to browsers'
);

assert.doesNotMatch(
  productsSource,
  /const search = resolvedSearchParams\.q/,
  'products page must not consume raw q query params directly'
);

for (const [label, source] of storefrontListingSources) {
  assert.doesNotMatch(
    source,
    /searchParams[^\n]*(?:page|pageSize|limit|take|skip|sort|orderBy|filter)/,
    `${label} must not add unbounded listing, sort, or filter query params without a dedicated allowlist/normalizer gate`
  );

  assert.doesNotMatch(
    source,
    /list(?:Products|Categories)\(\{[^}]*\.\.\./s,
    `${label} must not spread raw request/query params into catalog repository listing calls`
  );

  assert.doesNotMatch(
    source,
    /list(?:Products|Categories)\(\{[^}]*(?:page|pageSize|limit|take|skip|sort|orderBy|filter)/s,
    `${label} must not pass public listing controls into catalog repository calls without explicit bounds and allowlists`
  );
}

assert.match(
  repositorySource,
  /export async function listProducts\(options: CatalogReadOptions = \{\}\): Promise<Product\[]>/,
  'public listProducts must keep a narrow options-only signature instead of accepting raw query/listing controls'
);

assert.match(
  repositorySource,
  /prisma\.product\.findMany\(\{ where: \{ isActive: true, category: \{ isActive: true \} \}, include: publicProductInclude, orderBy: \[\{ bestSeller: 'desc' \}, \{ title: 'asc' \}\] \}\)/,
  'public listProducts must keep fixed server-side ordering and avoid public take/skip/orderBy/filter complexity'
);

assert.match(
  repositorySource,
  /export async function listCategories\(options: CatalogReadOptions = \{\}\): Promise<Category\[]>/,
  'public listCategories must keep a narrow options-only signature instead of accepting raw query/listing controls'
);

assert.match(
  repositorySource,
  /prisma\.category\.findMany\(\{ where: \{ isActive: true \}, include: categoryInclude, orderBy: \[\{ sortOrder: 'asc' \}, \{ title: 'asc' \}\] \}\)/,
  'public listCategories must keep fixed server-side ordering and avoid public take/skip/orderBy/filter complexity'
);

console.log('catalog search and query complexity gate passed');
