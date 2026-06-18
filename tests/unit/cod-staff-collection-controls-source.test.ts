import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';

const service = readFileSync('lib/checkout/cod-collection-service.ts', 'utf8');
const page = readFileSync('app/admin/payments/cod-collections/page.tsx', 'utf8');
const roadmap = readFileSync('docs/digikala-style-payment-remaining-phases.md', 'utf8');
const pkg = readFileSync('package.json', 'utf8');

for (const fragment of [
  'export function assertCodCollectionStatus(value: string)',
  'export async function updateCodCollectionStatus(input: CodCollectionUpdateInput)',
  'COD_COLLECTION_STATUSES',
  'checkoutPaymentAttempt.update',
  'checkoutOrderTimelineEvent.create',
  "type: 'cod_collection_status_updated'",
  'Only COD payment attempts can update delivery collection status.'
]) {
  assert.ok(service.includes(fragment), `Expected COD collection service fragment: ${fragment}`);
}

for (const fragment of [
  'async function updateCodCollectionFormAction(formData: FormData)',
  "'use server';",
  "assertAdminRole('staff')",
  'updateCodCollectionStatus({',
  "action: 'order.payment.cod.collection_update'",
  "redirect('/admin/payments/cod-collections?status=cod-collection-updated')",
  'COD_COLLECTION_STATUSES.map',
  'Save COD collection',
  'Collection status',
  "import { AdminPageShell } from '@/components/admin/AdminPageShell';",
  '<AdminPageShell',
  'activeNavKey="payment-settlement"',
  'returnTo="/admin/payments/cod-collections"',
  'resolveStorefrontLocale()',
  'isAdminAuthConfigured()'
]) {
  assert.ok(page.includes(fragment), `Expected COD collection controls page fragment: ${fragment}`);
}

for (const fragment of [
  'COD staff collection controls for pending, collected, failed, and waived outcomes with timeline and audit evidence.',
  'Settlement/reconciliation fields for delivery collections.',
  'Start **Phase P4 — COD fulfillment completion guard**'
]) {
  assert.ok(roadmap.includes(fragment), `Expected roadmap COD staff-controls fragment: ${fragment}`);
}

assert.ok(
  pkg.includes('check:cod-staff-collection-controls'),
  'Expected package.json to expose COD staff collection controls source guard',
);

console.log('cod-staff-collection-controls-source.test.ts passed');
