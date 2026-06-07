import { PrismaClient } from '@prisma/client';
import {
  createLifecycleCategory,
  createLifecycleChannel,
  createLifecycleProductType,
  createLifecycleProductWithVariantAndStock
} from '@/tests/e2e/lifecycle/fixtures/catalog-fixtures';
import { createLifecycleCustomer } from '@/tests/e2e/lifecycle/fixtures/customer-fixtures';
import { resetLifecycleDatabase } from '@/tests/e2e/lifecycle/test-db';
import { hashToken, type ApiFixture } from './shared';

export async function prepareApiFixture(prisma: PrismaClient): Promise<ApiFixture> {
  await prisma.$connect();
  await resetLifecycleDatabase(prisma);
  await ensureApiRouteSupportTables(prisma);
  await createLifecycleChannel(prisma);
  const category = await createLifecycleCategory(prisma);
  const productType = await createLifecycleProductType(prisma);
  const catalog = await createLifecycleProductWithVariantAndStock(prisma, {
    categoryId: category.id,
    productTypeId: productType.id
  });
  const customer = await createLifecycleCustomer(prisma);

  const cart = await prisma.cartSession.create({
    data: {
      token: 'api-e2e-cart-token',
      locale: 'fa-IR',
      currency: 'TOMAN',
      expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      items: {
        create: {
          productId: catalog.product.id,
          variantId: catalog.variant.id,
          lineKey: catalog.variant.id,
          quantity: 2
        }
      }
    }
  });

  const order = await prisma.checkoutOrder.create({
    data: {
      orderNumber: 'API-E2E-1001',
      publicLookupToken: 'api-e2e-order-token',
      customerId: customer.customer.id,
      addressId: customer.address.id,
      status: 'pending_payment',
      checkoutMode: 'cart',
      currency: 'TOMAN',
      subtotalCents: 250000,
      totalCents: 250000,
      recipientName: customer.customer.displayName,
      recipientPhone: customer.customer.phone,
      items: {
        create: {
          productId: catalog.product.id,
          variantId: catalog.variant.id,
          variantSku: catalog.variant.sku,
          variantName: catalog.variant.name,
          productTitle: catalog.product.title,
          productCode: catalog.product.code,
          quantity: 2,
          unitPriceCents: catalog.variant.priceCents,
          lineTotalCents: 250000
        }
      },
      paymentAttempts: {
        create: {
          provider: 'stripe',
          status: 'created',
          amountCents: 250000,
          currency: 'TOMAN',
          providerReference: 'cs_api_e2e_1001'
        }
      }
    }
  });

  const customerSessionToken = 'api-e2e-customer-session-token';
  await prisma.customerSession.create({
    data: {
      customerId: customer.customer.id,
      tokenHash: hashToken(customerSessionToken),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    }
  });

  return {
    prisma,
    cartToken: cart.token,
    customerSessionToken,
    customerId: customer.customer.id,
    orderNumber: order.orderNumber,
    productId: catalog.product.id,
    variantId: catalog.variant.id,
    publicLookupToken: order.publicLookupToken ?? '',
    stripeProviderReference: 'cs_api_e2e_1001'
  };
}

async function ensureApiRouteSupportTables(prisma: PrismaClient) {
  await ensureNotificationActionTable(prisma);
  await ensureStorefrontSettingsTables(prisma);
  await ensureAdminSettingsReadModelTables(prisma);
}

async function ensureNotificationActionTable(prisma: PrismaClient) {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "CheckoutOrderNotificationAction" (
      "id" TEXT NOT NULL,
      "orderId" TEXT NOT NULL,
      "channel" TEXT NOT NULL,
      "templateKey" TEXT NOT NULL,
      "recipient" TEXT NOT NULL,
      "subject" TEXT,
      "body" TEXT NOT NULL,
      "status" TEXT NOT NULL DEFAULT 'queued',
      "attemptCount" INTEGER NOT NULL DEFAULT 0,
      "maxAttempts" INTEGER NOT NULL DEFAULT 3,
      "lastAttemptAt" TIMESTAMP(3),
      "nextRetryAt" TIMESTAMP(3),
      "deliveredAt" TIMESTAMP(3),
      "failedAt" TIMESTAMP(3),
      "errorCode" TEXT,
      "errorMessage" TEXT,
      "actorLabel" TEXT,
      "actorRole" TEXT,
      "metadata" JSONB,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "CheckoutOrderNotificationAction_pkey" PRIMARY KEY ("id")
    );
  `);
  await prisma.$executeRawUnsafe(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'CheckoutOrderNotificationAction_orderId_fkey'
      ) THEN
        ALTER TABLE "CheckoutOrderNotificationAction"
          ADD CONSTRAINT "CheckoutOrderNotificationAction_orderId_fkey"
          FOREIGN KEY ("orderId") REFERENCES "CheckoutOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      END IF;
    END $$;
  `);
  await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "CheckoutOrderNotificationAction_orderId_createdAt_idx" ON "CheckoutOrderNotificationAction"("orderId", "createdAt");');
  await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "CheckoutOrderNotificationAction_status_nextRetryAt_idx" ON "CheckoutOrderNotificationAction"("status", "nextRetryAt");');
  await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "CheckoutOrderNotificationAction_channel_status_idx" ON "CheckoutOrderNotificationAction"("channel", "status");');
}

async function ensureStorefrontSettingsTables(prisma: PrismaClient) {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "StoreSetting" (
      "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
      "key" TEXT NOT NULL DEFAULT 'primary',
      "storeName" TEXT NOT NULL DEFAULT 'Golara',
      "legalName" TEXT,
      "supportEmail" TEXT,
      "supportPhone" TEXT,
      "defaultLocale" TEXT NOT NULL DEFAULT 'fa-IR',
      "defaultCurrency" TEXT NOT NULL DEFAULT 'TOMAN',
      "timezone" TEXT NOT NULL DEFAULT 'America/Vancouver',
      "storefrontBaseUrl" TEXT,
      "isMaintenanceMode" BOOLEAN NOT NULL DEFAULT false,
      "metadata" JSONB NOT NULL DEFAULT '{}'::jsonb,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
  await prisma.$executeRawUnsafe('CREATE UNIQUE INDEX IF NOT EXISTS "StoreSetting_key_key" ON "StoreSetting" ("key");');
  await prisma.$executeRawUnsafe(`
    INSERT INTO "StoreSetting" ("key", "storeName", "defaultLocale", "defaultCurrency", "timezone", "isMaintenanceMode")
    VALUES ('primary', 'Golara', 'fa-IR', 'TOMAN', 'America/Vancouver', false)
    ON CONFLICT ("key") DO NOTHING;
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "StorefrontNavigationMenu" (
      "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
      "key" TEXT NOT NULL,
      "label" TEXT NOT NULL,
      "locale" TEXT,
      "isActive" BOOLEAN NOT NULL DEFAULT true,
      "metadata" JSONB NOT NULL DEFAULT '{}'::jsonb,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "StorefrontNavigationMenuItem" (
      "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
      "menuId" TEXT NOT NULL,
      "parentId" TEXT,
      "label" TEXT NOT NULL,
      "href" TEXT NOT NULL,
      "locale" TEXT,
      "isVisible" BOOLEAN NOT NULL DEFAULT true,
      "opensInNewTab" BOOLEAN NOT NULL DEFAULT false,
      "sortOrder" INTEGER NOT NULL DEFAULT 0,
      "metadata" JSONB NOT NULL DEFAULT '{}'::jsonb,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "StorefrontNavigationMenuItem_menuId_fkey" FOREIGN KEY ("menuId") REFERENCES "StorefrontNavigationMenu"("id") ON DELETE CASCADE,
      CONSTRAINT "StorefrontNavigationMenuItem_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "StorefrontNavigationMenuItem"("id") ON DELETE SET NULL
    );
  `);
  await prisma.$executeRawUnsafe('CREATE UNIQUE INDEX IF NOT EXISTS "StorefrontNavigationMenu_key_locale_key" ON "StorefrontNavigationMenu" ("key", COALESCE("locale", \'\'));');
  await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "StorefrontNavigationMenuItem_menuId_sortOrder_idx" ON "StorefrontNavigationMenuItem" ("menuId", "sortOrder");');
  await prisma.$executeRawUnsafe(`
    WITH primary_menu AS (
      INSERT INTO "StorefrontNavigationMenu" ("key", "label", "locale", "isActive")
      VALUES ('primary', 'Primary navigation', NULL, true)
      ON CONFLICT ("key", COALESCE("locale", '')) DO UPDATE SET "label" = EXCLUDED."label"
      RETURNING "id"
    )
    INSERT INTO "StorefrontNavigationMenuItem" ("menuId", "label", "href", "sortOrder")
    SELECT "id", 'Catalog', '/products', 10 FROM primary_menu
    UNION ALL SELECT "id", 'Occasions', '/#occasions', 20 FROM primary_menu
    UNION ALL SELECT "id", 'Available today', '/categories/available-today', 30 FROM primary_menu
    UNION ALL SELECT "id", 'Best sellers', '/#best-sellers', 40 FROM primary_menu
    ON CONFLICT DO NOTHING;
  `);
}

async function ensureAdminSettingsReadModelTables(prisma: PrismaClient) {
  await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "HomepageBannerMediaSetting" ("id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text, "key" TEXT NOT NULL, "locale" TEXT, "eyebrow" TEXT, "title" TEXT NOT NULL DEFAULT 'Fresh floral moments for every occasion', "subtitle" TEXT, "mediaId" TEXT, "imageUrl" TEXT, "imageAlt" TEXT, "ctaLabel" TEXT, "ctaHref" TEXT, "isActive" BOOLEAN NOT NULL DEFAULT true, "sortOrder" INTEGER NOT NULL DEFAULT 10, "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP);`);
  await prisma.$executeRawUnsafe('CREATE UNIQUE INDEX IF NOT EXISTS "HomepageBannerMediaSetting_key_locale_key" ON "HomepageBannerMediaSetting" ("key", COALESCE("locale", \'\'));');

  await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "ShippingDeliverySetting" ("id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text, "key" TEXT NOT NULL UNIQUE, "label" TEXT NOT NULL, "description" TEXT, "deliveryFeeCents" INTEGER NOT NULL DEFAULT 0, "freeDeliveryMinimumCents" INTEGER, "minimumOrderCents" INTEGER, "deliveryRadiusKm" INTEGER, "deliveryPostalCodes" TEXT[] NOT NULL DEFAULT '{}', "pickupAddress" TEXT, "deliveryInstructions" TEXT, "sameDayCutoffMinutes" INTEGER, "timezone" TEXT NOT NULL DEFAULT 'America/Vancouver', "isActive" BOOLEAN NOT NULL DEFAULT true, "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP);`);
  await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "TaxCategorySetting" ("id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text, "key" TEXT NOT NULL UNIQUE, "label" TEXT NOT NULL, "description" TEXT, "taxRateBasisPoints" INTEGER NOT NULL DEFAULT 0, "countryCode" TEXT NOT NULL DEFAULT 'CA', "regionCode" TEXT, "appliesToShipping" BOOLEAN NOT NULL DEFAULT false, "isDefault" BOOLEAN NOT NULL DEFAULT false, "isActive" BOOLEAN NOT NULL DEFAULT true, "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP);`);
  await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "PaymentProviderSetting" ("id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text, "key" TEXT NOT NULL UNIQUE, "label" TEXT NOT NULL, "description" TEXT, "checkoutMode" TEXT NOT NULL DEFAULT 'inquiry', "domesticProvider" TEXT NOT NULL DEFAULT 'manual', "overseasProvider" TEXT, "domesticCurrency" TEXT NOT NULL DEFAULT 'TOMAN', "overseasCurrency" TEXT NOT NULL DEFAULT 'USD', "overseasFallback" TEXT NOT NULL DEFAULT 'whatsapp', "requireIranianGatewayMerchantId" BOOLEAN NOT NULL DEFAULT false, "requireStripeSecretKey" BOOLEAN NOT NULL DEFAULT false, "isDefault" BOOLEAN NOT NULL DEFAULT false, "isActive" BOOLEAN NOT NULL DEFAULT true, "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP);`);
  await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "NotificationProviderSetting" ("id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text, "key" TEXT NOT NULL UNIQUE, "label" TEXT NOT NULL, "description" TEXT, "emailProvider" TEXT NOT NULL DEFAULT 'manual', "smsProvider" TEXT NOT NULL DEFAULT 'manual', "defaultFromEmail" TEXT, "defaultFromPhone" TEXT, "replyToEmail" TEXT, "enableOrderEmail" BOOLEAN NOT NULL DEFAULT true, "enableOrderSms" BOOLEAN NOT NULL DEFAULT false, "requireEmailProviderEnv" BOOLEAN NOT NULL DEFAULT false, "requireSmsProviderEnv" BOOLEAN NOT NULL DEFAULT false, "isDefault" BOOLEAN NOT NULL DEFAULT false, "isActive" BOOLEAN NOT NULL DEFAULT true, "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP);`);

  await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "WebhookConfiguration" ("id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text, "key" TEXT NOT NULL UNIQUE, "label" TEXT NOT NULL, "description" TEXT, "targetUrl" TEXT NOT NULL DEFAULT 'https://example.com/webhook', "events" JSONB NOT NULL DEFAULT '[]'::jsonb, "secretEnvVar" TEXT, "headerNames" JSONB NOT NULL DEFAULT '[]'::jsonb, "isDefault" BOOLEAN NOT NULL DEFAULT false, "isActive" BOOLEAN NOT NULL DEFAULT true, "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP);`);
  await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "WebhookEventLog" ("id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text, "webhookConfigurationKey" TEXT NOT NULL, "eventName" TEXT NOT NULL, "targetUrl" TEXT NOT NULL, "payloadDigest" TEXT NOT NULL UNIQUE, "status" TEXT NOT NULL DEFAULT 'queued', "attemptCount" INTEGER NOT NULL DEFAULT 0, "lastStatusCode" INTEGER, "lastError" TEXT, "nextAttemptAt" TIMESTAMP(3), "deliveredAt" TIMESTAMP(3), "metadata" JSONB NOT NULL DEFAULT '{}'::jsonb, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP);`);
  await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "IntegrationAppRegistry" ("id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text, "key" TEXT NOT NULL UNIQUE, "label" TEXT NOT NULL, "description" TEXT, "category" TEXT NOT NULL DEFAULT 'custom', "provider" TEXT, "status" TEXT NOT NULL DEFAULT 'active', "homepageUrl" TEXT, "docsUrl" TEXT, "webhookConfigurationKey" TEXT, "permissions" JSONB NOT NULL DEFAULT '[]'::jsonb, "requiredEnvVars" JSONB NOT NULL DEFAULT '[]'::jsonb, "isInternal" BOOLEAN NOT NULL DEFAULT false, "isActive" BOOLEAN NOT NULL DEFAULT true, "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP);`);
  await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "ApiTokenCredential" ("id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text, "key" TEXT NOT NULL UNIQUE, "label" TEXT NOT NULL, "description" TEXT, "tokenPrefix" TEXT, "tokenDigest" TEXT, "scopes" JSONB NOT NULL DEFAULT '[]'::jsonb, "integrationAppKey" TEXT, "expiresAt" TIMESTAMP(3), "lastUsedAt" TIMESTAMP(3), "isRevoked" BOOLEAN NOT NULL DEFAULT false, "isActive" BOOLEAN NOT NULL DEFAULT true, "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP);`);
  await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "DashboardExtensionMountPoint" ("id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text, "key" TEXT NOT NULL UNIQUE, "label" TEXT NOT NULL, "description" TEXT, "mountLocation" TEXT NOT NULL DEFAULT 'dashboard', "integrationAppKey" TEXT, "requiredRoles" JSONB NOT NULL DEFAULT '[]'::jsonb, "requiredPermissions" JSONB NOT NULL DEFAULT '[]'::jsonb, "isInternal" BOOLEAN NOT NULL DEFAULT false, "isActive" BOOLEAN NOT NULL DEFAULT true, "sortOrder" INTEGER NOT NULL DEFAULT 100, "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP);`);
  await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "ImportExportJob" ("id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text, "key" TEXT NOT NULL UNIQUE, "label" TEXT NOT NULL, "description" TEXT, "kind" TEXT NOT NULL DEFAULT 'export', "target" TEXT NOT NULL DEFAULT 'products', "status" TEXT NOT NULL DEFAULT 'queued', "requestedBy" TEXT, "sourceFilename" TEXT, "sourceMimeType" TEXT, "inputDigest" TEXT, "outputUrl" TEXT, "outputDigest" TEXT, "totalRows" INTEGER NOT NULL DEFAULT 0, "processedRows" INTEGER NOT NULL DEFAULT 0, "failedRows" INTEGER NOT NULL DEFAULT 0, "errorMessage" TEXT, "metadata" JSONB NOT NULL DEFAULT '{}'::jsonb, "startedAt" TIMESTAMP(3), "completedAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP);`);

  await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "AdminPermissionGroup" ("id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text, "key" TEXT NOT NULL UNIQUE, "label" TEXT NOT NULL, "description" TEXT, "role" TEXT NOT NULL DEFAULT 'owner', "permissions" JSONB NOT NULL DEFAULT '[]'::jsonb, "isDefault" BOOLEAN NOT NULL DEFAULT false, "isActive" BOOLEAN NOT NULL DEFAULT true, "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP);`);
  await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "AdminStaffAccount" ("id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text, "provider" TEXT NOT NULL DEFAULT 'password', "providerAccountId" TEXT NOT NULL, "label" TEXT NOT NULL, "email" TEXT, "role" TEXT NOT NULL DEFAULT 'owner', "permissionGroupKey" TEXT, "isActive" BOOLEAN NOT NULL DEFAULT true, "metadata" JSONB NOT NULL DEFAULT '{}'::jsonb, "lastLoginAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP);`);
  await prisma.$executeRawUnsafe('CREATE UNIQUE INDEX IF NOT EXISTS "AdminStaffAccount_provider_providerAccountId_key" ON "AdminStaffAccount" ("provider", "providerAccountId");');
}
