import 'server-only';

import type { CustomerInquiry } from '@/lib/catalog';
import { listInquiries } from '@/lib/cms/catalog-repository';
import { isInquiryAssigned } from '@/lib/inquiries/inquiry-assignment';

export type InquiryOperationsSourceRow = Pick<CustomerInquiry, 'id' | 'status' | 'createdAt' | 'assignee' | 'followUps' | 'productId' | 'productTitle'>;

export type InquiryStatusBucket = {
  status: string;
  count: number;
};

export type InquirySourceBucket = {
  source: string;
  count: number;
};

export type InquiryOperationsSummary = {
  totalInquiries: number;
  newInquiries: number;
  openInquiries: number;
  assignedInquiries: number;
  unassignedInquiries: number;
  followUpInquiries: number;
  closedInquiries: number;
  cancelledInquiries: number;
  recentInquiries: number;
  resolutionRatePercent: number;
  byStatus: InquiryStatusBucket[];
  bySource: InquirySourceBucket[];
  generatedAt: Date;
};

const NEW_STATUSES = new Set(['new']);
const CLOSED_STATUSES = new Set(['confirmed', 'fulfilled', 'closed', 'resolved', 'completed']);
const CANCELLED_STATUSES = new Set(['cancelled', 'canceled', 'rejected', 'voided']);

export const EMPTY_INQUIRY_OPERATIONS_SUMMARY: InquiryOperationsSummary = {
  totalInquiries: 0,
  newInquiries: 0,
  openInquiries: 0,
  assignedInquiries: 0,
  unassignedInquiries: 0,
  followUpInquiries: 0,
  closedInquiries: 0,
  cancelledInquiries: 0,
  recentInquiries: 0,
  resolutionRatePercent: 0,
  byStatus: [],
  bySource: [],
  generatedAt: new Date(0)
};

export function normalizeInquiryStatus(value?: string | null) {
  return value?.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || 'unknown';
}

export function isClosedInquiryStatus(status: string) {
  return CLOSED_STATUSES.has(normalizeInquiryStatus(status));
}

export function isCancelledInquiryStatus(status: string) {
  return CANCELLED_STATUSES.has(normalizeInquiryStatus(status));
}

export function isOpenInquiryStatus(status: string) {
  const normalized = normalizeInquiryStatus(status);
  return !isClosedInquiryStatus(normalized) && !isCancelledInquiryStatus(normalized);
}

export function getInquirySource(row: InquiryOperationsSourceRow) {
  if (row.productId || row.productTitle) return 'product';
  return 'general';
}

function statusBuckets(source: Record<string, number>): InquiryStatusBucket[] {
  return Object.entries(source)
    .map(([status, count]) => ({ status, count }))
    .sort((a, b) => b.count - a.count || a.status.localeCompare(b.status));
}

function sourceBuckets(source: Record<string, number>): InquirySourceBucket[] {
  return Object.entries(source)
    .map(([source, count]) => ({ source, count }))
    .sort((a, b) => b.count - a.count || a.source.localeCompare(b.source));
}

export function buildInquiryOperationsSummary(rows: InquiryOperationsSourceRow[], now = new Date()): InquiryOperationsSummary {
  const cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const byStatus: Record<string, number> = {};
  const bySource: Record<string, number> = {};
  let newInquiries = 0;
  let openInquiries = 0;
  let assignedInquiries = 0;
  let followUpInquiries = 0;
  let closedInquiries = 0;
  let cancelledInquiries = 0;
  let recentInquiries = 0;

  for (const row of rows) {
    const status = normalizeInquiryStatus(row.status);
    const source = getInquirySource(row);
    byStatus[status] = (byStatus[status] ?? 0) + 1;
    bySource[source] = (bySource[source] ?? 0) + 1;
    if (NEW_STATUSES.has(status)) newInquiries += 1;
    if (isOpenInquiryStatus(status)) openInquiries += 1;
    if (isInquiryAssigned(row.assignee)) assignedInquiries += 1;
    if (row.followUps?.length) followUpInquiries += 1;
    if (isClosedInquiryStatus(status)) closedInquiries += 1;
    if (isCancelledInquiryStatus(status)) cancelledInquiries += 1;
    if (row.createdAt >= cutoff) recentInquiries += 1;
  }

  return {
    totalInquiries: rows.length,
    newInquiries,
    openInquiries,
    assignedInquiries,
    unassignedInquiries: Math.max(0, rows.length - assignedInquiries),
    followUpInquiries,
    closedInquiries,
    cancelledInquiries,
    recentInquiries,
    resolutionRatePercent: rows.length ? Math.round((closedInquiries / rows.length) * 100) : 0,
    byStatus: statusBuckets(byStatus),
    bySource: sourceBuckets(bySource),
    generatedAt: now
  };
}

export const inquiryOperationsSummaryService = {
  async summary(): Promise<InquiryOperationsSummary> {
    const rows = await listInquiries();
    return buildInquiryOperationsSummary(rows);
  }
};
