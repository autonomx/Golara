import 'server-only';

import type { Prisma } from '@prisma/client';
import { hasDatabase, prisma } from '@/lib/prisma';

type InventoryTx = Prisma.TransactionClient;

function assertDatabaseReady() {
  if (!hasDatabase()) throw new Error('DATABASE_URL is required for inventory reservations.');
}

function availableQuantity(stock: { quantity: number; reservedQuantity: number }) {
  return Math.max(0, stock.quantity - stock.reservedQuantity);
}

export async function reserveOrderInventory(orderId: string, tx: InventoryTx = prisma) {
  assertDatabaseReady();

  const orderItems = await tx.checkoutOrderItem.findMany({
    where: { orderId, variantId: { not: null } },
    include: {
      variant: {
        select: {
          id: true,
          sku: true,
          name: true,
          trackInventory: true,
          locationStocks: { orderBy: [{ quantity: 'desc' }] }
        }
      }
    }
  });

  for (const item of orderItems) {
    if (!item.variantId || !item.variant?.trackInventory) continue;
    const alreadyReserved = await tx.inventoryStockReservation.findFirst({ where: { orderItemId: item.id, status: 'held' } });
    if (alreadyReserved) continue;

    const stock = item.variant.locationStocks.find((candidate) => availableQuantity(candidate) >= item.quantity);
    if (!stock) {
      throw new Error(`Insufficient inventory for ${item.variant.sku}. Requested ${item.quantity}.`);
    }

    await tx.productVariantLocationStock.update({
      where: { id: stock.id },
      data: { reservedQuantity: stock.reservedQuantity + item.quantity }
    });
    await tx.inventoryStockReservation.create({
      data: {
        orderItemId: item.id,
        variantStockId: stock.id,
        variantId: item.variantId,
        locationId: stock.locationId,
        quantity: item.quantity,
        status: 'held',
        metadata: { variantSku: item.variant.sku, variantName: item.variant.name }
      }
    });
  }
}

export async function commitOrderInventoryReservations(orderId: string) {
  assertDatabaseReady();

  await prisma.$transaction(async (tx) => {
    const reservations = await tx.inventoryStockReservation.findMany({
      where: { orderItem: { orderId }, status: 'held' },
      include: { variantStock: true }
    });

    for (const reservation of reservations) {
      await tx.productVariantLocationStock.update({
        where: { id: reservation.variantStockId },
        data: {
          quantity: Math.max(0, reservation.variantStock.quantity - reservation.quantity),
          reservedQuantity: Math.max(0, reservation.variantStock.reservedQuantity - reservation.quantity)
        }
      });
      await tx.productVariant.update({
        where: { id: reservation.variantId },
        data: { stockQuantity: { decrement: reservation.quantity } }
      });
      await tx.inventoryStockReservation.update({
        where: { id: reservation.id },
        data: { status: 'committed' }
      });
    }
  });
}

async function releaseOrderInventoryReservationsWithTx(orderId: string, tx: InventoryTx) {
  const reservations = await tx.inventoryStockReservation.findMany({
    where: { orderItem: { orderId }, status: 'held' },
    include: { variantStock: true }
  });

  for (const reservation of reservations) {
    await tx.productVariantLocationStock.update({
      where: { id: reservation.variantStockId },
      data: { reservedQuantity: Math.max(0, reservation.variantStock.reservedQuantity - reservation.quantity) }
    });
    await tx.inventoryStockReservation.update({
      where: { id: reservation.id },
      data: { status: 'released' }
    });
  }
}

export async function releaseOrderInventoryReservations(orderId: string, tx?: InventoryTx) {
  assertDatabaseReady();

  if (tx) {
    await releaseOrderInventoryReservationsWithTx(orderId, tx);
    return;
  }

  await prisma.$transaction((transaction) => releaseOrderInventoryReservationsWithTx(orderId, transaction));
}
