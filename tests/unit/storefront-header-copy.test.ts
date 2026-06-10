import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { storefrontCopy } from '@/lib/localization/storefront-copy';

const source = readFileSync('components/SiteHeader.tsx', 'utf8');

function assertIncludes(fragment: string) {
  assert.ok(source.includes(fragment), `Expected SiteHeader source to include: ${fragment}`);
}

function assertCopyKey(key: keyof typeof storefrontCopy.en) {
  assert.ok(storefrontCopy.en[key], `Expected English storefront copy for ${key}`);
  assert.ok(storefrontCopy.fa[key], `Expected Persian storefront copy for ${key}`);
}

const guardedKeys = [
  'header.announcement',
  'header.primaryNavigation',
  'header.accountLabel',
  'header.cartLabel',
  'header.cartWithItemsLabel',
  'catalog.searchLabel',
  'catalog.searchPlaceholder',
  'catalog.searchSubmit',
  'catalog.searchClear'
] as const;

assertIncludes("import { formatStorefrontCopy, getStorefrontCopy } from '@/lib/localization/storefront-copy';");
assertIncludes("const copy = (key: Parameters<typeof getStorefrontCopy>[0]) => getStorefrontCopy(key, resolvedLocale);");
assertIncludes("formatStorefrontCopy('header.cartWithItemsLabel', resolvedLocale, { count: itemCount })");
assertIncludes("copy('header.announcement')");
assertIncludes("copy('header.primaryNavigation')");
assertIncludes("copy('header.accountLabel')");
assertIncludes("copy('header.cartLabel')");
assertIncludes("label={copy('catalog.searchLabel')}");
assertIncludes("placeholder={copy('catalog.searchPlaceholder')}");
assertIncludes("submitLabel={copy('catalog.searchSubmit')}");
assertIncludes("hideLabel={copy('catalog.searchClear')}");

for (const key of guardedKeys) {
  assertCopyKey(key);
}

for (const rawLabel of ['Same-day flowers', 'Primary navigation', 'Account', 'Cart', 'Search products']) {
  assert.ok(!source.includes(`>${rawLabel}<`), `Expected ${rawLabel} to stay routed through storefront copy`);
}

console.log('storefront header copy guard passed');
