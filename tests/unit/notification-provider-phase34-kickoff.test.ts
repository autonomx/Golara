import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { buildNotificationDeliveryPlan } from '../../lib/notifications/notification-delivery-contract';
import { buildNotificationProviderReadiness } from '../../lib/notifications/notification-provider-readiness';

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
  const providerReadiness = source('lib/notifications/notification-provider-readiness.ts');

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

  assert.ok(providerReadiness.includes('buildNotificationProviderReadiness'));
  assert.ok(providerReadiness.includes('liveDeliveryEnabled: false'));
  assert.ok(providerReadiness.includes('sender_verification_missing'));
  assert.ok(providerReadiness.includes('template_approval_missing'));
  assertNoLiveDeliverySurface(providerReadiness);

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

  const readyResend = buildNotificationProviderReadiness({
    channel: 'email',
    provider: 'resend',
    env: { RESEND_API_KEY: 'present' },
    senderVerified: true,
    templatesApproved: true
  });
  assert.equal(readyResend.status, 'ready');
  assert.equal(readyResend.liveDeliveryEnabled, false);
  assert.deepEqual(readyResend.blockers, []);

  const blockedTwilioSms = buildNotificationProviderReadiness({
    channel: 'sms',
    provider: 'twilio',
    env: { TWILIO_ACCOUNT_SID: 'AC123' }
  });
  assert.equal(blockedTwilioSms.status, 'needs_operator_evidence');
  assert.ok(blockedTwilioSms.blockers.includes('twilio_auth_token_missing'));
  assert.ok(blockedTwilioSms.blockers.includes('twilio_from_number_missing'));
  assert.ok(blockedTwilioSms.blockers.includes('sender_verification_missing'));
  assert.ok(blockedTwilioSms.blockers.includes('template_approval_missing'));

  const manualWhatsapp = buildNotificationProviderReadiness({ channel: 'whatsapp', provider: 'manual' });
  assert.equal(manualWhatsapp.status, 'manual_review');
  assert.equal(manualWhatsapp.liveDeliveryEnabled, false);
  assert.deepEqual(manualWhatsapp.warnings, ['manual_provider_requires_operator_review']);

  const disabledEmail = buildNotificationProviderReadiness({ channel: 'email', provider: 'disabled' });
  assert.equal(disabledEmail.status, 'disabled');
  assert.equal(disabledEmail.liveDeliveryEnabled, false);
  assert.deepEqual(disabledEmail.warnings, ['provider_disabled']);

  const unsupported = buildNotificationProviderReadiness({ channel: 'sms', provider: 'sendgrid' });
  assert.equal(unsupported.status, 'needs_operator_evidence');
  assert.ok(unsupported.blockers.includes('provider_channel_unsupported'));

  console.log('notification-provider-phase34-kickoff.test.ts passed');
}
