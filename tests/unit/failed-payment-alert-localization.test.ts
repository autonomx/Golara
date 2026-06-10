import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  formatAdminFailedPaymentAlertKind,
  formatAdminFailedPaymentAlertStatus,
  formatAdminFailedPaymentAlertTitle,
  formatAdminFailedPaymentNotificationDetail
} from '../../lib/localization/admin-failed-payment-alerts-copy';

function source(path: string) {
  return readFileSync(path, 'utf8');
}

export function runFailedPaymentAlertLocalizationTests() {
  const helper = source('lib/localization/admin-failed-payment-alerts-copy.ts');
  const panel = source('components/admin/AdminFailedPaymentNotificationAlertsPanel.tsx');

  const paymentAlert = { kind: 'payment', status: 'failed' };
  const retryAlert = {
    kind: 'notification',
    status: 'retry_scheduled',
    detail: 'order_update to a@example.com · attempt 1/3 · TEMP_RETRY'
  };

  assert.equal(formatAdminFailedPaymentAlertKind('payment', 'fa-IR'), 'پرداخت');
  assert.equal(formatAdminFailedPaymentAlertStatus('retry_scheduled', 'fa-IR'), 'تلاش دوباره زمان بندی شده');
  assert.equal(formatAdminFailedPaymentAlertStatus('declined', 'en-CA'), 'Declined');
  assert.equal(formatAdminFailedPaymentAlertTitle(paymentAlert, 'fa-IR'), 'پرداخت ناموفق');
  assert.equal(formatAdminFailedPaymentAlertTitle(retryAlert, 'en-CA'), 'Retry scheduled Notification');
  assert.match(formatAdminFailedPaymentNotificationDetail(retryAlert, 'fa-IR'), / به /);
  assert.match(formatAdminFailedPaymentNotificationDetail(retryAlert, 'fa-IR'), /تلاش 1\/3/);

  assert.match(helper, /formatAdminFailedPaymentAlertTitle/);
  assert.match(helper, /formatAdminFailedPaymentNotificationDetail/);
  assert.match(helper, /adminLocaleKey/);

  assert.match(panel, /formatAdminFailedPaymentAlertTitle\(row, locale\)/);
  assert.match(panel, /formatAdminFailedPaymentAlertKind\(row\.kind, locale\)/);
  assert.match(panel, /formatAdminFailedPaymentAlertStatus\(row\.status, locale\)/);
  assert.doesNotMatch(panel, /\{row\.kind\}/);
  assert.doesNotMatch(panel, /\{row\.status\}/);

  console.log('failed-payment-alert-localization.test.ts passed');
}
