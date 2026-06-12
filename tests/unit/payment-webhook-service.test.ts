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
  assert.match(service, /normalizePublicOrderLookupToken/);
  assert.match(service, /export async function recordPaymentWebhookEvent/);
  assert.match(service, /normalizePaymentWebhookEvent\(input\)/);
  assert.match(service, /checkoutPaymentEvent\.findUnique/);
  assert.match(service, /provider_idempotencyKey/);
  assert.match(service, /status: 'duplicate'/);
  assert.match(service, /function isPaymentAttemptCorroborated/);
  assert.match(service, /input\.orderNumber && input\.attempt\.order\.orderNumber !== input\.orderNumber/);
  assert.match(service, /input\.publicLookupToken && input\.attempt\.order\.publicLookupToken !== input\.publicLookupToken/);
  assert.match(service, /const orderNumber = input\.orderNumber\?\.trim\(\)/);
  assert.match(service, /const publicLookupToken = input\.publicLookupToken \? normalizePublicOrderLookupToken/);
  assert.match(service, /checkoutPaymentAttempt\.findFirst/);
  assert.match(service, /providerReference: input\.providerReference/);
  assert.match(service, /byReference && isPaymentAttemptCorroborated\(\{ attempt: byReference, orderNumber, publicLookupToken \}\)/);
  assert.match(service, /if \(orderNumber\)/);
  assert.match(service, /order:\s*\{\s*orderNumber,\s*\.\.\.\(publicLookupToken \? \{ publicLookupToken \} : \{\}\)\s*\}/s);
  assert.doesNotMatch(service, /if \(publicLookupToken\)[\s\S]*?checkoutPaymentAttempt\.findFirst/);
  assert.doesNotMatch(service, /if \(input\.orderNumber \|\| input\.publicLookupToken\)/);
  assert.match(service, /checkoutPaymentEvent\.create/);
  assert.match(service, /paymentWebhookService = \{/);
  assert.match(service, /async function applyTrustedWebhookStateChange/);
  assert.match(service, /if \(!input\.statePlan\.trusted\) return/);
  assert.match(service, /checkoutOrder\.update/);
  assert.match(service, /checkoutPaymentAttempt\.update/);

  const corroboratorIndex = service.indexOf('function isPaymentAttemptCorroborated');
  const orderNormalizeIndex = service.indexOf('const orderNumber = input.orderNumber?.trim()');
  const referenceLookupIndex = service.indexOf('providerReference: input.providerReference');
  const corroborationCallIndex = service.indexOf('isPaymentAttemptCorroborated({ attempt: byReference, orderNumber, publicLookupToken })');
  const orderLookupIndex = service.indexOf('if (orderNumber)');
  assert.ok(corroboratorIndex > -1);
  assert.ok(orderNormalizeIndex > corroboratorIndex);
  assert.ok(referenceLookupIndex > orderNormalizeIndex);
  assert.ok(corroborationCallIndex > referenceLookupIndex);
  assert.ok(orderLookupIndex > corroborationCallIndex);

  const helperIndex = service.indexOf('async function applyTrustedWebhookStateChange');
  const attemptUpdateIndex = service.indexOf('checkoutPaymentAttempt.update');
  const orderUpdateIndex = service.indexOf('checkoutOrder.update');
  const recordIndex = service.indexOf('export async function recordPaymentWebhookEvent');
  assert.ok(helperIndex > -1);
  assert.ok(recordIndex > helperIndex);
  assert.ok(attemptUpdateIndex > helperIndex && attemptUpdateIndex < recordIndex);
  assert.ok(orderUpdateIndex > helperIndex && orderUpdateIndex < recordIndex);

  console.log('payment-webhook-service.test.ts passed');
}
