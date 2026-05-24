import 'server-only';

type InquiryNotificationPayload = {
  inquiryId: string;
  productTitle?: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  message: string;
};

function configuredMode() {
  return process.env.INQUIRY_NOTIFICATION_MODE?.trim() || 'log';
}

function recipientSummary() {
  return {
    email: process.env.INQUIRY_NOTIFICATION_EMAIL?.trim() || '',
    whatsapp: process.env.INQUIRY_NOTIFICATION_WHATSAPP?.trim() || ''
  };
}

export async function notifyNewInquiry(payload: InquiryNotificationPayload) {
  const mode = configuredMode();
  const recipients = recipientSummary();

  if (mode !== 'log') {
    console.warn('[notifications] unsupported INQUIRY_NOTIFICATION_MODE; using log-only notification', { mode });
  }

  console.info('[notifications] new customer inquiry', {
    mode: 'log',
    recipientsConfigured: Boolean(recipients.email || recipients.whatsapp),
    inquiryId: payload.inquiryId,
    productTitle: payload.productTitle,
    customerName: payload.customerName,
    customerPhone: payload.customerPhone,
    customerEmail: payload.customerEmail,
    messagePreview: payload.message.slice(0, 160)
  });
}
