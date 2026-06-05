import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  DEFAULT_STOREFRONT_NAVIGATION_MENU,
  normalizeStorefrontNavigationHref,
  normalizeStorefrontNavigationLocale,
  normalizeStorefrontNavigationMenuInput,
  visibleStorefrontNavigationItems
} from '../../lib/settings/storefront-navigation-menu';

function source(path: string) {
  return readFileSync(path, 'utf8');
}

export async function runStorefrontNavigationMenuBuilderTests() {
  const migration = source('prisma/migrations/20260603010000_add_storefront_navigation_menu_builder/migration.sql');
  const service = source('lib/settings/storefront-navigation-menu.ts');
  const panel = source('components/admin/AdminStorefrontNavigationPanel.tsx');
  const actions = source('app/admin/settings/actions.ts');
  const adminConsole = source('app/admin/AdminConsolePage.tsx');
  const siteHeader = source('components/SiteHeader.tsx');
  const roadmap = source('docs/ADMIN_SALEOR_PARITY_ROADMAP.md');

  assert.match(migration, /CREATE TABLE IF NOT EXISTS "StorefrontNavigationMenu"/);
  assert.match(migration, /CREATE TABLE IF NOT EXISTS "StorefrontNavigationMenuItem"/);
  assert.match(migration, /"key" TEXT NOT NULL/);
  assert.match(migration, /"locale" TEXT/);
  assert.match(migration, /"isActive" BOOLEAN NOT NULL DEFAULT true/);
  assert.match(migration, /"href" TEXT NOT NULL/);
  assert.match(migration, /"isVisible" BOOLEAN NOT NULL DEFAULT true/);
  assert.match(migration, /"opensInNewTab" BOOLEAN NOT NULL DEFAULT false/);
  assert.match(migration, /"sortOrder" INTEGER NOT NULL DEFAULT 0/);
  assert.match(migration, /StorefrontNavigationMenuItem_menuId_fkey/);
  assert.match(migration, /StorefrontNavigationMenuItem_parentId_fkey/);
  assert.match(migration, /StorefrontNavigationMenu_key_locale_key/);
  assert.match(migration, /'Catalog', '\/products'/);
  assert.match(migration, /'Occasions', '\/#occasions'/);
  assert.match(migration, /'Available today', '\/categories\/available-today'/);
  assert.match(migration, /'Best sellers', '\/#best-sellers'/);

  assert.match(service, /export type StorefrontNavigationMenuItem/);
  assert.match(service, /export type StorefrontNavigationMenu/);
  assert.match(service, /export type StorefrontNavigationMenuInput/);
  assert.match(service, /DEFAULT_STOREFRONT_NAVIGATION_MENU/);
  assert.match(service, /normalizeStorefrontNavigationLocale/);
  assert.match(service, /normalizeStorefrontNavigationHref/);
  assert.match(service, /normalizeStorefrontNavigationMenuInput/);
  assert.match(service, /visibleStorefrontNavigationItems/);
  assert.match(service, /storefrontNavigationMenuService = \{/);
  assert.match(service, /async get\(key = 'primary'/);
  assert.match(service, /async update\(input: StorefrontNavigationMenuInput\)/);
  assert.match(service, /FROM "StorefrontNavigationMenu"/);
  assert.match(service, /FROM "StorefrontNavigationMenuItem"/);
  assert.match(service, /INSERT INTO "StorefrontNavigationMenu"/);
  assert.match(service, /DELETE FROM "StorefrontNavigationMenuItem"/);
  assert.match(service, /INSERT INTO "StorefrontNavigationMenuItem"/);
  assert.match(service, /action: 'settings\.storefront_navigation\.update'/);

  assert.equal(DEFAULT_STOREFRONT_NAVIGATION_MENU.items.length, 4);
  assert.equal(normalizeStorefrontNavigationLocale(' fa_IR '), 'fa-IR');
  assert.equal(normalizeStorefrontNavigationHref('products'), '/products');
  assert.equal(normalizeStorefrontNavigationHref('#occasions'), '#occasions');
  assert.equal(normalizeStorefrontNavigationHref('https://example.com'), 'https://example.com');

  const normalized = normalizeStorefrontNavigationMenuInput({
    key: ' primary ',
    label: ' Primary menu ',
    locale: 'en_US',
    isActive: true,
    items: [
      { label: ' B ', href: 'b', isVisible: true, opensInNewTab: false, sortOrder: 20 },
      { label: ' A ', href: '/a', isVisible: true, opensInNewTab: false, sortOrder: 10 }
    ]
  });

  assert.equal(normalized.locale, 'en-US');
  assert.deepEqual(normalized.items.map((item) => item.label), ['A', 'B']);
  assert.deepEqual(normalized.items.map((item) => item.href), ['/a', '/b']);

  const visible = visibleStorefrontNavigationItems(
    [
      { id: '1', menuId: 'menu', label: 'Global', href: '/', isVisible: true, opensInNewTab: false, sortOrder: 10 },
      { id: '2', menuId: 'menu', label: 'Hidden', href: '/hidden', isVisible: false, opensInNewTab: false, sortOrder: 20 },
      { id: '3', menuId: 'menu', label: 'English', href: '/en', locale: 'en-US', isVisible: true, opensInNewTab: false, sortOrder: 30 },
      { id: '4', menuId: 'menu', label: 'Persian', href: '/fa', locale: 'fa-IR', isVisible: true, opensInNewTab: false, sortOrder: 40 }
    ],
    'en-US'
  );

  assert.deepEqual(visible.map((item) => item.label), ['Global', 'English']);

  assert.match(panel, /export async function AdminStorefrontNavigationPanel/);
  assert.match(panel, /homepageBannerMediaSettingsService/);
  assert.match(panel, /AdminHomepageBannerMediaSettingsPanel/);
  assert.match(panel, /updateStorefrontNavigationMenuAction/);
  assert.match(panel, /Storefront navigation/);
  assert.match(panel, /name="itemsJson"/);
  assert.match(panel, /Save navigation menu/);

  assert.match(actions, /updateStorefrontNavigationMenuAction/);
  assert.match(actions, /parseNavigationItemsJson/);
  assert.match(actions, /storefrontNavigationMenuService\.update/);
  assert.match(actions, /revalidatePath\('\/'\)/);
  assert.match(actions, /storefront-navigation-updated/);

  assert.match(adminConsole, /AdminStorefrontNavigationPanel/);
  assert.match(adminConsole, /storefrontNavigationMenuService/);
  assert.match(adminConsole, /storefrontNavigationMenu, storeSetting\] = await Promise\.all/);
  assert.match(adminConsole, /storefrontNavigationMenuService\.get\(\)/);
  assert.match(adminConsole, /<AdminStorefrontNavigationPanel menu=\{storefrontNavigationMenu\} databaseReady=\{runtimeReadiness\.databaseUrlPresent\} \/>/);

  assert.match(siteHeader, /storefrontNavigationMenuService/);
  assert.match(siteHeader, /visibleStorefrontNavigationItems/);
  assert.match(siteHeader, /navigationItems\.map/);
  assert.match(siteHeader, /aria-label=\{navigationMenu\.label \|\| 'Primary navigation'\}/);

  assert.match(roadmap, /- \[x\] Add storefront navigation\/menu builder\./);

  console.log('storefront-navigation-menu-builder.test.ts passed');
}
