import assert from 'node:assert/strict';
import {
  getCurrentInquiryNotificationReadiness,
  getCurrentInquiryNotificationRetryRunbook,
  getInquiryNotificationConfig as getInquiryNotificationConfigFromWrapper,
  getInquiryNotificationReadiness as getInquiryNotificationReadinessFromWrapper,
  getInquiryNotificationRetryRunbook as getInquiryNotificationRetryRunbookFromWrapper,
  notifyNewInquiry
} from '../../lib/notifications/inquiry-notifications';
import {
  createInquiryNotificationService,
  getInquiryNotificationConfig,
  getInquiryNotificationReadiness,
  getInquiryNotificationRetryRunbook,
  normalizeInquiryNotificationMode,
  type InquiryNotificationPayload
} from '../../lib/notifications/inquiry-notifications-core';

const payload: InquiryNotificationPayload = {
  inquiryId: 'inquiry-1',
  productTitle: 'Rose Bouquet',
  customerName: 'Mina Customer',
  customerPhone: '+1 604 555 0101',
  customerEmail: 'mina@example.test',
  message: 'I would like a rose bouquet for a birthday.'
};

type LogEntry = { level: 'info' | 'warn'; args: unknown[] };

function createLogger() {
  const entries: LogEntry[] = [];
  return {
    entries,
    logger: {
      info(...args: unknown[]) {
        entries.push({ level: 'info', args });
      },
      warn(...args: unknown[]) {
        entries.push({ level: 'warn', args });
      }
    }
  };
}

function response(status: number, statusText = 'OK') {
  return { ok: status >= 200 && status < 300, status, statusText } as Response;
}

function defaultRecipients() {
  return { email: '', whatsapp: '', webhookUrl: '' };
}

export async function runInquiryNotificationsCoreTests() {
  assert.equal(normalizeInquiryNotificationMode(undefined), 'log');
  assert.equal(normalizeInquiryNotificationMode(' WebHook '), 'webhook');
  assert.deepEqual(
    getInquiryNotificationConfig({
      INQUIRY_NOTIFICATION_MODE: ' webhook ',
      INQUIRY_NOTIFICATION_EMAIL: ' staff@example.test ',
      INQUIRY_NOTIFICATION_WHATSAPP: ' +16045550101 ',
      INQUIRY_NOTIFICATION_WEBHOOK_URL: ' https://example.test/hook '
    }),
    {
      mode: 'webhook',
      recipients: {
        email: 'staff@example.test',
        whatsapp: '+16045550101',
        webhookUrl: 'https://example.test/hook'
      }
    }
  );

  assert.equal(getInquiryNotificationConfigFromWrapper, getInquiryNotificationConfig);
  assert.equal(getInquiryNotificationReadinessFromWrapper, getInquiryNotificationReadiness);
  assert.equal(getInquiryNotificationRetryRunbookFromWrapper, getInquiryNotificationRetryRunbook);

  const originalInquiryNotificationEnv = {
    INQUIRY_NOTIFICATION_MODE: process.env.INQUIRY_NOTIFICATION_MODE,
    INQUIRY_NOTIFICATION_EMAIL: process.env.INQUIRY_NOTIFICATION_EMAIL,
    INQUIRY_NOTIFICATION_WHATSAPP: process.env.INQUIRY_NOTIFICATION_WHATSAPP,
    INQUIRY_NOTIFICATION_WEBHOOK_URL: process.env.INQUIRY_NOTIFICATION_WEBHOOK_URL
  };

  const originalConsoleInfo = console.info;
  try {
    process.env.INQUIRY_NOTIFICATION_MODE = ' log ';
    process.env.INQUIRY_NOTIFICATION_EMAIL = ' staff@example.test ';
    process.env.INQUIRY_NOTIFICATION_WHATSAPP = '';
    process.env.INQUIRY_NOTIFICATION_WEBHOOK_URL = '';

    const currentReadiness = getCurrentInquiryNotificationReadiness();
    assert.equal(currentReadiness.mode, 'log');
    assert.equal(currentReadiness.ready, true);
    assert.equal(currentReadiness.warnings[0]?.code, 'notification_log_only');
    assert.deepEqual(getCurrentInquiryNotificationRetryRunbook(), getInquiryNotificationRetryRunbook(currentReadiness));

    let logged: unknown[] | null = null;
    console.info = (...args: unknown[]) => {
      logged = args;
    };

    const wrapperResult = await notifyNewInquiry({
      ...payload,
      inquiryId: 'wrapper-inquiry',
      message: 'x'.repeat(200)
    });
    assert.deepEqual(wrapperResult, {
      status: 'logged',
      mode: 'log',
      channel: 'log',
      inquiryId: 'wrapper-inquiry',
      fallbackLogged: false,
      detail: 'Inquiry notification was written to structured logs.'
    });
    assert.equal(logged?.[0], '[notifications] new customer inquiry');
    assert.equal((logged?.[1] as { inquiryId: string }).inquiryId, 'wrapper-inquiry');
    assert.equal((logged?.[1] as { messagePreview: string }).messagePreview.length, 160);
  } finally {
    console.info = originalConsoleInfo;
    for (const [key, value] of Object.entries(originalInquiryNotificationEnv)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }

  const logReadiness = getInquiryNotificationReadiness({ mode: 'log', recipients: defaultRecipients() });
  assert.deepEqual(logReadiness, {
    mode: 'log',
    ready: true,
    blockers: [],
    warnings: [
      {
        code: 'notification_log_only',
        severity: 'warning',
        summary: 'Inquiry notifications are log-only.',
        detail: 'Staff must monitor the admin inbox until webhook, email, or WhatsApp delivery is configured.'
      }
    ]
  });
  assert.deepEqual(getInquiryNotificationRetryRunbook(logReadiness), [
    'Monitor the admin inquiry inbox as the source of truth for every new inquiry.',
    'Check server logs for [notifications] new customer inquiry entries during the launch window.',
    'Assign each new inquiry to a staff owner and add a follow-up note once staff contact the customer.',
    'Switch to webhook mode only after the receiver URL and test inquiry delivery are verified.'
  ]);

  const missingWebhookReadiness = getInquiryNotificationReadiness({ mode: 'webhook', recipients: defaultRecipients() });
  assert.deepEqual(missingWebhookReadiness, {
    mode: 'webhook',
    ready: false,
    blockers: [
      {
        code: 'notification_webhook_url_missing',
        severity: 'blocker',
        summary: 'Webhook notifications are selected but the webhook URL is missing.',
        detail: 'Set INQUIRY_NOTIFICATION_WEBHOOK_URL or switch INQUIRY_NOTIFICATION_MODE to log before production deploy.'
      }
    ],
    warnings: []
  });
  assert.deepEqual(getInquiryNotificationRetryRunbook(missingWebhookReadiness), [
    'Confirm the receiver URL is configured and still accepts golara.customer_inquiry.created payloads.',
    'Open the admin inquiry inbox and verify the customer inquiry exists before retrying any external notification.',
    'Use the inquiry export or print view to manually resend the inquiry details to staff or the external workflow owner.',
    'After fixing the receiver, submit a test inquiry and verify the webhook returns a 2xx response.'
  ]);

  assert.deepEqual(
    getInquiryNotificationReadiness({
      mode: 'webhook',
      recipients: { ...defaultRecipients(), webhookUrl: 'https://example.test/hook' }
    }),
    {
      mode: 'webhook',
      ready: true,
      blockers: [],
      warnings: []
    }
  );

  const unsupportedReadiness = getInquiryNotificationReadiness({ mode: 'email', recipients: defaultRecipients() });
  assert.deepEqual(unsupportedReadiness, {
    mode: 'email',
    ready: false,
    blockers: [
      {
        code: 'notification_mode_unsupported',
        severity: 'blocker',
        summary: 'Unsupported inquiry notification mode: email.',
        detail: 'Use INQUIRY_NOTIFICATION_MODE=log or INQUIRY_NOTIFICATION_MODE=webhook before production deploy.'
      }
    ],
    warnings: []
  });
  assert.deepEqual(getInquiryNotificationRetryRunbook(unsupportedReadiness), [
    'Switch INQUIRY_NOTIFICATION_MODE to log or webhook before launch.',
    'Redeploy with supported notification settings.',
    'Create a test inquiry and verify it appears in the admin inbox.',
    'Confirm staff have a manual monitoring process until automated delivery is verified.'
  ]);

  {
    const { entries, logger } = createLogger();
    const service = createInquiryNotificationService({
      getConfig: () => ({ mode: 'log', recipients: defaultRecipients() }),
      logger
    });

    const result = await service.notifyNewInquiry(payload);

    assert.deepEqual(result, {
      status: 'logged',
      mode: 'log',
      channel: 'log',
      inquiryId: 'inquiry-1',
      fallbackLogged: false,
      detail: 'Inquiry notification was written to structured logs.'
    });
    assert.equal(entries.length, 1);
    assert.equal(entries[0]?.level, 'info');
    assert.equal(entries[0]?.args[0], '[notifications] new customer inquiry');
    assert.deepEqual(entries[0]?.args[1], {
      mode: 'log',
      recipientsConfigured: false,
      inquiryId: 'inquiry-1',
      productTitle: 'Rose Bouquet',
      customerName: 'Mina Customer',
      customerPhone: '+1 604 555 0101',
      customerEmail: 'mina@example.test',
      messagePreview: 'I would like a rose bouquet for a birthday.',
      delivery: result
    });
  }

  {
    const { entries, logger } = createLogger();
    const requests: { url: string | URL | Request; init?: RequestInit }[] = [];
    const service = createInquiryNotificationService({
      getConfig: () => ({ mode: 'webhook', recipients: { ...defaultRecipients(), webhookUrl: 'https://example.test/hook' } }),
      logger,
      async fetchImpl(url, init) {
        requests.push({ url, init });
        return response(204, 'No Content');
      }
    });

    const result = await service.notifyNewInquiry(payload);

    assert.deepEqual(result, {
      status: 'delivered',
      mode: 'webhook',
      channel: 'webhook',
      inquiryId: 'inquiry-1',
      fallbackLogged: false,
      webhookStatus: 204,
      detail: 'Inquiry webhook returned a 2xx response.'
    });
    assert.equal(requests.length, 1);
    assert.equal(requests[0]?.url, 'https://example.test/hook');
    assert.equal(requests[0]?.init?.method, 'POST');
    assert.deepEqual(JSON.parse(String(requests[0]?.init?.body)), {
      event: 'golara.customer_inquiry.created',
      inquiry: {
        id: 'inquiry-1',
        productTitle: 'Rose Bouquet',
        customerName: 'Mina Customer',
        customerPhone: '+1 604 555 0101',
        customerEmail: 'mina@example.test',
        message: 'I would like a rose bouquet for a birthday.'
      }
    });
    assert.deepEqual(entries, [
      {
        level: 'info',
        args: ['[notifications] inquiry webhook sent', { inquiryId: 'inquiry-1', status: 204, delivery: result }]
      }
    ]);
  }

  {
    const { entries, logger } = createLogger();
    let fetchCalled = false;
    const service = createInquiryNotificationService({
      getConfig: () => ({ mode: 'webhook', recipients: defaultRecipients() }),
      logger,
      async fetchImpl() {
        fetchCalled = true;
        return response(200);
      }
    });

    const result = await service.notifyNewInquiry(payload);

    assert.equal(fetchCalled, false);
    assert.equal(entries[0]?.level, 'warn');
    assert.equal(entries[0]?.args[0], '[notifications] webhook mode requested but INQUIRY_NOTIFICATION_WEBHOOK_URL is not configured');
    assert.deepEqual(entries[0]?.args[1], { inquiryId: 'inquiry-1', errorCode: 'notification_webhook_url_missing' });
    assert.equal(entries[1]?.level, 'info');
    assert.equal((entries[1]?.args[1] as { mode: string }).mode, 'webhook-missing-url');
    assert.deepEqual(result, {
      status: 'fallback',
      mode: 'webhook-missing-url',
      channel: 'log',
      inquiryId: 'inquiry-1',
      fallbackLogged: true,
      detail: 'Inquiry notification fell back to structured logs.'
    });
  }

  {
    const { entries, logger } = createLogger();
    const service = createInquiryNotificationService({
      getConfig: () => ({ mode: 'webhook', recipients: { ...defaultRecipients(), webhookUrl: 'https://example.test/hook' } }),
      logger,
      async fetchImpl() {
        return response(500, 'Server Error');
      }
    });

    const result = await service.notifyNewInquiry(payload);

    assert.deepEqual(result, {
      status: 'fallback',
      mode: 'webhook',
      channel: 'webhook',
      inquiryId: 'inquiry-1',
      fallbackLogged: true,
      webhookStatus: 500,
      errorCode: 'notification_webhook_non_success',
      detail: 'Webhook returned 500 Server Error. Inquiry was also logged.'
    });
    assert.deepEqual(entries[0], {
      level: 'warn',
      args: ['[notifications] inquiry webhook returned non-success status', { status: 500, statusText: 'Server Error', inquiryId: 'inquiry-1', delivery: result }]
    });
    assert.equal(entries[1]?.level, 'info');
    assert.equal((entries[1]?.args[1] as { mode: string }).mode, 'webhook-failed');
  }

  {
    const { entries, logger } = createLogger();
    const error = new Error('network down');
    const service = createInquiryNotificationService({
      getConfig: () => ({ mode: 'webhook', recipients: { ...defaultRecipients(), webhookUrl: 'https://example.test/hook' } }),
      logger,
      async fetchImpl() {
        throw error;
      }
    });

    const result = await service.notifyNewInquiry(payload);

    assert.deepEqual(result, {
      status: 'fallback',
      mode: 'webhook',
      channel: 'webhook',
      inquiryId: 'inquiry-1',
      fallbackLogged: true,
      errorCode: 'notification_webhook_error',
      detail: 'network down'
    });
    assert.deepEqual(entries[0], {
      level: 'warn',
      args: ['[notifications] inquiry webhook failed', { inquiryId: 'inquiry-1', error, delivery: result }]
    });
    assert.equal(entries[1]?.level, 'info');
    assert.equal((entries[1]?.args[1] as { mode: string }).mode, 'webhook-error');
  }

  {
    const { entries, logger } = createLogger();
    const service = createInquiryNotificationService({
      getConfig: () => ({ mode: 'email', recipients: defaultRecipients() }),
      logger
    });

    const result = await service.notifyNewInquiry(payload);

    assert.deepEqual(entries[0], {
      level: 'warn',
      args: ['[notifications] unsupported INQUIRY_NOTIFICATION_MODE; using log-only notification', { mode: 'email', inquiryId: 'inquiry-1', errorCode: 'notification_mode_unsupported' }]
    });
    assert.equal(entries[1]?.level, 'info');
    assert.equal((entries[1]?.args[1] as { mode: string }).mode, 'unsupported-mode');
    assert.deepEqual(result, {
      status: 'fallback',
      mode: 'unsupported-mode',
      channel: 'log',
      inquiryId: 'inquiry-1',
      fallbackLogged: true,
      detail: 'Inquiry notification fell back to structured logs.'
    });
  }

  console.log('inquiry-notifications-core.test.ts passed');
}
