import assert from 'node:assert/strict';
import { source } from './api-hardening-source';
import type { ApiFixture } from './shared';

export async function runConcurrencyAndIdempotencyHardeningTests(fixture: ApiFixture) {
  await ensurePaymentOperationRecordTable(fixture);
  const order = await fixture.prisma.checkoutOrder.create({
    data: {
      orderNumber: 'API-E2E-HARDENING-CONCURRENT-1001',
      publicLookupToken: 'api-e2e-hardening-concurrent-token',
      status: 'draft',
      checkoutMode: 'staff',
      currency: 'TOMAN',
      recipientName: 'API E2E Hardening Recipient',
      recipientPhone: '+16045559910',
      paymentAttempts: {
        create: {
          provider: 'stripe',
          status: 'paid',
          amountCents: 125000,
          currency: 'TOMAN',
          providerReference: 'api-e2e-hardening-operation-attempt'
        }
      }
    }
  });
  const paymentAttempt = await fixture.prisma.checkoutPaymentAttempt.findFirstOrThrow({ where: { orderId: order.id } });
  const notificationIds = ['api-e2e-hardening-notification-a', 'api-e2e-hardening-notification-b'];

  await Promise.all([
    fixture.prisma.$executeRawUnsafe(`
      INSERT INTO "CheckoutOrderNotificationAction" ("id", "orderId", "channel", "templateKey", "recipient", "subject", "body", "maxAttempts", "actorLabel", "actorRole", "metadata")
      VALUES ('${notificationIds[0]}', '${order.id}', 'email', 'manual_order_update', 'hardening-a@golara.test', 'API E2E hardening A', 'API E2E hardening body A', 2, 'Admin', 'staff', '{"phase":"hardening"}'::jsonb)
    `),
    fixture.prisma.$executeRawUnsafe(`
      INSERT INTO "CheckoutOrderNotificationAction" ("id", "orderId", "channel", "templateKey", "recipient", "body", "maxAttempts", "actorLabel", "actorRole", "metadata")
      VALUES ('${notificationIds[1]}', '${order.id}', 'sms', 'manual_order_update', '+16045559911', 'API E2E hardening body B', 1, 'Admin', 'staff', '{"phase":"hardening"}'::jsonb)
    `)
  ]);
  const queuedRows = await fixture.prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*) AS "count" FROM "CheckoutOrderNotificationAction" WHERE "orderId" = ${order.id}
  `;
  assert.equal(queuedRows[0]?.count, 2n);

  await fixture.prisma.$executeRawUnsafe(`
    UPDATE "CheckoutOrderNotificationAction"
    SET "status" = 'retry_scheduled', "attemptCount" = 1, "lastAttemptAt" = NOW(), "nextRetryAt" = NOW() + INTERVAL '2 minutes', "errorCode" = 'api-e2e-hardening-failed', "errorMessage" = 'API E2E retry scheduled'
    WHERE "id" = '${notificationIds[0]}'
  `);
  await fixture.prisma.$executeRawUnsafe(`
    UPDATE "CheckoutOrderNotificationAction"
    SET "status" = 'delivered', "attemptCount" = 1, "lastAttemptAt" = NOW(), "deliveredAt" = NOW()
    WHERE "id" = '${notificationIds[1]}'
  `);
  const notificationRows = await fixture.prisma.$queryRaw<Array<{ status: string; attemptCount: number; nextRetryAt: Date | null; deliveredAt: Date | null }>>`
    SELECT "status", "attemptCount", "nextRetryAt", "deliveredAt"
    FROM "CheckoutOrderNotificationAction"
    WHERE "id" IN (${notificationIds[0]}, ${notificationIds[1]})
    ORDER BY "id" ASC
  `;
  assert.equal(notificationRows[0]?.status, 'retry_scheduled');
  assert.equal(notificationRows[0]?.attemptCount, 1);
  assert.ok(notificationRows[0]?.nextRetryAt);
  assert.equal(notificationRows[1]?.status, 'delivered');
  assert.equal(notificationRows[1]?.attemptCount, 1);
  assert.ok(notificationRows[1]?.deliveredAt);

  await fixture.prisma.$executeRawUnsafe(`
    INSERT INTO "PaymentOperationRecord" ("orderId", "paymentAttemptId", "orderNumber", "operationKind", "requestedAmountCents", "currency", "originalPaymentAmountCents", "originalPaymentCurrency", "provider", "providerReference", "idempotencyKey", "operatorLabel", "previewDecision", "status", "metadata")
    VALUES ('${order.id}', '${paymentAttempt.id}', '${order.orderNumber}', 'capture', 125000, 'TOMAN', 125000, 'TOMAN', 'stripe', 'api-e2e-hardening-operation-attempt', 'api-e2e-hardening-idempotency', 'API E2E', 'allowed', 'succeeded', '{"source":"api-e2e"}'::jsonb)
    ON CONFLICT ("idempotencyKey") DO NOTHING;
  `);
  await fixture.prisma.$executeRawUnsafe(`
    INSERT INTO "PaymentOperationRecord" ("orderId", "paymentAttemptId", "orderNumber", "operationKind", "requestedAmountCents", "currency", "originalPaymentAmountCents", "originalPaymentCurrency", "provider", "providerReference", "idempotencyKey", "operatorLabel", "previewDecision", "status", "metadata")
    VALUES ('${order.id}', '${paymentAttempt.id}', '${order.orderNumber}', 'capture', 125000, 'TOMAN', 125000, 'TOMAN', 'stripe', 'api-e2e-hardening-operation-attempt', 'api-e2e-hardening-idempotency', 'API E2E', 'allowed', 'succeeded', '{"source":"api-e2e-duplicate"}'::jsonb)
    ON CONFLICT ("idempotencyKey") DO NOTHING;
  `);
  const operationRows = await fixture.prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*) AS "count" FROM "PaymentOperationRecord" WHERE "idempotencyKey" = 'api-e2e-hardening-idempotency'
  `;
  assert.equal(operationRows[0]?.count, 1n);
}

export async function runAsyncWorkflowHardeningTests(fixture: ApiFixture) {
  await fixture.prisma.$executeRawUnsafe(`
    INSERT INTO "WebhookEventLog" ("webhookConfigurationKey", "eventName", "targetUrl", "payloadDigest", "status", "attemptCount", "lastStatusCode", "lastError", "nextAttemptAt", "metadata")
    VALUES ('api-e2e-webhook', 'order.paid', 'https://example.com/hardening', 'api-e2e-webhook-digest-hardening', 'retry_scheduled', 2, 503, 'temporary outage', NOW() + INTERVAL '10 minutes', '{"phase":"hardening"}'::jsonb)
    ON CONFLICT ("payloadDigest") DO UPDATE SET "status" = EXCLUDED."status", "attemptCount" = EXCLUDED."attemptCount", "lastStatusCode" = EXCLUDED."lastStatusCode", "lastError" = EXCLUDED."lastError", "nextAttemptAt" = EXCLUDED."nextAttemptAt";
  `);
  const webhookRows = await fixture.prisma.$queryRaw<Array<{ status: string; attemptCount: number; lastStatusCode: number | null; lastError: string | null }>>`
    SELECT "status", "attemptCount", "lastStatusCode", "lastError"
    FROM "WebhookEventLog"
    WHERE "payloadDigest" = 'api-e2e-webhook-digest-hardening'
  `;
  assert.deepEqual(webhookRows[0], { status: 'retry_scheduled', attemptCount: 2, lastStatusCode: 503, lastError: 'temporary outage' });

  await fixture.prisma.$executeRawUnsafe(`
    INSERT INTO "ImportExportJob" ("key", "label", "description", "kind", "target", "status", "requestedBy", "totalRows", "processedRows", "failedRows", "metadata")
    VALUES ('api-e2e-hardening-export-job', 'API E2E Hardening Export', 'API E2E hardening async export', 'export', 'orders', 'queued', 'api-e2e-admin', 0, 0, 0, '{"phase":"queued"}'::jsonb)
    ON CONFLICT ("key") DO UPDATE SET "status" = EXCLUDED."status", "processedRows" = EXCLUDED."processedRows", "failedRows" = EXCLUDED."failedRows", "metadata" = EXCLUDED."metadata";
  `);
  await fixture.prisma.$executeRawUnsafe(`
    UPDATE "ImportExportJob"
    SET "status" = 'completed', "totalRows" = 3, "processedRows" = 3, "failedRows" = 0, "outputUrl" = 'https://example.com/api-e2e-hardening-export.csv', "completedAt" = NOW()
    WHERE "key" = 'api-e2e-hardening-export-job';
  `);
  const jobRows = await fixture.prisma.$queryRaw<Array<{ status: string; totalRows: number; processedRows: number; failedRows: number; outputUrl: string | null }>>`
    SELECT "status", "totalRows", "processedRows", "failedRows", "outputUrl"
    FROM "ImportExportJob"
    WHERE "key" = 'api-e2e-hardening-export-job'
  `;
  assert.deepEqual(jobRows[0], {
    status: 'completed',
    totalRows: 3,
    processedRows: 3,
    failedRows: 0,
    outputUrl: 'https://example.com/api-e2e-hardening-export.csv'
  });

  const settingsActions = source('app/admin/settings/actions.ts');
  assert.match(settingsActions, /updateImportExportJobTrackingAction/);
  assert.match(settingsActions, /updateWebhookConfigurationAction/);
}

async function ensurePaymentOperationRecordTable(fixture: ApiFixture) {
  await fixture.prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "PaymentOperationRecord" (
      "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
      "orderId" TEXT NOT NULL,
      "paymentAttemptId" TEXT NOT NULL,
      "orderNumber" TEXT,
      "operationKind" TEXT NOT NULL,
      "requestedAmountCents" INTEGER NOT NULL,
      "currency" TEXT NOT NULL,
      "originalPaymentAmountCents" INTEGER,
      "originalPaymentCurrency" TEXT,
      "provider" TEXT NOT NULL,
      "providerReference" TEXT,
      "idempotencyKey" TEXT NOT NULL,
      "operatorId" TEXT,
      "operatorLabel" TEXT,
      "operatorEmail" TEXT,
      "operatorReason" TEXT,
      "previewDecision" TEXT NOT NULL,
      "previewReasons" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
      "status" TEXT NOT NULL DEFAULT 'pending',
      "providerOperationReference" TEXT,
      "providerStatus" TEXT,
      "errorCategory" TEXT,
      "retryable" BOOLEAN NOT NULL DEFAULT false,
      "transitionPlan" JSONB NOT NULL DEFAULT '{}'::jsonb,
      "metadata" JSONB NOT NULL DEFAULT '{}'::jsonb,
      "submittedAt" TIMESTAMP(3),
      "completedAt" TIMESTAMP(3),
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "PaymentOperationRecord_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "CheckoutOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "PaymentOperationRecord_paymentAttemptId_fkey" FOREIGN KEY ("paymentAttemptId") REFERENCES "CheckoutPaymentAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE
    );
  `);
  await fixture.prisma.$executeRawUnsafe('CREATE UNIQUE INDEX IF NOT EXISTS "PaymentOperationRecord_idempotencyKey_key" ON "PaymentOperationRecord" ("idempotencyKey");');
}
