import type { PrismaClient } from '@prisma/client';

export async function createLifecycleCheckoutOrderFromCart(
  prisma: PrismaClient,
  deps: {
    customerId: string;
    addressId: string;
    cartItemId: string;
    product: {
      id: string;
      title: string;
      code: string;
      priceCents: number;
      currency: string;
    };
    variant: {
      id: string;
      sku: string;
      name: string;
      priceCents: number;
    };
    variantStockId: string;
    locationId: string;
  }
) {
  const cartItem = await prisma.cartItem.findUniqueOrThrow({
    where: { id: deps.cartItemId }
  });
  const quantity = cartItem.quantity;
  const subtotalCents = deps.variant.priceCents * quantity;

  const order = await prisma.checkoutOrder.create({
    data: {
      orderNumber: 'E2E-ORDER-1001',
      publicLookupToken: 'e2e-order-1001-token',
      customerId: deps.customerId,
      addressId: deps.addressId,
      status: 'pending',
      checkoutMode: 'cart',
      currency: deps.product.currency,
      subtotalCents,
      deliveryCents: 0,
      discountCents: 0,
      totalCents: subtotalCents,
      deliveryDate: new Date('2026-06-16T18:00:00.000Z'),
      deliveryWindow: '10:00-13:00',
      fulfillmentStatus: 'not_scheduled',
      recipientName: 'E2E Customer',
      recipientPhone: '+16045559001',
      customerNote: 'Lifecycle test order.'
    }
  });

  const orderItem = await prisma.checkoutOrderItem.create({
    data: {
      orderId: order.id,
      productId: deps.product.id,
      variantId: deps.variant.id,
      variantSku: deps.variant.sku,
      variantName: deps.variant.name,
      productTitle: deps.product.title,
      productCode: deps.product.code,
      quantity,
      unitPriceCents: deps.variant.priceCents,
      lineTotalCents: subtotalCents
    }
  });

  const paymentAttempt = await prisma.checkoutPaymentAttempt.create({
    data: {
      orderId: order.id,
      provider: 'manual',
      status: 'created',
      amountCents: subtotalCents,
      currency: deps.product.currency,
      providerReference: 'E2E-PAYMENT-1001',
      metadata: { lifecycle: true }
    }
  });

  const timelineEvent = await prisma.checkoutOrderTimelineEvent.create({
    data: {
      orderId: order.id,
      type: 'order.created',
      title: 'Order created',
      note: 'Lifecycle checkout order created from cart.',
      actorLabel: 'Lifecycle E2E',
      actorRole: 'system',
      metadata: { lifecycle: true }
    }
  });

  const reservation = await prisma.inventoryStockReservation.create({
    data: {
      orderItemId: orderItem.id,
      variantStockId: deps.variantStockId,
      variantId: deps.variant.id,
      locationId: deps.locationId,
      quantity,
      status: 'held',
      metadata: { lifecycle: true }
    }
  });

  const variantStock = await prisma.productVariantLocationStock.update({
    where: { id: deps.variantStockId },
    data: { reservedQuantity: { increment: quantity } }
  });

  return { order, orderItem, paymentAttempt, timelineEvent, reservation, variantStock };
}
