import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';

const source = readFileSync('app/admin/AdminConsolePage.tsx', 'utf8');

for (const fragment of [
  "import { DEFAULT_STORE_SETTING, storeSettingsService } from '@/lib/settings/store-settings';",
  "import { DEFAULT_STOREFRONT_NAVIGATION_MENU, storefrontNavigationMenuService } from '@/lib/settings/storefront-navigation-menu';",
  "const needsSettingsReads = activeTab === 'settings';",
  'needsSettingsReads && authenticated ? listAdminFulfillmentMethodSettings() : Promise.resolve([])',
  'needsSettingsReads ? storefrontNavigationMenuService.get() : Promise.resolve(DEFAULT_STOREFRONT_NAVIGATION_MENU)',
  'needsSettingsReads ? storeSettingsService.get() : Promise.resolve(DEFAULT_STORE_SETTING)'
]) {
  assert.ok(source.includes(fragment), `Expected AdminConsolePage settings-read gate fragment: ${fragment}`);
}

assert.ok(!source.includes('const [storefrontNavigationMenu, storeSetting] = await Promise.all([storefrontNavigationMenuService.get(), storeSettingsService.get()]);'), 'Expected settings services not to load unconditionally for every admin route.');
assert.ok(!source.includes('authenticated ? listAdminFulfillmentMethodSettings() : Promise.resolve([])'), 'Expected fulfillment settings not to load for every authenticated admin route.');

console.log('admin shell settings read gate passed');
