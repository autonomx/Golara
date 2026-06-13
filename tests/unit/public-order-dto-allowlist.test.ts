import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function extractSelectBlock(source: string, marker: string) {
  const markerIndex = source.indexOf(marker);
  assert.notEqual(markerIndex, -1, `missing ${marker} select marker`);
  const selectIndex = source.indexOf('select:', markerIndex);
  assert.notEqual(selectIndex, -1, `missing select block after ${marker}`);
  const openIndex = source.indexOf('{', selectIndex);
  assert.notEqual(openIndex, -1, `missing select block opener after ${marker}`);
  let depth = 0;
  for (let index = openIndex; index < source.length; index += 1) {
    const char = source[index];
    if (char === '{') depth += 1;
    if (char === '}') {
      depth -= 1;
      if (depth === 0) return source.slice(openIndex + 1, index);
    }
  }
  throw new Error(`unterminated select block after ${marker}`);
}

function topLevelSelectedFields(block: string) {
  const fields: string[] = [];
  let depth = 0;
  let lineStart = 0;
  for (let index = 0; index <= block.length; index += 1) {
    const char = block[index];
    if (char === '\n' || index === block.length) {
      const line = block.slice(lineStart, index);
      if (depth === 0) {
        const match = line.match(/^\s*([A-Za-z][A-Za-z0-9_]*)\s*:/);
        if (match) fields.push(match[1]);
      }
      for (const current of line) {
        if (current === '{') depth += 1;
        if (current === '}') depth -= 1;
      }
      lineStart = index + 1;
    }
  }
  return fields;
}

function assertAllowedSelectFields(block: string, allowed: string[], context: string) {
  for (const field of topLevelSelectedFields(block)) {
    assert.ok(allowed.includes(field), `${context} must not expose ${field}`);
  }
}

function assertNoPrivateOrderReads(source: string, context: string) {
  for (const forbidden of [
    'prisma.checkoutOrder',
    'getCustomerSession',
    'getCustomerSessionCookie',
    'listCustomerOrdersForSession',
    'customerAccount',
    'customerSession',
    'customerId',
    'customerEmail',
    'customerPhone',
    'recipientName',
    'recipientPhone',
    'shippingAddress',
    'paymentProviderMetadata'
  ]) {
    assert.doesNotMatch(source, new RegExp(`\\b${forbidden}\\b`), `${context} must not read or render private order/session field ${forbidden}`);
  }
}

export async function runPublicOrderDtoAllowlistTests() {
  const repositorySource = readFileSync('lib/checkout/public-order-repository.ts', 'utf8');
  const pageSource = readFileSync('app/orders/[token]/page.tsx', 'utf8');
  const confirmationPageSource = readFileSync('app/orders/confirmation/page.tsx', 'utf8');
  const returnCoreSource = readFileSync('lib/checkout/order-return-route-core.ts', 'utf8');
  const accountOrdersPageSource = readFileSync('app/account/orders/page.tsx', 'utf8');
  const customerAccountRepositorySource = readFileSync('lib/customers/customer-account-repository.ts', 'utf8');

  const orderSelect = extractSelectBlock(repositorySource, 'prisma.checkoutOrder.findUnique');
  assertAllowedSelectFields(
    orderSelect,
    [
      'orderNumber',
      'status',
      'checkoutMode',
      'fulfillmentStatus',
      'currency',
      'totalCents',
      'deliveryDate',
      'deliveryWindow',
      'createdAt',
      'items',
      'timelineEvents',
      'paymentAttempts'
    ],
    'public order root DTO'
  );

  for (const forbidden of [
    'id',
    'customerId',
    'customer',
    'addressId',
    'address',
    'shippingAddress',
    'recipientName',
    'recipientPhone',
    'customerEmail',
    'customerPhone',
    'customerNote',
    'adminNote',
    'internalNote',
    'metadata',
    'paymentProviderMetadata'
  ]) {
    assert.doesNotMatch(orderSelect, new RegExp(`\\b${forbidden}\\s*:\\s*true\\b`), `public order root DTO must not expose ${forbidden}`);
  }

  const itemSelect = extractSelectBlock(repositorySource, 'items:');
  assertAllowedSelectFields(itemSelect, ['productTitle', 'quantity'], 'public order item DTO');
  for (const forbidden of ['id', 'productId', 'variantId', 'sku', 'unitPriceCents', 'lineTotalCents', 'metadata']) {
    assert.doesNotMatch(itemSelect, new RegExp(`\\b${forbidden}\\s*:\\s*true\\b`), `public order item DTO must not expose ${forbidden}`);
  }

  const paymentAttemptSelect = extractSelectBlock(repositorySource, 'paymentAttempts:');
  assertAllowedSelectFields(paymentAttemptSelect, ['status', 'createdAt'], 'public payment attempt DTO');
  for (const forbidden of ['id', 'provider', 'providerReference', 'amountCents', 'currency', 'rawPayload', 'metadata', 'errorMessage']) {
    assert.doesNotMatch(paymentAttemptSelect, new RegExp(`\\b${forbidden}\\s*:\\s*true\\b`), `public payment attempt DTO must not expose ${forbidden}`);
  }

  assert.doesNotMatch(pageSource, /order\.(?:customer|address|recipient|customerNote|adminNote|internalNote|metadata)/, 'public order page must not render private order fields');
  assert.doesNotMatch(pageSource, /latestAttempt\?\.(?:provider|providerReference|amountCents|currency|rawPayload|metadata|errorMessage)/, 'public order page must not render private payment attempt fields');

  assertNoPrivateOrderReads(confirmationPageSource, 'payment confirmation page');
  assert.doesNotMatch(confirmationPageSource, /getPublicOrderByToken|checkoutOrder|paymentAttempts|timelineEvents/, 'payment confirmation page must stay receipt-only and not hydrate order details');
  assert.match(confirmationPageSource, /orderNumber\s*=\s*order\?\.trim\(\)/, 'payment confirmation page may only echo the bounded order reference from the redirect query');

  assert.match(returnCoreSource, /new URL\(`\/orders\/\$\{result\.publicLookupToken\}`/, 'successful payment returns must redirect to the public lookup-token status route');
  assert.doesNotMatch(returnCoreSource, /\/orders\/confirmation[^`'\"]*order=/, 'payment return fallback must not put order references on the confirmation URL');
  assert.doesNotMatch(returnCoreSource, /customerId|customerEmail|customerPhone|recipientName|recipientPhone|shippingAddress/, 'payment return URLs must not carry customer-only fields');

  assert.match(accountOrdersPageSource, /getCustomerSessionCookie\(\)/, 'private customer order history must read the customer session cookie');
  assert.match(accountOrdersPageSource, /getCustomerSession\(token\)/, 'private customer order history must verify the customer session before loading orders');
  assert.match(accountOrdersPageSource, /if \(!session\) redirect\('\/account\?status=session-required'\)/, 'private customer order history must reject missing sessions');
  assert.match(accountOrdersPageSource, /listCustomerOrdersForSession\(session\)/, 'private customer order history must derive orders from the verified session');
  assert.doesNotMatch(accountOrdersPageSource, /searchParams|params:|publicLookupToken[^?]/, 'private customer order history must not accept public route/query identifiers as ownership proof');

  assert.match(customerAccountRepositorySource, /type VerifiedCustomerSession = \{\s*customerId: string;\s*\}/s, 'private order repository must require a verified customer session shape');
  assert.match(customerAccountRepositorySource, /where:\s*\{\s*customerId:\s*session\.customerId\s*\}/, 'private order repository must bind order reads to the verified session customerId');

  console.log('public-order-dto-allowlist.test.ts passed');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runPublicOrderDtoAllowlistTests().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
