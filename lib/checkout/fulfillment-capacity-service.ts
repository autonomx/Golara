import 'server-only';

import { hasDatabase, prisma } from '@/lib/prisma';

export const FULFILLMENT_RESERVATION_STATUSES = ['held', 'confirmed', 'released', 'expired'] as const;
export type FulfillmentReservationStatus = typeof FULFILLMENT_RESERVATION_STATUSES[number];

export type ReserveFulfillmentCapacityInput = {
  bucketId: string;
  orderId?: string;
  quantity?: number;
  expiresAt?: Date;
  metadata?: Record<string, string | number | boolean | null>;
};

function assertDatabaseReady() {
  if (!hasDatabase()) throw new Error('DATABASE_URL is required for fulfillment capacity reservations.');
}

function normalizeQuantity(value?: number) {
  if (!value || !Number.isFinite(value)) return 1;
  return Math.max(1, Math.floor(value));
}

function isActiveReservation(status: string) {
  return status === 'held' || status === 'confirmed';
}

async function recalculateBucketReserved(bucketId: string) {
  const activeReservations = await prisma.fulfillmentCapacityReservation.findMany({
    where: { bucketId, status: { in: ['held', 'confirmed'] } },
    select: { quantity: true }
  });
  return prisma.fulfillmentCapacityBucket.update({
    where: { id: bucketId },
    data: { reserved: activeReservations.reduce((total, item) => total + item.quantity, 0) }
  });
}

export async function reserveFulfillmentCapacity(input: ReserveFulfillmentCapacityInput) {
  assertDatabaseReady();
  const quantity = normalizeQuantity(input.quantity);

  return prisma.$transaction(async (tx) => {
    const bucket = await tx.fulfillmentCapacityBucket.findUnique({
      where: { id: input.bucketId },
      include: { reservations: { select: { status: true, quantity: true } } }
    });
    if (!bucket) throw new Error(`Fulfillment capacity bucket not found: ${input.bucketId}`);

    const activeReserved = bucket.reservations
      .filter((reservation) => isActiveReservation(reservation.status))
      .reduce((total, reservation) => total + reservation.quantity, 0);
    const remaining = bucket.capacity - activeReserved;
    if (quantity > remaining) {
      throw new Error(`Insufficient fulfillment capacity. Requested ${quantity}, available ${Math.max(0, remaining)}.`);
    }

    const reservation = await tx.fulfillmentCapacityReservation.create({
      data: {
        bucketId: bucket.id,
        quantity,
        expiresAt: input.expiresAt,
        metadata: input.metadata
      }
    });

    await tx.fulfillmentCapacityBucket.update({
      where: { id: bucket.id },
      data: { reserved: activeReserved + quantity }
    });

    if (input.orderId) {
      await tx.checkoutOrder.update({
        where: { id: input.orderId },
        data: { capacityReservationId: reservation.id }
      });
    }

    return reservation;
  });
}

export async function releaseFulfillmentCapacityReservation(reservationId: string, status: Extract<FulfillmentReservationStatus, 'released' | 'expired'> = 'released') {
  assertDatabaseReady();

  return prisma.$transaction(async (tx) => {
    const reservation = await tx.fulfillmentCapacityReservation.findUnique({ where: { id: reservationId } });
    if (!reservation) throw new Error(`Fulfillment capacity reservation not found: ${reservationId}`);
    if (!isActiveReservation(reservation.status)) return reservation;

    const updated = await tx.fulfillmentCapacityReservation.update({
      where: { id: reservation.id },
      data: { status }
    });

    const activeReservations = await tx.fulfillmentCapacityReservation.findMany({
      where: { bucketId: reservation.bucketId, status: { in: ['held', 'confirmed'] } },
      select: { quantity: true }
    });
    await tx.fulfillmentCapacityBucket.update({
      where: { id: reservation.bucketId },
      data: { reserved: activeReservations.reduce((total, item) => total + item.quantity, 0) }
    });

    return updated;
  });
}

export async function confirmFulfillmentCapacityReservation(reservationId: string) {
  assertDatabaseReady();

  return prisma.fulfillmentCapacityReservation.update({
    where: { id: reservationId },
    data: { status: 'confirmed' }
  });
}

export async function getOrderCapacityReservationId(orderId: string) {
  assertDatabaseReady();
  const order = await prisma.checkoutOrder.findUnique({
    where: { id: orderId },
    select: { capacityReservationId: true }
  });
  return order?.capacityReservationId ?? null;
}

export async function confirmOrderFulfillmentCapacityReservation(orderId: string) {
  const reservationId = await getOrderCapacityReservationId(orderId);
  if (!reservationId) return null;
  return confirmFulfillmentCapacityReservation(reservationId);
}

export async function releaseOrderFulfillmentCapacityReservation(orderId: string, status: Extract<FulfillmentReservationStatus, 'released' | 'expired'> = 'released') {
  const reservationId = await getOrderCapacityReservationId(orderId);
  if (!reservationId) return null;
  return releaseFulfillmentCapacityReservation(reservationId, status);
}

export async function expireHeldFulfillmentCapacityReservations(now = new Date()) {
  assertDatabaseReady();

  const reservations = await prisma.fulfillmentCapacityReservation.findMany({
    where: {
      status: 'held',
      expiresAt: { lte: now }
    },
    select: { id: true, bucketId: true }
  });

  const expired = [];
  for (const reservation of reservations) {
    expired.push(await releaseFulfillmentCapacityReservation(reservation.id, 'expired'));
  }

  const bucketIds = [...new Set(reservations.map((reservation) => reservation.bucketId))];
  for (const bucketId of bucketIds) {
    await recalculateBucketReserved(bucketId);
  }

  return { count: expired.length, reservations: expired };
}
