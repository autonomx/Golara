import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { buildNotificationDeliveryPlan } from '../../lib/notifications/notification-delivery-contract';

function source(path: string) {
  return readFileSync(path, 'utf8');
}

function assertNoLiveDeliverySurface(pageSource: string) {
  assert.equal(pageSource.includes('fetch('), false);
  assert.equal(pageSource.includes('https://api.'), false);
  assert.equal(pageSource.includes('https://graph.facebook.com'), false);
  assert.equal(pageSource.includes('https://api.twilio.com'), false);
  assert.equal(pageSource.includes('https://api.sendgrid.com'), false);
  assert.equal(pageSource.includes('https://api.resend.com'), false);
  assert.equal(pageSource.includes('TWILIO_AUTH_TOKEN='), false);
  assert.equal(pageSource.includes('SENDGRID_API_KEY='), false);
  assert.equal(pageSource.includes('RESEND_API_KEY='), false);
  assert.equal(pageSource.includes('WHATSAPP_ACCESS_TOKEN='), false);
  assert.equal(pageSource.includes('onClick='), false);
  assert.equal(pageSource.includes('<button'), false);
}

export async function runNotificationProviderPhase34KickoffTests() {
  const kickoff = source('docs/production-roadmap-phase34-notification-providers.md');
  const deliveryContract = source('lib/notifications/notification-delivery-contract.ts');

  assert.ok(kickoff.includes('Phase 34 Real Notification Provider Foundations'));
  assert.ok(kickoff.includes('no real email, SMS, or WhatsApp provider delivery is enabled'));
  assert.ok(kickoff.includes('provider-neutral delivery contract'));
  assert.ok(kickoff.includes('email, SMS, and WhatsApp-style channels'));
  assert.ok(kickoff.includes('readiness diagnostics before any live provider calls'));
  assert.ok(kickoff.includes('delivery-attempt persistence planning'));
  assert.ok(kickoff.includes('Email: SMTP, Resend, SendGrid'));
  assert.ok(kickoff.includes('SMS: Twilio'));
  assert.ok(kickoff.includes('WhatsApp: Twilio WhatsApp, Meta WhatsApp Cloud API'));
  assert.ok(kickoff.includes('This document does not select or approve a live provider'));
  assert.ok(kickoff.includes('Live email, SMS, or WhatsApp HTTP/API calls'));
  assert.ok(kickoff.includes('Default live provider endpoint URLs'));
  assert.ok(kickoff.includes('Provider credentials or secret values'));
  assert.ok(kickoff.includes('Admin send/retry buttons that trigger live delivery'));
  assert.ok(kickoff.includes('Automatic customer/staff delivery'));
  assert.ok(kickoff.includes('Durable retry worker behavior; that belongs to Phase 35'));
  assert.ok(kickoff.includes('Provider selection and account ownership confirmation'));
  assert.ok(kickoff.includes('Credential-source names documented without secret values'));
  assert.ok(kickoff.includes('Sender identity/domain/number/WhatsApp business verification evidence'));
  assert.ok(kickoff.includes('Template approval evidence'));
  assert.ok(kickoff.includes('Opt-out, consent, and suppression-list expectations'));
  assert.ok(kickoff.includes('Phase 35 owns durable outbound retry/worker behavior'));
  assert.ok(kickoff.includes('Phase 38 owns production operations and monitoring'));
  assertNoLiveDeliverySurface(kickoff);

  assert.ok(deliveryContract.includes("NOTIFICATION_DELIVERY_CHANNELS = ['email', 'sms', 'whatsapp'] as const"));
  assert.ok(deliveryContract.includes('liveDeliveryEnabled: false'));
  assert.ok(deliveryContract.includes('provider_readiness_evidence_missing'));
  assertNoLiveDeliverySurface(deliveryContract);

  const plannedEmail = buildNotificationDeliveryPlan({
    channel: 'email',
    provider: 'log',
    templateKey: ' order.confirmed ',
    recipient: ' customer@example.com ',
    providerReady: true
  });
  assert.equal(plannedEmail.status, 'planned');
  assert.equal(plannedEmail.liveDeliveryEnabled, false);
  assert.equal(plannedEmail.templateKey, 'order.confirmed');
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

  console.log('notification-provider-phase34-kickoff.test.ts passed');
}
