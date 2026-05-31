import 'server-only';

import {
  createInquiryNotificationService,
  getInquiryNotificationConfig,
  type InquiryNotificationPayload
} from './inquiry-notifications-core';

const inquiryNotificationService = createInquiryNotificationService({
  getConfig: () => getInquiryNotificationConfig(process.env)
});

export async function notifyNewInquiry(payload: InquiryNotificationPayload) {
  await inquiryNotificationService.notifyNewInquiry(payload);
}
