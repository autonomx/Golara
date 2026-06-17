import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function source(path: string) {
  return readFileSync(path, 'utf8');
}

export async function runPaymentGatewayLaunchDocsTests() {
  const checklist = source('docs/production-payment-gateway-launch-checklist.md');
  const evidenceBundle = source('docs/production-payment-launch-evidence-bundle.md');
  const localE2eRunbook = source('docs/local-e2e-commerce-validation-runbook.md');
  const remainingPhases = source('docs/digikala-style-payment-remaining-phases.md');
  const productionChecklist = source('docs/PRODUCTION_CHECKLIST.md');
  const phase32 = source('docs/production-roadmap-phase32-payment-webhooks.md');
  const envExample = source('.env.example');
  const readinessGate = source('lib/settings/payment-method-readiness-gate.ts');
  const smokeChecklist = source('lib/settings/payment-method-smoke-checklist.ts');
  const paymentMethodSettingsPanel = source('components/admin/AdminPaymentMethodSettingsPanel.tsx');
  const checkoutAction = source('app/cart/checkout/actions.ts');

  assert.match(checklist, /Production Payment Gateway Launch Checklist/);
  assert.match(checklist, /CHECKOUT_MODE="gateway"/);
  assert.match(checklist, /PAYMENT_SETTLEMENT_MIGRATION_CONFIRMED="true"/);
  assert.match(checklist, /PAYMENT_WEBHOOK_SMOKE_TESTS_CONFIRMED="true"/);
  assert.match(checklist, /docs\/production-roadmap-phase32-payment-webhook-smoke-tests\.md/);
  assert.match(checklist, /docs\/production-roadmap-phase32-payment-webhook-validation-evidence\.md/);
  assert.match(checklist, /docs\/production-roadmap-phase32-settlement-migration-contract\.md/);
  assert.match(checklist, /docs\/production-payment-launch-evidence-bundle\.md/);
  assert.match(checklist, /admin\/payments\/settlement/);
  assert.match(checklist, /admin\/payments\/alerts/);
  assert.match(checklist, /evidence capture/);
  assert.match(checklist, /Roll back to `CHECKOUT_MODE="inquiry"`|Switch `CHECKOUT_MODE` back to `inquiry`/);

  assert.match(checklist, /lib\/settings\/payment-method-readiness-gate\.ts/);
  assert.match(checklist, /lib\/settings\/payment-method-smoke-checklist\.ts/);
  assert.match(checklist, /components\/admin\/AdminPaymentMethodSettingsPanel\.tsx/);
  assert.match(checklist, /\/admin\/payment-methods/);
  assert.match(checklist, /\/admin\/payments\/reconciliation\/csv/);
  assert.match(checklist, /wallet liability summary/);
  assert.match(checklist, /manual-transfer settlement totals/);
  assert.match(checklist, /installment customer messages and receivables summary/);
  assert.match(checklist, /COD adjustment evidence, and COD collection totals/);
  assert.match(checklist, /Customer-facing order copy and receipt\/reminder copy/);
  assert.match(checklist, /method-specific smoke checklist/);
  assert.match(checklist, /advisory in the current codebase/);

  assert.match(evidenceBundle, /Production Payment Launch Evidence Bundle/);
  assert.match(evidenceBundle, /does \*\*not\*\* claim that staging or production validation has been completed/);
  assert.match(evidenceBundle, /Target environment and deployment URL/);
  assert.match(evidenceBundle, /missing operational evidence keys/);
  assert.match(evidenceBundle, /lib\/settings\/payment-method-readiness-gate\.ts/);
  assert.match(evidenceBundle, /lib\/settings\/payment-method-smoke-checklist\.ts/);
  assert.match(evidenceBundle, /\/admin\/payment-methods/);
  assert.match(evidenceBundle, /\/admin\/payments\/settlement/);
  assert.match(evidenceBundle, /\/admin\/payments\/reconciliation\/csv/);
  assert.match(evidenceBundle, /Notification delivery evidence/);
  assert.match(evidenceBundle, /Gateway\/IPG/);
  assert.match(evidenceBundle, /Wallet\/store credit/);
  assert.match(evidenceBundle, /Manual transfer\/card-to-card/);
  assert.match(evidenceBundle, /Installment\/credit/);
  assert.match(evidenceBundle, /COD/);
  assert.match(evidenceBundle, /docs\/LAUNCH_AUDIT\.md/);
  assert.match(evidenceBundle, /docs\/PRODUCTION_CHECKLIST\.md/);
  assert.match(evidenceBundle, /docs\/production-payment-gateway-launch-checklist\.md/);
  assert.match(evidenceBundle, /APP_MODE="production" npm run check:deploy-readiness/);
  assert.match(evidenceBundle, /PAYMENT_SETTLEMENT_MIGRATION_CONFIRMED=true/);
  assert.match(evidenceBundle, /Target-environment payment validation/);

  assert.match(localE2eRunbook, /Local E2E Commerce Validation Runbook/);
  assert.match(localE2eRunbook, /does \*\*not\*\* claim that local, staging, or production validation has been completed/);
  assert.match(localE2eRunbook, /npm run typecheck/);
  assert.match(localE2eRunbook, /npm run test:unit/);
  assert.match(localE2eRunbook, /npm run test:functional/);
  assert.match(localE2eRunbook, /npm run test:api/);
  assert.match(localE2eRunbook, /npm run test:nonbrowser/);
  assert.match(localE2eRunbook, /npm run test:e2e/);
  assert.match(localE2eRunbook, /npm run test:e2e:production-like/);
  assert.match(localE2eRunbook, /npm run build/);
  assert.match(localE2eRunbook, /npm run check:performance-budget/);
  assert.match(localE2eRunbook, /npm run check:routes/);
  assert.match(localE2eRunbook, /APP_MODE="production" CHECKOUT_MODE="inquiry" npm run check:deploy-readiness/);
  assert.match(localE2eRunbook, /APP_MODE="production" CHECKOUT_MODE="gateway" npm run check:deploy-readiness/);
  assert.match(localE2eRunbook, /production secrets/);
  assert.match(localE2eRunbook, /provider-generated webhooks/);
  assert.match(localE2eRunbook, /\/admin\/payment-methods/);
  assert.match(localE2eRunbook, /\/admin\/payments\/settlement/);
  assert.match(localE2eRunbook, /\/admin\/payments\/alerts/);
  assert.match(localE2eRunbook, /\/admin\/payments\/reconciliation\/csv/);
  assert.match(localE2eRunbook, /rollback to inquiry\/manual checkout/i);
  assert.doesNotMatch(localE2eRunbook, /PAYMENT_SETTLEMENT_MIGRATION_CONFIRMED="true"/);
  assert.doesNotMatch(localE2eRunbook, /PAYMENT_WEBHOOK_SMOKE_TESTS_CONFIRMED="true"/);

  assert.match(remainingPhases, /P10 production launch evidence bundle template/);
  assert.match(remainingPhases, /Completed checkpoint: Start \*\*Phase P10 — production launch evidence bundle\*\* is now complete/);
  assert.match(remainingPhases, /Collect target-environment P10 evidence outside source control/);

  assert.match(readinessGate, /blocksCheckout: false/);
  assert.match(readinessGate, /checkoutBlockingCount: 0/);
  assert.match(readinessGate, /PAYMENT_METHOD_READINESS_GATE_VERSION/);
  assert.match(smokeChecklist, /blocksCheckout: false/);
  assert.match(smokeChecklist, /checkoutBlockingCount: 0/);
  assert.match(smokeChecklist, /PAYMENT_METHOD_SMOKE_CHECKLIST_VERSION/);
  assert.match(paymentMethodSettingsPanel, /summarizePaymentMethodReadinessGates\(methods/);
  assert.match(paymentMethodSettingsPanel, /Checkout remains non-blocking/);
  assert.match(paymentMethodSettingsPanel, /production-payment-gateway-launch-checklist\.md/);
  assert.doesNotMatch(checkoutAction, /payment-method-readiness-gate/);
  assert.doesNotMatch(checkoutAction, /payment-method-smoke-checklist/);
  assert.match(checkoutAction, /resolveCheckoutPaymentMethodSelection\(await paymentMethodSettingsService\.list\(\), paymentMethodKey\)/);
  assert.match(checkoutAction, /checkoutPaymentMethodMetadata\(paymentMethodSelection\.selection\)/);

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
