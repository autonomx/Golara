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
