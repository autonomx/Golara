import 'server-only';

import { randomUUID } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { hasDatabase, prisma } from '@/lib/prisma';

export const ADMIN_FULFILLMENT_SHIPMENT_STATUSES = ['created', 'scheduled', 'in_transit', 'delivered', 'failed', 'cancelled'] as const;
export type AdminFulfillmentShipmentStatus = (typeof ADMIN_FULFILLMENT_SHIPMENT_STATUSES)[number];

export type AdminFulfillmentShipmentInput = {
  status?: string;
  fulfillmentType?: string;
  carrierName?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  deliveryDate?: Date | string | null;
  deliveryWindow?: string;
  recipientName?: string;
  recipientPhone?: string;
  addressSummary?: string;
  note?: string;
  actorLabel?: string;
  actorRole?: string;
};

export type AdminFulfillmentShipmentRecord = {
  id: string;
  orderId: string;
  status: AdminFulfillmentShipmentStatus;
  fulfillmentType: string;
  carrierName: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
  deliveryDate: Date | null;
  deliveryWindow: string | null;
  recipientName: string | null;
  recipientPhone: string | null;
  addressSummary: string | null;
  note: string | null;
  createdAt: Date;
  updatedAt: Date;
};

function optionalText(value?: string | null) {
  const normalized = value?.trim();
  return normalized || null;
}

export function assertAdminFulfillmentShipmentStatus(value?: string | null): AdminFulfillmentShipmentStatus {
  const normalized = optionalText(value) ?? 'created';
  if (ADMIN_FULFILLMENT_SHIPMENT_STATUSES.includes(normalized as AdminFulfillmentShipmentStatus)) {
    return normalized as AdminFulfillmentShipmentStatus;
  }
  throw new Error(`Unsupported fulfillment shipment status: ${value}`);
}

export function parseAdminFulfillmentDeliveryDate(value?: Date | string | null) {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function normalizeAdminFulfillmentShipmentInput(input: AdminFulfillmentShipmentInput) {
  return {
    status: assertAdminFulfillmentShipmentStatus(input.status),
    fulfillmentType: optionalText(input.fulfillmentType) ?? 'delivery',
    carrierName: optionalText(input.carrierName),
    trackingNumber: optionalText(input.trackingNumber),
    trackingUrl: optionalText(input.trackingUrl),
    deliveryDate: parseAdminFulfillmentDeliveryDate(input.deliveryDate),
    deliveryWindow: optionalText(input.deliveryWindow),
    recipientName: optionalText(input.recipientName),
    recipientPhone: optionalText(input.recipientPhone),
    addressSummary: optionalText(input.addressSummary),
    note: optionalText(input.note),
    actorLabel: optionalText(input.actorLabel) ?? 'Admin',
    actorRole: optionalText(input.actorRole) ?? 'staff'
  };
}

export async function listAdminFulfillmentShipments(orderId: string): Promise<AdminFulfillmentShipmentRecord[]> {
  if (!hasDatabase()) return [];

  return prisma.$queryRaw<AdminFulfillmentShipmentRecord[]>`
    SELECT
      "id",
      "orderId",
      "status",
      "fulfillmentType",
      "carrierName",
      "trackingNumber",
      "trackingUrl",
      "deliveryDate",
      "deliveryWindow",
      "recipientName",
      "recipientPhone",
      "addressSummary",
      "note",
      "createdAt",
      "updatedAt"
    FROM "CheckoutFulfillmentShipment"
    WHERE "orderId" = ${orderId}
    ORDER BY "createdAt" DESC
  `;
}

export async function createAdminFulfillmentShipment(orderId: string, input: AdminFulfillmentShipmentInput) {
  if (!hasDatabase()) throw new Error('DATABASE_URL is not configured.');

  const order = await prisma.checkoutOrder.findUnique({
    where: { id: orderId },
    select: { id: true, orderNumber: true }
  });
  if (!order) throw new Error('Order not found.');

  const shipment = normalizeAdminFulfillmentShipmentInput(input);
  const shipmentId = randomUUID();
  const metadata = {
    actorLabel: shipment.actorLabel,
    actorRole: shipment.actorRole,
    trackingNumberAdded: Boolean(shipment.trackingNumber),
    deliveryDateAdded: Boolean(shipment.deliveryDate)
  };

  const inserted = await prisma.$queryRaw<AdminFulfillmentShipmentRecord[]>`
    INSERT INTO "CheckoutFulfillmentShipment" (
      "id",
      "orderId",
      "status",
      "fulfillmentType",
      "carrierName",
      "trackingNumber",
      "trackingUrl",
      "deliveryDate",
      "deliveryWindow",
      "recipientName",
      "recipientPhone",
      "addressSummary",
      "note",
      "metadata"
    ) VALUES (
      ${shipmentId},
      ${orderId},
      ${shipment.status},
      ${shipment.fulfillmentType},
      ${shipment.carrierName},
      ${shipment.trackingNumber},
      ${shipment.trackingUrl},
      ${shipment.deliveryDate},
      ${shipment.deliveryWindow},
      ${shipment.recipientName},
      ${shipment.recipientPhone},
      ${shipment.addressSummary},
      ${shipment.note},
      ${JSON.stringify(metadata)}::jsonb
    )
    RETURNING
      "id",
      "orderId",
      "status",
      "fulfillmentType",
      "carrierName",
      "trackingNumber",
      "trackingUrl",
      "deliveryDate",
      "deliveryWindow",
      "recipientName",
      "recipientPhone",
      "addressSummary",
      "note",
      "createdAt",
      "updatedAt"
  `;

  await prisma.checkoutOrderTimelineEvent.create({
    data: {
      orderId,
      type: 'fulfillment_shipment_created',
      title: `Fulfillment shipment created${shipment.trackingNumber ? ` / ${shipment.trackingNumber}` : ''}`,
      note: shipment.note ?? undefined,
      actorLabel: shipment.actorLabel,
      actorRole: shipment.actorRole,
      metadata: metadata as Prisma.InputJsonObject
    }
  });

  return { order, shipment: inserted[0] };
}
