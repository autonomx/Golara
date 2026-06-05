import type { PaymentOperationRecordRow } from './payment-operation-record-repository';

export type PaymentOperationHistoryTone = 'neutral' | 'success' | 'warning' | 'danger';

export type PaymentOperationHistorySummaryRow = {
  label: string;
  value: string;
};

export type PaymentOperationHistoryFilterLabel = {
  label: string;
  value: string;
};

export type PaymentOperationHistoryViewOptions = {
  orderId?: string | null;
  limit?: number | null;
};

export type PaymentOperationHistoryRow = {
  id: string;
  title: string;
  statusLabel: string;
  tone: PaymentOperationHistoryTone;
  amountLabel: string;
  providerLabel: string;
  referenceLabel: string;
  orderLabel: string;
  requestedByLabel: string;
  createdAtLabel: string;
  updatedAtLabel: string;
  detailRows: Array<{ label: string; value: string }>;
};

export type PaymentOperationHistoryView = {
  status: 'empty' | 'ready';
  heading: string;
  summary: string;
  summaryRows: PaymentOperationHistorySummaryRow[];
  filterLabels: PaymentOperationHistoryFilterLabel[];
  rows: PaymentOperationHistoryRow[];
};

function label(value: string | null | undefined, fallback = 'Not available') {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function titleCase(value: string | null | undefined) {
  return label(value, 'unknown').replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function money(amountCents: number, currency: string) {
  const amount = Number.isFinite(amountCents) ? amountCents / 100 : 0;
  return `${amount.toFixed(2)} ${label(currency, 'USD').toUpperCase()}`;
}

function dateLabel(value: Date | string | null | undefined) {
  if (!value) return 'Not available';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not available';
  return date.toISOString();
}

function toneForStatus(status: string): PaymentOperationHistoryTone {
  if (status === 'succeeded') return 'success';
  if (status === 'failed') return 'danger';
  if (status === 'manual_review' || status === 'submitted') return 'warning';
  return 'neutral';
}

function requestedBy(record: PaymentOperationRecordRow) {
  return label(record.operatorLabel ?? record.operatorEmail ?? record.operatorId, 'Operator not recorded');
}

function countWhere(records: PaymentOperationRecordRow[], predicate: (record: PaymentOperationRecordRow) => boolean) {
  return records.filter(predicate).length;
}

function buildSummaryRows(records: PaymentOperationRecordRow[]): PaymentOperationHistorySummaryRow[] {
  const reviewCount = countWhere(records, (record) => record.status === 'manual_review' || record.status === 'submitted');
  return [
    { label: 'Loaded records', value: String(records.length) },
    { label: 'Succeeded', value: String(countWhere(records, (record) => record.status === 'succeeded')) },
    { label: 'Needs review', value: String(reviewCount) },
    { label: 'Retryable', value: String(countWhere(records, (record) => record.retryable)) }
  ];
}

function buildFilterLabels(options: PaymentOperationHistoryViewOptions): PaymentOperationHistoryFilterLabel[] {
  return [
    { label: 'Order filter', value: label(options.orderId, 'No order selected') },
    { label: 'Display limit', value: options.limit ? `Latest ${options.limit}` : 'Default latest records' },
    { label: 'Mode', value: 'Read-only history review' }
  ];
}

export function buildPaymentOperationHistoryRow(record: PaymentOperationRecordRow): PaymentOperationHistoryRow {
  const title = `${titleCase(record.operationKind)} ${money(record.requestedAmountCents, record.currency)}`;
  return {
    id: record.id,
    title,
    statusLabel: titleCase(record.status),
    tone: toneForStatus(record.status),
    amountLabel: money(record.requestedAmountCents, record.currency),
    providerLabel: titleCase(record.provider),
    referenceLabel: label(record.providerOperationReference ?? record.providerReference, 'Provider reference pending'),
    orderLabel: label(record.orderNumber ?? record.orderId),
    requestedByLabel: requestedBy(record),
    createdAtLabel: dateLabel(record.createdAt),
    updatedAtLabel: dateLabel(record.updatedAt),
    detailRows: [
      { label: 'Operation', value: titleCase(record.operationKind) },
      { label: 'Status', value: titleCase(record.status) },
      { label: 'Provider', value: titleCase(record.provider) },
      { label: 'Requested amount', value: money(record.requestedAmountCents, record.currency) },
      { label: 'Provider status', value: label(record.providerStatus, 'Provider status pending') },
      { label: 'Retryable', value: record.retryable ? 'Yes' : 'No' },
      { label: 'Error category', value: label(record.errorCategory, 'No error recorded') },
      { label: 'Reason', value: label(record.operatorReason, 'No operator reason recorded') }
    ]
  };
}

export function buildPaymentOperationHistoryView(
  records: PaymentOperationRecordRow[],
  options: PaymentOperationHistoryViewOptions = {}
): PaymentOperationHistoryView {
  const rows = records.map(buildPaymentOperationHistoryRow);
  return {
    status: rows.length > 0 ? 'ready' : 'empty',
    heading: 'Payment operation history',
    summary: rows.length > 0
      ? 'Read-only refund and void operation records for operator review. This view does not execute provider operations.'
      : 'No payment operation records are available for this order yet. Confirm the migration gate before expecting persisted history rows.',
    summaryRows: buildSummaryRows(records),
    filterLabels: buildFilterLabels(options),
    rows
  };
}
