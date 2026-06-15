import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';

const service = readFileSync('lib/settings/payment-method-settings.ts', 'utf8');
const action = readFileSync('app/admin/payment-methods/actions.ts', 'utf8');
const panel = readFileSync('components/admin/AdminPaymentMethodSettingsPanel.tsx', 'utf8');

for (const fragment of [
  'export type PaymentMethodControlsInput',
  'async updateControls(input: PaymentMethodControlsInput)',
  'UPDATE "PaymentMethodSetting"',
  '"isActive" = ${normalized.isActive}',
  '"isDefault" = ${normalized.isDefault}',
  '"requiresManualReview" = ${normalized.requiresManualReview}',
  'recordAdminAuditLog',
  "action: 'settings.payment_method.update'"
]) {
  assert.ok(service.includes(fragment), `Expected payment method service fragment: ${fragment}`);
}

for (const fragment of [
  "'use server';",
  "await assertAdminRole('owner');",
  'paymentMethodSettingsService.updateControls',
  "revalidatePath('/cart/checkout');",
  "revalidatePath('/admin/payment-methods');",
  "redirect('/admin/payment-methods?status=payment-method-updated');"
]) {
  assert.ok(action.includes(fragment), `Expected payment method action fragment: ${fragment}`);
}

for (const fragment of [
  'action={updatePaymentMethodSettingAction}',
  'name="isActive"',
  'name="isDefault"',
  'name="requiresManualReview"',
  'name="sortOrder"',
  'Save method',
  'disabled={!databaseReady}'
]) {
  assert.ok(panel.includes(fragment), `Expected payment method panel fragment: ${fragment}`);
}

console.log('payment-method-admin-controls.test.ts passed');
