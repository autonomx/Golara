import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';

const source = readFileSync('app/admin/AdminConsolePage.tsx', 'utf8');

for (const fragment of [
  "import { listAdminCustomers } from '@/lib/customers/customer-repository';",
  "const needsCustomerReads = activeTab === 'customers';",
  'needsCustomerReads && authenticated ? listAdminCustomers() : Promise.resolve([])',
  "{activeTab === 'customers' ? <AdminCustomerPanel customers={adminCustomers}"
]) {
  assert.ok(source.includes(fragment), `Expected AdminConsolePage customer-read gate fragment: ${fragment}`);
}

assert.ok(!source.includes('authenticated ? listAdminCustomers() : Promise.resolve([])'), 'Expected customer list not to load for every authenticated admin route.');

const needsCustomerIndex = source.indexOf("const needsCustomerReads = activeTab === 'customers';");
const listCustomerIndex = source.indexOf('needsCustomerReads && authenticated ? listAdminCustomers() : Promise.resolve([])');
assert.ok(needsCustomerIndex > -1, 'Expected customer read gate to be declared.');
assert.ok(listCustomerIndex > needsCustomerIndex, 'Expected customer list read to be guarded by needsCustomerReads.');

console.log('admin shell customer read gate passed');
