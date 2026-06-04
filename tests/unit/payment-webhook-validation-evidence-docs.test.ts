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
  assert.match(evidence, /## Completion checklist/);
  assert.match(evidence, /Do not mark this evidence complete/);
  assert.match(evidence, /concrete value, link, screenshot reference, command output, provider event identifier, or operator note/);
  assert.match(evidence, /Deployed SHA matches the target environment/);
  assert.match(evidence, /Settlement migration confirmation flag was enabled only after migration verification/);
  assert.match(evidence, /Webhook smoke-test confirmation flag was enabled only after this evidence was captured/);
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
  assert.match(phase32, /blank provider validation evidence template with a completion checklist/);
  assert.match(phase32, /completion checklist requiring concrete values, links, screenshot references, command output, provider event identifiers, or operator notes/);
  assert.match(phase32, /deployed SHA confirmation, migration verification, provider-generated success\/duplicate\/invalid-signature cases/);
  assert.match(phase32, /confirmation-flag ordering/);
  assert.match(phase32, /## Recommended validation sequence/);
  assert.match(phase32, /Apply and verify `prisma\/migrations\/20260604170000_add_payment_settlement_reconciliation\/migration\.sql`/);
  assert.match(phase32, /PAYMENT_SETTLEMENT_MIGRATION_CONFIRMED="true"/);
  assert.match(phase32, /provider-generated requests, including success, failure\/cancel, duplicate replay, and invalid-signature cases/);
  assert.match(phase32, /PAYMENT_WEBHOOK_SMOKE_TESTS_CONFIRMED="true"/);
  assert.match(phase32, /rollback to `CHECKOUT_MODE="inquiry"` or `CHECKOUT_MODE="assisted"`/);
  assert.match(phase32, /## Phase 32 closeout criteria/);
  assert.match(phase32, /Repo-side Phase 32 can be considered complete/);
  assert.match(phase32, /Target-environment Phase 32 can be considered validated only after/);
  assert.match(phase32, /Out of scope for Phase 32 closeout/);
  assert.match(phase32, /provider-backed refunds\/voids/);
  assert.match(phase32, /Phase 33, Phase 34, and Phase 35 work/);

  console.log('payment-webhook-validation-evidence-docs.test.ts passed');
}
