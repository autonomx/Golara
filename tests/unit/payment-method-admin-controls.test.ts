import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';

const service = readFileSync('lib/settings/payment-method-settings.ts', 'utf8');
const action = readFileSync('app/admin/payment-methods/actions.ts', 'utf8');
const panel = readFileSync('components/admin/AdminPaymentMethodSettingsPanel.tsx', 'utf8');
const paymentMethodsPage = readFileSync('app/admin/payment-methods/page.tsx', 'utf8');
const adminPageShell = readFileSync('components/admin/AdminPageShell.tsx', 'utf8');
const adminSidebarLayoutController = readFileSync('components/admin/AdminSidebarLayoutController.tsx', 'utf8');
const adminPageShellCopy = readFileSync('lib/localization/admin-page-shell-copy.ts', 'utf8');
const launchChecklist = readFileSync('docs/production-payment-gateway-launch-checklist.md', 'utf8');

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

for (const fragment of [
  "activeNavKey=\"payment-methods\"",
  "activeTab=\"sales\"",
  "returnTo=\"/admin/payment-methods\"",
  'AdminPageShell',
  'AdminPaymentMethodSettingsPanel'
]) {
  assert.ok(paymentMethodsPage.includes(fragment), `Expected payment methods page shell fragment: ${fragment}`);
}

for (const fragment of [
  "| 'payment-methods'",
  "'payment-methods': 'Payment methods'",
  "{ href: '/admin/payment-methods', key: 'payment-methods', icon: CreditCard }"
]) {
  assert.ok(adminPageShell.includes(fragment), `Expected payment methods sidebar fragment: ${fragment}`);
}

for (const fragment of [
  "pathname === '/admin'",
  "href=\"/admin/payment-methods\"",
  'admin-root-payment-methods-link',
  "main#main-content[data-admin-root-sidebar-payment-methods='true'] aside nav a[href='/admin/payments/settlement']",
  "delete main.dataset.adminRootSidebarPaymentMethods"
]) {
  assert.ok(adminSidebarLayoutController.includes(fragment), `Expected root admin payment methods sidebar compatibility fragment: ${fragment}`);
}

for (const fragment of [
  "'Payment methods': 'Payment methods'",
  "'Payment methods': 'روش‌های پرداخت'"
]) {
  assert.ok(adminPageShellCopy.includes(fragment), `Expected payment methods shell copy fragment: ${fragment}`);
}

for (const fragment of [
  '## 4. Method-level readiness and smoke evidence',
  'review `/admin/payment-methods`',
  'source-controlled smoke checklist for that method',
  'Gateway/IPG: create a provider-backed checkout',
  'Wallet/store credit: create a wallet-funded checkout',
  'Manual transfer: submit reference/proof metadata',
  'Installment: request approval',
  'COD: create a COD order',
  'This P9 readiness gate is advisory in the current codebase',
  'method-level readiness evidence, smoke-test evidence capture'
]) {
  assert.ok(launchChecklist.includes(fragment), `Expected payment launch checklist fragment: ${fragment}`);
}

console.log('payment-method-admin-controls.test.ts passed');
