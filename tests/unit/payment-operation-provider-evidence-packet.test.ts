import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { validatePaymentOperationProviderEvidencePacket } from '../../lib/checkout/payment-operation-provider-readiness';

function source(path: string) {
  return readFileSync(path, 'utf8');
}

function assertNoExecutionSurface(pageSource: string) {
  assert.equal(pageSource.includes('fetch('), false);
  assert.equal(pageSource.includes('@prisma/client'), false);
  assert.equal(pageSource.includes('prisma.'), false);
  assert.equal(pageSource.includes('executePaymentOperationAdapter'), false);
  assert.equal(pageSource.includes('https://api.stripe.com'), false);
  assert.equal(pageSource.includes('https://www.zarinpal.com'), false);
  assert.equal(pageSource.includes('CheckoutOrder" SET'), false);
  assert.equal(pageSource.includes('CheckoutPaymentAttempt" SET'), false);
}

export async function runPaymentOperationProviderEvidencePacketTests() {
  const readinessSource = source('lib/checkout/payment-operation-provider-readiness.ts');
  const phase33Docs = source('docs/production-roadmap-phase33-payment-operations.md');
  const goNoGoChecklist = source('docs/production-roadmap-phase33-refund-void-go-no-go-checklist.md');
  const providerEvidenceExample = source('docs/production-roadmap-phase33-provider-readiness-evidence-example.md');

  const partialStripe = validatePaymentOperationProviderEvidencePacket({
    provider: 'stripe',
    endpointMappingConfirmed: true,
    liveValidationConfirmed: true
  });
  assert.equal(partialStripe.provider, 'stripe');
  assert.equal(partialStripe.complete, false);
  assert.equal(partialStripe.executionEnabled, false);
  assert.ok(partialStripe.missing.includes('credential_evidence_missing'));
  assert.ok(partialStripe.missing.includes('idempotency_evidence_missing'));
  assert.ok(partialStripe.missing.includes('response_example_evidence_missing'));
  assert.ok(partialStripe.missing.includes('dashboard_evidence_missing'));

  const completeZarinpal = validatePaymentOperationProviderEvidencePacket({
    provider: 'zarin-pal',
    endpointMappingConfirmed: true,
    liveValidationConfirmed: true,
    credentialEvidenceCaptured: true,
    idempotencyEvidenceCaptured: true,
    responseExampleCaptured: true,
    dashboardEvidenceCaptured: true
  });
  assert.equal(completeZarinpal.provider, 'zarinpal');
  assert.equal(completeZarinpal.complete, true);
  assert.equal(completeZarinpal.executionEnabled, false);
  assert.deepEqual(completeZarinpal.missing, []);

  const manual = validatePaymentOperationProviderEvidencePacket({ provider: 'manual' });
  assert.equal(manual.complete, false);
  assert.equal(manual.executionEnabled, false);
  assert.ok(manual.warnings.includes('manual_provider_requires_operator_review'));

  const unknown = validatePaymentOperationProviderEvidencePacket({ provider: 'not-real' });
  assert.equal(unknown.provider, 'unknown');
  assert.equal(unknown.complete, false);
  assert.equal(unknown.executionEnabled, false);
  assert.ok(unknown.missing.includes('provider_operation_adapter_unavailable'));

  assert.ok(readinessSource.includes('validatePaymentOperationProviderEvidencePacket'));
  assert.ok(readinessSource.includes('credential_evidence_missing'));
  assert.ok(readinessSource.includes('idempotency_evidence_missing'));
  assert.ok(readinessSource.includes('response_example_evidence_missing'));
  assert.ok(readinessSource.includes('dashboard_evidence_missing'));
  assert.ok(readinessSource.includes('executionEnabled: false'));
  assertNoExecutionSurface(readinessSource);

  assert.ok(phase33Docs.includes('provider evidence-packet validation helper'));
  assert.ok(phase33Docs.includes('executionEnabled: false'));
  assert.ok(goNoGoChecklist.includes('evidence-packet validation'));
  assert.ok(providerEvidenceExample.includes('Evidence packet validation'));

  console.log('payment-operation-provider-evidence-packet.test.ts passed');
}
