import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

import { homepageCategoryImage } from '../../lib/homepage-assets';
import { categoryTileDisplayTitle } from '../../components/HomepageCategoryTileCard';

export async function runHomepageCategoryAssetsTests() {
  assert.equal(
    homepageCategoryImage('today-vip'),
    '/homepage/categories/vip-flower-box.jpg',
    'Today VIP category should reuse the VIP flower box image instead of Woshe Royal.'
  );

  assert.equal(
    homepageCategoryImage('woshe-royal'),
    '/homepage/categories/vip-flower-box.jpg',
    'Woshe Royal category should no longer reference the removed Woshe Royal image asset.'
  );

  assert.notEqual(
    homepageCategoryImage('woshe-royal'),
    '/homepage/categories/woshe-royal.jpg',
    'Removed Woshe Royal category image must not be returned by the resolver.'
  );

  assert.equal(categoryTileDisplayTitle('موجود برای امروز Available Today', 'en-CA'), 'Available Today');
  assert.equal(categoryTileDisplayTitle('باکس گل Flower Box', 'en-CA'), 'Flower Box');
  assert.equal(categoryTileDisplayTitle('دسته گل Bouquets', 'en-CA'), 'Bouquets');
  assert.equal(categoryTileDisplayTitle('وشه رویال Woshe Royal VVIP', 'en-CA'), 'Woshe Royal VVIP');
  assert.equal(categoryTileDisplayTitle('WOSHE Distance | ارسال به سراسر ایران', 'en-CA'), 'WOSHE Distance');
  assert.equal(categoryTileDisplayTitle('باکس گل Flower Box', 'fa-IR'), 'باکس گل');
  assert.equal(categoryTileDisplayTitle('Daily', 'fa-IR'), 'Daily');

  const packageJson = readFileSync('package.json', 'utf8');
  const seedScript = readFileSync('prisma/seed-demo-category-media.ts', 'utf8');
  const categoryImageRoute = readFileSync('app/seed-images/category-real/[slug]/route.ts', 'utf8');
  const tileCard = readFileSync('components/HomepageCategoryTileCard.tsx', 'utf8');

  assert.ok(packageJson.includes('seed-demo-category-media.ts'), 'db:seed should include the category media seed script');
  assert.ok(seedScript.includes('seedCategories'), 'category media seed should derive rows from seed categories');
  assert.ok(seedScript.includes('resolveCategoryImagePath'), 'category media seed should use the same category image resolver as catalog seed data');
  assert.ok(seedScript.includes("mediaCategory: 'category'"), 'category media rows should be tagged as category media');
  assert.ok(seedScript.includes('seedCategorySlugs'), 'category media metadata should preserve source category slugs');
  assert.ok(seedScript.includes('productId: null'), 'category media updates should not stay attached to product media rows');
  assert.ok(!categoryImageRoute.includes("stem: 'woshe-royal'"), 'category image route should not serve the removed Woshe Royal asset');
  assert.ok(categoryImageRoute.includes("'today-vip': [{ directory: 'photo-real', stem: 'vip-flower-box' }]"), 'today VIP should route to the replacement VIP flower-box image');
  assert.ok(categoryImageRoute.includes("royal: [{ directory: 'photo-real', stem: 'vip-flower-box' }]"), 'royal category should route to the replacement VIP flower-box image');

  assert.ok(tileCard.includes('categoryTileDisplayTitle'), 'category tile should clean legacy bilingual titles by locale before rendering');
  assert.ok(tileCard.includes('displayTitle'), 'category tile should use the locale-cleaned display title for rendered text and accessibility labels');
  assert.ok(tileCard.includes('object-[68%_center]'), 'category tile image should be biased away from the copy panel to reduce baked-in image text collisions');
  assert.ok(tileCard.includes('bg-stone-50/92'), 'category tile live copy should sit on an opaque copy panel instead of directly over image text');
  assert.ok(tileCard.includes('backdrop-blur-sm'), 'category tile copy panel should soften busy image text under the live copy area');
  assert.ok(!tileCard.includes('absolute left-6 top-1/2 max-w-[17rem]'), 'category tile should not use the old transparent full-image text overlay');
}
