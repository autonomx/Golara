import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  DEFAULT_DIGIKALA_PAYMENT_METHOD_SETTINGS,
  listEnabledPaymentMethodKeys
} from '../../lib/settings/payment-method-settings';

const migration = readFileSync('prisma/migrations/20260615080000_add_digikala_payment_method_settings/migration.sql', 'utf8');
const service = readFileSync('lib/settings/payment-method-settings.ts', 'utf8');
const panel = readFileSync('components/admin/AdminPaymentMethodSettingsPanel.tsx', 'utf8');
const route = readFileSync('app/admin/payment-methods/page.tsx', 'utf8');

assert.match(migration, /CREATE TABLE IF NOT EXISTS "PaymentMethodSetting"/);
for (const key of ['iranian-ipg', 'wallet-credit', 'installment-credit', 'bank-transfer', 'cash-on-delivery']) {
  assert.match(migration, new RegExp(`'${key}'`));
}

assert.equal(DEFAULT_DIGIKALA_PAYMENT_METHOD_SETTINGS.length, 5);
assert.deepEqual(listEnabledPaymentMethodKeys(DEFAULT_DIGIKALA_PAYMENT_METHOD_SETTINGS), ['iranian-ipg', 'wallet-credit', 'installment-credit', 'bank-transfer', 'cash-on-delivery']);
assert.ok(DEFAULT_DIGIKALA_PAYMENT_METHOD_SETTINGS.every((method) => method.isActive));
assert.ok(DEFAULT_DIGIKALA_PAYMENT_METHOD_SETTINGS.some((method) => method.key === 'iranian-ipg' && method.providerKey === 'zarinpal' && method.isDefault));
assert.ok(DEFAULT_DIGIKALA_PAYMENT_METHOD_SETTINGS.some((method) => method.key === 'wallet-credit' && method.requiresManualReview));
assert.ok(DEFAULT_DIGIKALA_PAYMENT_METHOD_SETTINGS.some((method) => method.key === 'installment-credit' && method.requiresManualReview));

assert.match(service, /paymentMethodSettingsService = \{/);
assert.match(service, /FROM "PaymentMethodSetting"/);
assert.doesNotMatch(service, /recordAdminAuditLog/);
assert.match(panel, /DigiKala-style payment methods/);
assert.match(panel, /enabled/);
assert.match(panel, /Readiness notes/);
assert.doesNotMatch(panel, /action=\{/);
assert.match(route, /requireAdminRouteSession/);
assert.match(route, /paymentMethodSettingsService\.list\(\)/);

console.log('payment-method-settings.test.ts passed');
