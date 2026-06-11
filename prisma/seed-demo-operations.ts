import { PrismaClient } from '@prisma/client';
import { planPaymentSettlementReconciliation } from '../lib/checkout/payment-settlement-reconciliation';

const prisma = new PrismaClient();

const demoAdminAccounts = [
  {
    providerAccountId: 'demo-owner@golara.test',
    label: 'Demo Owner',
    email: 'demo-owner@golara.test',
    role: 'owner'
  },
  {
    providerAccountId: 'demo-staff@golara.test',
    label: 'Demo Staff',
    email: 'demo-staff@golara.test',
    role: 'staff'
  },
  {
    providerAccountId: 'demo-fulfillment@golara.test',
    label: 'Demo Fulfillment',
    email: 'demo-fulfillment@golara.test',
    role: 'fulfillment'
  }
];

const demoSettlementEvents = [
  {
    orderNumber: 'DEMO-1001',
    eventType: 'payment.paid',
    idempotencyKey: 'demo-settlement-paid-1001',
    status: 'paid'
  },
  {
    orderNumber: 'DEMO-1002',
    eventType: 'payment.pending',
    idempotencyKey: 'demo-settlement-pending-1002',
    status: 'created'
  },
  {
    orderNumber: 'DEMO-1003',
    eventType: 'payment.failed',
    idempotencyKey: 'demo-settlement-failed-1003',
    status: 'failed',
    amountDeltaCents: 5000
  }
];

const demoAuditLogs = [
  {
    action: 'demo.seed.staff',
    entity: 'AdminAccount',
    summary: 'Seeded demo staff accounts for deployed admin previews.',
    actorLabel: 'Seed script',
    actorEmail: 'demo-owner@golara.test',
    actorRole: 'owner'
  },
  {
    action: 'demo.seed.settlements',
    entity: 'PaymentSettlementReconciliation',
    summary: 'Seeded demo payment settlement reconciliation records.',
    actorLabel: 'Seed script',
    actorEmail: 'demo-owner@golara.test',
    actorRole: 'owner'
  },
  {
    action: 'demo.seed.inquiries',
    entity: 'CustomerInquiry',
    summary: 'Demo inquiries are available for customer operations previews.',
    actorLabel: 'Seed script',
    actorEmail: 'demo-staff@golara.test',
    actorRole: 'staff'
  }
];

async function seedDemoAdminAccounts() {
  for (const account of demoAdminAccounts) {
    await prisma.adminAccount.upsert({
      where: {
        provider_providerAccountId: {
          provider: 'password',
          providerAccountId: account.providerAccountId
        }
      },
      create: {
        provider: 'password',
        providerAccountId: account.providerAccountId,
        label: account.label,
        email: account.email,
        role: account.role,
        isActive: true,
        metadata: { demo: true, seededBy: 'seed-demo-operations' }
      },
      update: {
        label: account.label,
        email: account.email,
        role: account.role,
        isActive: true,
        metadata: { demo: true, seededBy: 'seed-demo-operations' }
      }
    });
  }
}

async function seedDemoPaymentSettlements() {
  for (const event of demoSettlementEvents) {
    const order = await prisma.checkoutOrder.findUnique({
      where: { orderNumber: event.orderNumber },
      include: {
        paymentAttempts: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    const attempt = order?.paymentAttempts[0];
    if (!order || !attempt) continue;

    const actualAmountCents = Math.max(0, attempt.amountCents + (event.amountDeltaCents ?? 0));
    const eventMetadata = {
      demo: true,
      seededBy: 'seed-demo-operations',
      providerReference: attempt.providerReference,
      orderNumber: order.orderNumber,
      amountCents: actualAmountCents,
      currency: attempt.currency
    };

    const paymentEvent = await prisma.checkoutPaymentEvent.upsert({
      where: {
        provider_idempotencyKey: {
          provider: attempt.provider,
          idempotencyKey: event.idempotencyKey
        }
      },
      create: {
        paymentAttemptId: attempt.id,
        provider: attempt.provider,
        eventType: event.eventType,
        idempotencyKey: event.idempotencyKey,
        status: event.status,
        metadata: eventMetadata,
        processedAt: new Date('2026-06-03T12:15:00.000Z')
      },
      update: {
        paymentAttemptId: attempt.id,
        eventType: event.eventType,
        status: event.status,
        metadata: eventMetadata,
        processedAt: new Date('2026-06-03T12:15:00.000Z')
      },
      select: { id: true }
    });

    const plan = planPaymentSettlementReconciliation({
      provider: attempt.provider,
      providerReference: attempt.providerReference,
      webhookStatus: event.status,
      orderNumber: order.orderNumber,
      orderTotalCents: order.totalCents,
      orderCurrency: order.currency,
      webhookAmountCents: actualAmountCents,
      webhookCurrency: attempt.currency,
      eventId: paymentEvent.id,
      idempotencyKey: event.idempotencyKey
    });

    await prisma.paymentSettlementReconciliation.upsert({
      where: { paymentEventId: paymentEvent.id },
      create: {
        paymentEventId: paymentEvent.id,
        paymentAttemptId: attempt.id,
        orderId: order.id,
        provider: plan.provider,
        providerReference: plan.providerReference,
        orderNumber: plan.orderNumber,
        status: plan.status,
        expectedAmountCents: plan.expectedAmountCents,
        actualAmountCents: plan.actualAmountCents,
        expectedCurrency: plan.expectedCurrency,
        actualCurrency: plan.actualCurrency,
        needsAttention: plan.needsAttention,
        metadata: { ...plan.metadata, demo: true, seededBy: 'seed-demo-operations' }
      },
      update: {
        provider: plan.provider,
        providerReference: plan.providerReference,
        orderNumber: plan.orderNumber,
        status: plan.status,
        expectedAmountCents: plan.expectedAmountCents,
        actualAmountCents: plan.actualAmountCents,
        expectedCurrency: plan.expectedCurrency,
        actualCurrency: plan.actualCurrency,
        needsAttention: plan.needsAttention,
        metadata: { ...plan.metadata, demo: true, seededBy: 'seed-demo-operations' }
      }
    });
  }
}

async function seedDemoAdminAuditLogs() {
  await prisma.adminAuditLog.deleteMany({
    where: { action: { startsWith: 'demo.seed.' } }
  });

  for (const log of demoAuditLogs) {
    await prisma.adminAuditLog.create({
      data: {
        action: log.action,
        entity: log.entity,
        summary: log.summary,
        actorType: 'password',
        actorLabel: log.actorLabel,
        actorEmail: log.actorEmail,
        actorRole: log.actorRole,
        actorProvider: 'password',
        metadata: { demo: true, seededBy: 'seed-demo-operations' }
      }
    });
  }
}

async function main() {
  await seedDemoAdminAccounts();
  await seedDemoPaymentSettlements();
  await seedDemoAdminAuditLogs();
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
