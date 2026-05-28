import 'server-only';

import { hasDatabase, prisma } from '@/lib/prisma';

const DEFAULT_LOOKBACK_HOURS = 24;
const TOP_HASH_LIMIT = 8;

const EVENT_TYPES = [
  'otp_request_allowed',
  'otp_request_blocked',
  'otp_delivery_failed',
  'otp_verify_failed',
  'otp_verify_blocked',
  'otp_verify_success'
] as const;

export type CustomerAuthEventType = typeof EVENT_TYPES[number];

export type CustomerAuthEventSummary = {
  databaseReady: boolean;
  windowHours: number;
  generatedAt: string;
  countsByType: Record<CustomerAuthEventType, number>;
  topPhoneHashes: Array<{ hash: string; count: number }>;
  topIpHashes: Array<{ hash: string; count: number }>;
};

function emptyCounts(): Record<CustomerAuthEventType, number> {
  return EVENT_TYPES.reduce((counts, eventType) => ({ ...counts, [eventType]: 0 }), {} as Record<CustomerAuthEventType, number>);
}

function lookbackStart(windowHours: number) {
  return new Date(Date.now() - windowHours * 60 * 60 * 1000);
}

function normalizeWindowHours(value?: number) {
  if (!value || !Number.isFinite(value)) return DEFAULT_LOOKBACK_HOURS;
  return Math.min(Math.max(Math.trunc(value), 1), 168);
}

function sortTopHashes(counts: Map<string, number>) {
  return [...counts.entries()]
    .map(([hash, count]) => ({ hash, count }))
    .sort((a, b) => b.count - a.count || a.hash.localeCompare(b.hash))
    .slice(0, TOP_HASH_LIMIT);
}

export async function getCustomerAuthEventSummary(windowHoursInput?: number): Promise<CustomerAuthEventSummary> {
  const windowHours = normalizeWindowHours(windowHoursInput);
  const base = {
    databaseReady: hasDatabase(),
    windowHours,
    generatedAt: new Date().toISOString(),
    countsByType: emptyCounts(),
    topPhoneHashes: [],
    topIpHashes: []
  } satisfies CustomerAuthEventSummary;

  if (!base.databaseReady) return base;

  const events = await prisma.customerAuthEvent.findMany({
    where: {
      createdAt: { gte: lookbackStart(windowHours) },
      eventType: { in: [...EVENT_TYPES] }
    },
    select: {
      eventType: true,
      phoneHash: true,
      ipHash: true
    },
    orderBy: { createdAt: 'desc' },
    take: 1000
  });

  const countsByType = emptyCounts();
  const phoneCounts = new Map<string, number>();
  const ipCounts = new Map<string, number>();

  for (const event of events) {
    if (EVENT_TYPES.includes(event.eventType as CustomerAuthEventType)) {
      countsByType[event.eventType as CustomerAuthEventType] += 1;
    }

    if (event.phoneHash) {
      phoneCounts.set(event.phoneHash, (phoneCounts.get(event.phoneHash) ?? 0) + 1);
    }
    if (event.ipHash) {
      ipCounts.set(event.ipHash, (ipCounts.get(event.ipHash) ?? 0) + 1);
    }
  }

  return {
    ...base,
    countsByType,
    topPhoneHashes: sortTopHashes(phoneCounts),
    topIpHashes: sortTopHashes(ipCounts)
  };
}
