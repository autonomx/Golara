import assert from 'node:assert/strict';
import {
  appendServerActionFields,
  assertRedirect,
  createAdminCookieJar,
  request,
  responseText,
  submitServerAction,
  type ApiFixture
} from './shared';

export async function runAdminSettingsLongTailActionTests(fixture: ApiFixture) {
  const adminJar = createAdminCookieJar();
  const settingsHtml = await responseText(await request('/admin/settings', { headers: { cookie: adminJar.header() } }));

  await runStoreSettingsOptionalAndMaintenanceTest(fixture, adminJar, settingsHtml);

  const updatedSettingsHtml = await responseText(await request('/admin/settings', { headers: { cookie: adminJar.header() } }));
  await runLocalizedNavigationMenuTest(fixture, adminJar, updatedSettingsHtml);
}

async function runStoreSettingsOptionalAndMaintenanceTest(fixture: ApiFixture, adminJar: ReturnType<typeof createAdminCookieJar>, settingsHtml: string) {
  const form = new FormData();
  appendServerActionFields(form, settingsHtml, 'name="storeName"');
  form.set('storeName', 'Golara API E2E Maintenance');
  form.set('legalName', '');
  form.set('supportEmail', '');
  form.set('supportPhone', '');
  form.set('defaultLocale', 'fa-IR');
  form.set('defaultCurrency', 'CAD');
  form.set('timezone', 'America/Toronto');
  form.set('storefrontBaseUrl', '');
  form.set('isMaintenanceMode', 'on');

  const response = await submitServerAction('/admin/settings', form, adminJar);
  assertRedirect(response, '/admin/settings?status=store-settings-updated');

  const rows = await fixture.prisma.$queryRaw<Array<{
    storeName: string;
    legalName: string | null;
    supportEmail: string | null;
    supportPhone: string | null;
    defaultCurrency: string;
    timezone: string;
    storefrontBaseUrl: string | null;
    isMaintenanceMode: boolean;
  }>>`
    SELECT "storeName", "legalName", "supportEmail", "supportPhone", "defaultCurrency", "timezone", "storefrontBaseUrl", "isMaintenanceMode"
    FROM "StoreSetting"
    WHERE "key" = 'primary'
  `;
  assert.equal(rows[0]?.storeName, 'Golara API E2E Maintenance');
  assert.equal(rows[0]?.legalName, null);
  assert.equal(rows[0]?.supportEmail, null);
  assert.equal(rows[0]?.supportPhone, null);
  assert.equal(rows[0]?.defaultCurrency, 'CAD');
  assert.equal(rows[0]?.timezone, 'America/Toronto');
  assert.equal(rows[0]?.storefrontBaseUrl, null);
  assert.equal(rows[0]?.isMaintenanceMode, true);
}

async function runLocalizedNavigationMenuTest(fixture: ApiFixture, adminJar: ReturnType<typeof createAdminCookieJar>, settingsHtml: string) {
  const localizedItems = [
    { label: 'API E2E EN Shop', href: '/products?locale=en-CA', locale: 'en-CA', isVisible: true, opensInNewTab: false, sortOrder: 5 },
    { label: 'API E2E External Policy', href: 'https://example.com/api-e2e-policy', locale: 'en-CA', isVisible: true, opensInNewTab: true, sortOrder: 15 },
    { label: 'API E2E Draft Link', href: '/draft-api-e2e', locale: 'en-CA', isVisible: false, opensInNewTab: false, sortOrder: 25 }
  ];
  const form = new FormData();
  appendServerActionFields(form, settingsHtml, 'name="itemsJson"');
  form.set('key', 'footer');
  form.set('label', 'API E2E Footer Navigation');
  form.set('locale', 'en-CA');
  form.set('itemsJson', JSON.stringify(localizedItems));
  form.set('isActive', 'on');

  const response = await submitServerAction('/admin/settings', form, adminJar);
  assertRedirect(response, '/admin/settings?status=storefront-navigation-updated');

  const menuRows = await fixture.prisma.$queryRaw<Array<{ id: string; label: string; locale: string | null; isActive: boolean }>>`
    SELECT "id", "label", "locale", "isActive"
    FROM "StorefrontNavigationMenu"
    WHERE "key" = 'footer' AND "locale" = 'en-CA'
  `;
  assert.equal(menuRows[0]?.label, 'API E2E Footer Navigation');
  assert.equal(menuRows[0]?.locale, 'en-CA');
  assert.equal(menuRows[0]?.isActive, true);

  const itemRows = await fixture.prisma.$queryRaw<Array<{ label: string; href: string; locale: string | null; isVisible: boolean; opensInNewTab: boolean; sortOrder: number }>>`
    SELECT "label", "href", "locale", "isVisible", "opensInNewTab", "sortOrder"
    FROM "StorefrontNavigationMenuItem"
    WHERE "menuId" = ${menuRows[0]?.id}
    ORDER BY "sortOrder"
  `;
  assert.deepEqual(itemRows.map((item) => item.label), ['API E2E EN Shop', 'API E2E External Policy', 'API E2E Draft Link']);
  assert.equal(itemRows[0]?.locale, 'en-CA');
  assert.equal(itemRows[1]?.opensInNewTab, true);
  assert.equal(itemRows[2]?.isVisible, false);
  assert.equal(itemRows[2]?.sortOrder, 25);
  assert.equal(await fixture.prisma.adminAuditLog.count({ where: { action: 'settings.storefront_navigation.update', entityId: menuRows[0]?.id } }), 1);
}
