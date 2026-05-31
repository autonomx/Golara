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

export type InquiryNotificationReadinessSeverity = 'blocker' | 'warning';

export type InquiryNotificationReadinessIssue = {
  code: string;
  severity: InquiryNotificationReadinessSeverity;
  summary: string;
  detail: string;
};

export type InquiryNotificationReadiness = {
  mode: string;
  ready: boolean;
  blockers: InquiryNotificationReadinessIssue[];
  warnings: InquiryNotificationReadinessIssue[];
};

export type InquiryNotificationDeliveryStatus = 'delivered' | 'logged' | 'fallback' | 'failed';

export type InquiryNotificationDeliveryResult = {
  status: InquiryNotificationDeliveryStatus;
  mode: string;
  channel: 'log' | 'webhook';
  inquiryId: string;
  fallbackLogged: boolean;
  webhookStatus?: number;
  errorCode?: string;
  detail: string;
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

export function getInquiryNotificationReadiness(config: InquiryNotificationConfig): InquiryNotificationReadiness {
  const blockers: InquiryNotificationReadinessIssue[] = [];
  const warnings: InquiryNotificationReadinessIssue[] = [];

  if (config.mode === 'webhook') {
    if (!config.recipients.webhookUrl) {
      blockers.push({
        code: 'notification_webhook_url_missing',
        severity: 'blocker',
        summary: 'Webhook notifications are selected but the webhook URL is missing.',
        detail: 'Set INQUIRY_NOTIFICATION_WEBHOOK_URL or switch INQUIRY_NOTIFICATION_MODE to log before production deploy.'
      });
    }
  } else if (config.mode === 'log') {
    warnings.push({
      code: 'notification_log_only',
      severity: 'warning',
      summary: 'Inquiry notifications are log-only.',
      detail: 'Staff must monitor the admin inbox until webhook, email, or WhatsApp delivery is configured.'
    });
  } else {
    blockers.push({
      code: 'notification_mode_unsupported',
      severity: 'blocker',
      summary: `Unsupported inquiry notification mode: ${config.mode}.`,
      detail: 'Use INQUIRY_NOTIFICATION_MODE=log or INQUIRY_NOTIFICATION_MODE=webhook before production deploy.'
    });
  }

  return {
    mode: config.mode,
    ready: blockers.length === 0,
    blockers,
    warnings
  };
}

export function getInquiryNotificationRetryRunbook(readiness: InquiryNotificationReadiness): string[] {
  if (readiness.mode === 'webhook') {
    return [
      'Confirm the receiver URL is configured and still accepts golara.customer_inquiry.created payloads.',
      'Open the admin inquiry inbox and verify the customer inquiry exists before retrying any external notification.',
      'Use the inquiry export or print view to manually resend the inquiry details to staff or the external workflow owner.',
      'After fixing the receiver, submit a test inquiry and verify the webhook returns a 2xx response.'
    ];
  }

  if (readiness.mode === 'log') {
    return [
      'Monitor the admin inquiry inbox as the source of truth for every new inquiry.',
      'Check server logs for [notifications] new customer inquiry entries during the launch window.',
      'Assign each new inquiry to a staff owner and add a follow-up note once staff contact the customer.',
      'Switch to webhook mode only after the receiver URL and test inquiry delivery are verified.'
    ];
  }

  return [
    'Switch INQUIRY_NOTIFICATION_MODE to log or webhook before launch.',
    'Redeploy with supported notification settings.',
    'Create a test inquiry and verify it appears in the admin inbox.',
    'Confirm staff have a manual monitoring process until automated delivery is verified.'
  ];
}

function safePreview(value: string) {
  return value.slice(0, 160);
}

function createDeliveryResult(input: Omit<InquiryNotificationDeliveryResult, 'inquiryId'> & { inquiryId: string }): InquiryNotificationDeliveryResult {
  return input;
}

function logNotification(
  logger: InquiryNotificationLogger,
  payload: InquiryNotificationPayload,
  recipients: NotificationRecipients,
  mode = 'log'
): InquiryNotificationDeliveryResult {
  const result = createDeliveryResult({
    status: mode === 'log' ? 'logged' : 'fallback',
    mode,
    channel: 'log',
    inquiryId: payload.inquiryId,
    fallbackLogged: mode !== 'log',
    detail: mode === 'log' ? 'Inquiry notification was written to structured logs.' : 'Inquiry notification fell back to structured logs.'
  });

  logger.info('[notifications] new customer inquiry', {
    mode,
    recipientsConfigured: Boolean(recipients.email || recipients.whatsapp || recipients.webhookUrl),
    inquiryId: payload.inquiryId,
    productTitle: payload.productTitle,
    customerName: payload.customerName,
    customerPhone: payload.customerPhone,
    customerEmail: payload.customerEmail,
    messagePreview: safePreview(payload.message),
    delivery: result
  });

  return result;
}

async function notifyWebhook(
  payload: InquiryNotificationPayload,
  recipients: NotificationRecipients,
  fetchImpl: typeof fetch,
  logger: InquiryNotificationLogger
): Promise<InquiryNotificationDeliveryResult> {
  if (!recipients.webhookUrl) {
    logger.warn('[notifications] webhook mode requested but INQUIRY_NOTIFICATION_WEBHOOK_URL is not configured', {
      inquiryId: payload.inquiryId,
      errorCode: 'notification_webhook_url_missing'
    });
    return logNotification(logger, payload, recipients, 'webhook-missing-url');
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
      const failedResult = createDeliveryResult({
        status: 'fallback',
        mode: 'webhook',
        channel: 'webhook',
        inquiryId: payload.inquiryId,
        fallbackLogged: true,
        webhookStatus: response.status,
        errorCode: 'notification_webhook_non_success',
        detail: `Webhook returned ${response.status} ${response.statusText}. Inquiry was also logged.`
      });
      logger.warn('[notifications] inquiry webhook returned non-success status', {
        status: response.status,
        statusText: response.statusText,
        inquiryId: payload.inquiryId,
        delivery: failedResult
      });
      logNotification(logger, payload, recipients, 'webhook-failed');
      return failedResult;
    }

    const deliveredResult = createDeliveryResult({
      status: 'delivered',
      mode: 'webhook',
      channel: 'webhook',
      inquiryId: payload.inquiryId,
      fallbackLogged: false,
      webhookStatus: response.status,
      detail: 'Inquiry webhook returned a 2xx response.'
    });
    logger.info('[notifications] inquiry webhook sent', {
      inquiryId: payload.inquiryId,
      status: response.status,
      delivery: deliveredResult
    });
    return deliveredResult;
  } catch (error) {
    const errorResult = createDeliveryResult({
      status: 'fallback',
      mode: 'webhook',
      channel: 'webhook',
      inquiryId: payload.inquiryId,
      fallbackLogged: true,
      errorCode: 'notification_webhook_error',
      detail: error instanceof Error ? error.message : 'Webhook request failed. Inquiry was also logged.'
    });
    logger.warn('[notifications] inquiry webhook failed', { inquiryId: payload.inquiryId, error, delivery: errorResult });
    logNotification(logger, payload, recipients, 'webhook-error');
    return errorResult;
  }
}

export function createInquiryNotificationService(dependencies: InquiryNotificationServiceDependencies) {
  const logger = dependencies.logger ?? console;
  const fetchImpl = dependencies.fetchImpl ?? fetch;

  return {
    async notifyNewInquiry(payload: InquiryNotificationPayload): Promise<InquiryNotificationDeliveryResult> {
      const config = dependencies.getConfig();
      const { mode, recipients } = config;

      if (mode === 'log') {
        return logNotification(logger, payload, recipients);
      }

      if (mode === 'webhook') {
        return notifyWebhook(payload, recipients, fetchImpl, logger);
      }

      logger.warn('[notifications] unsupported INQUIRY_NOTIFICATION_MODE; using log-only notification', {
        mode,
        inquiryId: payload.inquiryId,
        errorCode: 'notification_mode_unsupported'
      });
      return logNotification(logger, payload, recipients, 'unsupported-mode');
    }
  };
}
