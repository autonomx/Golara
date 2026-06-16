export type CustomerWalletReceiptLocale = 'en' | 'fa';

export type CustomerWalletReceiptKind = 'walletDebit' | 'walletRefund';

export type CustomerWalletReceiptEntry = {
  entryType: string;
  direction: string;
  status: string;
  orderId?: string | null;
  paymentAttemptId?: string | null;
  idempotencyKey?: string | null;
  metadata?: unknown;
  createdAt?: Date | string | null;
};

export type CustomerWalletReceiptDetails = {
  kind: CustomerWalletReceiptKind;
  title: string;
  body: string;
  statusLabel: string;
  orderLabel: string;
  paymentAttemptLabel: string;
  eventAtLabel: string;
  idempotencyLabel: string;
  status: string;
  orderNumber?: string;
  paymentAttemptId?: string;
  eventAt?: string;
  idempotencyKey?: string;
};

type CustomerWalletReceiptRegistry = Record<CustomerWalletReceiptLocale, Record<CustomerWalletReceiptKind, {
  title: string;
  body: string;
  statusLabel: string;
  orderLabel: string;
  paymentAttemptLabel: string;
  eventAtLabel: string;
  idempotencyLabel: string;
}>>;

const walletReceiptCopy: CustomerWalletReceiptRegistry = {
  en: {
    walletDebit: {
      title: 'Wallet debit receipt',
      body: 'This receipt confirms store credit was used for this order. Keep the reference below if you need support follow-up.',
      statusLabel: 'Debit status',
      orderLabel: 'Order',
      paymentAttemptLabel: 'Payment attempt',
      eventAtLabel: 'Debited at',
      idempotencyLabel: 'Receipt key'
    },
    walletRefund: {
      title: 'Wallet refund receipt',
      body: 'This receipt confirms store credit was returned to your wallet. The credited amount is available according to the wallet entry status below.',
      statusLabel: 'Refund status',
      orderLabel: 'Order',
      paymentAttemptLabel: 'Payment attempt',
      eventAtLabel: 'Refunded at',
      idempotencyLabel: 'Receipt key'
    }
  },
  fa: {
    walletDebit: {
      title: 'رسید برداشت از کیف پول',
      body: 'این رسید تایید می‌کند که اعتبار فروشگاه برای این سفارش استفاده شده است. برای پیگیری پشتیبانی، شناسه زیر را نگه دارید.',
      statusLabel: 'وضعیت برداشت',
      orderLabel: 'سفارش',
      paymentAttemptLabel: 'شناسه پرداخت',
      eventAtLabel: 'زمان برداشت',
      idempotencyLabel: 'کلید رسید'
    },
    walletRefund: {
      title: 'رسید بازگشت وجه به کیف پول',
      body: 'این رسید تایید می‌کند که اعتبار به کیف پول شما بازگردانده شده است. مبلغ بازگشتی طبق وضعیت تراکنش زیر قابل استفاده است.',
      statusLabel: 'وضعیت بازگشت وجه',
      orderLabel: 'سفارش',
      paymentAttemptLabel: 'شناسه پرداخت',
      eventAtLabel: 'زمان بازگشت وجه',
      idempotencyLabel: 'کلید رسید'
    }
  }
};

export function normalizeCustomerWalletReceiptLocale(locale?: string | null): CustomerWalletReceiptLocale {
  return locale?.toLowerCase().startsWith('fa') ? 'fa' : 'en';
}

function metadataObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function metadataText(value: unknown) {
  if (typeof value === 'string') return value.trim() || undefined;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return undefined;
}

function formatReceiptDate(value: unknown, locale?: string | null) {
  if (typeof value !== 'string' && !(value instanceof Date)) return undefined;
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) return undefined;
  return new Intl.DateTimeFormat(normalizeCustomerWalletReceiptLocale(locale) === 'fa' ? 'fa-IR' : 'en-CA', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date);
}

function receiptKind(entry: CustomerWalletReceiptEntry): CustomerWalletReceiptKind | undefined {
  if (entry.entryType === 'refund_credit') return 'walletRefund';
  if (entry.entryType === 'checkout_capture' || entry.direction === 'capture' || entry.entryType === 'admin_debit' || entry.direction === 'debit') return 'walletDebit';
  return undefined;
}

export function customerWalletReceiptDetails(
  entry: CustomerWalletReceiptEntry,
  locale?: string | null
): CustomerWalletReceiptDetails | null {
  const kind = receiptKind(entry);
  if (!kind) return null;

  const normalizedLocale = normalizeCustomerWalletReceiptLocale(locale);
  const copy = walletReceiptCopy[normalizedLocale][kind];
  const metadata = metadataObject(entry.metadata);
  const eventAt = kind === 'walletRefund'
    ? formatReceiptDate(metadata.refundedAt ?? entry.createdAt, locale)
    : formatReceiptDate(metadata.walletCapturedAt ?? metadata.capturedAt ?? entry.createdAt, locale);

  return {
    kind,
    title: copy.title,
    body: copy.body,
    statusLabel: copy.statusLabel,
    orderLabel: copy.orderLabel,
    paymentAttemptLabel: copy.paymentAttemptLabel,
    eventAtLabel: copy.eventAtLabel,
    idempotencyLabel: copy.idempotencyLabel,
    status: entry.status.replace(/_/g, ' '),
    orderNumber: metadataText(metadata.orderNumber ?? entry.orderId),
    paymentAttemptId: metadataText(metadata.paymentAttemptId ?? entry.paymentAttemptId),
    eventAt,
    idempotencyKey: metadataText(entry.idempotencyKey)
  };
}
