import type { PrismaClient } from '@prisma/client';

export type LifecycleShipmentRecord = {
  id: string;
  orderId: string;
  status: string;
  fulfillmentType: string;
  carrierName: string | null;
  trackingNumber: string | null;
  deliveryWindow: string | null;
};

export async function ensureLifecycleShipmentTable(prisma: PrismaClient) {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "CheckoutFulfillmentShipment" (
      "id" TEXT NOT NULL,
      "orderId" TEXT NOT NULL,
      "status" TEXT NOT NULL DEFAULT 'created',
      "fulfillmentType" TEXT NOT NULL DEFAULT 'delivery',
      "carrierName" TEXT,
      "trackingNumber" TEXT,
      "trackingUrl" TEXT,
      "deliveryDate" TIMESTAMP(3),
      "deliveryWindow" TEXT,
      "recipientName" TEXT,
      "recipientPhone" TEXT,
      "addressSummary" TEXT,
      "note" TEXT,
      "metadata" JSONB,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "CheckoutFulfillmentShipment_pkey" PRIMARY KEY ("id")
    )
  `);
  await prisma.$executeRawUnsafe(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'CheckoutFulfillmentShipment_orderId_fkey'
      ) THEN
        ALTER TABLE "CheckoutFulfillmentShipment"
          ADD CONSTRAINT "CheckoutFulfillmentShipment_orderId_fkey"
          FOREIGN KEY ("orderId") REFERENCES "CheckoutOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      END IF;
    END $$;
  `);
}

export async function ensureLifecycleSettlementReconciliationTable(prisma: PrismaClient) {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "PaymentSettlementReconciliation" (
      "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
      "paymentEventId" TEXT NOT NULL,
      "paymentAttemptId" TEXT NOT NULL,
      "orderId" TEXT NOT NULL,
      "provider" TEXT NOT NULL,
      "providerReference" TEXT,
      "orderNumber" TEXT,
      "status" TEXT NOT NULL DEFAULT 'pending',
      "expectedAmountCents" INTEGER,
      "actualAmountCents" INTEGER,
      "expectedCurrency" TEXT,
      "actualCurrency" TEXT,
      "needsAttention" BOOLEAN NOT NULL DEFAULT false,
      "metadata" JSONB NOT NULL DEFAULT '{}'::jsonb,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await prisma.$executeRawUnsafe(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'PaymentSettlementReconciliation_paymentEventId_fkey'
      ) THEN
        ALTER TABLE "PaymentSettlementReconciliation"
          ADD CONSTRAINT "PaymentSettlementReconciliation_paymentEventId_fkey"
          FOREIGN KEY ("paymentEventId") REFERENCES "CheckoutPaymentEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      END IF;
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'PaymentSettlementReconciliation_paymentAttemptId_fkey'
      ) THEN
        ALTER TABLE "PaymentSettlementReconciliation"
          ADD CONSTRAINT "PaymentSettlementReconciliation_paymentAttemptId_fkey"
          FOREIGN KEY ("paymentAttemptId") REFERENCES "CheckoutPaymentAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      END IF;
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'PaymentSettlementReconciliation_orderId_fkey'
      ) THEN
        ALTER TABLE "PaymentSettlementReconciliation"
          ADD CONSTRAINT "PaymentSettlementReconciliation_orderId_fkey"
          FOREIGN KEY ("orderId") REFERENCES "CheckoutOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      END IF;
    END $$;
  `);
  await prisma.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS "PaymentSettlementReconciliation_paymentEventId_key"
      ON "PaymentSettlementReconciliation" ("paymentEventId")
  `);
}

export async function simulateLifecyclePaymentFailure(
  prisma: PrismaClient,
  deps: {
    orderId: string;
    amountCents: number;
    currency: string;
  }
) {
  const failedAttempt = await prisma.checkoutPaymentAttempt.create({
    data: {
      orderId: deps.orderId,
      provider: 'manual',
      status: 'failed',
      amountCents: deps.amountCents,
      currency: deps.currency,
      providerReference: 'E2E-PAYMENT-FAILED-1001',
      metadata: { lifecycle: true, simulatedFailure: true }
    }
  });

  const failedEvent = await prisma.checkoutPaymentEvent.create({
    data: {
      paymentAttemptId: failedAttempt.id,
      provider: 'manual',
      eventType: 'payment.failed',
      idempotencyKey: 'e2e-payment-failed-1001',
      status: 'failed',
      processedAt: new Date('2026-06-16T18:05:00.000Z'),
      metadata: { lifecycle: true }
    }
  });

  await prisma.checkoutOrderTimelineEvent.create({
    data: {
      orderId: deps.orderId,
      type: 'payment.failed',
      title: 'Payment failed',
      note: 'Lifecycle payment failure simulation recorded.',
      actorLabel: 'Lifecycle E2E',
      actorRole: 'system',
      metadata: { lifecycle: true }
    }
  });

  await prisma.adminAuditLog.create({
    data: {
      action: 'payment.failed',
      entity: 'CheckoutOrder',
      entityId: deps.orderId,
      summary: 'Lifecycle payment failure simulation recorded.',
      actorType: 'system',
      actorLabel: 'Lifecycle E2E',
      actorRole: 'system',
      actorProvider: 'e2e',
      metadata: { lifecycle: true }
    }
  });

  return { failedAttempt, failedEvent };
}

export async function markLifecyclePaymentSucceeded(
  prisma: PrismaClient,
  deps: {
    orderId: string;
    paymentAttemptId: string;
  }
) {
  const paymentAttempt = await prisma.checkoutPaymentAttempt.update({
    where: { id: deps.paymentAttemptId },
    data: { status: 'paid' }
  });

  const paymentEvent = await prisma.checkoutPaymentEvent.create({
    data: {
      paymentAttemptId: deps.paymentAttemptId,
      provider: 'manual',
      eventType: 'payment.succeeded',
      idempotencyKey: 'e2e-payment-succeeded-1001',
      status: 'paid',
      processedAt: new Date('2026-06-16T18:10:00.000Z'),
      metadata: { lifecycle: true }
    }
  });

  const order = await prisma.checkoutOrder.update({
    where: { id: deps.orderId },
    data: { status: 'confirmed' }
  });

  await prisma.checkoutOrderTimelineEvent.create({
    data: {
      orderId: deps.orderId,
      type: 'payment.paid',
      title: 'Payment paid',
      note: 'Lifecycle payment success simulation recorded.',
      actorLabel: 'Lifecycle E2E',
      actorRole: 'system',
      metadata: { lifecycle: true }
    }
  });

  await prisma.adminAuditLog.create({
    data: {
      action: 'payment.paid',
      entity: 'CheckoutOrder',
      entityId: deps.orderId,
      summary: 'Lifecycle payment success simulation recorded.',
      actorType: 'system',
      actorLabel: 'Lifecycle E2E',
      actorRole: 'system',
      actorProvider: 'e2e',
      metadata: { lifecycle: true }
    }
  });

  return { order, paymentAttempt, paymentEvent };
}

export async function scheduleLifecycleFulfillment(
  prisma: PrismaClient,
  deps: {
    orderId: string;
  }
) {
  await ensureLifecycleShipmentTable(prisma);

  const method = await prisma.fulfillmentMethodSetting.create({
    data: {
      key: 'e2e-local-delivery',
      label: 'E2E Local Delivery',
      description: 'Lifecycle local delivery method.',
      isActive: true,
      isDefault: true,
      requiresAddress: true,
      requiresScheduling: true,
      sortOrder: 1
    }
  });

  const bucket = await prisma.fulfillmentCapacityBucket.create({
    data: {
      capacityDate: new Date('2026-06-16T00:00:00.000Z'),
      windowKey: '10:00-13:00',
      fulfillmentType: 'delivery',
      capacity: 5,
      reserved: 1,
      metadata: { lifecycle: true, methodKey: method.key }
    }
  });

  const reservation = await prisma.fulfillmentCapacityReservation.create({
    data: {
      bucketId: bucket.id,
      status: 'scheduled',
      quantity: 1,
      metadata: { lifecycle: true }
    }
  });

  const order = await prisma.checkoutOrder.update({
    where: { id: deps.orderId },
    data: {
      capacityReservationId: reservation.id,
      fulfillmentStatus: 'scheduled',
      fulfillmentNote: 'Lifecycle fulfillment scheduled.',
      courierName: 'E2E Courier',
      courierPhone: '+16045559999'
    }
  });

  await prisma.checkoutOrderTimelineEvent.create({
    data: {
      orderId: deps.orderId,
      type: 'fulfillment.scheduled',
      title: 'Fulfillment scheduled',
      note: 'Lifecycle fulfillment scheduled.',
      actorLabel: 'Lifecycle E2E',
      actorRole: 'system',
      metadata: { lifecycle: true, methodKey: method.key }
    }
  });

  const shipment = (
    await prisma.$queryRawUnsafe<LifecycleShipmentRecord[]>(
      `
        INSERT INTO "CheckoutFulfillmentShipment" (
          "id",
          "orderId",
          "status",
          "fulfillmentType",
          "carrierName",
          "trackingNumber",
          "deliveryWindow",
          "recipientName",
          "recipientPhone",
          "addressSummary",
          "note",
          "metadata"
        ) VALUES (
          'e2e-shipment-1001',
          $1,
          'scheduled',
          'delivery',
          'E2E Courier',
          'E2E-TRACK-1001',
          '10:00-13:00',
          'E2E Customer',
          '+16045559001',
          '100 E2E Lifecycle Street',
          'Lifecycle shipment scheduled.',
          '{"lifecycle":true}'::jsonb
        )
        RETURNING "id", "orderId", "status", "fulfillmentType", "carrierName", "trackingNumber", "deliveryWindow"
      `,
      deps.orderId
    )
  )[0];

  await prisma.adminAuditLog.create({
    data: {
      action: 'fulfillment.scheduled',
      entity: 'CheckoutOrder',
      entityId: deps.orderId,
      summary: 'Lifecycle fulfillment scheduled.',
      actorType: 'system',
      actorLabel: 'Lifecycle E2E',
      actorRole: 'system',
      actorProvider: 'e2e',
      metadata: { lifecycle: true, shipmentId: shipment?.id }
    }
  });

  return { method, bucket, reservation, order, shipment };
}
