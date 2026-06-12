import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function assertImportAndCalls(path: string, actionNames: string[]) {
  const source = readFileSync(path, 'utf8');
  assert.match(source, /assertSameOriginServerAction/);

  for (const actionName of actionNames) {
    const actionIndex = source.indexOf(`export async function ${actionName}`);
    assert.ok(actionIndex >= 0, `${path} must export ${actionName}`);
    const guardIndex = source.indexOf('await assertSameOriginServerAction();', actionIndex);
    assert.ok(guardIndex >= 0, `${actionName} must call the same-origin guard`);
  }
}

export async function runCustomerAccountOriginBoundaryTests() {
  const profileSource = readFileSync('app/account/profile/actions.ts', 'utf8');
  assertImportAndCalls('app/account/login/actions.ts', [
    'requestCustomerOtpAction',
    'verifyCustomerOtpAction'
  ]);
  assertImportAndCalls('app/account/profile/actions.ts', ['updateAccountProfileAction']);

  assert.match(profileSource, /async function requireCustomerId\(\)/);
  assert.match(profileSource, /const customerId = await requireCustomerId\(\);/);
  assert.match(profileSource, /updateCustomerProfile\(customerId,/);
  assert.doesNotMatch(profileSource, /stringField\(formData,\s*['"]customerId['"]/);
  assert.doesNotMatch(profileSource, /formData\.get\(['"]customerId['"]\)/);

  const addressSource = readFileSync('app/account/addresses/actions.ts', 'utf8');
  assert.match(addressSource, /assertSameOriginServerAction/);
  assert.match(addressSource, /async function requireCustomerAddressMutation/);
  assert.match(addressSource, /await assertSameOriginServerAction\(\);[\s\S]*return requireCustomerId\(\);/);
  assert.doesNotMatch(addressSource, /stringField\(formData,\s*['"]customerId['"]/);
  assert.doesNotMatch(addressSource, /formData\.get\(['"]customerId['"]\)/);
  assert.match(addressSource, /addCustomerAddress\(customerId, addressInput\(formData\)\)/);
  assert.match(addressSource, /updateCustomerAddress\(customerId, stringField\(formData, 'addressId'\), addressInput\(formData\)\)/);
  assert.match(addressSource, /setDefaultCustomerAddress\(customerId, stringField\(formData, 'addressId'\)\)/);
  assert.match(addressSource, /deleteCustomerAddress\(customerId, stringField\(formData, 'addressId'\)\)/);

  for (const actionName of [
    'addAccountAddressAction',
    'updateAccountAddressAction',
    'setDefaultAccountAddressAction',
    'deleteAccountAddressAction'
  ]) {
    const actionIndex = addressSource.indexOf(`export async function ${actionName}`);
    assert.ok(actionIndex >= 0, `address actions must export ${actionName}`);
    const helperIndex = addressSource.indexOf('requireCustomerAddressMutation()', actionIndex);
    assert.ok(helperIndex >= 0, `${actionName} must use the guarded helper`);
  }

  console.log('customer-account-origin-boundary.test.ts passed');
}

if (process.argv[1]?.endsWith('customer-account-origin-boundary.test.ts')) {
  runCustomerAccountOriginBoundaryTests().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
