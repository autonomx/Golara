import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function source(path: string) {
  return readFileSync(path, 'utf8');
}

export async function runPaymentWebhookServiceTests() {
  const schema = source('prisma/schema.prisma');
  const service = source('lib/checkout/payment-webhook-service.ts');
  const record = source('lib/checkout/payment-webhook-record.ts');

  assert.match(schema, /model CheckoutPaymentEvent/);
  assert.match(schema, /@@unique\(\[provider, idempotencyKey\]\)/);
  assert.match(schema, /model CheckoutPaymentAttempt/);
  assert.match(schema, /providerReference String\?/);

  assert.match(record, /export function buildPaymentWebhookEventPersistenceInput/);
  assert.match(record, /paymentAttemptId is required for payment webhook event persistence/);

  assert.match(service, /import 'server-only'/);
  assert.match(service, /export async function recordPaymentWebhookEvent/);
  assert.match(service, /normalizePaymentWebhookEvent\(input\)/);
  assert.match(service, /checkoutPaymentEvent\.findUnique/);
  assert.match(service, /provider_idempotencyKey/);
  assert.match(service, /checkoutPaymentAttempt\.findFirst/);
  assert.match(service, /providerReference: input\.providerReference/);
  assert.match(service, /orderNumber: input\.orderNumber/);
  assert.match(service, /publicLookupToken: input\.publicLookupToken/);
  assert.match(service, /checkoutPaymentEvent\.create/);
  assert.match(service, /paymentWebhookService = \{/);
  assert.doesNotMatch(service, /checkoutOrder\.update/);
  assert.doesNotMatch(service, /checkoutPaymentAttempt\.update/);

  console.log('payment-webhook-service.test.ts passed');
}
