import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  DEFAULT_PAYMENT_PROVIDER_SETTING,
  buildPaymentGatewayConfigFromSetting,
  buildPaymentProviderReadinessSummary,
  listRequiredPaymentProviderEnvironmentVariables,
  normalizePaymentProviderSettingInput
} from '../../lib/settings/payment-provider-settings';

function source(path: string) {
  return readFileSync(path, 'utf8');
}

export async function runPaymentProviderSettingsTests() {
  const migration = source('prisma/migrations/20260603050000_add_payment_provider_settings_readiness/migration.sql');
  const service = source('lib/settings/payment-provider-settings.ts');
  const panel = source('components/admin/AdminPaymentProviderSettingsPanel.tsx');
  const fulfillmentPanel = source('components/admin/AdminFulfillmentSettingsPanel.tsx');
  const actions = source('app/admin/settings/actions.ts');
  const roadmap = source('docs/ADMIN_SALEOR_PARITY_ROADMAP.md');

  assert.match(migration, /CREATE TABLE IF NOT EXISTS "PaymentProviderSetting"/);
  assert.match(migration, /"checkoutMode" TEXT NOT NULL DEFAULT 'inquiry'/);
  assert.match(migration, /"domesticProvider" TEXT NOT NULL DEFAULT 'manual'/);
  assert.match(migration, /"overseasFallback" TEXT NOT NULL DEFAULT 'whatsapp'/);
  assert.match(migration, /"requireIranianGatewayMerchantId" BOOLEAN NOT NULL DEFAULT false/);
  assert.match(migration, /"requireStripeSecretKey" BOOLEAN NOT NULL DEFAULT false/);
  assert.match(migration, /PaymentProviderSetting_key_key/);
  assert.match(migration, /PaymentProviderSetting_single_default_idx/);
  assert.match(migration, /'default-payment-readiness'/);

  assert.match(service, /export type PaymentProviderSetting/);
  assert.match(service, /export type PaymentProviderSettingInput/);
  assert.match(service, /DEFAULT_PAYMENT_PROVIDER_SETTING/);
  assert.match(service, /normalizePaymentProviderSettingInput/);
  assert.match(service, /buildPaymentGatewayConfigFromSetting/);
  assert.match(service, /listRequiredPaymentProviderEnvironmentVariables/);
  assert.match(service, /buildPaymentProviderReadinessSummary/);
  assert.match(service, /paymentProviderSettingsService = \{/);
  assert.match(service, /FROM "PaymentProviderSetting"/);
  assert.match(service, /INSERT INTO "PaymentProviderSetting"/);
  assert.match(service, /action: 'settings\.payment_provider\.update'/);

  assert.equal(DEFAULT_PAYMENT_PROVIDER_SETTING.key, 'default-payment-readiness');
  assert.equal(DEFAULT_PAYMENT_PROVIDER_SETTING.checkoutMode, 'inquiry');
  assert.equal(DEFAULT_PAYMENT_PROVIDER_SETTING.domesticProvider, 'manual');

  const normalized = normalizePaymentProviderSettingInput({
    key: ' Gateway Readiness! ',
    label: '  Gateway settings  ',
    description: '  Direct checkout readiness  ',
    checkoutMode: ' gateway ',
    domesticProvider: ' iranian ',
    overseasProvider: ' stripe ',
    domesticCurrency: ' toman ',
    overseasCurrency: ' cad ',
    overseasFallback: ' stripe ',
    requireIranianGatewayMerchantId: true,
    requireStripeSecretKey: true,
    isDefault: true,
    isActive: true
  });

  assert.equal(normalized.key, 'gateway-readiness');
  assert.equal(normalized.label, 'Gateway settings');
  assert.equal(normalized.description, 'Direct checkout readiness');
  assert.equal(normalized.checkoutMode, 'gateway');
  assert.equal(normalized.domesticProvider, 'iranian');
  assert.equal(normalized.overseasProvider, 'stripe');
  assert.equal(normalized.domesticCurrency, 'TOMAN');
  assert.equal(normalized.overseasCurrency, 'CAD');
  assert.equal(normalized.overseasFallback, 'stripe');

  const setting = {
    ...DEFAULT_PAYMENT_PROVIDER_SETTING,
    checkoutMode: 'gateway' as const,
    domesticProvider: 'iranian' as const,
    overseasProvider: 'stripe' as const,
    overseasFallback: 'stripe' as const,
    requireIranianGatewayMerchantId: true,
    requireStripeSecretKey: true
  };

  assert.deepEqual(buildPaymentGatewayConfigFromSetting(setting), {
    checkoutMode: 'gateway',
    domesticProvider: 'iranian',
    overseasProvider: 'stripe',
    domesticCurrency: 'TOMAN',
    overseasCurrency: 'USD',
    overseasFallback: 'stripe'
  });
  assert.deepEqual(listRequiredPaymentProviderEnvironmentVariables(setting), ['IRANIAN_GATEWAY_MERCHANT_ID', 'STRIPE_SECRET_KEY']);

  const blockedReadiness = buildPaymentProviderReadinessSummary(setting, {});
  assert.equal(blockedReadiness.ready, false);
  assert.deepEqual(blockedReadiness.blockers.map((issue) => issue.code), ['iranian_gateway_merchant_missing', 'stripe_secret_missing']);
  assert.deepEqual(blockedReadiness.requiredEnvironmentVariables, ['IRANIAN_GATEWAY_MERCHANT_ID', 'STRIPE_SECRET_KEY']);

  const readySummary = buildPaymentProviderReadinessSummary(setting, {
    IRANIAN_GATEWAY_MERCHANT_ID: 'merchant-1',
    STRIPE_SECRET_KEY: 'sk_test_example'
  });
  assert.equal(readySummary.ready, true);
  assert.deepEqual(readySummary.blockers, []);

  const inactiveSummary = buildPaymentProviderReadinessSummary({ ...setting, isActive: false }, {
    IRANIAN_GATEWAY_MERCHANT_ID: 'merchant-1',
    STRIPE_SECRET_KEY: 'sk_test_example'
  });
  assert.equal(inactiveSummary.ready, false);

  assert.match(panel, /export function AdminPaymentProviderSettingsPanel/);
  assert.match(panel, /updatePaymentProviderSettingAction/);
  assert.match(panel, /Payment provider readiness/);
  assert.match(panel, /name="checkoutMode"/);
  assert.match(panel, /name="domesticProvider"/);
  assert.match(panel, /name="requireStripeSecretKey"/);
  assert.match(panel, /Save payment settings/);

  assert.match(fulfillmentPanel, /paymentProviderSettingsService\.list\(\)/);
  assert.match(fulfillmentPanel, /AdminPaymentProviderSettingsPanel/);

  assert.match(actions, /updatePaymentProviderSettingAction/);
  assert.match(actions, /paymentProviderSettingsService\.update/);
  assert.match(actions, /payment-provider-updated/);

  assert.match(roadmap, /- \[x\] Add payment provider settings\/readiness\./);

  console.log('payment-provider-settings.test.ts passed');
}
