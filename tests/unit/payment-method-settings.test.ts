import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  DEFAULT_DIGIKALA_PAYMENT_METHOD_SETTINGS,
  listEnabledPaymentMethodKeys,
  normalizePaymentMethodSettingInput
} from '../../lib/settings/payment-method-settings';

const migration = readFileSync('prisma/migrations/20260615080000_add_digikala_payment_method_settings/migration.sql', 'utf8');
const service = readFileSync('lib/settings/payment-method-settings.ts', 'utf8');
const panel = readFileSync('components/admin/AdminPaymentMethodSettingsPanel.tsx', 'utf8');
const route = readFileSync('app/admin/payment-methods/page.tsx', 'utf8');
const action = readFileSync('app/admin/settings/payment-method-actions.ts', 'utf8');

assert.match(migration, /CREATE TABLE IF NOT EXISTS "PaymentMethodSetting"/);
for (const key of ['iranian-ipg', 'wallet-credit', 'installment-credit', 'bank-transfer', 'cash-on-delivery']) {
  assert.match(migration, new RegExp(`'${key}'`));
}

assert.equal(DEFAULT_DIGIKALA_PAYMENT_METHOD_SETTINGS.length, 5);
assert.deepEqual(listEnabledPaymentMethodKeys(DEFAULT_DIGIKALA_PAYMENT_METHOD_SETTINGS), ['iranian-ipg', 'wallet-credit', 'installment-credit', 'bank-transfer', 'cash-on-delivery']);
assert.ok(DEFAULT_DIGIKALA_PAYMENT_METHOD_SETTINGS.every((method) => method.isActive));

const normalized = normalizePaymentMethodSettingInput({
  key: ' Wallet Credit ',
  label: ' Wallet ',
  description: ' Customer balance ',
  methodType: ' wallet ',
  providerKey: ' Internal Wallet ',
  settlementMode: ' internal_ledger ',
  captureMode: ' ledger_capture ',
  currency: ' toman ',
  isActive: true,
  isDefault: false,
  requiresManualReview: true,
  sortOrder: 20
});
assert.equal(normalized.key, 'wallet-credit');
assert.equal(normalized.providerKey, 'internal_wallet');
assert.equal(normalized.currency, 'TOMAN');

assert.match(service, /paymentMethodSettingsService = \{/);
assert.match(service, /FROM "PaymentMethodSetting"/);
assert.match(service, /settings\.payment_method\.update/);
assert.match(panel, /DigiKala-style payment methods/);
assert.match(panel, /name="isActive"/);
assert.match(panel, /Save payment method/);
assert.match(route, /requireAdminRouteSession/);
assert.match(route, /paymentMethodSettingsService\.list\(\)/);
assert.match(action, /updatePaymentMethodSettingAction/);
assert.match(action, /paymentMethodSettingsService\.update/);

console.log('payment-method-settings.test.ts passed');
