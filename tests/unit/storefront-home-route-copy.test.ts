import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { storefrontCopy } from '@/lib/localization/storefront-copy';

const source = readFileSync('app/page.tsx', 'utf8');

function has(fragment: string) {
  assert.ok(source.includes(fragment), `Expected homepage source to include: ${fragment}`);
}

function lacks(fragment: string) {
  assert.ok(!source.includes(fragment), `Expected homepage source not to include: ${fragment}`);
}

function appearsBefore(first: string, second: string) {
  const firstIndex = source.indexOf(first);
  const secondIndex = source.indexOf(second);
  assert.ok(firstIndex >= 0, `Expected homepage source to include first fragment: ${first}`);
  assert.ok(secondIndex >= 0, `Expected homepage source to include second fragment: ${second}`);
  assert.ok(firstIndex < secondIndex, `Expected ${first} to appear before ${second}`);
}

function hasCopy(key: keyof typeof storefrontCopy.en) {
  assert.ok(storefrontCopy.en[key], `Expected English storefront copy for ${key}`);
  assert.ok(storefrontCopy.fa[key], `Expected Persian storefront copy for ${key}`);
}

for (const key of [
  'home.footerBody',
  'home.collectionsEyebrow',
  'home.collectionsTitle',
  'home.collectionsBody',
  'home.collectionsCtaLabel',
  'home.footerShopTitle',
  'home.footerAllProducts',
  'home.footerOccasions',
  'home.footerBestSellers',
  'home.footerServiceTitle',
  'home.footerServiceBody'
] as const) {
  hasCopy(key);
}

for (const fragment of [
  'resolveStorefrontLocale()',
  'getStorefrontCopyDirection(locale)',
  "const copy = (key: Parameters<typeof getStorefrontCopy>[0]) => getStorefrontCopy(key, locale)",
  '<SiteHeader returnTo="/" locale={locale} />',
  '<HomepageBannerSlideshow slides={homepageBannerSlides} homepage={homepage} />',
  '<BestSellersCarousel products={bestSellers} locale={locale} />',
  '<HomepageCategoryTileCard key={category.slug} category={category} priority={index < 4} locale={locale} />',
  'className="relative overflow-hidden bg-white py-20"',
  'className="mx-auto max-w-7xl px-5"',
  "copy('home.collectionsEyebrow')",
  "copy('home.collectionsTitle')",
  "copy('home.collectionsBody')",
  "copy('home.collectionsCtaLabel')",
  "copy('home.footerShopTitle')",
  "copy('home.footerAllProducts')",
  "copy('home.footerOccasions')",
  "copy('home.footerBestSellers')",
  "copy('home.footerServiceTitle')",
  "copy('home.footerServiceBody')"
]) {
  has(fragment);
}

for (const fragment of [
  "import { HomepageOccasionRail } from '@/components/HomepageOccasionRail';",
  '<HomepageOccasionRail occasions={occasionRailItems} locale={locale} />',
  'const occasionRailItems = homepageOccasionsWithCounts.slice(0, 10);',
  'className="relative overflow-hidden bg-white px-5 py-20"',
  'className="mx-auto max-w-[1520px]"'
]) {
  lacks(fragment);
}

appearsBefore('<HomepageBannerSlideshow slides={homepageBannerSlides} homepage={homepage} />', 'data-section="home-collections"');
appearsBefore('data-section="home-collections"', '<BestSellersCarousel products={bestSellers} locale={locale} />');

console.log('storefront homepage route copy guard passed');
