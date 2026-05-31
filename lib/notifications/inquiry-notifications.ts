import 'server-only';

import {
  createInquiryNotificationService,
  getInquiryNotificationConfig,
  getInquiryNotificationReadiness,
  getInquiryNotificationRetryRunbook,
  type InquiryNotificationPayload
} from './inquiry-notifications-core';

export { getInquiryNotificationConfig, getInquiryNotificationReadiness, getInquiryNotificationRetryRunbook } from './inquiry-notifications-core';

const inquiryNotificationService = createInquiryNotificationService({
  getConfig: () => getInquiryNotificationConfig(process.env)
});

export function getCurrentInquiryNotificationReadiness() {
  return getInquiryNotificationReadiness(getInquiryNotificationConfig(process.env));
}

export function getCurrentInquiryNotificationRetryRunbook() {
  return getInquiryNotificationRetryRunbook(getCurrentInquiryNotificationReadiness());
}

export async function notifyNewInquiry(payload: InquiryNotificationPayload) {
  return inquiryNotificationService.notifyNewInquiry(payload);
}
