import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { seedProducts } from '../../lib/seed-data';

export async function runProductSeedLocalesTests() {
  const seedSource = readFileSync('prisma/seed.ts', 'utf8');

  assert.match(seedSource, /seedProductLocales/);
  assert.match(seedSource, /'en-CA'/);
  assert.match(seedSource, /'fa-IR'/);
  assert.match(seedSource, /localizeSeedProducts/);
  assert.match(seedSource, /productTranslation\.upsert/);
  assert.match(seedSource, /productId_locale/);
  assert.match(seedSource, /isPublished: true/);
  assert.equal(seedProducts.length > 0, true);

  console.log('product-seed-locales.test.ts passed');
}
