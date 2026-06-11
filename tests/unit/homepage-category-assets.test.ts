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
}
