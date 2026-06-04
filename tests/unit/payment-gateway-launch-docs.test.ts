import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function source(path: string) {
  return readFileSync(path, 'utf8');
}

export async function runPaymentGatewayLaunchDocsTests() {
  const checklist = source('docs/production-payment-gateway-launch-checklist.md');
  const productionChecklist = source('docs/PRODUCTION_CHECKLIST.md');
  const phase32 = source('docs/production-roadmap-phase32-payment-webhooks.md');
  const envExample = source('.env.example');

  assert.match(checklist, /Production Payment Gateway Launch Checklist/);
  assert.match(checklist, /CHECKOUT_MODE="gateway"/);
  assert.match(checklist, /PAYMENT_SETTLEMENT_MIGRATION_CONFIRMED="true"/);
  assert.match(checklist, /PAYMENT_WEBHOOK_SMOKE_TESTS_CONFIRMED="true"/);
  assert.match(checklist, /docs\/production-roadmap-phase32-payment-webhook-smoke-tests\.md/);
  assert.match(checklist, /docs\/production-roadmap-phase32-payment-webhook-validation-evidence\.md/);
  assert.match(checklist, /docs\/production-roadmap-phase32-settlement-migration-contract\.md/);
  assert.match(checklist, /admin\/payments\/settlement/);
  assert.match(checklist, /admin\/payments\/alerts/);
  assert.match(checklist, /evidence capture/);
  assert.match(checklist, /Roll back to `CHECKOUT_MODE="inquiry"`|Switch `CHECKOUT_MODE` back to `inquiry`/);

  assert.match(productionChecklist, /docs\/production-payment-gateway-launch-checklist\.md/);
  assert.match(productionChecklist, /docs\/production-roadmap-phase32-payment-webhook-validation-evidence\.md/);
  assert.match(productionChecklist, /docs\/production-roadmap-phase32-settlement-migration-contract\.md/);
  assert.match(productionChecklist, /PAYMENT_SETTLEMENT_MIGRATION_CONFIRMED/);
  assert.match(productionChecklist, /PAYMENT_WEBHOOK_SMOKE_TESTS_CONFIRMED/);
  assert.match(productionChecklist, /Phase 32 settlement reconciliation migration/);
  assert.match(productionChecklist, /If gateway checkout is in scope/);

  assert.match(phase32, /production-payment-gateway-launch-checklist\.md/);
  assert.match(phase32, /conditional deploy-readiness blockers/);
  assert.match(phase32, /production gateway launch checklist/);

  assert.match(envExample, /PAYMENT_SETTLEMENT_MIGRATION_CONFIRMED="false"/);
  assert.match(envExample, /PAYMENT_WEBHOOK_SMOKE_TESTS_CONFIRMED="false"/);

  console.log('payment-gateway-launch-docs.test.ts passed');
}
