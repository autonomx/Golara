import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { getAdminCopy } from '@/lib/localization/admin-copy';

const repoRoot = process.cwd();
const pageSource = readFileSync(join(repoRoot, 'app/admin/media/page.tsx'), 'utf8');
const copySource = readFileSync(join(repoRoot, 'lib/localization/admin-copy.ts'), 'utf8');

const requiredKeys = [
  'Operations console',
  'Admin navigation',
  'Store',
  'Media library',
  'Manage image uploads, URL media, category tags, and usage.',
  'Admin / Catalog',
  'Add image',
  'Add image URL',
  'Product',
  'Category',
  'Homepage hero',
  'Homepage best seller',
  'Homepage category',
  'General / other',
  'Image URL',
  'Alt text',
  'Blush rose bouquet',
  'Add media',
  'Upload image',
  'Image file',
  'Optional descriptive text',
  'Image',
  'Source',
  'Actions',
  'Seed or static asset',
  'Save',
  'Edit',
  'Update',
  'Static',
  'media'
];

for (const key of requiredKeys) {
  assert.ok(pageSource.includes(`t(${JSON.stringify(key)})`) || pageSource.includes(`t(option.label)`), `${key} must stay wrapped with the admin translator`);
  assert.ok(copySource.includes(`${JSON.stringify(key)}:`) || copySource.includes(`'${key.replace(/'/g, "\\'")}':`), `${key} must have Persian admin-copy coverage`);
  assert.notEqual(getAdminCopy(key, 'fa'), key, `${key} must resolve to Persian admin copy`);
}

assert.ok(pageSource.includes('resolveStorefrontLocale()'), 'media route must resolve the storefront locale');
assert.ok(pageSource.includes('createAdminTranslator(locale)'), 'media route must create the admin translator from the resolved locale');
assert.ok(pageSource.includes('getStorefrontCopyDirection(locale)'), 'media route shell must use locale direction');
assert.ok(pageSource.includes('createAdminTranslator(locale);'), 'media category selector/sidebar must create translators from locale props');

const forbiddenRawJsx = [
  '>Media library<',
  '>Add image<',
  '>Add image URL<',
  '>Upload image<',
  '>Image URL<',
  '>Alt text<',
  '>Add media<',
  '>Image<',
  '>Category<',
  '>Source<',
  '>Actions<',
  '>Save<',
  '>Edit<',
  '>Update<',
  '>Static<'
];

for (const fragment of forbiddenRawJsx) {
  assert.ok(!pageSource.includes(fragment), `media route must not render raw copy fragment ${fragment}`);
}

console.log('admin media page copy guard passed');
