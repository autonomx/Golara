export type InquiryNotificationPayload = {
  inquiryId: string;
  productTitle?: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  message: string;
};

export type NotificationRecipients = {
  email: string;
  whatsapp: string;
  webhookUrl: string;
};

export type InquiryNotificationConfig = {
  mode: string;
  recipients: NotificationRecipients;
};

export type InquiryNotificationLogger = Pick<typeof console, 'info' | 'warn'>;

export type InquiryNotificationServiceDependencies = {
  getConfig: () => InquiryNotificationConfig;
  fetchImpl?: typeof fetch;
  logger?: InquiryNotificationLogger;
};

export function normalizeInquiryNotificationMode(value: string | undefined) {
  return value?.trim().toLowerCase() || 'log';
}

function envValue(env: Record<string, string | undefined>, name: string) {
  return env[name]?.trim() || '';
}

export function getInquiryNotificationConfig(env: Record<string, string | undefined>): InquiryNotificationConfig {
  return {
    mode: normalizeInquiryNotificationMode(env.INQUIRY_NOTIFICATION_MODE),
    recipients: {
      email: envValue(env, 'INQUIRY_NOTIFICATION_EMAIL'),
      whatsapp: envValue(env, 'INQUIRY_NOTIFICATION_WHATSAPP'),
      webhookUrl: envValue(env, 'INQUIRY_NOTIFICATION_WEBHOOK_URL')
    }
  };
}

function safePreview(value: string) {
  return value.slice(0, 160);
}

function logNotification(
  logger: InquiryNotificationLogger,
  payload: InquiryNotificationPayload,
  recipients: NotificationRecipients,
  mode = 'log'
) {
  logger.info('[notifications] new customer inquiry', {
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

async function notifyWebhook(
  payload: InquiryNotificationPayload,
  recipients: NotificationRecipients,
  fetchImpl: typeof fetch,
  logger: InquiryNotificationLogger
) {
  if (!recipients.webhookUrl) {
    logger.warn('[notifications] webhook mode requested but INQUIRY_NOTIFICATION_WEBHOOK_URL is not configured');
    logNotification(logger, payload, recipients, 'webhook-missing-url');
    return;
  }

  try {
    const response = await fetchImpl(recipients.webhookUrl, {
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
      logger.warn('[notifications] inquiry webhook returned non-success status', {
        status: response.status,
        statusText: response.statusText
      });
      logNotification(logger, payload, recipients, 'webhook-failed');
      return;
    }

    logger.info('[notifications] inquiry webhook sent', {
      inquiryId: payload.inquiryId,
      status: response.status
    });
  } catch (error) {
    logger.warn('[notifications] inquiry webhook failed', error);
    logNotification(logger, payload, recipients, 'webhook-error');
  }
}

export function createInquiryNotificationService(dependencies: InquiryNotificationServiceDependencies) {
  const logger = dependencies.logger ?? console;
  const fetchImpl = dependencies.fetchImpl ?? fetch;

  return {
    async notifyNewInquiry(payload: InquiryNotificationPayload) {
      const config = dependencies.getConfig();
      const { mode, recipients } = config;

      if (mode === 'log') {
        logNotification(logger, payload, recipients);
        return;
      }

      if (mode === 'webhook') {
        await notifyWebhook(payload, recipients, fetchImpl, logger);
        return;
      }

      logger.warn('[notifications] unsupported INQUIRY_NOTIFICATION_MODE; using log-only notification', { mode });
      logNotification(logger, payload, recipients, 'unsupported-mode');
    }
  };
}
