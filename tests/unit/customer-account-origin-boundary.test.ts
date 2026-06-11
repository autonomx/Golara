import { readFileSync } from 'node:fs';
import { join } from 'node:path';

function read(path: string) {
  return readFileSync(join(process.cwd(), path), 'utf8');
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function assertImportAndCalls(path: string, actionNames: string[]) {
  const source = read(path);
  assert(
    source.includes("import { assertSameOriginServerAction } from '@/lib/server-action-origin';"),
    `${path} must import the shared same-origin guard`
  );

  for (const actionName of actionNames) {
    const actionIndex = source.indexOf(`export async function ${actionName}`);
    assert(actionIndex >= 0, `${path} must export ${actionName}`);
    const guardIndex = source.indexOf('await assertSameOriginServerAction();', actionIndex);
    assert(guardIndex >= 0, `${actionName} must call the same-origin guard`);
  }
}

assertImportAndCalls('app/account/login/actions.ts', ['requestCustomerOtpAction', 'verifyCustomerOtpAction']);
assertImportAndCalls('app/account/profile/actions.ts', ['updateAccountProfileAction']);

const addressSource = read('app/account/addresses/actions.ts');
assert(
  addressSource.includes("import { assertSameOriginServerAction } from '@/lib/server-action-origin';"),
  'address actions must import the shared same-origin guard'
);
assert(
  addressSource.includes('async function requireCustomerAddressMutation()') &&
    addressSource.includes('await assertSameOriginServerAction();') &&
    addressSource.includes('return requireCustomerId();'),
  'address actions must centralize the same-origin guard before resolving the customer session'
);

for (const actionName of [
  'addAccountAddressAction',
  'updateAccountAddressAction',
  'setDefaultAccountAddressAction',
  'deleteAccountAddressAction'
]) {
  const actionIndex = addressSource.indexOf(`export async function ${actionName}`);
  assert(actionIndex >= 0, `address actions must export ${actionName}`);
  const helperIndex = addressSource.indexOf('requireCustomerAddressMutation()', actionIndex);
  assert(helperIndex >= 0, `${actionName} must use the guarded customer mutation helper`);
}

console.log('customer account origin boundary guard passed');
