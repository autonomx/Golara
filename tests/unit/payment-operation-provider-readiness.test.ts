import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  buildPaymentOperationProviderReadiness,
  buildPaymentOperationProviderReadinessSummary
} from '../../lib/checkout/payment-operation-provider-readiness';
import { buildPaymentOperationProviderReadinessRouteResult } from '../../lib/checkout/payment-operation-provider-readiness-route-core';

function source(path: string) {
  return readFileSync(path, 'utf8');
}

function assertNoExecutionSurface(pageSource: string) {
  assert.equal(pageSource.includes('fetch('), false);
  assert.equal(pageSource.includes('@prisma/client'), false);
  assert.equal(pageSource.includes('prisma.'), false);
  assert.equal(pageSource.includes('executePaymentOperationAdapter'), false);
  assert.equal(pageSource.includes('createStripePaymentOperationHttpAdapter'), false);
  assert.equal(pageSource.includes('createZarinPalPaymentOperationHttpAdapter'), false);
  assert.equal(pageSource.includes('https://api.stripe.com'), false);
  assert.equal(pageSource.includes('https://www.zarinpal.com'), false);
  assert.equal(pageSource.includes('onClick='), false);
  assert.equal(pageSource.includes('<button'), false);
  assert.equal(pageSource.includes('CheckoutOrder" SET'), false);
  assert.equal(pageSource.includes('CheckoutPaymentAttempt" SET'), false);
}

export async function runPaymentOperationProviderReadinessTests() {
  const readinessSource = source('lib/checkout/payment-operation-provider-readiness.ts');
  const readinessRouteCore = source('lib/checkout/payment-operation-provider-readiness-route-core.ts');
  const readinessPanel = source('components/admin/AdminPaymentOperationProviderReadinessPanel.tsx');
  const readinessPage = source('app/admin/payments/operations/providers/page.tsx');
  const operationsPage = source('app/admin/payments/operations/page.tsx');
  const previewPage = source('app/admin/payments/operations/preview/page.tsx');
  const historyPage = source('app/admin/payments/operations/history/page.tsx');
  const settlementPage = source('app/admin/payments/settlement/page.tsx');
  const navigationDocs = source('docs/production-roadmap-phase33-payment-operation-admin-navigation.md');
  const operatorRunbook = source('docs/production-roadmap-phase33-payment-operation-operator-runbook.md');
  const goNoGoChecklist = source('docs/production-roadmap-phase33-refund-void-go-no-go-checklist.md');
  const providerEvidenceExample = source('docs/production-roadmap-phase33-provider-readiness-evidence-example.md');
  const smokeTestChecklist = source('docs/production-roadmap-phase33-refund-void-smoke-test-checklist.md');
  const phase33Docs = source('docs/production-roadmap-phase33-payment-operations.md');
  const productionRoadmap = source('docs/production-roadmap.md');
  const mainRoadmapGuardNote = source('docs/production-roadmap-phase33-main-roadmap-guard-note.md');
  const coverageIndex = source('docs/production-roadmap-phase33-coverage-index.md');

  const stripeBlocked = buildPaymentOperationProviderReadiness({ provider: 'stripe', env: {} });
  assert.equal(stripeBlocked.provider, 'stripe');
  assert.equal(stripeBlocked.status, 'needs_operator_evidence');
  assert.equal(stripeBlocked.executionEnabled, false);
  assert.deepEqual(stripeBlocked.supportedOperations, ['refund', 'void']);
  assert.deepEqual(stripeBlocked.credentialEnvironmentVariables, ['STRIPE_SECRET_KEY']);
  assert.ok(stripeBlocked.blockers.includes('provider_credentials_missing'));
  assert.ok(stripeBlocked.blockers.includes('provider_endpoint_mapping_unconfirmed'));
  assert.ok(stripeBlocked.warnings.includes('provider_validation_evidence_pending'));
  assert.equal(stripeBlocked.checks.find((check) => check.key === 'STRIPE_SECRET_KEY')?.status, 'missing');
  assert.equal(stripeBlocked.checks.find((check) => check.key === 'endpoint_mapping_evidence')?.status, 'pending');
  assert.equal(stripeBlocked.checks.find((check) => check.key === 'live_provider_validation')?.status, 'pending');
  assert.ok(stripeBlocked.checks.find((check) => check.key === 'STRIPE_SECRET_KEY')?.detail.includes('outside source control'));

  const stripeReady = buildPaymentOperationProviderReadiness({
    provider: 'stripe',
    env: { STRIPE_SECRET_KEY: 'sk_test_example' },
    endpointMappingConfirmed: true,
    liveValidationConfirmed: true
  });
  assert.equal(stripeReady.status, 'ready');
  assert.equal(stripeReady.executionEnabled, false);
  assert.deepEqual(stripeReady.blockers, []);
  assert.deepEqual(stripeReady.warnings, []);
  assert.equal(stripeReady.checks.find((check) => check.key === 'STRIPE_SECRET_KEY')?.status, 'ready');
  assert.equal(stripeReady.checks.find((check) => check.key === 'endpoint_mapping_evidence')?.status, 'ready');
  assert.equal(stripeReady.checks.find((check) => check.key === 'live_provider_validation')?.status, 'ready');

  const zarinpalPending = buildPaymentOperationProviderReadiness({
    provider: 'zarin-pal',
    env: { ZARINPAL_MERCHANT_ID: 'merchant-1' },
    endpointMappingConfirmed: false,
    liveValidationConfirmed: true
  });
  assert.equal(zarinpalPending.provider, 'zarinpal');
  assert.equal(zarinpalPending.status, 'needs_operator_evidence');
  assert.deepEqual(zarinpalPending.credentialEnvironmentVariables, ['ZARINPAL_MERCHANT_ID']);
  assert.ok(zarinpalPending.blockers.includes('provider_endpoint_mapping_unconfirmed'));
  assert.equal(zarinpalPending.checks.find((check) => check.key === 'ZARINPAL_MERCHANT_ID')?.status, 'ready');
  assert.equal(zarinpalPending.checks.find((check) => check.key === 'endpoint_mapping_evidence')?.status, 'pending');
  assert.equal(zarinpalPending.checks.find((check) => check.key === 'live_provider_validation')?.status, 'ready');

  const manual = buildPaymentOperationProviderReadiness({ provider: 'manual' });
  assert.equal(manual.status, 'manual_review');
  assert.equal(manual.executionEnabled, false);
  assert.ok(manual.warnings.includes('manual_provider_requires_operator_review'));
  assert.equal(manual.checks.find((check) => check.key === 'credentials_not_required')?.status, 'not_required');
  assert.equal(manual.checks.find((check) => check.key === 'manual_review_required')?.status, 'pending');

  const unknown = buildPaymentOperationProviderReadiness({ provider: 'unknown-provider' });
  assert.equal(unknown.provider, 'unknown');
  assert.equal(unknown.status, 'unavailable');
  assert.equal(unknown.executionEnabled, false);
  assert.ok(unknown.blockers.includes('provider_operation_adapter_unavailable'));
  assert.equal(unknown.checks.find((check) => check.key === 'provider_supported')?.status, 'missing');

  const summary = buildPaymentOperationProviderReadinessSummary([
    { provider: 'stripe', env: { STRIPE_SECRET_KEY: 'sk_test_example' }, endpointMappingConfirmed: true, liveValidationConfirmed: true },
    { provider: 'zarinpal', env: { ZARINPAL_MERCHANT_ID: 'merchant-1' }, endpointMappingConfirmed: false, liveValidationConfirmed: true },
    { provider: 'manual' },
    { provider: 'not-real' }
  ]);
  assert.equal(summary.ready, false);
  assert.equal(summary.total, 4);
  assert.equal(summary.readyCount, 1);
  assert.equal(summary.needsOperatorEvidence, 1);
  assert.equal(summary.manualReview, 1);
  assert.equal(summary.unavailable, 1);

  const routeResult = buildPaymentOperationProviderReadinessRouteResult({
    env: { STRIPE_SECRET_KEY: 'sk_test_example' },
    endpointMappingConfirmed: true,
    liveValidationConfirmed: false,
    providers: ['stripe', 'manual', 'not-real']
  });
  assert.equal(routeResult.status, 200);
  assert.equal(routeResult.body.ok, true);
  assert.equal(routeResult.body.executionEnabled, false);
  assert.equal(routeResult.body.summary.total, 3);
  assert.equal(routeResult.body.summary.readyCount, 0);
  assert.equal(routeResult.body.summary.needsOperatorEvidence, 1);
  assert.equal(routeResult.body.summary.manualReview, 1);
  assert.equal(routeResult.body.summary.unavailable, 1);

  const defaultRouteResult = buildPaymentOperationProviderReadinessRouteResult({ env: {} });
  assert.equal(defaultRouteResult.status, 200);
  assert.equal(defaultRouteResult.body.ok, true);
  assert.equal(defaultRouteResult.body.executionEnabled, false);
  assert.equal(defaultRouteResult.body.summary.total, 3);
  assert.equal(defaultRouteResult.body.summary.providers.map((provider) => provider.provider).join(','), 'stripe,zarinpal,manual');
  assert.equal(defaultRouteResult.body.summary.needsOperatorEvidence, 2);
  assert.equal(defaultRouteResult.body.summary.manualReview, 1);

  assert.ok(readinessSource.includes('buildPaymentOperationProviderReadiness'));
  assert.ok(readinessSource.includes('buildPaymentOperationProviderReadinessSummary'));
  assert.ok(readinessSource.includes('executionEnabled: false'));
  assert.ok(readinessSource.includes('provider_endpoint_mapping_unconfirmed'));
  assert.ok(readinessSource.includes('provider_validation_evidence_pending'));
  assert.ok(readinessSource.includes('provider_credentials_missing'));
  assert.ok(readinessSource.includes('manual_provider_requires_operator_review'));
  assert.ok(readinessSource.includes('Concrete provider endpoint mapping remains pending operator confirmation.'));
  assert.ok(readinessSource.includes('Provider validation evidence is marked confirmed for diagnostics.'));
  assert.ok(readinessSource.includes('normalizePaymentOperationAdapterProvider'));
  assertNoExecutionSurface(readinessSource);

  assert.ok(readinessRouteCore.includes('buildPaymentOperationProviderReadinessRouteResult'));
  assert.ok(readinessRouteCore.includes('buildPaymentOperationProviderReadinessSummary'));
  assert.ok(readinessRouteCore.includes('executionEnabled: false'));
  assert.ok(readinessRouteCore.includes("['stripe', 'zarinpal', 'manual']"));
  assertNoExecutionSurface(readinessRouteCore);

  assert.ok(readinessPanel.includes('AdminPaymentOperationProviderReadinessPanel'));
  assert.ok(readinessPanel.includes('PaymentOperationProviderReadinessSummary'));
  assert.ok(readinessPanel.includes('Read-only diagnostics'));
  assert.ok(readinessPanel.includes('without secrets, provider calls, or execution controls'));
  assert.ok(readinessPanel.includes('Execution:</span> disabled'));
  assertNoExecutionSurface(readinessPanel);

  assert.ok(readinessPage.includes('AdminPaymentOperationProviderReadinessPanel'));
  assert.ok(readinessPage.includes('buildPaymentOperationProviderReadinessRouteResult'));
  assert.ok(readinessPage.includes('readinessResult.body.summary'));
  assert.ok(readinessPage.includes('/admin/payments/operations'));
  assert.ok(readinessPage.includes('Execution remains disabled'));
  assert.ok(readinessPage.includes('informational only'));
  assertNoExecutionSurface(readinessPage);

  assert.ok(operationsPage.includes('/admin/payments/operations/providers'));
  assert.ok(operationsPage.includes('/admin/payments/operations/history'));
  assert.ok(operationsPage.includes('/admin/payments/operations/preview'));
  assert.ok(operationsPage.includes('Execution remains disabled'));
  assert.ok(operationsPage.includes('navigation-only'));
  assertNoExecutionSurface(operationsPage);

  assert.ok(previewPage.includes('/admin/payments/operations'));
  assert.ok(previewPage.includes('/admin/payments/settlement'));
  assert.ok(previewPage.includes('Read-only Phase 33 preview entry point'));
  assertNoExecutionSurface(previewPage);

  assert.ok(historyPage.includes('/admin/payments/operations'));
  assert.ok(historyPage.includes('/admin/payments/operations/preview'));
  assert.ok(historyPage.includes('/admin/payments/settlement'));
  assert.ok(historyPage.includes('Read-only Phase 33 operation history'));
  assertNoExecutionSurface(historyPage);

  assert.ok(settlementPage.includes('/admin/payments/operations'));
  assert.ok(settlementPage.includes('/admin/payments/operations/providers'));
  assert.ok(settlementPage.includes('/admin/payments/operations/history'));
  assert.ok(settlementPage.includes('/admin/payments/operations/preview'));
  assert.ok(settlementPage.includes('read-only Phase 33 diagnostics'));
  assert.ok(settlementPage.includes('do not execute provider adapters'));
  assertNoExecutionSurface(settlementPage);

  assert.ok(navigationDocs.includes('/admin/payments/operations'));
  assert.ok(navigationDocs.includes('/admin/payments/operations/providers'));
  assert.ok(navigationDocs.includes('/admin/payments/operations/history'));
  assert.ok(navigationDocs.includes('/admin/payments/operations/preview'));
  assert.ok(navigationDocs.includes('documentation-only'));
  assert.ok(navigationDocs.includes('must remain read-only'));
  assert.ok(navigationDocs.includes('Do not attempt live refund/void execution'));
  assertNoExecutionSurface(navigationDocs);

  assert.ok(operatorRunbook.includes('/admin/payments/operations'));
  assert.ok(operatorRunbook.includes('/admin/payments/operations/providers'));
  assert.ok(operatorRunbook.includes('/admin/payments/operations/history?orderId=<order-id>'));
  assert.ok(operatorRunbook.includes('documentation-only'));
  assert.ok(operatorRunbook.includes('PAYMENT_OPERATION_RECORDS_MIGRATION_CONFIRMED=true'));
  assert.ok(operatorRunbook.includes('executionEnabled: false'));
  assert.ok(operatorRunbook.includes('Do not use Phase 33 read-only surfaces'));
  assert.ok(operatorRunbook.includes('docs/production-roadmap-phase33-provider-endpoint-mapping-readiness.md'));
  assertNoExecutionSurface(operatorRunbook);

  assert.ok(goNoGoChecklist.includes('Status: **NO-GO for live refund/void execution**'));
  assert.ok(goNoGoChecklist.includes('PAYMENT_OPERATION_RECORDS_MIGRATION_CONFIRMED=true'));
  assert.ok(goNoGoChecklist.includes('docs/production-roadmap-phase33-provider-endpoint-mapping-readiness.md'));
  assert.ok(goNoGoChecklist.includes('Go criteria for a future guarded execution slice'));
  assert.ok(goNoGoChecklist.includes('No-go triggers'));
  assert.ok(goNoGoChecklist.includes('truthful verification reporting'));
  assert.ok(goNoGoChecklist.includes('admin navigation that remains read-only'));
  assertNoExecutionSurface(goNoGoChecklist);

  assert.ok(providerEvidenceExample.includes('Status: **documentation-only example**'));
  assert.ok(providerEvidenceExample.includes('NO-GO for live refund/void execution'));
  assert.ok(providerEvidenceExample.includes('STRIPE_SECRET_KEY'));
  assert.ok(providerEvidenceExample.includes('ZARINPAL_MERCHANT_ID'));
  assert.ok(providerEvidenceExample.includes('Execution enabled | false'));
  assert.ok(providerEvidenceExample.includes('Admin execution enabled: false'));
  assert.ok(providerEvidenceExample.includes('PAYMENT_OPERATION_RECORDS_MIGRATION_CONFIRMED=true'));
  assert.ok(providerEvidenceExample.includes('no order/payment mutation'));
  assert.ok(providerEvidenceExample.includes('does not enable live provider execution'));
  assertNoExecutionSurface(providerEvidenceExample);

  assert.ok(smokeTestChecklist.includes('Status: **documentation-only checklist**'));
  assert.ok(smokeTestChecklist.includes('NO-GO for live refund/void execution'));
  assert.ok(smokeTestChecklist.includes('PAYMENT_OPERATION_RECORDS_MIGRATION_CONFIRMED=true'));
  assert.ok(smokeTestChecklist.includes('docs/production-roadmap-phase33-provider-readiness-evidence-example.md'));
  assert.ok(smokeTestChecklist.includes('executionEnabled: false'));
  assert.ok(smokeTestChecklist.includes('Adapter execution enabled: false'));
  assert.ok(smokeTestChecklist.includes('Admin execution enabled: false'));
  assert.ok(smokeTestChecklist.includes('Order/payment mutation enabled: false'));
  assert.ok(smokeTestChecklist.includes('Inventory/capacity release enabled: false'));
  assert.ok(smokeTestChecklist.includes('verification results are assumed rather than actually run'));
  assertNoExecutionSurface(smokeTestChecklist);

  assert.ok(phase33Docs.includes('read-only provider-operation readiness diagnostics'));
  assert.ok(phase33Docs.includes('/admin/payments/operations/providers'));
  assert.ok(phase33Docs.includes('/admin/payments/operations`'));
  assert.ok(phase33Docs.includes('payment settlement admin page'));
  assert.ok(phase33Docs.includes('navigation consistency'));
  assert.ok(phase33Docs.includes('payment-operation-admin-navigation'));
  assert.ok(phase33Docs.includes('payment-operation-operator-runbook'));
  assert.ok(phase33Docs.includes('refund-void-go-no-go-checklist'));
  assert.ok(phase33Docs.includes('provider-readiness-evidence-example'));
  assert.ok(phase33Docs.includes('refund-void-smoke-test-checklist'));
  assert.ok(phase33Docs.includes('production-roadmap-phase33-coverage-index.md'));
  assert.ok(phase33Docs.includes('Updated `docs/production-roadmap-phase33-coverage-index.md` to record the provider-readiness source guard and the Phase 33 tracker follow-up after PR #280.'));

  assert.ok(coverageIndex.includes('Phase 33 Coverage Index'));
  assert.ok(coverageIndex.includes('Status: documentation-only index'));
  assert.ok(coverageIndex.includes('production-roadmap-phase33-coverage-progress-20260604.md'));
  assert.ok(coverageIndex.includes('production-roadmap-phase33-history-pending-row-coverage.md'));
  assert.ok(coverageIndex.includes('production-roadmap-phase33-history-doc-guard.md'));
  assert.ok(coverageIndex.includes('implemented in PR #275'));
  assert.ok(coverageIndex.includes('source-guards this coverage index'));
  assert.ok(coverageIndex.includes('source-guarded coverage-index status after PR #280'));
  assert.ok(coverageIndex.includes('follow-up source guard are now closed'));
  assert.ok(coverageIndex.includes('documentation-only'));
  assert.ok(coverageIndex.includes('does not change runtime behavior'));
  assert.ok(coverageIndex.includes('provider behavior'));
  assert.ok(coverageIndex.includes('order/payment state'));
  assert.ok(coverageIndex.includes('Prisma model access'));
  assertNoExecutionSurface(coverageIndex);

  assert.ok(productionRoadmap.includes('Phase 33 — refunds, voids, and payment operations'));
  assert.ok(productionRoadmap.includes('NO-GO for live refund/void execution'));
  assert.ok(productionRoadmap.includes('docs/production-roadmap-phase33-payment-operations.md'));
  assert.ok(productionRoadmap.includes('docs/production-roadmap-phase33-provider-readiness-evidence-example.md'));
  assert.ok(productionRoadmap.includes('docs/production-roadmap-phase33-refund-void-smoke-test-checklist.md'));
  assert.ok(productionRoadmap.includes('PAYMENT_OPERATION_RECORDS_MIGRATION_CONFIRMED=true'));
  assert.ok(productionRoadmap.includes('executionEnabled: false'));
  assert.ok(productionRoadmap.includes('default fetch behavior'));
  assert.ok(productionRoadmap.includes('Prisma model/client access for `PaymentOperationRecord`'));
  assertNoExecutionSurface(productionRoadmap);

  assert.ok(mainRoadmapGuardNote.includes('Status: documentation-only.'));
  assert.ok(mainRoadmapGuardNote.includes('docs/production-roadmap.md'));
  assert.ok(mainRoadmapGuardNote.includes('tests/unit/payment-operation-provider-readiness.test.ts'));
  assert.ok(mainRoadmapGuardNote.includes('docs/production-roadmap-phase33-payment-operations.md'));
  assert.ok(mainRoadmapGuardNote.includes('docs/production-roadmap-phase33-provider-readiness-evidence-example.md'));
  assert.ok(mainRoadmapGuardNote.includes('docs/production-roadmap-phase33-refund-void-smoke-test-checklist.md'));
  assert.ok(mainRoadmapGuardNote.includes('read-only planning and diagnostics'));
  assert.ok(mainRoadmapGuardNote.includes('disabled provider-readiness execution'));
  assert.ok(mainRoadmapGuardNote.includes('no default HTTP behavior'));
  assert.ok(mainRoadmapGuardNote.includes('no Prisma client model path for `PaymentOperationRecord`'));
  assert.ok(mainRoadmapGuardNote.includes('does not change runtime behavior'));
  assertNoExecutionSurface(mainRoadmapGuardNote);

  console.log('payment-operation-provider-readiness.test.ts passed');
}
