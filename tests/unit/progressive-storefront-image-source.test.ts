import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';

const progressiveImageSource = readFileSync('components/ProgressiveStorefrontImage.tsx', 'utf8');
const homepageHeroSource = readFileSync('components/HomepageBannerSlideshow.tsx', 'utf8');
const productCardSource = readFileSync('components/ProductCard.tsx', 'utf8');
const categoryTileSource = readFileSync('components/HomepageCategoryTileCard.tsx', 'utf8');
const bestSellersSource = readFileSync('components/BestSellersCarousel.tsx', 'utf8');
const packageJson = readFileSync('package.json', 'utf8');

function includes(source: string, fragment: string, label: string) {
  assert.ok(source.includes(fragment), `${label} should include ${fragment}`);
}

function excludes(source: string, fragment: string, label: string) {
  assert.ok(!source.includes(fragment), `${label} should not include ${fragment}`);
}

includes(progressiveImageSource, "'use client';", 'progressive image component');
includes(progressiveImageSource, 'data-storefront-progressive-placeholder="true"', 'progressive image component');
includes(progressiveImageSource, 'useState(false)', 'progressive image component');
includes(progressiveImageSource, 'setLoaded(true)', 'progressive image component');
includes(progressiveImageSource, 'transition-opacity duration-700', 'progressive image component');
includes(progressiveImageSource, "loaded ? 'opacity-100' : 'opacity-0'", 'progressive image component');

for (const [label, source] of [
  ['homepage hero', homepageHeroSource],
  ['product card', productCardSource],
  ['homepage category tile', categoryTileSource],
  ['best sellers carousel', bestSellersSource]
] as const) {
  includes(source, "import { ProgressiveStorefrontImage }", label);
  includes(source, '<ProgressiveStorefrontImage', label);
}

excludes(homepageHeroSource, "import Image from 'next/image';", 'homepage hero');
excludes(productCardSource, "import Image from 'next/image';", 'product card');
excludes(categoryTileSource, "import Image from 'next/image';", 'homepage category tile');
excludes(bestSellersSource, "import Image from 'next/image';", 'best sellers carousel');

includes(homepageHeroSource, 'bg-[#fff7f1]', 'homepage hero should keep a soft paintable background before image load');
includes(homepageHeroSource, 'priority', 'homepage hero should preserve LCP image priority while allowing text-first paint');
includes(productCardSource, 'aspect-[4/5]', 'product cards should reserve image space before image load');
includes(categoryTileSource, 'min-h-[270px]', 'category tiles should reserve image space before image load');
includes(bestSellersSource, 'aspect-[4/5]', 'best seller cards should reserve image space before image load');
includes(packageJson, 'check:progressive-storefront-images', 'package.json should expose a focused progressive-image guard');

console.log('progressive storefront image source guard passed');
