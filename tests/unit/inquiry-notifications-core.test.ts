import assert from 'node:assert/strict';
import {
  createInquiryNotificationService,
  getInquiryNotificationConfig,
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

  {
    const { entries, logger } = createLogger();
    const service = createInquiryNotificationService({
      getConfig: () => ({ mode: 'log', recipients: defaultRecipients() }),
      logger
    });

    await service.notifyNewInquiry(payload);

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
      messagePreview: 'I would like a rose bouquet for a birthday.'
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

    await service.notifyNewInquiry(payload);

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
        args: ['[notifications] inquiry webhook sent', { inquiryId: 'inquiry-1', status: 204 }]
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

    await service.notifyNewInquiry(payload);

    assert.equal(fetchCalled, false);
    assert.equal(entries[0]?.level, 'warn');
    assert.equal(entries[0]?.args[0], '[notifications] webhook mode requested but INQUIRY_NOTIFICATION_WEBHOOK_URL is not configured');
    assert.equal(entries[1]?.level, 'info');
    assert.equal((entries[1]?.args[1] as { mode: string }).mode, 'webhook-missing-url');
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

    await service.notifyNewInquiry(payload);

    assert.deepEqual(entries[0], {
      level: 'warn',
      args: ['[notifications] inquiry webhook returned non-success status', { status: 500, statusText: 'Server Error' }]
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

    await service.notifyNewInquiry(payload);

    assert.deepEqual(entries[0], {
      level: 'warn',
      args: ['[notifications] inquiry webhook failed', error]
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

    await service.notifyNewInquiry(payload);

    assert.deepEqual(entries[0], {
      level: 'warn',
      args: ['[notifications] unsupported INQUIRY_NOTIFICATION_MODE; using log-only notification', { mode: 'email' }]
    });
    assert.equal(entries[1]?.level, 'info');
    assert.equal((entries[1]?.args[1] as { mode: string }).mode, 'unsupported-mode');
  }

  console.log('inquiry-notifications-core.test.ts passed');
}
