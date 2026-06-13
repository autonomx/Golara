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

export async function runPublicOrderDtoAllowlistTests() {
  const repositorySource = readFileSync('lib/checkout/public-order-repository.ts', 'utf8');
  const pageSource = readFileSync('app/orders/[token]/page.tsx', 'utf8');

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

  console.log('public-order-dto-allowlist.test.ts passed');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runPublicOrderDtoAllowlistTests().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
