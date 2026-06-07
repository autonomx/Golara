import assert from 'node:assert/strict';
import type { ServiceLifecycleState } from './service-lifecycle-context';

export async function runServiceAuthStockFlow(state: ServiceLifecycleState) {
  const { prisma, modules, customer, address, product, variant } = state;
  assert.ok(customer);
  assert.ok(address);
  assert.ok(product);
  assert.ok(variant);
  const { createCustomerSession, getCustomerSession, hashCustomerSessionToken, linkCustomerAccount, revokeCustomerSession } = modules.customerAccounts;
  const { hashOtpCode, verifyCustomerOtp } = modules.customerOtp;
  const { createOrderDraft } = modules.orderDrafts;
  const { addCartItem, getCartByToken } = modules.cart;

  const account = await linkCustomerAccount({
    phone: '+16045559002',
    displayName: 'E2E Service Customer',
    email: 'service-customer.e2e@golara.test',
    locale: 'fa-IR'
  });
  const session = await createCustomerSession({ customerId: account.customerId, provider: 'phone', userAgent: 'Lifecycle E2E', ipAddress: '127.0.0.1' });
  assert.equal((await getCustomerSession(session.token))?.customerId, account.customerId);
  await revokeCustomerSession(session.token);
  assert.equal(await getCustomerSession(session.token), null);
  const expiredToken = 'e2e-expired-session-token';
  await prisma.customerSession.create({ data: { customerId: account.customerId, tokenHash: hashCustomerSessionToken(expiredToken), expiresAt: new Date('2020-01-01T00:00:00.000Z') } });
  assert.equal(await getCustomerSession(expiredToken), null);

  const otpDestination = '+16045559002';
  const otpCode = '123456';
  const otpChallenge = await prisma.customerOtpChallenge.create({
    data: {
      destination: otpDestination,
      purpose: 'login',
      codeHash: hashOtpCode(otpDestination, otpCode, 'login'),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000)
    }
  });
  assert.equal((await verifyCustomerOtp({ phone: otpDestination, code: '000000', purpose: 'login' })).ok, false);
  const otpResult = await verifyCustomerOtp({ phone: otpDestination, code: otpCode, purpose: 'login' });
  assert.equal(otpResult.ok, true);
  assert.equal(otpResult.ok ? otpResult.challenge.id : '', otpChallenge.id);

  const expiredOtpCode = '654321';
  await prisma.customerOtpChallenge.create({
    data: {
      destination: otpDestination,
      purpose: 'login',
      codeHash: hashOtpCode(otpDestination, expiredOtpCode, 'login'),
      expiresAt: new Date('2020-01-01T00:00:00.000Z')
    }
  });
  assert.deepEqual(await verifyCustomerOtp({ phone: otpDestination, code: expiredOtpCode, purpose: 'login' }), { ok: false, reason: 'missing_or_expired' });

  const blockedOtpCode = '777777';
  await prisma.customerOtpChallenge.create({
    data: {
      destination: otpDestination,
      purpose: 'login',
      codeHash: hashOtpCode(otpDestination, blockedOtpCode, 'login'),
      maxAttempts: 1,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000)
    }
  });
  assert.equal((await verifyCustomerOtp({ phone: otpDestination, code: '111111', purpose: 'login' })).reason, 'too_many_attempts');
  assert.equal((await verifyCustomerOtp({ phone: otpDestination, code: blockedOtpCode, purpose: 'login' })).reason, 'too_many_attempts');

  const boundaryProduct = await prisma.product.create({
    data: {
      slug: 'e2e-boundary-stock',
      code: 'E2E-BOUNDARY-001',
      title: 'E2E Boundary Stock',
      description: 'Boundary stock product.',
      priceCents: 50000,
      currency: 'TOMAN',
      imageUrl: '/seed-images/photo-real/standard-bouquet.jpg',
      categoryId: product.categoryId,
      productTypeId: product.productTypeId,
      isActive: true
    }
  });
  const boundaryVariant = await prisma.productVariant.create({
    data: {
      productId: boundaryProduct.id,
      sku: 'E2E-BOUNDARY-001-STANDARD',
      name: 'Standard',
      priceCents: 50000,
      currency: 'TOMAN',
      stockQuantity: 2,
      trackInventory: true,
      isActive: true
    }
  });
  const boundaryLocation = await prisma.warehouseLocation.create({ data: { slug: 'e2e-boundary-location', name: 'E2E Boundary Location', countryCode: 'CA', isActive: true } });
  await prisma.productVariantLocationStock.create({ data: { variantId: boundaryVariant.id, locationId: boundaryLocation.id, quantity: 2, reservedQuantity: 0 } });
  const boundaryOrder = await createOrderDraft({
    customerId: customer.id,
    addressId: address.id,
    checkoutMode: 'cart',
    currency: 'TOMAN',
    items: [{ productId: boundaryProduct.id, variantId: boundaryVariant.id, quantity: 2 }]
  });
  assert.equal(boundaryOrder.totalCents, 100000);
  const boundaryStock = await prisma.productVariantLocationStock.findFirstOrThrow({ where: { variantId: boundaryVariant.id } });
  assert.equal(boundaryStock.reservedQuantity, 2);
  await assert.rejects(
    () => createOrderDraft({ customerId: customer.id, addressId: address.id, checkoutMode: 'cart', currency: 'TOMAN', items: [{ productId: boundaryProduct.id, variantId: boundaryVariant.id, quantity: 1 }] }),
    /Insufficient inventory/
  );

  const nonTrackedProduct = await prisma.product.create({
    data: {
      slug: 'e2e-non-tracked-stock',
      code: 'E2E-NONTRACK-001',
      title: 'E2E Non Tracked Stock',
      description: 'Non-tracked stock product.',
      priceCents: 45000,
      currency: 'TOMAN',
      imageUrl: '/seed-images/photo-real/standard-bouquet.jpg',
      categoryId: product.categoryId,
      productTypeId: product.productTypeId,
      isActive: true
    }
  });
  const nonTrackedVariant = await prisma.productVariant.create({
    data: {
      productId: nonTrackedProduct.id,
      sku: 'E2E-NONTRACK-001-STANDARD',
      name: 'Standard',
      priceCents: 45000,
      currency: 'TOMAN',
      stockQuantity: 0,
      trackInventory: false,
      isActive: true
    }
  });
  const nonTrackedOrder = await createOrderDraft({
    customerId: customer.id,
    addressId: address.id,
    checkoutMode: 'cart',
    currency: 'TOMAN',
    items: [{ productId: nonTrackedProduct.id, variantId: nonTrackedVariant.id, quantity: 3 }]
  });
  assert.equal(await prisma.inventoryStockReservation.count({ where: { orderItem: { orderId: nonTrackedOrder.id } } }), 0);

  const raceProduct = await prisma.product.create({
    data: {
      slug: 'e2e-race-stock',
      code: 'E2E-RACE-001',
      title: 'E2E Race Stock',
      description: 'Single-stock product for concurrent reservation tests.',
      priceCents: 60000,
      currency: 'TOMAN',
      imageUrl: '/seed-images/photo-real/standard-bouquet.jpg',
      categoryId: product.categoryId,
      productTypeId: product.productTypeId,
      isActive: true
    }
  });
  const raceVariant = await prisma.productVariant.create({
    data: {
      productId: raceProduct.id,
      sku: 'E2E-RACE-001-STANDARD',
      name: 'Standard',
      priceCents: 60000,
      currency: 'TOMAN',
      stockQuantity: 1,
      trackInventory: true,
      isActive: true
    }
  });
  const raceLocation = await prisma.warehouseLocation.create({
    data: { slug: 'e2e-race-location', name: 'E2E Race Location', countryCode: 'CA', isActive: true }
  });
  await prisma.productVariantLocationStock.create({
    data: { variantId: raceVariant.id, locationId: raceLocation.id, quantity: 1, reservedQuantity: 0 }
  });
  const raceDraftInput = {
    customerId: customer.id,
    addressId: address.id,
    checkoutMode: 'cart',
    currency: 'TOMAN',
    items: [{ productId: raceProduct.id, variantId: raceVariant.id, quantity: 1 }]
  };
  const raceResults = await Promise.allSettled([createOrderDraft(raceDraftInput), createOrderDraft(raceDraftInput)]);
  assert.equal(raceResults.filter((result) => result.status === 'fulfilled').length, 1);
  assert.equal(raceResults.filter((result) => result.status === 'rejected' && /Insufficient inventory/.test(String(result.reason))).length, 1);
  const raceStock = await prisma.productVariantLocationStock.findFirstOrThrow({ where: { variantId: raceVariant.id } });
  assert.equal(raceStock.quantity, 1);
  assert.equal(raceStock.reservedQuantity, 1);

  const cadProduct = await prisma.product.create({
    data: {
      slug: 'e2e-cad-checkout',
      code: 'E2E-CAD-001',
      title: 'E2E CAD Checkout',
      description: 'CAD product for locale/currency lifecycle tests.',
      priceCents: 1200,
      currency: 'CAD',
      imageUrl: '/seed-images/photo-real/standard-bouquet.jpg',
      categoryId: product.categoryId,
      productTypeId: product.productTypeId,
      isActive: true
    }
  });
  const cadVariant = await prisma.productVariant.create({
    data: {
      productId: cadProduct.id,
      sku: 'E2E-CAD-001-STANDARD',
      name: 'Standard',
      priceCents: 1200,
      currency: 'CAD',
      stockQuantity: 0,
      trackInventory: false,
      isActive: true
    }
  });
  const cadCart = await addCartItem({
    productId: cadProduct.id,
    variantId: cadVariant.id,
    quantity: 2,
    locale: 'en-CA',
    currency: 'CAD'
  });
  assert.ok(cadCart?.token);
  const savedCadCart = await getCartByToken(cadCart.token);
  assert.equal(savedCadCart?.locale, 'en-CA');
  assert.equal(savedCadCart?.currency, 'CAD');
  const cadOrder = await createOrderDraft({
    customerId: customer.id,
    addressId: address.id,
    checkoutMode: 'cart',
    currency: 'CAD',
    items: [{ productId: cadProduct.id, variantId: cadVariant.id, quantity: 2 }]
  });
  assert.equal(cadOrder.currency, 'CAD');
  assert.equal(cadOrder.totalCents, 2400);
}
