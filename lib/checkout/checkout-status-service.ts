import 'server-only';

import type { Prisma } from '@prisma/client';
import {
  assertCheckoutFulfillmentStatus,
  assertCheckoutOrderStatus,
  assertCheckoutPaymentStatus,
  canTransitionCheckoutFulfillmentStatus,
  canTransitionCheckoutOrderStatus,
  canTransitionCheckoutPaymentStatus,
  type CheckoutFulfillmentStatus,
  type CheckoutOrderStatus,
  type CheckoutPaymentStatus
} from '@/lib/checkout/checkout-state-machine';
import { confirmOrderFulfillmentCapacityReservation, releaseOrderFulfillmentCapacityReservation } from '@/lib/checkout/fulfillment-capacity-service';
import { commitOrderInventoryReservations, releaseOrderInventoryReservations } from '@/lib/inventory/inventory-reservation-service';
import { hasDatabase, prisma } from '@/lib/prisma';

const TIMELINE_NOTE_MAX_LENGTH = 1000;
const TIMELINE_ACTOR_LABEL_MAX_LENGTH = 120;
const TIMELINE_ACTOR_ROLE_MAX_LENGTH = 80;
const COD_COLLECTION_READY_FOR_DELIVERY_STATUSES = new Set<string>(['collected', 'waived']);

type TransitionActor = {
  actorLabel?: string;
  actorRole?: string;
};

type TransitionInput<TStatus extends string> = TransitionActor & {
  orderId: string;
  to: TStatus;
  note?: string;
};

type PaymentTransitionInput = TransitionActor & {
  paymentAttemptId: string;
  to: CheckoutPaymentStatus;
  note?: string;
};

type JsonMetadata = Record<string, Prisma.JsonValue>;

function timelineTitle(kind: string, from: string, to: string) {
  return `${kind} status changed from ${from} to ${to}`;
}

function boundedOptionalText(value: string | undefined, maxLength: number) {
  const normalized = value?.trim();
  if (!normalized) return undefined;
  return normalized.slice(0, maxLength);
}

function timelineNote(value?: string) {
  return boundedOptionalText(value, TIMELINE_NOTE_MAX_LENGTH);
}

function timelineActorLabel(value?: string) {
  return boundedOptionalText(value, TIMELINE_ACTOR_LABEL_MAX_LENGTH);
}

function timelineActorRole(value?: string) {
  return boundedOptionalText(value, TIMELINE_ACTOR_ROLE_MAX_LENGTH);
}

function metadataObject(value: Prisma.JsonValue | null | undefined): JsonMetadata {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return { ...(value as JsonMetadata) };
}

function isCodPaymentMetadata(metadata: JsonMetadata) {
  return metadata.codPaymentSelected === true || metadata.codRequiresDeliveryCollection === true || metadata.paymentMethodType === 'cod';
}

function codCollectionStatus(metadata: JsonMetadata) {
  return typeof metadata.codCollectionStatus === 'string' ? metadata.codCollectionStatus : 'pending';
}

function assertDatabaseReady() {
  if (!hasDatabase()) throw new Error('DATABASE_URL is required for checkout status mutations.');
}

function throwIllegalTransition(result: { ok: true } | { ok: false; reason: string; allowedTransitions: string[] }) {
  if (result.ok) return;
  throw new Error(`${result.reason} Allowed transitions: ${result.allowedTransitions.join(', ') || 'none'}.`);
}

async function applyOrderCapacityLifecycle(orderId: string, status: CheckoutOrderStatus) {
  if (status === 'confirmed') {
    await confirmOrderFulfillmentCapacityReservation(orderId);
    await commitOrderInventoryReservations(orderId);
  }
  if (status === 'cancelled') {
    await releaseOrderFulfillmentCapacityReservation(orderId, 'released');
    await releaseOrderInventoryReservations(orderId);
  }
}

async function applyPaymentCapacityLifecycle(orderId: string, status: CheckoutPaymentStatus) {
  if (status === 'paid') {
    await confirmOrderFulfillmentCapacityReservation(orderId);
    await commitOrderInventoryReservations(orderId);
  }
  if (status === 'failed' || status === 'cancelled' || status === 'refunded') {
    await releaseOrderFulfillmentCapacityReservation(orderId, 'released');
    await releaseOrderInventoryReservations(orderId);
  }
}

export async function transitionCheckoutOrderStatus(input: TransitionInput<CheckoutOrderStatus>) {
  assertDatabaseReady();

  const updated = await prisma.$transaction(async (tx) => {
    const order = await tx.checkoutOrder.findUnique({ where: { id: input.orderId }, select: { id: true, status: true } });
    if (!order) throw new Error(`Checkout order not found: ${input.orderId}`);

    const from = assertCheckoutOrderStatus(order.status);
    throwIllegalTransition(canTransitionCheckoutOrderStatus(from, input.to));

    const result = from === input.to
      ? order
      : await tx.checkoutOrder.update({ where: { id: order.id }, data: { status: input.to }, select: { id: true, status: true } });

    if (from !== input.to) {
      await tx.checkoutOrderTimelineEvent.create({
        data: {
          orderId: order.id,
          type: 'order_status_changed',
          title: timelineTitle('Order', from, input.to),
          note: timelineNote(input.note),
          actorLabel: timelineActorLabel(input.actorLabel),
          actorRole: timelineActorRole(input.actorRole),
          metadata: { from, to: input.to }
        }
      });
    }

    return result;
  });

  await applyOrderCapacityLifecycle(updated.id, input.to);
  return updated;
}

export async function transitionCheckoutFulfillmentStatus(input: TransitionInput<CheckoutFulfillmentStatus>) {
  assertDatabaseReady();

  return prisma.$transaction(async (tx) => {
    const order = await tx.checkoutOrder.findUnique({ where: { id: input.orderId }, select: { id: true, fulfillmentStatus: true } });
    if (!order) throw new Error(`Checkout order not found: ${input.orderId}`);

    const from = assertCheckoutFulfillmentStatus(order.fulfillmentStatus);
    throwIllegalTransition(canTransitionCheckoutFulfillmentStatus(from, input.to));

    if (input.to === 'delivered') {
      const paymentAttempts = await tx.checkoutPaymentAttempt.findMany({
        where: { orderId: order.id },
        select: { id: true, metadata: true }
      });
      const codPaymentAttempt = paymentAttempts.find((attempt) => isCodPaymentMetadata(metadataObject(attempt.metadata)));

      if (codPaymentAttempt) {
        const metadata = metadataObject(codPaymentAttempt.metadata);
        const collectionStatus = codCollectionStatus(metadata);
        if (!COD_COLLECTION_READY_FOR_DELIVERY_STATUSES.has(collectionStatus)) {
          throw new Error(`COD collection must be collected or waived before fulfillment can be marked delivered. Current status: ${collectionStatus}.`);
        }
      }
    }

    const updated = from === input.to
      ? order
      : await tx.checkoutOrder.update({ where: { id: order.id }, data: { fulfillmentStatus: input.to }, select: { id: true, fulfillmentStatus: true } });

    if (from !== input.to) {
      await tx.checkoutOrderTimelineEvent.create({
        data: {
          orderId: order.id,
          type: 'fulfillment_status_changed',
          title: timelineTitle('Fulfillment', from, input.to),
          note: timelineNote(input.note),
          actorLabel: timelineActorLabel(input.actorLabel),
          actorRole: timelineActorRole(input.actorRole),
          metadata: { from, to: input.to }
        }
      });
    }

    return updated;
  });
}

export async function transitionCheckoutPaymentStatus(input: PaymentTransitionInput) {
  assertDatabaseReady();

  const updated = await prisma.$transaction(async (tx) => {
    const payment = await tx.checkoutPaymentAttempt.findUnique({ where: { id: input.paymentAttemptId }, select: { id: true, orderId: true, status: true } });
    if (!payment) throw new Error(`Checkout payment attempt not found: ${input.paymentAttemptId}`);

    const from = assertCheckoutPaymentStatus(payment.status);
    throwIllegalTransition(canTransitionCheckoutPaymentStatus(from, input.to));

    const result = from === input.to
      ? payment
      : await tx.checkoutPaymentAttempt.update({ where: { id: payment.id }, data: { status: input.to }, select: { id: true, orderId: true, status: true } });

    if (from !== input.to) {
      await tx.checkoutOrderTimelineEvent.create({
        data: {
          orderId: payment.orderId,
          type: 'payment_status_changed',
          title: timelineTitle('Payment', from, input.to),
          note: timelineNote(input.note),
          actorLabel: timelineActorLabel(input.actorLabel),
          actorRole: timelineActorRole(input.actorRole),
          metadata: { from, to: input.to, paymentAttemptId: payment.id }
        }
      });
    }

    return result;
  });

  await applyPaymentCapacityLifecycle(updated.orderId, input.to);
  return updated;
}
