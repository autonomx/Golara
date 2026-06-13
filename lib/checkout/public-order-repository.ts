import 'server-only';

import { createHash } from 'node:crypto';
import { hasDatabase, prisma } from '@/lib/prisma';
import { logPublicAbuseEvent } from '@/lib/security/public-abuse-events';

const PUBLIC_ORDER_LOOKUP_TOKEN_MIN_LENGTH = 32;
const PUBLIC_ORDER_LOOKUP_TOKEN_MAX_LENGTH = 128;
const PUBLIC_ORDER_LOOKUP_TOKEN_PATTERN = /^[A-Za-z0-9_-]+$/;
const PUBLIC_ORDER_LOOKUP_WINDOW_MS = 5 * 60 * 1000;
const PUBLIC_ORDER_LOOKUP_MAX_ATTEMPTS = 20;
const PUBLIC_ORDER_LOOKUP_MAX_BUCKETS = 500;

type PublicOrderLookupBucket = {
  count: number;
  resetAt: number;
};

const publicOrderLookupBuckets = new Map<string, PublicOrderLookupBucket>();

export function normalizePublicOrderLookupToken(token: string) {
  const normalized = token.trim();
  if (normalized.length < PUBLIC_ORDER_LOOKUP_TOKEN_MIN_LENGTH) return null;
  if (normalized.length > PUBLIC_ORDER_LOOKUP_TOKEN_MAX_LENGTH) return null;
  if (!PUBLIC_ORDER_LOOKUP_TOKEN_PATTERN.test(normalized)) return null;
  return normalized;
}

function publicOrderLookupThrottleKey(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

function prunePublicOrderLookupBuckets(now: number) {
  if (publicOrderLookupBuckets.size < PUBLIC_ORDER_LOOKUP_MAX_BUCKETS) return;
  for (const [key, bucket] of publicOrderLookupBuckets) {
    if (bucket.resetAt <= now) publicOrderLookupBuckets.delete(key);
  }
  if (publicOrderLookupBuckets.size < PUBLIC_ORDER_LOOKUP_MAX_BUCKETS) return;
  const oldestKey = publicOrderLookupBuckets.keys().next().value;
  if (oldestKey) publicOrderLookupBuckets.delete(oldestKey);
}

function allowPublicOrderLookupAttempt(token: string, now = Date.now()) {
  prunePublicOrderLookupBuckets(now);
  const key = publicOrderLookupThrottleKey(token);
  const existing = publicOrderLookupBuckets.get(key);
  if (!existing || existing.resetAt <= now) {
    publicOrderLookupBuckets.set(key, { count: 1, resetAt: now + PUBLIC_ORDER_LOOKUP_WINDOW_MS });
    return true;
  }
  if (existing.count >= PUBLIC_ORDER_LOOKUP_MAX_ATTEMPTS) {
    logPublicAbuseEvent({ event: 'public_order_lookup', outcome: 'throttled', scope: 'lookup' });
    return false;
  }
  existing.count += 1;
  return true;
}

export async function getPublicOrderByToken(token: string) {
  const normalized = normalizePublicOrderLookupToken(token);
  if (!hasDatabase() || !normalized) return null;
  if (!allowPublicOrderLookupAttempt(normalized)) return null;

  return prisma.checkoutOrder.findUnique({
    where: { publicLookupToken: normalized },
    select: {
      orderNumber: true,
      status: true,
      checkoutMode: true,
      fulfillmentStatus: true,
      currency: true,
      totalCents: true,
      deliveryDate: true,
      deliveryWindow: true,
      createdAt: true,
      items: {
        select: {
          productTitle: true,
          quantity: true
        },
        orderBy: { createdAt: 'asc' }
      },
      timelineEvents: {
        select: {
          type: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' },
        take: 6
      },
      paymentAttempts: {
        select: {
          status: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' },
        take: 1
      }
    }
  });
}
