import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { buildNotificationDeliveryPlan } from '../../lib/notifications/notification-delivery-contract';

function source(path: string) {
  return readFileSync(path, 'utf8');
}

function assertNoLiveDeliverySurface(pageSource: string) {
  assert.equal(pageSource.includes('fetch('), false);
  assert.equal(pageSource.includes('https://'), false);
  assert.equal(pageSource.includes('onClick='), false);
  assert.equal(pageSource.includes('<button'), false);
}

export async function runNotificationDeliveryContractTests() {
  const deliveryContract = source('lib/notifications/notification-delivery-contract.ts');

  assert.match(deliveryContract, /NOTIFICATION_DELIVERY_CHANNELS = \['email', 'sms', 'whatsapp'\] as const/);
  assert.match(deliveryContract, /NOTIFICATION_DELIVERY_PROVIDERS = \['disabled', 'manual', 'log', 'smtp', 'resend', 'sendgrid', 'twilio', 'meta-whatsapp'\] as const/);
  assert.match(deliveryContract, /liveDeliveryEnabled: false/);
  assert.match(deliveryContract, /provider_readiness_evidence_missing/);
  assertNoLiveDeliverySurface(deliveryContract);

  const plannedEmail = buildNotificationDeliveryPlan({
    channel: 'email',
    provider: 'log',
    templateKey: ' order.confirmed ',
    recipient: ' customer@example.com ',
    subject: ' Order confirmed ',
    bodyPreview: ' Thanks for your order. ',
    providerReady: true
  });
  assert.equal(plannedEmail.status, 'planned');
  assert.equal(plannedEmail.liveDeliveryEnabled, false);
  assert.equal(plannedEmail.templateKey, 'order.confirmed');
  assert.equal(plannedEmail.recipientLabel, 'customer@example.com');
  assert.deepEqual(plannedEmail.reasons, []);

  const manualSms = buildNotificationDeliveryPlan({
    channel: 'sms',
    provider: 'manual',
    templateKey: 'fulfillment.ready',
    recipient: '+15551234567'
  });
  assert.equal(manualSms.status, 'manual_review');
  assert.deepEqual(manualSms.reasons, ['manual_provider_requires_operator_review']);

  const blockedWhatsapp = buildNotificationDeliveryPlan({
    channel: 'whatsapp',
    provider: 'meta-whatsapp',
    templateKey: '',
    recipient: 'not-a-phone',
    providerReady: false
  });
  assert.equal(blockedWhatsapp.status, 'blocked');
  assert.equal(blockedWhatsapp.templateKey, 'notification-template-missing');
  assert.deepEqual(blockedWhatsapp.reasons, ['whatsapp_recipient_missing_or_invalid', 'provider_readiness_evidence_missing']);

  const disabledPlan = buildNotificationDeliveryPlan({
    channel: 'email',
    provider: 'disabled',
    templateKey: 'order.confirmed',
    recipient: 'customer@example.com'
  });
  assert.equal(disabledPlan.status, 'disabled');
  assert.equal(disabledPlan.liveDeliveryEnabled, false);
  assert.deepEqual(disabledPlan.reasons, ['provider_disabled']);

  console.log('notification-delivery-contract.test.ts passed');
}
