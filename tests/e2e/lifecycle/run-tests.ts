import assert from 'node:assert/strict';

import {
  assertSafeLifecycleDatabaseUrl,
  createLifecyclePrismaClient,
  getLifecycleTestDbConfig,
  resetLifecycleDatabase
} from './test-db';
import {
  createLifecycleCategory,
  createLifecycleChannel,
  createLifecycleProductType,
  createLifecycleProductWithVariantAndStock
} from './fixtures/catalog-fixtures';
import { createLifecycleCartWithItem } from './fixtures/cart-fixtures';
import { createLifecycleCustomer } from './fixtures/customer-fixtures';
import { createLifecycleCheckoutOrderFromCart } from './fixtures/order-fixtures';
import {
  markLifecyclePaymentSucceeded,
  scheduleLifecycleFulfillment,
  simulateLifecyclePaymentFailure
} from './fixtures/payment-fulfillment-fixtures';
import { runLifecycleServiceRepositoryScenario } from './fixtures/service-lifecycle-fixtures';

async function runLifecycleDatabaseHarness(databaseUrl: string) {
  const prisma = createLifecyclePrismaClient(databaseUrl);
  try {
    await prisma.$connect();
    await resetLifecycleDatabase(prisma);
    const result = await prisma.$queryRaw<[{ ok: number }]>`SELECT 1 AS ok`;
    assert.equal(result[0]?.ok, 1);

    const channel = await createLifecycleChannel(prisma);
    const category = await createLifecycleCategory(prisma);
    const productType = await createLifecycleProductType(prisma);
    const catalog = await createLifecycleProductWithVariantAndStock(prisma, {
      categoryId: category.id,
      productTypeId: productType.id
    });
    const customer = await createLifecycleCustomer(prisma);

    const savedProduct = await prisma.product.findUniqueOrThrow({
      where: { id: catalog.product.id },
      include: {
        category: true,
        productType: true,
        variants: { include: { locationStocks: true } }
      }
    });
    assert.equal(channel.slug, 'e2e-default');
    assert.equal(channel.currency, 'TOMAN');
    assert.equal(category.slug, 'e2e-roses');
    assert.equal(productType.slug, 'e2e-bouquet');
    assert.equal(savedProduct.category.slug, category.slug);
    assert.equal(savedProduct.productType?.slug, productType.slug);
    assert.equal(savedProduct.variants.length, 1);
    assert.equal(savedProduct.variants[0]?.sku, 'E2E-ROSE-001-STANDARD');
    assert.equal(savedProduct.variants[0]?.locationStocks[0]?.quantity, 12);
    assert.equal(savedProduct.variants[0]?.locationStocks[0]?.reservedQuantity, 0);

    const savedCustomer = await prisma.customerProfile.findUniqueOrThrow({
      where: { id: customer.customer.id },
      include: { accounts: true, addresses: true }
    });
    assert.equal(savedCustomer.phone, '+16045559001');
    assert.equal(savedCustomer.accounts[0]?.providerAccountId, savedCustomer.phone);
    assert.equal(savedCustomer.addresses[0]?.isDefault, true);
    assert.equal(savedCustomer.addresses[0]?.line1, '100 E2E Lifecycle Street');

    const cart = await createLifecycleCartWithItem(prisma, {
      productId: catalog.product.id,
      variantId: catalog.variant.id
    });
    const checkout = await createLifecycleCheckoutOrderFromCart(prisma, {
      customerId: customer.customer.id,
      addressId: customer.address.id,
      cartItemId: cart.item.id,
      product: catalog.product,
      variant: catalog.variant,
      variantStockId: catalog.variantStock.id,
      locationId: catalog.warehouseLocation.id
    });

    const savedCart = await prisma.cartSession.findUniqueOrThrow({
      where: { id: cart.cart.id },
      include: { items: true }
    });
    assert.equal(savedCart.token, 'e2e-cart-token');
    assert.equal(savedCart.items.length, 1);
    assert.equal(savedCart.items[0]?.productId, catalog.product.id);
    assert.equal(savedCart.items[0]?.variantId, catalog.variant.id);
    assert.equal(savedCart.items[0]?.quantity, 2);

    const savedOrder = await prisma.checkoutOrder.findUniqueOrThrow({
      where: { id: checkout.order.id },
      include: {
        items: { include: { stockReservations: true } },
        paymentAttempts: { include: { events: true } },
        timelineEvents: true
      }
    });
    assert.equal(savedOrder.customerId, customer.customer.id);
    assert.equal(savedOrder.addressId, customer.address.id);
    assert.equal(savedOrder.status, 'pending');
    assert.equal(savedOrder.checkoutMode, 'cart');
    assert.equal(savedOrder.subtotalCents, 250000);
    assert.equal(savedOrder.totalCents, 250000);
    assert.equal(savedOrder.items.length, 1);
    assert.equal(savedOrder.items[0]?.productId, catalog.product.id);
    assert.equal(savedOrder.items[0]?.variantId, catalog.variant.id);
    assert.equal(savedOrder.items[0]?.lineTotalCents, 250000);
    assert.equal(savedOrder.paymentAttempts.length, 1);
    assert.equal(savedOrder.paymentAttempts[0]?.status, 'created');
    assert.equal(savedOrder.paymentAttempts[0]?.amountCents, 250000);
    assert.equal(savedOrder.paymentAttempts[0]?.events.length, 0);
    assert.equal(savedOrder.timelineEvents.some((event) => event.type === 'order.created'), true);
    assert.equal(savedOrder.items[0]?.stockReservations[0]?.status, 'held');
    assert.equal(savedOrder.items[0]?.stockReservations[0]?.quantity, 2);

    const savedVariantStock = await prisma.productVariantLocationStock.findUniqueOrThrow({
      where: { id: catalog.variantStock.id }
    });
    assert.equal(savedVariantStock.quantity, 12);
    assert.equal(savedVariantStock.reservedQuantity, 2);

    await simulateLifecyclePaymentFailure(prisma, {
      orderId: checkout.order.id,
      amountCents: checkout.order.totalCents,
      currency: checkout.order.currency
    });
    await markLifecyclePaymentSucceeded(prisma, {
      orderId: checkout.order.id,
      paymentAttemptId: checkout.paymentAttempt.id
    });
    const fulfillment = await scheduleLifecycleFulfillment(prisma, {
      orderId: checkout.order.id
    });

    const completedOrder = await prisma.checkoutOrder.findUniqueOrThrow({
      where: { id: checkout.order.id },
      include: {
        capacityReservation: { include: { bucket: true } },
        paymentAttempts: { include: { events: true } },
        timelineEvents: true
      }
    });
    assert.equal(completedOrder.status, 'confirmed');
    assert.equal(completedOrder.fulfillmentStatus, 'scheduled');
    assert.equal(completedOrder.capacityReservation?.status, 'scheduled');
    assert.equal(completedOrder.capacityReservation?.bucket.windowKey, '10:00-13:00');
    assert.equal(completedOrder.paymentAttempts.some((attempt) => attempt.status === 'failed'), true);
    assert.equal(completedOrder.paymentAttempts.some((attempt) => attempt.status === 'paid'), true);
    assert.equal(
      completedOrder.paymentAttempts.some((attempt) => attempt.events.some((event) => event.eventType === 'payment.failed')),
      true
    );
    assert.equal(
      completedOrder.paymentAttempts.some((attempt) => attempt.events.some((event) => event.eventType === 'payment.succeeded')),
      true
    );
    for (const eventType of ['order.created', 'payment.failed', 'payment.paid', 'fulfillment.scheduled']) {
      assert.equal(completedOrder.timelineEvents.some((event) => event.type === eventType), true);
    }
    assert.equal(fulfillment.method.key, 'e2e-local-delivery');
    assert.equal(fulfillment.shipment?.status, 'scheduled');
    assert.equal(fulfillment.shipment?.trackingNumber, 'E2E-TRACK-1001');

    const auditLogs = await prisma.adminAuditLog.findMany({
      where: { entity: 'CheckoutOrder', entityId: checkout.order.id },
      orderBy: { createdAt: 'asc' }
    });
    for (const action of ['payment.failed', 'payment.paid', 'fulfillment.scheduled']) {
      assert.equal(auditLogs.some((log) => log.action === action), true);
    }

    await resetLifecycleDatabase(prisma);
    const serviceCategory = await createLifecycleCategory(prisma);
    const serviceProductType = await createLifecycleProductType(prisma);
    await createLifecycleChannel(prisma);
    await createLifecycleProductWithVariantAndStock(prisma, {
      categoryId: serviceCategory.id,
      productTypeId: serviceProductType.id
    });
    await runLifecycleServiceRepositoryScenario(prisma, databaseUrl);
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  assert.equal(getLifecycleTestDbConfig({}).shouldRun, false);
  assert.throws(() => assertSafeLifecycleDatabaseUrl('not-a-url'), /valid PostgreSQL/);
  assert.throws(() => assertSafeLifecycleDatabaseUrl('mysql://localhost/golara_e2e'), /postgres/);
  assert.throws(() => assertSafeLifecycleDatabaseUrl('postgresql://db.example.com/golara_production'), /production or staging/);
  assert.throws(() => assertSafeLifecycleDatabaseUrl('postgresql://db.example.com/golara'), /local or clearly marked/);
  assert.throws(
    () => assertSafeLifecycleDatabaseUrl('postgresql://localhost/golara_e2e', 'postgresql://localhost/golara_e2e'),
    /must not match DATABASE_URL/
  );
  assert.throws(
    () =>
      getLifecycleTestDbConfig({
        E2E_DATABASE_URL: 'postgresql://localhost/golara_e2e',
        DATABASE_URL: 'postgresql://localhost/golara_e2e'
      }),
    /must not match DATABASE_URL/
  );
  assert.doesNotThrow(() => assertSafeLifecycleDatabaseUrl('postgresql://localhost/golara'));
  assert.doesNotThrow(() => assertSafeLifecycleDatabaseUrl('postgresql://db.example.com/golara_e2e'));

  const config = getLifecycleTestDbConfig();
  if (!config.shouldRun) {
    console.log(config.reason);
    return;
  }

  await runLifecycleDatabaseHarness(config.databaseUrl);
  console.log('lifecycle local database E2E harness passed');
}

main().catch((error) => {
  console.error(error);
  throw error;
});
