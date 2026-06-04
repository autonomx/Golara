import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { buildSettlementPlanFromSource } from '../../lib/checkout/payment-settlement-repository';

function source(path: string) {
  return readFileSync(path, 'utf8');
}

export async function runPaymentSettlementRepositoryTests() {
  const migration = source('prisma/migrations/20260604170000_add_payment_settlement_reconciliation/migration.sql');
  const repository = source('lib/checkout/payment-settlement-repository.ts');
  const contract = source('docs/production-roadmap-phase32-settlement-migration-contract.md');

  assert.match(migration, /CREATE TABLE IF NOT EXISTS "PaymentSettlementReconciliation"/);
  assert.match(migration, /"paymentEventId" TEXT NOT NULL/);
  assert.match(migration, /"paymentAttemptId" TEXT NOT NULL/);
  assert.match(migration, /"orderId" TEXT NOT NULL/);
  assert.match(migration, /"status" TEXT NOT NULL DEFAULT 'pending'/);
  assert.match(migration, /"needsAttention" BOOLEAN NOT NULL DEFAULT false/);
  assert.match(migration, /PaymentSettlementReconciliation_paymentEventId_key/);
  assert.match(migration, /PaymentSettlementReconciliation_status_idx/);
  assert.match(migration, /PaymentSettlementReconciliation_needsAttention_idx/);

  assert.match(repository, /export function buildSettlementPlanFromSource/);
  assert.match(repository, /export async function upsertPaymentSettlementReconciliation/);
  assert.match(repository, /export async function listPaymentSettlementReconciliations/);
  assert.match(repository, /FROM "CheckoutPaymentEvent" e/);
  assert.match(repository, /INNER JOIN "CheckoutPaymentAttempt" a/);
  assert.match(repository, /INNER JOIN "CheckoutOrder" o/);
  assert.match(repository, /INSERT INTO "PaymentSettlementReconciliation"/);
  assert.match(repository, /ON CONFLICT \("paymentEventId"\) DO UPDATE SET/);
  assert.match(repository, /paymentSettlementRepository = \{/);
  assert.doesNotMatch(repository, /checkoutOrder\.update/);
  assert.doesNotMatch(repository, /checkoutPaymentAttempt\.update/);

  assert.match(contract, /Phase 32 Settlement Migration Contract/);
  assert.match(contract, /documentation only/);
  assert.match(contract, /does not claim the migration has been applied/);
  assert.match(contract, /PaymentSettlementReconciliation` table/);
  assert.match(contract, /not represented as a Prisma model/);
  assert.match(contract, /raw-SQL backed through `lib\/checkout\/payment-settlement-repository\.ts`/);
  assert.match(contract, /prisma generate` does not validate this table/);
  assert.match(contract, /PAYMENT_SETTLEMENT_MIGRATION_CONFIRMED="true"/);
  assert.match(contract, /Avoid mutating checkout orders or payment attempts directly/);

  const settled = buildSettlementPlanFromSource({
    paymentEventId: 'event-1',
    paymentAttemptId: 'attempt-1',
    orderId: 'order-1',
    provider: 'stripe',
    providerReference: 'cs_test_123',
    orderNumber: 'GOL-1001',
    eventStatus: 'paid',
    orderTotalCents: 420000,
    orderCurrency: 'USD',
    attemptAmountCents: 420000,
    attemptCurrency: 'USD',
    eventMetadata: { amountCents: 420000, currency: 'usd' },
    idempotencyKey: 'stripe:event'
  });
  assert.equal(settled.status, 'settled');
  assert.equal(settled.needsAttention, false);

  const mismatch = buildSettlementPlanFromSource({
    paymentEventId: 'event-2',
    paymentAttemptId: 'attempt-2',
    orderId: 'order-2',
    provider: 'zarinpal',
    providerReference: '123456',
    orderNumber: 'GOL-2001',
    eventStatus: 'paid',
    orderTotalCents: 850000,
    orderCurrency: 'TOMAN',
    attemptAmountCents: 850000,
    attemptCurrency: 'TOMAN',
    eventMetadata: { amountCents: 700000, currency: 'toman' },
    idempotencyKey: 'zarinpal:event'
  });
  assert.equal(mismatch.status, 'amount_mismatch');
  assert.equal(mismatch.needsAttention, true);

  console.log('payment-settlement-repository.test.ts passed');
}
