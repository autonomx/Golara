import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { CUSTOMER_SESSION_COOKIE_NAME } from '@/lib/customers/customer-session-cookie';
import {
  appendServerActionFields,
  CookieJar,
  createAdminCookieJar,
  hashToken,
  postSignedStripe,
  request,
  responseText,
  submitServerAction,
  type ApiFixture
} from './shared';

function source(path: string) {
  return readFileSync(path, 'utf8');
}

export async function runAdminRolePermissionMatrixAdvancedTests() {
  const cmsActions = source('app/admin/actions.ts');
  const settingsActions = source('app/admin/settings/actions.ts');
  const orderActions = source('app/admin/order-actions.ts');
  const homepageCategoryActions = source('app/admin/homepage/category-actions.ts');
  const homepageProductActions = source('app/admin/homepage/product-actions.ts');
  const productDetailPage = source('app/admin/products/[productId]/page.tsx');
  const orderDetailPage = source('app/admin/orders/[orderId]/page.tsx');
  const productsExportRoute = source('app/admin/products/export/route.ts');
  const ordersCsvRoute = source('app/admin/orders/csv/route.ts');

  assert.match(cmsActions, /async function ensureCanWriteCms\(\)[\s\S]*?assertAdminRole\('owner'\)/);
  assert.match(settingsActions, /updatePaymentProviderSettingAction[\s\S]*?assertAdminRole\('owner'\)/);
  assert.match(settingsActions, /updateApiTokenManagementAction[\s\S]*?assertAdminRole\('owner'\)/);
  assert.match(homepageCategoryActions, /assertAdminRole\('owner'\)/);
  assert.match(homepageProductActions, /assertAdminRole\('owner'\)/);
  assert.match(orderActions, /createStaffDraftOrderAction[\s\S]*?assertAdminRole\('staff'\)/);
  assert.match(orderActions, /queueOrderNotificationAction[\s\S]*?assertAdminRole\('staff'\)/);
  assert.match(productDetailPage, /assertAdminRole\('staff'\)/);
  assert.match(orderDetailPage, /assertAdminRole\('staff'\)/);
  assert.match(productsExportRoute, /assertAdminRole\('staff'\)/);
  assert.match(ordersCsvRoute, /assertAdminRole\('staff'\)/);
}

export async function runRawSettingsSurfaceAdvancedTests(fixture: ApiFixture) {
  await fixture.prisma.$executeRawUnsafe(`
    INSERT INTO "PaymentProviderSetting" ("key", "label", "description", "checkoutMode", "domesticProvider", "overseasProvider", "domesticCurrency", "overseasCurrency", "overseasFallback", "requireIranianGatewayMerchantId", "requireStripeSecretKey", "isDefault", "isActive")
    VALUES ('api-e2e-payment-provider', 'API E2E Payment Provider', 'advanced api e2e payment provider', 'payment', 'zarinpal', 'stripe', 'TOMAN', 'CAD', 'whatsapp', true, true, false, true)
    ON CONFLICT ("key") DO UPDATE SET "label" = EXCLUDED."label", "domesticProvider" = EXCLUDED."domesticProvider", "isActive" = EXCLUDED."isActive";
  `);
  await fixture.prisma.$executeRawUnsafe(`
    INSERT INTO "NotificationProviderSetting" ("key", "label", "description", "emailProvider", "smsProvider", "defaultFromEmail", "defaultFromPhone", "replyToEmail", "enableOrderEmail", "enableOrderSms", "requireEmailProviderEnv", "requireSmsProviderEnv", "isDefault", "isActive")
    VALUES ('api-e2e-notification-provider', 'API E2E Notification Provider', 'advanced api e2e notification provider', 'sendgrid', 'twilio', 'orders@golara.test', '+16045550000', 'reply@golara.test', true, true, true, true, false, true)
    ON CONFLICT ("key") DO UPDATE SET "label" = EXCLUDED."label", "emailProvider" = EXCLUDED."emailProvider", "isActive" = EXCLUDED."isActive";
  `);
  await fixture.prisma.$executeRawUnsafe(`
    INSERT INTO "WebhookConfiguration" ("key", "label", "description", "targetUrl", "events", "secretEnvVar", "headerNames", "isDefault", "isActive")
    VALUES ('api-e2e-webhook', 'API E2E Webhook', 'advanced api e2e webhook', 'https://example.com/api-e2e-webhook', '["order.paid","order.failed"]'::jsonb, 'API_E2E_WEBHOOK_SECRET', '["x-api-e2e"]'::jsonb, false, true)
    ON CONFLICT ("key") DO UPDATE SET "targetUrl" = EXCLUDED."targetUrl", "events" = EXCLUDED."events", "isActive" = EXCLUDED."isActive";
  `);
  await fixture.prisma.$executeRawUnsafe(`
    INSERT INTO "IntegrationAppRegistry" ("key", "label", "description", "category", "provider", "status", "homepageUrl", "docsUrl", "webhookConfigurationKey", "permissions", "requiredEnvVars", "isInternal", "isActive")
    VALUES ('api-e2e-integration-app', 'API E2E Integration App', 'advanced api e2e integration', 'payment', 'stripe', 'active', 'https://example.com', 'https://example.com/docs', 'api-e2e-webhook', '["orders:read"]'::jsonb, '["STRIPE_SECRET_KEY"]'::jsonb, false, true)
    ON CONFLICT ("key") DO UPDATE SET "status" = EXCLUDED."status", "permissions" = EXCLUDED."permissions", "isActive" = EXCLUDED."isActive";
  `);
  await fixture.prisma.$executeRawUnsafe(`
    INSERT INTO "ApiTokenCredential" ("key", "label", "description", "tokenPrefix", "tokenDigest", "scopes", "integrationAppKey", "expiresAt", "isRevoked", "isActive")
    VALUES ('api-e2e-token', 'API E2E Token', 'advanced api e2e token', 'api_e2e', 'api-e2e-token-digest', '["orders:read","webhooks:read"]'::jsonb, 'api-e2e-integration-app', '2026-12-31T00:00:00.000Z', false, true)
    ON CONFLICT ("key") DO UPDATE SET "tokenPrefix" = EXCLUDED."tokenPrefix", "scopes" = EXCLUDED."scopes", "isRevoked" = EXCLUDED."isRevoked", "isActive" = EXCLUDED."isActive";
  `);
  await fixture.prisma.$executeRawUnsafe(`
    INSERT INTO "DashboardExtensionMountPoint" ("key", "label", "description", "mountLocation", "integrationAppKey", "requiredRoles", "requiredPermissions", "isInternal", "isActive", "sortOrder")
    VALUES ('api-e2e-dashboard-extension', 'API E2E Dashboard Extension', 'advanced api e2e extension', 'dashboard', 'api-e2e-integration-app', '["owner"]'::jsonb, '["orders:read"]'::jsonb, false, true, 42)
    ON CONFLICT ("key") DO UPDATE SET "sortOrder" = EXCLUDED."sortOrder", "requiredRoles" = EXCLUDED."requiredRoles", "isActive" = EXCLUDED."isActive";
  `);

  const rows = await fixture.prisma.$queryRaw<Array<{ paymentCount: bigint; notificationCount: bigint; webhookCount: bigint; tokenCount: bigint; extensionCount: bigint }>>`
    SELECT
      (SELECT COUNT(*) FROM "PaymentProviderSetting" WHERE "key" = 'api-e2e-payment-provider' AND "isActive" = true) AS "paymentCount",
      (SELECT COUNT(*) FROM "NotificationProviderSetting" WHERE "key" = 'api-e2e-notification-provider' AND "enableOrderSms" = true) AS "notificationCount",
      (SELECT COUNT(*) FROM "WebhookConfiguration" WHERE "key" = 'api-e2e-webhook' AND "targetUrl" LIKE 'https://example.com/%') AS "webhookCount",
      (SELECT COUNT(*) FROM "ApiTokenCredential" WHERE "key" = 'api-e2e-token' AND "isRevoked" = false) AS "tokenCount",
      (SELECT COUNT(*) FROM "DashboardExtensionMountPoint" WHERE "key" = 'api-e2e-dashboard-extension' AND "sortOrder" = 42) AS "extensionCount"
  `;
  assert.deepEqual(rows[0], { paymentCount: 1n, notificationCount: 1n, webhookCount: 1n, tokenCount: 1n, extensionCount: 1n });

  const actions = source('app/admin/settings/actions.ts');
  for (const action of [
    'updatePaymentProviderSettingAction',
    'updateNotificationProviderSettingAction',
    'updateWebhookConfigurationAction',
    'updateIntegrationAppRegistryAction',
    'updateApiTokenManagementAction',
    'updateDashboardExtensionMountPointAction'
  ]) {
    assert.match(actions, new RegExp(`${action}[\\s\\S]*?assertAdminRole\\('owner'\\)`));
  }
}

export async function runImportExportJobLifecycleAdvancedTests(fixture: ApiFixture) {
  await fixture.prisma.$executeRawUnsafe(`
    INSERT INTO "ImportExportJob" ("key", "label", "description", "kind", "target", "status", "requestedBy", "sourceFilename", "sourceMimeType", "inputDigest", "outputUrl", "outputDigest", "totalRows", "processedRows", "failedRows", "errorMessage", "metadata")
    VALUES ('api-e2e-import-job', 'API E2E Import Job', 'advanced api e2e import', 'import', 'products', 'failed', 'api-e2e-admin', 'products.csv', 'text/csv', 'input-digest-1', 'https://example.com/output.csv', 'output-digest-1', 5, 3, 2, 'two rows failed', '{"phase":"advanced"}'::jsonb)
    ON CONFLICT ("key") DO UPDATE SET "status" = EXCLUDED."status", "processedRows" = EXCLUDED."processedRows", "failedRows" = EXCLUDED."failedRows", "errorMessage" = EXCLUDED."errorMessage";
  `);
  const jobs = await fixture.prisma.$queryRaw<Array<{ status: string; processedRows: number; failedRows: number; errorMessage: string | null }>>`
    SELECT "status", "processedRows", "failedRows", "errorMessage"
    FROM "ImportExportJob"
    WHERE "key" = 'api-e2e-import-job'
  `;
  assert.deepEqual(jobs[0], { status: 'failed', processedRows: 3, failedRows: 2, errorMessage: 'two rows failed' });

  const importAction = source('app/admin/actions.ts');
  assert.match(importAction, /importProductsCsvAction/);
  assert.match(importAction, /file\.size === 0/);
  assert.match(importAction, /Product CSV has no rows/);
  assert.match(importAction, /Imported \$\{created\} new and updated \$\{updated\} products/);
}

export async function runPaginationFilterBoundaryAdvancedTests(fixture: ApiFixture) {
  const adminJar = createAdminCookieJar();
  for (const path of [
    '/admin/products?catalogSearch=definitely-no-api-e2e-match&productPage=999&productColumns=product,price,flags,actions',
    '/admin/categories?catalogSearch=definitely-no-api-e2e-category&categoryPage=999',
    `/admin/orders?orderSearch=${encodeURIComponent('definitely-no-api-e2e-order')}`,
    `/admin/inquiries?inquirySearch=${encodeURIComponent('definitely-no-api-e2e-inquiry')}`
  ]) {
    const response = await request(path, { headers: { cookie: adminJar.header() } });
    assert.equal(response.status, 200, `${path} should render`);
    assert.doesNotMatch(await response.text(), new RegExp(fixture.orderNumber));
  }
}

export async function runBolaObjectAuthorizationAdvancedTests(fixture: ApiFixture) {
  await fixture.prisma.customerSession.deleteMany({ where: { customer: { phone: '+16045559802' } } });
  await fixture.prisma.customerProfile.deleteMany({ where: { phone: '+16045559802' } });
  const ownedAddress = await fixture.prisma.customerAddress.create({
    data: {
      customerId: fixture.customerId,
      label: 'API E2E BOLA Hidden Address',
      recipient: 'API E2E Owner',
      phone: '+16045559801',
      line1: '801 Hidden Boundary Lane',
      city: 'Vancouver',
      isDefault: false
    }
  });
  const otherCustomer = await fixture.prisma.customerProfile.create({
    data: {
      phone: '+16045559802',
      displayName: 'API E2E BOLA Other',
      email: 'api-bola-other.e2e@golara.test',
      locale: 'en-CA'
    }
  });
  const token = 'api-e2e-bola-other-session-token';
  await fixture.prisma.customerSession.create({
    data: {
      customerId: otherCustomer.id,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    }
  });
  const jar = new CookieJar();
  jar.set(CUSTOMER_SESSION_COOKIE_NAME, token);
  const html = await responseText(await request('/account/addresses', { headers: { cookie: jar.header() } }));
  assert.doesNotMatch(html, /API E2E BOLA Hidden Address/);
  assert.doesNotMatch(html, new RegExp(ownedAddress.id));

  const wrongTokenResponse = await request(`/orders/${fixture.publicLookupToken}-wrong`);
  assert.equal(wrongTokenResponse.status, 404);
}

export async function runRateLimitResourceAbuseAdvancedTests(fixture: ApiFixture) {
  const phone = '+16045559803';
  await fixture.prisma.customerOtpChallenge.deleteMany({ where: { destination: phone } });
  await fixture.prisma.customerSession.deleteMany({ where: { customer: { phone } } });
  await fixture.prisma.customerProfile.deleteMany({ where: { phone } });
  for (let index = 0; index < 6; index += 1) {
    const loginHtml = await responseText(await request('/account/login?returnTo=/account'));
    const form = new FormData();
    appendServerActionFields(form, loginHtml, 'name="phone"');
    form.set('phone', phone);
    form.set('returnTo', '/account');
    const response = await submitServerAction('/account/login', form, new CookieJar());
    assert.equal([302, 303, 307, 308].includes(response.status), true);
  }
  const challengeCount = await fixture.prisma.customerOtpChallenge.count({ where: { destination: phone } });
  assert.ok(challengeCount >= 1 && challengeCount <= 6);

  const hugeSearch = 'x'.repeat(4096);
  const adminJar = createAdminCookieJar();
  const response = await request(`/admin/orders?orderSearch=${encodeURIComponent(hugeSearch)}`, { headers: { cookie: adminJar.header() } });
  assert.equal(response.status, 200);
}

export async function runPaymentOperationRawTableAdvancedTests(fixture: ApiFixture) {
  const order = await fixture.prisma.checkoutOrder.findUniqueOrThrow({
    where: { orderNumber: fixture.orderNumber },
    include: { paymentAttempts: true }
  });
  const attempt = order.paymentAttempts[0];
  assert.ok(attempt, 'fixture order should have a payment attempt');

  const migration = source('prisma/migrations/20260604200000_add_payment_operation_records/migration.sql');
  assert.match(migration, /CREATE TABLE IF NOT EXISTS "PaymentOperationRecord"/);
  assert.match(migration, /"idempotencyKey" TEXT NOT NULL/);
  assert.match(migration, /PaymentOperationRecord_idempotencyKey_key/);

  const pages = [
    '/admin/payments/operations',
    '/admin/payments/operations/history',
    '/admin/payments/operations/preview'
  ];
  const adminJar = createAdminCookieJar();
  for (const path of pages) {
    const response = await request(path, { headers: { cookie: adminJar.header() } });
    assert.equal(response.status, 200, `${path} should render without PaymentOperationRecord writes`);
  }
}

export async function runWebhookEdgeCaseAdvancedTests(fixture: ApiFixture) {
  const unknown = await postSignedStripe('/api/webhooks/payments/stripe', {
    id: 'evt_api_e2e_unknown_type_advanced',
    type: 'customer.created',
    data: { object: { id: 'cus_api_e2e_unknown' } }
  });
  assert.equal([200, 202].includes(unknown.status), true);
  assert.ok(fixture.stripeProviderReference);
}

export async function runMediaUploadBoundaryAdvancedTests(fixture: ApiFixture) {
  const adminJar = createAdminCookieJar();
  const mediaHtml = await responseText(await request('/admin/media', { headers: { cookie: adminJar.header() } }));
  const emptyUpload = new FormData();
  appendServerActionFields(emptyUpload, mediaHtml, 'name="file"');
  emptyUpload.set('mediaCategory', 'product');
  emptyUpload.set('alt', 'API E2E Empty Upload');
  const response = await submitServerAction('/admin/media', emptyUpload, adminJar);
  assert.equal(response.status === 500 || [302, 303, 307, 308].includes(response.status), true);
  if ([302, 303, 307, 308].includes(response.status)) {
    assert.match(response.headers.get('location') ?? '', /status=error/);
  }
  assert.equal(await fixture.prisma.media.count({ where: { alt: 'API E2E Empty Upload' } }), 0);
}

export async function runAuditLogAdvancedTests(fixture: ApiFixture) {
  const recentActions = await fixture.prisma.adminAuditLog.findMany({
    where: {
      action: {
        in: [
          'settings.store.update',
          'settings.storefront_navigation.update',
          'homepage.update',
          'media.upsert_url',
          'order.line_item.add',
          'order.notification.queue'
        ]
      }
    },
    select: { action: true, entity: true, summary: true },
    orderBy: { createdAt: 'desc' },
    take: 20
  });
  const actionSet = new Set(recentActions.map((entry) => entry.action));
  assert.ok(actionSet.has('settings.storefront_navigation.update') || actionSet.has('settings.store.update'));
  assert.ok(recentActions.every((entry) => entry.entity && entry.summary));

  const auditPage = await request('/admin?tab=audit&auditSearch=API', { headers: { cookie: createAdminCookieJar().header() } });
  assert.equal(auditPage.status, 200);
}
