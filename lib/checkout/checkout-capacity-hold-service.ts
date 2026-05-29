import 'server-only';

import { reserveFulfillmentCapacity } from '@/lib/checkout/fulfillment-capacity-service';
import { hasDatabase, prisma } from '@/lib/prisma';

const DEFAULT_HOLD_MINUTES = 20;

export type CheckoutCapacityHoldInput = {
  capacityDate: Date;
  windowKey: string;
  fulfillmentType?: string;
  orderId?: string;
  quantity?: number;
  holdMinutes?: number;
  metadata?: Record<string, string | number | boolean | null>;
};

function assertDatabaseReady() {
  if (!hasDatabase()) throw new Error('DATABASE_URL is required for checkout capacity holds.');
}

function normalizeText(value: string | undefined, fallback: string) {
  const normalized = value?.trim();
  return normalized || fallback;
}

function normalizeQuantity(value?: number) {
  if (!value || !Number.isFinite(value)) return 1;
  return Math.max(1, Math.floor(value));
}

function normalizeHoldMinutes(value?: number) {
  if (!value || !Number.isFinite(value)) return DEFAULT_HOLD_MINUTES;
  return Math.min(Math.max(Math.floor(value), 1), 24 * 60);
}

function holdExpiresAt(minutes: number) {
  return new Date(Date.now() + minutes * 60 * 1000);
}

export async function findFulfillmentCapacityBucket(input: {
  capacityDate: Date;
  windowKey: string;
  fulfillmentType?: string;
}) {
  assertDatabaseReady();

  const windowKey = normalizeText(input.windowKey, 'default');
  const fulfillmentType = normalizeText(input.fulfillmentType, 'delivery');

  return prisma.fulfillmentCapacityBucket.findUnique({
    where: {
      capacityDate_windowKey_fulfillmentType: {
        capacityDate: input.capacityDate,
        windowKey,
        fulfillmentType
      }
    }
  });
}

export async function holdCheckoutFulfillmentCapacity(input: CheckoutCapacityHoldInput) {
  assertDatabaseReady();

  const windowKey = normalizeText(input.windowKey, 'default');
  const fulfillmentType = normalizeText(input.fulfillmentType, 'delivery');
  const quantity = normalizeQuantity(input.quantity);
  const bucket = await findFulfillmentCapacityBucket({
    capacityDate: input.capacityDate,
    windowKey,
    fulfillmentType
  });

  if (!bucket) {
    throw new Error(`No fulfillment capacity bucket found for ${input.capacityDate.toISOString()} ${windowKey} ${fulfillmentType}.`);
  }

  return reserveFulfillmentCapacity({
    bucketId: bucket.id,
    orderId: input.orderId,
    quantity,
    expiresAt: holdExpiresAt(normalizeHoldMinutes(input.holdMinutes)),
    metadata: {
      ...(input.metadata || {}),
      source: 'checkout_capacity_hold',
      windowKey,
      fulfillmentType
    }
  });
}
