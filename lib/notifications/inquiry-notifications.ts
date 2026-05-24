import 'server-only';

type InquiryNotificationPayload = {
  inquiryId: string;
  productTitle?: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  message: string;
};

type NotificationRecipients = {
  email: string;
  whatsapp: string;
  webhookUrl: string;
};

function configuredMode() {
  return process.env.INQUIRY_NOTIFICATION_MODE?.trim().toLowerCase() || 'log';
}

function recipientSummary(): NotificationRecipients {
  return {
    email: process.env.INQUIRY_NOTIFICATION_EMAIL?.trim() || '',
    whatsapp: process.env.INQUIRY_NOTIFICATION_WHATSAPP?.trim() || '',
    webhookUrl: process.env.INQUIRY_NOTIFICATION_WEBHOOK_URL?.trim() || ''
  };
}

function safePreview(value: string) {
  return value.slice(0, 160);
}

function logNotification(payload: InquiryNotificationPayload, mode = 'log') {
  const recipients = recipientSummary();
  console.info('[notifications] new customer inquiry', {
    mode,
    recipientsConfigured: Boolean(recipients.email || recipients.whatsapp || recipients.webhookUrl),
    inquiryId: payload.inquiryId,
    productTitle: payload.productTitle,
    customerName: payload.customerName,
    customerPhone: payload.customerPhone,
    customerEmail: payload.customerEmail,
    messagePreview: safePreview(payload.message)
  });
}

async function notifyWebhook(payload: InquiryNotificationPayload, recipients: NotificationRecipients) {
  if (!recipients.webhookUrl) {
    console.warn('[notifications] webhook mode requested but INQUIRY_NOTIFICATION_WEBHOOK_URL is not configured');
    logNotification(payload, 'webhook-missing-url');
    return;
  }

  try {
    const response = await fetch(recipients.webhookUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        event: 'golara.customer_inquiry.created',
        inquiry: {
          id: payload.inquiryId,
          productTitle: payload.productTitle,
          customerName: payload.customerName,
          customerPhone: payload.customerPhone,
          customerEmail: payload.customerEmail,
          message: payload.message
        }
      })
    });

    if (!response.ok) {
      console.warn('[notifications] inquiry webhook returned non-success status', {
        status: response.status,
        statusText: response.statusText
      });
      logNotification(payload, 'webhook-failed');
      return;
    }

    console.info('[notifications] inquiry webhook sent', {
      inquiryId: payload.inquiryId,
      status: response.status
    });
  } catch (error) {
    console.warn('[notifications] inquiry webhook failed', error);
    logNotification(payload, 'webhook-error');
  }
}

export async function notifyNewInquiry(payload: InquiryNotificationPayload) {
  const mode = configuredMode();
  const recipients = recipientSummary();

  if (mode === 'log') {
    logNotification(payload);
    return;
  }

  if (mode === 'webhook') {
    await notifyWebhook(payload, recipients);
    return;
  }

  console.warn('[notifications] unsupported INQUIRY_NOTIFICATION_MODE; using log-only notification', { mode });
  logNotification(payload, 'unsupported-mode');
}
