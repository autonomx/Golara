import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  buildPaymentOperationProviderReadiness,
  buildPaymentOperationProviderReadinessSummary
} from '../../lib/checkout/payment-operation-provider-readiness';

function source(path: string) {
  return readFileSync(path, 'utf8');
}

export async function runPaymentOperationProviderReadinessTests() {
  const readinessSource = source('lib/checkout/payment-operation-provider-readiness.ts');
  const phase33Docs = source('docs/production-roadmap-phase33-payment-operations.md');

  const stripeBlocked = buildPaymentOperationProviderReadiness({ provider: 'stripe', env: {} });
  assert.equal(stripeBlocked.provider, 'stripe');
  assert.equal(stripeBlocked.status, 'needs_operator_evidence');
  assert.equal(stripeBlocked.executionEnabled, false);
  assert.deepEqual(stripeBlocked.supportedOperations, ['refund', 'void']);
  assert.deepEqual(stripeBlocked.credentialEnvironmentVariables, ['STRIPE_SECRET_KEY']);
  assert.ok(stripeBlocked.blockers.includes('provider_credentials_missing'));
  assert.ok(stripeBlocked.blockers.includes('provider_endpoint_mapping_unconfirmed'));
  assert.ok(stripeBlocked.warnings.includes('provider_validation_evidence_pending'));

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

  const manual = buildPaymentOperationProviderReadiness({ provider: 'manual' });
  assert.equal(manual.status, 'manual_review');
  assert.equal(manual.executionEnabled, false);
  assert.ok(manual.warnings.includes('manual_provider_requires_operator_review'));
  assert.equal(manual.checks.find((check) => check.key === 'credentials_not_required')?.status, 'not_required');

  const unknown = buildPaymentOperationProviderReadiness({ provider: 'unknown-provider' });
  assert.equal(unknown.provider, 'unknown');
  assert.equal(unknown.status, 'unavailable');
  assert.equal(unknown.executionEnabled, false);
  assert.ok(unknown.blockers.includes('provider_operation_adapter_unavailable'));

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

  assert.ok(readinessSource.includes('buildPaymentOperationProviderReadiness'));
  assert.ok(readinessSource.includes('buildPaymentOperationProviderReadinessSummary'));
  assert.ok(readinessSource.includes('executionEnabled: false'));
  assert.ok(readinessSource.includes('provider_endpoint_mapping_unconfirmed'));
  assert.ok(readinessSource.includes('provider_validation_evidence_pending'));
  assert.ok(readinessSource.includes('provider_credentials_missing'));
  assert.ok(readinessSource.includes('manual_provider_requires_operator_review'));
  assert.ok(readinessSource.includes('normalizePaymentOperationAdapterProvider'));
  assert.equal(readinessSource.includes('fetch('), false);
  assert.equal(readinessSource.includes('@prisma/client'), false);
  assert.equal(readinessSource.includes('prisma.'), false);
  assert.equal(readinessSource.includes('CheckoutOrder" SET'), false);
  assert.equal(readinessSource.includes('CheckoutPaymentAttempt" SET'), false);
  assert.equal(readinessSource.includes('executePaymentOperationAdapter'), false);
  assert.equal(readinessSource.includes('createStripePaymentOperationHttpAdapter'), false);
  assert.equal(readinessSource.includes('createZarinPalPaymentOperationHttpAdapter'), false);
  assert.equal(readinessSource.includes('https://api.stripe.com'), false);
  assert.equal(readinessSource.includes('https://www.zarinpal.com'), false);

  assert.ok(phase33Docs.includes('read-only provider-operation readiness diagnostics'));

  console.log('payment-operation-provider-readiness.test.ts passed');
}
