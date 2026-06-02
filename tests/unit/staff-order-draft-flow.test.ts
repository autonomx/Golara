import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function source(path: string) {
  return readFileSync(path, 'utf8');
}

export async function runStaffOrderDraftFlowTests() {
  const repository = source('lib/checkout/order-draft-repository.ts');
  const actions = source('app/admin/order-actions.ts');
  const panel = source('components/admin/AdminOrderPanel.tsx');
  const detail = source('app/admin/orders/[orderId]/page.tsx');

  assert.match(repository, /export type CreateStaffOrderDraftInput/);
  assert.match(repository, /export async function createStaffOrderDraft/);
  assert.match(repository, /checkoutMode: 'assisted'/);
  assert.match(repository, /type: 'staff_draft_created'/);
  assert.match(repository, /title: 'Staff draft created'/);
  assert.match(repository, /timelineEvents: true/);

  assert.match(actions, /export async function createStaffDraftOrderAction/);
  assert.match(actions, /assertAdminRole\('staff'\)/);
  assert.match(actions, /createStaffOrderDraft\(/);
  assert.match(actions, /action: 'order.staff_draft.create'/);
  assert.match(actions, /redirect\(orderDetailPath\(order.id, 'staff-draft-created'\)\)/);

  assert.match(panel, /createStaffDraftOrderAction/);
  assert.match(panel, /Create draft order/);
  assert.match(detail, /staff-draft-created/);
  assert.match(detail, /No line items yet\./);

  console.log('staff-order-draft-flow.test.ts passed');
}
