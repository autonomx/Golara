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

for (const fragment of [
  "summarizePaymentMethodReadinessGates(methods, { env: process.env })",
  'Production evidence readiness',
  'Enabled methods missing operational evidence',
  'Missing operational evidence',
  'Checkout remains non-blocking',
  'readinessSummary.needsEvidenceCount',
  'readinessSummary.checkoutBlockingCount',
  'readinessGate.missingEvidence.join',
  'Launch checklist: docs/production-payment-gateway-launch-checklist.md',
  'smoke evidence is reviewed per method before sign-off'
]) {
  assert.ok(panel.includes(fragment), `Expected payment method readiness warning fragment: ${fragment}`);
}

console.log('payment-method-admin-controls.test.ts passed');
