import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { runNotificationDeliveryAdapter } from '../../lib/notifications/notification-delivery-adapters';
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
  const evidenceTemplate = source('docs/production-roadmap-phase34-provider-readiness-evidence-example.md');
  const smokeChecklist = source('docs/production-roadmap-phase34-notification-smoke-test-checklist.md');
  const persistencePlan = source('docs/production-roadmap-phase34-delivery-attempt-persistence-planning.md');
  const deliveryContract = source('lib/notifications/notification-delivery-contract.ts');
  const providerReadiness = source('lib/notifications/notification-provider-readiness.ts');
  const deliveryAdapters = source('lib/notifications/notification-delivery-adapters.ts');

  assert.ok(kickoff.includes('Phase 34 Real Notification Provider Foundations'));
  assert.ok(kickoff.includes('no real email, SMS, or WhatsApp provider delivery is enabled'));
  assert.ok(kickoff.includes('provider-neutral delivery contract'));
  assert.ok(kickoff.includes('email, SMS, and WhatsApp-style channels'));
  assert.ok(kickoff.includes('readiness diagnostics before any live provider calls'));
  assert.ok(kickoff.includes('delivery-attempt persistence planning'));
  assert.ok(kickoff.includes('notification-delivery-adapters.ts'));
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

  assert.ok(evidenceTemplate.includes('Provider Readiness Evidence Example'));
  assert.ok(evidenceTemplate.includes('configuration source names only'));
  assert.ok(evidenceTemplate.includes('Ready for live delivery enablement'));
  assertNoLiveDeliverySurface(evidenceTemplate);

  assert.ok(smokeChecklist.includes('Notification Smoke-Test Checklist'));
  assert.ok(smokeChecklist.includes('operator-led notification provider smoke tests'));
  assert.ok(smokeChecklist.includes('Ready for separate live enablement change'));
  assertNoLiveDeliverySurface(smokeChecklist);

  assert.ok(persistencePlan.includes('Delivery-Attempt Persistence Planning'));
  assert.ok(persistencePlan.includes('no database migration, retry worker, admin retry control, or live provider delivery is enabled'));
  assert.ok(persistencePlan.includes('Idempotency expectations'));
  assert.ok(persistencePlan.includes('Relationship to Phase 35'));
  assertNoLiveDeliverySurface(persistencePlan);

  assert.ok(deliveryContract.includes("NOTIFICATION_DELIVERY_CHANNELS = ['email', 'sms', 'whatsapp'] as const"));
  assert.ok(deliveryContract.includes('liveDeliveryEnabled: false'));
  assert.ok(deliveryContract.includes('provider_readiness_evidence_missing'));
  assertNoLiveDeliverySurface(deliveryContract);

  assert.ok(providerReadiness.includes('buildNotificationProviderReadiness'));
  assert.ok(providerReadiness.includes('liveDeliveryEnabled: false'));
  assert.ok(providerReadiness.includes('sender_verification_missing'));
  assert.ok(providerReadiness.includes('template_approval_missing'));
  assertNoLiveDeliverySurface(providerReadiness);

  assert.ok(deliveryAdapters.includes('runNotificationDeliveryAdapter'));
  assert.ok(deliveryAdapters.includes('liveDeliveryEnabled: false'));
  assert.ok(deliveryAdapters.includes("action: 'skipped' | 'manual_review' | 'logged'"));
  assertNoLiveDeliverySurface(deliveryAdapters);

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

  const loggedAdapter = runNotificationDeliveryAdapter({
    adapter: 'log',
    channel: 'email',
    provider: 'log',
    templateKey: ' order.confirmed ',
    recipient: ' customer@example.com ',
    providerReady: true,
    operatorNote: ' queued for audit log '
  });
  assert.equal(loggedAdapter.action, 'logged');
  assert.equal(loggedAdapter.handled, true);
  assert.equal(loggedAdapter.liveDeliveryEnabled, false);
  assert.equal(loggedAdapter.operatorNoteLabel, 'queued for audit log');
  assert.equal(loggedAdapter.plan.status, 'planned');
  assert.ok(loggedAdapter.auditLabels.includes('adapter:log'));

  const manualAdapter = runNotificationDeliveryAdapter({
    adapter: 'manual',
    channel: 'sms',
    provider: 'manual',
    templateKey: 'fulfillment.ready',
    recipient: '+15551234567'
  });
  assert.equal(manualAdapter.action, 'manual_review');
  assert.equal(manualAdapter.plan.status, 'manual_review');
  assert.ok(manualAdapter.auditLabels.includes('provider:manual'));

  const disabledAdapter = runNotificationDeliveryAdapter({
    adapter: 'disabled',
    channel: 'whatsapp',
    provider: 'disabled',
    templateKey: 'inquiry.received',
    recipient: '+15551234567'
  });
  assert.equal(disabledAdapter.action, 'skipped');
  assert.equal(disabledAdapter.plan.status, 'disabled');
  assert.equal(disabledAdapter.liveDeliveryEnabled, false);

  console.log('notification-provider-phase34-kickoff.test.ts passed');
}
