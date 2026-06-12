import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

export async function runCustomerOrderSessionBoundaryTests() {
  const repositorySource = readFileSync('lib/customers/customer-account-repository.ts', 'utf8');
  const orderPageSource = readFileSync('app/account/orders/page.tsx', 'utf8');

  assert.match(
    repositorySource,
    /export\s+async\s+function\s+listCustomerOrdersForSession\s*\(\s*session:\s*VerifiedCustomerSession\s*\)/,
    'customer order repository should expose a session-bound order listing helper'
  );
  assert.match(
    repositorySource,
    /where:\s*\{\s*customerId:\s*session\.customerId\s*\}/,
    'session-bound order listing should query with the verified session customerId'
  );
  assert.doesNotMatch(
    repositorySource,
    /export\s+async\s+function\s+listCustomerOrders\s*\(\s*customerId:\s*string\s*\)/,
    'repository must not expose account order history by arbitrary caller-supplied customerId'
  );

  assert.match(
    orderPageSource,
    /listCustomerOrdersForSession\(session\)/,
    'account order history page should pass the verified session object into the repository'
  );
  assert.doesNotMatch(
    orderPageSource,
    /listCustomerOrders\(session\.customerId\)/,
    'account order history page must not pass a raw customerId into order listing'
  );

  console.log('customer-order-session-boundary.test.ts passed');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runCustomerOrderSessionBoundaryTests().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
