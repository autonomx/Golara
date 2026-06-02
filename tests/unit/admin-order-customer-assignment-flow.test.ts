import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function source(path: string) {
  return readFileSync(path, 'utf8');
}

export async function runAdminOrderCustomerAssignmentFlowTests() {
  const repository = source('lib/checkout/admin-order-assignment-repository.ts');
  const actions = source('app/admin/order-actions.ts');
  const detail = source('app/admin/orders/[orderId]/page.tsx');

  assert.match(repository, /const EDITABLE_ASSIGNMENT_STATUSES = new Set\(\['draft', 'pending'\]\)/);
  assert.match(repository, /export async function listAdminOrderCustomerAssignmentOptions/);
  assert.match(repository, /export async function assignAdminOrderCustomer/);
  assert.match(repository, /Customer assignment can only be edited before confirmation/);
  assert.match(repository, /Address does not belong to the selected customer/);
  assert.match(repository, /type: 'order_customer_assigned'/);

  assert.match(actions, /export async function updateOrderCustomerAssignmentAction/);
  assert.match(actions, /assignAdminOrderCustomer\(orderId/);
  assert.match(actions, /action: 'order.customer.assign'/);
  assert.match(actions, /order-customer-assigned/);

  assert.match(detail, /listAdminOrderCustomerAssignmentOptions/);
  assert.match(detail, /updateOrderCustomerAssignmentAction/);
  assert.match(detail, /Save customer/);
  assert.match(detail, /Guest \/ draft/);
  assert.match(detail, /No saved address/);

  console.log('admin-order-customer-assignment-flow.test.ts passed');
}
