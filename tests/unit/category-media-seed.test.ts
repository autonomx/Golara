import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

export async function runCategoryMediaSeedTests() {
  const packageJson = readFileSync('package.json', 'utf8');
  const seedScript = readFileSync('prisma/seed-demo-category-media.ts', 'utf8');
  const categoryImageRoute = readFileSync('app/seed-images/category-real/[slug]/route.ts', 'utf8');

  assert.match(packageJson, /seed-demo-category-media\.ts/, 'db:seed should include the category media seed script');
  assert.match(seedScript, /seedCategories/, 'category media seed should derive rows from seed categories');
  assert.match(seedScript, /resolveCategoryImagePath/, 'category media seed should use the same category image resolver as catalog seed data');
  assert.match(seedScript, /mediaCategory: 'category'/, 'category media rows should be tagged as category media');
  assert.match(seedScript, /seedCategorySlugs/, 'category media metadata should preserve source category slugs');
  assert.match(seedScript, /productId: null/, 'category media updates should not stay attached to product media rows');
  assert.doesNotMatch(categoryImageRoute, /stem: 'woshe-royal'/, 'category image route should not serve the removed Woshe Royal asset');
  assert.match(categoryImageRoute, /'today-vip': \[\{ directory: 'photo-real', stem: 'vip-flower-box' \}\]/, 'today VIP should route to the replacement VIP flower-box image');
  assert.match(categoryImageRoute, /royal: \[\{ directory: 'photo-real', stem: 'vip-flower-box' \}\]/, 'royal category should route to the replacement VIP flower-box image');
}
