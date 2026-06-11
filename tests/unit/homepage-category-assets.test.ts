import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

import { homepageCategoryImage } from '../../lib/homepage-assets';

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

  const packageJson = readFileSync('package.json', 'utf8');
  const seedScript = readFileSync('prisma/seed-demo-category-media.ts', 'utf8');
  const categoryImageRoute = readFileSync('app/seed-images/category-real/[slug]/route.ts', 'utf8');
  const tileCard = readFileSync('components/HomepageCategoryTileCard.tsx', 'utf8');

  assert.match(packageJson, /seed-demo-category-media\.ts/, 'db:seed should include the category media seed script');
  assert.match(seedScript, /seedCategories/, 'category media seed should derive rows from seed categories');
  assert.match(seedScript, /resolveCategoryImagePath/, 'category media seed should use the same category image resolver as catalog seed data');
  assert.match(seedScript, /mediaCategory: 'category'/, 'category media rows should be tagged as category media');
  assert.match(seedScript, /seedCategorySlugs/, 'category media metadata should preserve source category slugs');
  assert.match(seedScript, /productId: null/, 'category media updates should not stay attached to product media rows');
  assert.doesNotMatch(categoryImageRoute, /stem: 'woshe-royal'/, 'category image route should not serve the removed Woshe Royal asset');
  assert.match(categoryImageRoute, /'today-vip': \[\{ directory: 'photo-real', stem: 'vip-flower-box' \}\]/, 'today VIP should route to the replacement VIP flower-box image');
  assert.match(categoryImageRoute, /royal: \[\{ directory: 'photo-real', stem: 'vip-flower-box' \}\]/, 'royal category should route to the replacement VIP flower-box image');

  assert.match(tileCard, /object-\[68%_center\]/, 'category tile image should be biased away from the copy panel to reduce baked-in image text collisions');
  assert.match(tileCard, /bg-stone-50\/92/, 'category tile live copy should sit on an opaque copy panel instead of directly over image text');
  assert.match(tileCard, /backdrop-blur-sm/, 'category tile copy panel should soften busy image text under the live copy area');
  assert.doesNotMatch(tileCard, /absolute left-6 top-1\/2 max-w-\[17rem\]/, 'category tile should not use the old transparent full-image text overlay');
}
