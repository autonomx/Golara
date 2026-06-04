import type { PaymentOperationPreviewInput } from '@/lib/checkout/payment-operation-preview';
import type { PaymentOperationKind } from '@/lib/checkout/payment-operation-plan';

export type PaymentOperationPreviewInputDraft = {
  operation?: unknown;
  orderStatus?: unknown;
  orderTotalCents?: unknown;
  orderCurrency?: unknown;
  paymentProvider?: unknown;
  paymentStatus?: unknown;
  paymentAmountCents?: unknown;
  paymentCurrency?: unknown;
  providerReference?: unknown;
  amountCents?: unknown;
  reason?: unknown;
  orderNumber?: unknown;
  paymentAttemptId?: unknown;
  fulfillmentStatus?: unknown;
  hasPerishableCapacity?: unknown;
};

export type PaymentOperationPreviewInputError = {
  field: keyof PaymentOperationPreviewInputDraft;
  code: string;
  message: string;
};

export type PaymentOperationPreviewInputResult =
  | { ok: true; input: PaymentOperationPreviewInput }
  | { ok: false; errors: PaymentOperationPreviewInputError[] };

const OPERATION_KINDS = new Set<PaymentOperationKind>(['refund', 'void']);
const FULFILLMENT_STATUSES = new Set(['unfulfilled', 'scheduled', 'in_progress', 'fulfilled', 'delivered', 'cancelled']);
const CURRENCY_PATTERN = /^[A-Z][A-Z0-9_]{2,11}$/;
const SAFE_IDENTIFIER_PATTERN = /^[A-Za-z0-9._:@/-]{1,160}$/;

function stringValue(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function optionalString(value: unknown) {
  const text = stringValue(value);
  return text || undefined;
}

function requiredString(
  draft: PaymentOperationPreviewInputDraft,
  field: keyof PaymentOperationPreviewInputDraft,
  errors: PaymentOperationPreviewInputError[],
  message: string
) {
  const text = stringValue(draft[field]);
  if (!text) {
    errors.push({ field, code: 'required', message });
    return '';
  }
  return text;
}

function parseCents(
  draft: PaymentOperationPreviewInputDraft,
  field: keyof PaymentOperationPreviewInputDraft,
  errors: PaymentOperationPreviewInputError[],
  message: string,
  options: { required: boolean }
) {
  const value = draft[field];
  if (value === undefined || value === null || value === '') {
    if (options.required) errors.push({ field, code: 'required', message });
    return undefined;
  }

  const numberValue = typeof value === 'number' ? value : Number(String(value).trim());
  if (!Number.isInteger(numberValue) || numberValue <= 0) {
    errors.push({ field, code: 'invalid_cents', message });
    return undefined;
  }

  return numberValue;
}

function normalizeCurrency(
  draft: PaymentOperationPreviewInputDraft,
  field: keyof PaymentOperationPreviewInputDraft,
  errors: PaymentOperationPreviewInputError[],
  message: string
) {
  const text = requiredString(draft, field, errors, message).toUpperCase();
  if (text && !CURRENCY_PATTERN.test(text)) {
    errors.push({ field, code: 'invalid_currency', message });
  }
  return text;
}

function validateOptionalIdentifier(
  draft: PaymentOperationPreviewInputDraft,
  field: keyof PaymentOperationPreviewInputDraft,
  errors: PaymentOperationPreviewInputError[],
  message: string
) {
  const text = optionalString(draft[field]);
  if (text && !SAFE_IDENTIFIER_PATTERN.test(text)) {
    errors.push({ field, code: 'invalid_identifier', message });
    return undefined;
  }
  return text;
}

function normalizeOptionalBoolean(value: unknown) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true' || normalized === 'yes' || normalized === '1') return true;
    if (normalized === 'false' || normalized === 'no' || normalized === '0') return false;
  }
  return undefined;
}

function normalizeFulfillmentStatus(draft: PaymentOperationPreviewInputDraft, errors: PaymentOperationPreviewInputError[]) {
  const text = optionalString(draft.fulfillmentStatus)?.toLowerCase();
  if (!text) return undefined;
  if (!FULFILLMENT_STATUSES.has(text)) {
    errors.push({ field: 'fulfillmentStatus', code: 'invalid_fulfillment_status', message: 'Choose a supported fulfillment status.' });
    return undefined;
  }
  return text;
}

export function normalizePaymentOperationPreviewInput(draft: PaymentOperationPreviewInputDraft): PaymentOperationPreviewInputResult {
  const errors: PaymentOperationPreviewInputError[] = [];
  const operation = stringValue(draft.operation).toLowerCase() as PaymentOperationKind;
  if (!OPERATION_KINDS.has(operation)) {
    errors.push({ field: 'operation', code: 'invalid_operation', message: 'Choose refund or void.' });
  }

  const orderStatus = requiredString(draft, 'orderStatus', errors, 'Order status is required.');
  const orderTotalCents = parseCents(draft, 'orderTotalCents', errors, 'Order total must be a positive integer number of cents.', { required: true });
  const orderCurrency = normalizeCurrency(draft, 'orderCurrency', errors, 'Order currency is required.');

  const paymentProvider = requiredString(draft, 'paymentProvider', errors, 'Payment provider is required.');
  const paymentStatus = requiredString(draft, 'paymentStatus', errors, 'Payment status is required.');
  const paymentAmountCents = parseCents(draft, 'paymentAmountCents', errors, 'Payment amount must be a positive integer number of cents.', { required: true });
  const paymentCurrency = normalizeCurrency(draft, 'paymentCurrency', errors, 'Payment currency is required.');

  const amountCents = parseCents(draft, 'amountCents', errors, 'Operation amount must be a positive integer number of cents.', { required: false });
  const reason = optionalString(draft.reason);
  if (reason && reason.length > 500) {
    errors.push({ field: 'reason', code: 'reason_too_long', message: 'Reason must be 500 characters or fewer.' });
  }

  const providerReference = validateOptionalIdentifier(draft, 'providerReference', errors, 'Provider reference can only include letters, numbers, dots, dashes, underscores, colons, slashes, and @.');
  const orderNumber = validateOptionalIdentifier(draft, 'orderNumber', errors, 'Order number can only include letters, numbers, dots, dashes, underscores, colons, slashes, and @.');
  const paymentAttemptId = validateOptionalIdentifier(draft, 'paymentAttemptId', errors, 'Payment attempt ID can only include letters, numbers, dots, dashes, underscores, colons, slashes, and @.');
  const fulfillmentStatus = normalizeFulfillmentStatus(draft, errors);
  const hasPerishableCapacity = normalizeOptionalBoolean(draft.hasPerishableCapacity);

  if (errors.length) return { ok: false, errors };

  return {
    ok: true,
    input: {
      operation,
      order: {
        status: orderStatus,
        totalCents: orderTotalCents ?? 0,
        currency: orderCurrency
      },
      payment: {
        provider: paymentProvider,
        status: paymentStatus,
        amountCents: paymentAmountCents ?? 0,
        currency: paymentCurrency,
        ...(providerReference ? { providerReference } : {})
      },
      ...(amountCents ? { amountCents } : {}),
      ...(reason ? { reason } : {}),
      ...(orderNumber ? { orderNumber } : {}),
      ...(paymentAttemptId ? { paymentAttemptId } : {}),
      ...(fulfillmentStatus ? { fulfillmentStatus } : {}),
      ...(hasPerishableCapacity === undefined ? {} : { hasPerishableCapacity })
    }
  };
}
