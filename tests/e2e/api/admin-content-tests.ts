import assert from 'node:assert/strict';
import {
  BASE_URL,
  appendServerActionFields,
  assertRedirect,
  createAdminCookieJar,
  expectHtml,
  request,
  responseText,
  submitServerAction,
  type ApiFixture
} from './shared';

export async function runAdminSettingsContentActionTests(fixture: ApiFixture) {
  const adminJar = createAdminCookieJar();
  const settingsHtml = await responseText(await request('/admin/settings', { headers: { cookie: adminJar.header() } }));

  const storeForm = new FormData();
  appendServerActionFields(storeForm, settingsHtml, 'name="storeName"');
  storeForm.set('storeName', 'Golara API E2E');
  storeForm.set('legalName', 'Golara API E2E Legal Inc.');
  storeForm.set('supportEmail', 'support-api-e2e@golara.test');
  storeForm.set('supportPhone', '+16045559100');
  storeForm.set('defaultLocale', 'en-CA');
  storeForm.set('defaultCurrency', 'TOMAN');
  storeForm.set('timezone', 'America/Vancouver');
  storeForm.set('storefrontBaseUrl', BASE_URL);
  const storeResponse = await submitServerAction('/admin/settings', storeForm, adminJar);
  assertRedirect(storeResponse, '/admin/settings?status=store-settings-updated');

  const storeRows = await fixture.prisma.$queryRaw<Array<{ storeName: string; supportEmail: string | null; defaultLocale: string }>>`
    SELECT "storeName", "supportEmail", "defaultLocale"
    FROM "StoreSetting"
    WHERE "key" = 'primary'
  `;
  assert.equal(storeRows[0]?.storeName, 'Golara API E2E');
  assert.equal(storeRows[0]?.supportEmail, 'support-api-e2e@golara.test');
  assert.equal(storeRows[0]?.defaultLocale, 'en-CA');

  const settingsAfterStoreUpdateHtml = await responseText(await request('/admin/settings', { headers: { cookie: adminJar.header() } }));
  const menuItems = [
    { label: 'API Shop', href: '/products', locale: null, isVisible: true, opensInNewTab: false, sortOrder: 10 },
    { label: 'API Roses', href: '/categories/e2e-roses', locale: null, isVisible: true, opensInNewTab: false, sortOrder: 20 },
    { label: 'Hidden API Link', href: '/hidden-api-link', locale: null, isVisible: false, opensInNewTab: false, sortOrder: 30 }
  ];
  const navForm = new FormData();
  appendServerActionFields(navForm, settingsAfterStoreUpdateHtml, 'name="itemsJson"');
  navForm.set('key', 'primary');
  navForm.set('label', 'API E2E Primary Navigation');
  navForm.set('locale', '');
  navForm.set('itemsJson', JSON.stringify(menuItems));
  navForm.set('isActive', 'on');
  const navResponse = await submitServerAction('/admin/settings', navForm, adminJar);
  assertRedirect(navResponse, '/admin/settings?status=storefront-navigation-updated');

  const menuRows = await fixture.prisma.$queryRaw<Array<{ id: string; label: string; isActive: boolean }>>`
    SELECT "id", "label", "isActive"
    FROM "StorefrontNavigationMenu"
    WHERE "key" = 'primary' AND "locale" IS NULL
  `;
  assert.equal(menuRows[0]?.label, 'API E2E Primary Navigation');
  assert.equal(menuRows[0]?.isActive, true);
  const itemRows = await fixture.prisma.$queryRaw<Array<{ label: string; href: string; isVisible: boolean }>>`
    SELECT "label", "href", "isVisible"
    FROM "StorefrontNavigationMenuItem"
    WHERE "menuId" = ${menuRows[0]?.id}
    ORDER BY "sortOrder"
  `;
  assert.deepEqual(itemRows.map((item) => item.label), ['API Shop', 'API Roses', 'Hidden API Link']);
  assert.equal(itemRows.find((item) => item.label === 'Hidden API Link')?.isVisible, false);

  await expectHtml('/', 200, ['API Shop', 'API Roses']);
  assert.equal(await fixture.prisma.adminAuditLog.count({ where: { action: 'settings.storefront_navigation.update', entityId: menuRows[0]?.id } }), 1);
}

export async function runAdminHomepageContentActionTests(fixture: ApiFixture) {
  const adminJar = createAdminCookieJar();
  const homepageAdminHtml = await responseText(await request('/admin/homepage', { headers: { cookie: adminJar.header() } }));
  const form = new FormData();
  appendServerActionFields(form, homepageAdminHtml, 'name="title"');
  form.set('eyebrow', 'API E2E Hero');
  form.set('title', 'API E2E Homepage Title');
  form.set('body', 'Homepage body updated through live API E2E.');
  form.set('existingHeroImage', '/seed-images/photo-real/standard-bouquet.jpg');
  form.set('heroSelectedMediaUrl', '');
  form.set('heroImageUrl', '');
  form.set('heroImageAlt', 'API E2E homepage bouquet');
  form.set('primaryCtaLabel', 'Shop API E2E');
  form.set('primaryCtaHref', '/products');
  form.set('secondaryCtaLabel', 'View API Roses');
  form.set('secondaryCtaHref', '/categories/e2e-roses');
  form.set('tertiaryCtaLabel', 'Admin API Picks');
  form.set('tertiaryCtaHref', '/#best-sellers');
  form.set('trustItemOne', 'API same-day');
  form.set('trustItemTwo', 'API premium finish');
  form.set('trustItemThree', 'API staff guidance');
  form.set('studioBadge', 'API studio badge');
  form.set('collectionsEyebrow', 'API Occasions');
  form.set('collectionsTitle', 'API occasion tiles');
  form.set('collectionsBody', 'API homepage occasion block.');
  form.set('collectionsCtaLabel', 'Browse API occasions');
  form.set('collectionsCtaHref', '/categories');
  form.set('footerBody', 'API footer brand body.');
  form.set('footerServiceBody', 'API footer service body.');

  const response = await submitServerAction('/admin/homepage', form, adminJar);
  assertRedirect(response, '/admin/homepage?status=homepage-updated');

  const section = await fixture.prisma.homepageSection.findUniqueOrThrow({ where: { key: 'home.hero' } });
  const translation = await fixture.prisma.homepageSectionTranslation.findUniqueOrThrow({
    where: { sectionId_locale: { sectionId: section.id, locale: 'fa-IR' } }
  });
  const translationPayload = translation.payload as { primaryCtaLabel?: string; collectionsTitle?: string };
  assert.equal(translation.title, 'API E2E Homepage Title');
  assert.equal(translation.body, 'Homepage body updated through live API E2E.');
  assert.equal(translationPayload.primaryCtaLabel, 'Shop API E2E');
  assert.equal(translationPayload.collectionsTitle, 'API occasion tiles');

  await expectHtml('/', 200, ['API E2E Homepage Title', 'Homepage body updated through live API E2E.', 'Shop API E2E']);
  assert.equal(await fixture.prisma.adminAuditLog.count({ where: { action: 'homepage.update', entityId: section.id } }), 1);
}

export async function runAdminMediaLibraryActionTests(fixture: ApiFixture) {
  const adminJar = createAdminCookieJar();
  const mediaPath = '/admin/media';
  const mediaHtml = await responseText(await request(mediaPath, { headers: { cookie: adminJar.header() } }));

  const createForm = new FormData();
  appendServerActionFields(createForm, mediaHtml, 'name="url"');
  createForm.set('mediaCategory', 'homepage-banner');
  createForm.set('url', 'https://example.com/api-e2e-media-original.jpg');
  createForm.set('alt', 'API E2E Media Alt');
  const createResponse = await submitServerAction(mediaPath, createForm, adminJar);
  assertRedirect(createResponse, '/admin/media?status=media-created');

  let media = await fixture.prisma.media.findUniqueOrThrow({ where: { url: 'https://example.com/api-e2e-media-original.jpg' } });
  assert.equal(media.alt, 'API E2E Media Alt');
  assert.equal(media.sourceType, 'external');
  assert.equal((media.metadata as { mediaCategory?: string } | null)?.mediaCategory, 'homepage-banner');

  const afterCreateHtml = await responseText(await request(mediaPath, { headers: { cookie: adminJar.header() } }));
  const categoryForm = new FormData();
  appendServerActionFields(categoryForm, afterCreateHtml, 'Save');
  categoryForm.set('mediaCategory', 'product');
  const categoryResponse = await submitServerAction(mediaPath, categoryForm, adminJar);
  assertRedirect(categoryResponse, '/admin/media?status=media-saved');

  media = await fixture.prisma.media.findUniqueOrThrow({ where: { id: media.id } });
  assert.equal((media.metadata as { mediaCategory?: string } | null)?.mediaCategory, 'product');

  const afterCategoryHtml = await responseText(await request(mediaPath, { headers: { cookie: adminJar.header() } }));
  const updateForm = new FormData();
  appendServerActionFields(updateForm, afterCategoryHtml, 'Update');
  updateForm.set('url', 'https://example.com/api-e2e-media-updated.jpg');
  updateForm.set('alt', 'API E2E Media Alt Updated');
  updateForm.set('mediaCategory', 'homepage-best-seller');
  const updateResponse = await submitServerAction(mediaPath, updateForm, adminJar);
  assertRedirect(updateResponse, '/admin/media?status=media-saved');

  media = await fixture.prisma.media.findUniqueOrThrow({ where: { id: media.id } });
  assert.equal(media.url, 'https://example.com/api-e2e-media-updated.jpg');
  assert.equal(media.alt, 'API E2E Media Alt Updated');
  assert.equal((media.metadata as { mediaCategory?: string } | null)?.mediaCategory, 'homepage-best-seller');

  await expectHtml(mediaPath, 200, ['API E2E Media Alt Updated', 'api-e2e-media-updated.jpg'], adminJar);
  for (const action of ['media.upsert_url', 'media.category.update', 'media.update']) {
    assert.equal(await fixture.prisma.adminAuditLog.count({ where: { action, entityId: media.id } }), 1, `${action} audit log`);
  }
}
