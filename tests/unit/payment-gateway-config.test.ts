import assert from 'node:assert/strict';
import {
  getPaymentGatewayConfig,
  getPaymentGatewayReadiness,
  selectPaymentGatewayForOrder
} from '../../lib/checkout/payment-gateway-config';
import {
  evaluatePaymentMethodReadinessGate,
  summarizePaymentMethodReadinessGates,
  type PaymentMethodReadinessEvidence
} from '../../lib/settings/payment-method-readiness-gate';
import {
  buildPaymentMethodSmokeChecklist,
  summarizePaymentMethodSmokeChecklists,
  type PaymentMethodSmokeEvidence
} from '../../lib/settings/payment-method-smoke-checklist';
import { DEFAULT_DIGIKALA_PAYMENT_METHOD_SETTINGS } from '../../lib/settings/payment-method-settings';

export async function runPaymentGatewayConfigTests() {
  assert.deepEqual(getPaymentGatewayConfig({}), {
    checkoutMode: 'inquiry',
    domesticProvider: 'manual',
    overseasProvider: undefined,
    domesticCurrency: 'TOMAN',
    overseasCurrency: 'USD',
    overseasFallback: 'whatsapp'
  });

  const multiGatewayConfig = getPaymentGatewayConfig({
    CHECKOUT_MODE: ' gateway ',
    CHECKOUT_DOMESTIC_GATEWAY_PROVIDER: ' iranian ',
    CHECKOUT_OVERSEAS_GATEWAY_PROVIDER: ' stripe ',
    CHECKOUT_DOMESTIC_CURRENCY: ' toman ',
    CHECKOUT_OVERSEAS_CURRENCY: ' cad ',
    CHECKOUT_OVERSEAS_FALLBACK: ' stripe '
  });
  assert.deepEqual(multiGatewayConfig, {
    checkoutMode: 'gateway',
    domesticProvider: 'iranian',
    overseasProvider: 'stripe',
    domesticCurrency: 'TOMAN',
    overseasCurrency: 'CAD',
    overseasFallback: 'stripe'
  });
  assert.equal(selectPaymentGatewayForOrder({ region: 'domestic', config: multiGatewayConfig }), 'iranian');
  assert.equal(selectPaymentGatewayForOrder({ region: 'overseas', config: multiGatewayConfig }), 'stripe');

  assert.deepEqual(getPaymentGatewayReadiness(multiGatewayConfig, {
    IRANIAN_GATEWAY_MERCHANT_ID: 'merchant-1',
    STRIPE_SECRET_KEY: 'sk_test_example'
  }), {
    ready: true,
    mode: 'gateway',
    providers: ['iranian', 'stripe'],
    blockers: [],
    warnings: []
  });

  const inquiryReadiness = getPaymentGatewayReadiness(getPaymentGatewayConfig({ CHECKOUT_MODE: 'inquiry' }), {});
  assert.equal(inquiryReadiness.ready, true);
  assert.deepEqual(inquiryReadiness.blockers, []);
  assert.deepEqual(inquiryReadiness.warnings.map((issue) => issue.code), ['checkout_inquiry_mode', 'overseas_whatsapp_fallback']);

  const assistedReadiness = getPaymentGatewayReadiness(getPaymentGatewayConfig({ CHECKOUT_MODE: 'assisted' }), {});
  assert.equal(assistedReadiness.ready, true);
  assert.deepEqual(assistedReadiness.warnings.map((issue) => issue.code), ['checkout_assisted_mode', 'overseas_whatsapp_fallback']);

  const blockedGateway = getPaymentGatewayReadiness(getPaymentGatewayConfig({ CHECKOUT_MODE: 'gateway' }), {});
  assert.equal(blockedGateway.ready, false);
  assert.deepEqual(blockedGateway.blockers.map((issue) => issue.code), ['gateway_mode_without_online_provider']);

  const missingProviderConfig = getPaymentGatewayReadiness(multiGatewayConfig, {});
  assert.equal(missingProviderConfig.ready, false);
  assert.deepEqual(missingProviderConfig.blockers.map((issue) => issue.code), ['iranian_gateway_merchant_missing', 'stripe_secret_missing']);

  const invalidCurrencyConfig = getPaymentGatewayConfig({
    CHECKOUT_MODE: 'gateway',
    CHECKOUT_DOMESTIC_GATEWAY_PROVIDER: 'iranian',
    CHECKOUT_DOMESTIC_CURRENCY: 'USD',
    CHECKOUT_OVERSEAS_GATEWAY_PROVIDER: 'stripe',
    CHECKOUT_OVERSEAS_CURRENCY: 'TOMAN',
    CHECKOUT_OVERSEAS_FALLBACK: 'stripe',
    IRANIAN_GATEWAY_MERCHANT_ID: 'merchant-1',
    STRIPE_SECRET_KEY: 'sk_test_example'
  });
  const invalidCurrencyReadiness = getPaymentGatewayReadiness(invalidCurrencyConfig, {
    IRANIAN_GATEWAY_MERCHANT_ID: 'merchant-1',
    STRIPE_SECRET_KEY: 'sk_test_example'
  });
  assert.equal(invalidCurrencyReadiness.ready, false);
  assert.deepEqual(invalidCurrencyReadiness.blockers.map((issue) => issue.code), ['iranian_gateway_currency_invalid', 'stripe_currency_invalid']);

  const fallbackConfig = getPaymentGatewayConfig({
    CHECKOUT_MODE: 'gateway',
    CHECKOUT_DOMESTIC_GATEWAY_PROVIDER: 'iranian',
    CHECKOUT_OVERSEAS_FALLBACK: 'whatsapp'
  });
  assert.equal(selectPaymentGatewayForOrder({ region: 'overseas', config: fallbackConfig }), 'whatsapp');

  const gatewayMethod = DEFAULT_DIGIKALA_PAYMENT_METHOD_SETTINGS.find((method) => method.key === 'iranian-ipg');
  assert.ok(gatewayMethod);
  const gatewayGate = evaluatePaymentMethodReadinessGate(gatewayMethod, {
    evidence: {
      gatewayReturnMapping: true,
      gatewayWebhookMapping: true,
      gatewayProviderReference: true,
      gatewayRefundVoidAdapter: true
    }
  });
  assert.equal(gatewayGate.status, 'needs-evidence');
  assert.equal(gatewayGate.blocksCheckout, false);
  assert.deepEqual(gatewayGate.missingEvidence, ['gatewayMerchantCredentials']);

  const completeGatewayGate = evaluatePaymentMethodReadinessGate(gatewayMethod, {
    env: { ZARINPAL_MERCHANT_ID: 'merchant-1' },
    evidence: {
      gatewayReturnMapping: true,
      gatewayWebhookMapping: true,
      gatewayProviderReference: true,
      gatewayRefundVoidAdapter: true
    }
  });
  assert.equal(completeGatewayGate.status, 'ready');
  assert.deepEqual(completeGatewayGate.missingEvidence, []);

  const completeEvidence: Record<string, PaymentMethodReadinessEvidence> = {
    'iranian-ipg': {
      gatewayReturnMapping: true,
      gatewayWebhookMapping: true,
      gatewayProviderReference: true,
      gatewayRefundVoidAdapter: true
    },
    'wallet-credit': {
      walletLedgerCapture: true,
      walletRefundReceipt: true,
      walletLiabilityDashboard: true
    },
    'installment-credit': {
      installmentReviewWorkflow: true,
      installmentSchedulePersistence: true,
      installmentReceivablesDashboard: true,
      installmentCustomerMessages: true
    },
    'bank-transfer': {
      manualTransferInstructions: true,
      manualTransferVerification: true,
      manualTransferSettlementTotals: true,
      manualTransferRefundTracking: true
    },
    'cash-on-delivery': {
      codCollectionControls: true,
      codFulfillmentGuard: true,
      codSettlementEvidence: true,
      codCustomerReminder: true
    }
  };
  const summary = summarizePaymentMethodReadinessGates(DEFAULT_DIGIKALA_PAYMENT_METHOD_SETTINGS, {
    env: { ZARINPAL_MERCHANT_ID: 'merchant-1' },
    evidenceByMethodKey: completeEvidence
  });
  assert.equal(summary.enabledMethodCount, 5);
  assert.equal(summary.readyCount, 5);
  assert.equal(summary.needsEvidenceCount, 0);
  assert.equal(summary.checkoutBlockingCount, 0);
  assert.deepEqual(summary.missingEvidence, []);

  const disabledSummary = summarizePaymentMethodReadinessGates(
    DEFAULT_DIGIKALA_PAYMENT_METHOD_SETTINGS.map((method) => (method.key === 'wallet-credit' ? { ...method, isActive: false } : method)),
    { env: { ZARINPAL_MERCHANT_ID: 'merchant-1' }, evidenceByMethodKey: completeEvidence }
  );
  assert.equal(disabledSummary.disabledCount, 1);
  assert.equal(disabledSummary.methods.find((method) => method.methodKey === 'wallet-credit')?.status, 'disabled');
  assert.equal(disabledSummary.checkoutBlockingCount, 0);

  const gatewaySmoke = buildPaymentMethodSmokeChecklist(gatewayMethod, {
    env: { ZARINPAL_MERCHANT_ID: 'merchant-1' },
    readinessEvidence: completeEvidence['iranian-ipg'],
    smokeEvidence: {
      checkoutMethodVisible: true,
      checkoutAttemptPersistsMethodKey: true,
      customerConfirmationCopy: true,
      adminOrderVisibility: true,
      settlementDashboardVisibility: true,
      reconciliationCsvExport: true,
      gatewayReturnSmoke: true,
      gatewayWebhookSmoke: true,
      gatewayProviderReferenceSmoke: true
    }
  });
  assert.equal(gatewaySmoke.status, 'complete');
  assert.equal(gatewaySmoke.readinessStatus, 'ready');
  assert.equal(gatewaySmoke.blocksCheckout, false);
  assert.deepEqual(gatewaySmoke.missingEvidence, []);

  const manualTransferMethod = DEFAULT_DIGIKALA_PAYMENT_METHOD_SETTINGS.find((method) => method.key === 'bank-transfer');
  assert.ok(manualTransferMethod);
  const manualTransferSmoke = buildPaymentMethodSmokeChecklist(manualTransferMethod, {
    readinessEvidence: completeEvidence['bank-transfer'],
    smokeEvidence: {
      checkoutMethodVisible: true,
      checkoutAttemptPersistsMethodKey: true,
      customerConfirmationCopy: true,
      adminOrderVisibility: true,
      settlementDashboardVisibility: true,
      reconciliationCsvExport: true,
      manualTransferInstructionSmoke: true
    }
  });
  assert.equal(manualTransferSmoke.status, 'missing-evidence');
  assert.deepEqual(manualTransferSmoke.missingEvidence, ['manualTransferReviewSmoke']);

  const allSmokeEvidence: Record<string, PaymentMethodSmokeEvidence> = {
    'iranian-ipg': {
      checkoutMethodVisible: true,
      checkoutAttemptPersistsMethodKey: true,
      customerConfirmationCopy: true,
      adminOrderVisibility: true,
      settlementDashboardVisibility: true,
      reconciliationCsvExport: true,
      gatewayReturnSmoke: true,
      gatewayWebhookSmoke: true,
      gatewayProviderReferenceSmoke: true
    },
    'wallet-credit': {
      checkoutMethodVisible: true,
      checkoutAttemptPersistsMethodKey: true,
      customerConfirmationCopy: true,
      adminOrderVisibility: true,
      settlementDashboardVisibility: true,
      reconciliationCsvExport: true,
      walletDebitReceiptSmoke: true,
      walletRefundReceiptSmoke: true
    },
    'installment-credit': {
      checkoutMethodVisible: true,
      checkoutAttemptPersistsMethodKey: true,
      customerConfirmationCopy: true,
      adminOrderVisibility: true,
      settlementDashboardVisibility: true,
      reconciliationCsvExport: true,
      installmentReviewSmoke: true,
      installmentScheduleSmoke: true
    },
    'bank-transfer': {
      checkoutMethodVisible: true,
      checkoutAttemptPersistsMethodKey: true,
      customerConfirmationCopy: true,
      adminOrderVisibility: true,
      settlementDashboardVisibility: true,
      reconciliationCsvExport: true,
      manualTransferInstructionSmoke: true,
      manualTransferReviewSmoke: true
    },
    'cash-on-delivery': {
      checkoutMethodVisible: true,
      checkoutAttemptPersistsMethodKey: true,
      customerConfirmationCopy: true,
      adminOrderVisibility: true,
      settlementDashboardVisibility: true,
      reconciliationCsvExport: true,
      codCollectionSmoke: true,
      codFulfillmentGuardSmoke: true
    }
  };
  const smokeSummary = summarizePaymentMethodSmokeChecklists(DEFAULT_DIGIKALA_PAYMENT_METHOD_SETTINGS, {
    env: { ZARINPAL_MERCHANT_ID: 'merchant-1' },
    readinessEvidenceByMethodKey: completeEvidence,
    smokeEvidenceByMethodKey: allSmokeEvidence
  });
  assert.equal(smokeSummary.enabledMethodCount, 5);
  assert.equal(smokeSummary.completeCount, 5);
  assert.equal(smokeSummary.missingEvidenceCount, 0);
  assert.equal(smokeSummary.checkoutBlockingCount, 0);
  assert.deepEqual(smokeSummary.missingEvidence, []);

  const disabledSmokeSummary = summarizePaymentMethodSmokeChecklists(
    DEFAULT_DIGIKALA_PAYMENT_METHOD_SETTINGS.map((method) => (method.key === 'wallet-credit' ? { ...method, isActive: false } : method)),
    { smokeEvidenceByMethodKey: allSmokeEvidence }
  );
  assert.equal(disabledSmokeSummary.disabledCount, 1);
  assert.equal(disabledSmokeSummary.methods.find((method) => method.methodKey === 'wallet-credit')?.status, 'disabled');
  assert.equal(disabledSmokeSummary.checkoutBlockingCount, 0);

  console.log('payment-gateway-config.test.ts passed');
}
