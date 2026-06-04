import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function source(path: string) {
  return readFileSync(path, 'utf8');
}

export async function runPaymentWebhookValidationEvidenceDocsTests() {
  const evidence = source('docs/production-roadmap-phase32-payment-webhook-validation-evidence.md');
  const phase32 = source('docs/production-roadmap-phase32-payment-webhooks.md');

  assert.match(evidence, /Phase 32 Payment Webhook Validation Evidence Template/);
  assert.match(evidence, /blank operator evidence template/);
  assert.match(evidence, /does not claim that staging or production validation has been completed/);
  assert.match(evidence, /docs\/production-roadmap-phase32-payment-webhook-smoke-tests\.md/);
  assert.match(evidence, /Commit SHA deployed/);
  assert.match(evidence, /PAYMENT_SETTLEMENT_MIGRATION_CONFIRMED="true"/);
  assert.match(evidence, /PAYMENT_WEBHOOK_SMOKE_TESTS_CONFIRMED="true"/);
  assert.match(evidence, /Signature header verified from provider-generated request/);
  assert.match(evidence, /Signature behavior verified from provider-generated request/);
  assert.match(evidence, /Duplicate replay result/);
  assert.match(evidence, /Invalid signature result/);
  assert.match(evidence, /PaymentSettlementReconciliation/);
  assert.match(evidence, /Settlement summary source shown as durable reconciliation records/);
  assert.match(evidence, /\/admin\/payments\/settlement/);
  assert.match(evidence, /\/admin\/payments\/alerts/);
  assert.match(evidence, /Rollback to inquiry-first checkout confirmed/);

  assert.match(phase32, /production-roadmap-phase32-payment-webhook-validation-evidence\.md/);
  assert.match(phase32, /validation evidence template/);
  assert.match(phase32, /does not claim provider validation has been completed/);
  assert.match(phase32, /## Recommended validation sequence/);
  assert.match(phase32, /Apply and verify `prisma\/migrations\/20260604170000_add_payment_settlement_reconciliation\/migration\.sql`/);
  assert.match(phase32, /PAYMENT_SETTLEMENT_MIGRATION_CONFIRMED="true"/);
  assert.match(phase32, /provider-generated requests, including success, failure\/cancel, duplicate replay, and invalid-signature cases/);
  assert.match(phase32, /PAYMENT_WEBHOOK_SMOKE_TESTS_CONFIRMED="true"/);
  assert.match(phase32, /rollback to `CHECKOUT_MODE="inquiry"` or `CHECKOUT_MODE="assisted"`/);

  console.log('payment-webhook-validation-evidence-docs.test.ts passed');
}
