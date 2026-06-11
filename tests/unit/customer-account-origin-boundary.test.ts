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
  assertImportAndCalls('app/account/login/actions.ts', [
    'requestCustomerOtpAction',
    'verifyCustomerOtpAction'
  ]);
  assertImportAndCalls('app/account/profile/actions.ts', ['updateAccountProfileAction']);

  const addressSource = readFileSync('app/account/addresses/actions.ts', 'utf8');
  assert.match(addressSource, /assertSameOriginServerAction/);
  assert.match(addressSource, /async function requireCustomerAddressMutation/);
  assert.match(addressSource, /await assertSameOriginServerAction\(\);[\s\S]*return requireCustomerId\(\);/);

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
