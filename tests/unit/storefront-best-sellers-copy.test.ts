import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { storefrontCopy } from '@/lib/localization/storefront-copy';

const source = readFileSync('components/BestSellersCarousel.tsx', 'utf8');

function assertIncludes(fragment: string) {
  assert.ok(source.includes(fragment), `Expected BestSellersCarousel source to include: ${fragment}`);
}

function assertCopyKey(key: keyof typeof storefrontCopy.en) {
  assert.ok(storefrontCopy.en[key], `Expected English storefront copy for ${key}`);
  assert.ok(storefrontCopy.fa[key], `Expected Persian storefront copy for ${key}`);
}

const localCopyFragments = [
  "eyebrow: 'Best seller'",
  "title: 'Featured picks'",
  "body: 'A curated run of customer favorites, styled with real Golara homepage photography.'",
  "previous: 'Previous best seller'",
  "next: 'Next best seller'",
  "contactToOrder: 'Contact to order'",
  "messageSales: 'Message sales'",
  "viewAndOrder: 'View and order'",
  "eyebrow: 'پرفروش'",
  "title: 'انتخاب‌های ویژه'",
  "previous: 'پرفروش قبلی'",
  "next: 'پرفروش بعدی'"
] as const;

const storefrontKeys = [
  'product.bestSeller',
  'product.availableToday',
  'product.interestedMessage'
] as const;

assertIncludes("import { formatStorefrontCopy, getStorefrontCopy } from '@/lib/localization/storefront-copy';");
assertIncludes('const labels = carouselCopy[activeLocale];');
assertIncludes("const copy = (key: Parameters<typeof getStorefrontCopy>[0]) => getStorefrontCopy(key, locale);");
assertIncludes("formatStorefrontCopy('product.interestedMessage', locale");
assertIncludes("copy('product.bestSeller')");
assertIncludes("copy('product.availableToday')");
assertIncludes('aria-label={labels.previous}');
assertIncludes('aria-label={labels.next}');

for (const fragment of localCopyFragments) {
  assertIncludes(fragment);
}

for (const key of storefrontKeys) {
  assertCopyKey(key);
}

for (const rawLabel of ['Best seller', 'Available today']) {
  assert.ok(!source.includes(`>${rawLabel}<`), `Expected ${rawLabel} badge copy to stay routed through storefront copy`);
}

console.log('storefront best sellers copy guard passed');
