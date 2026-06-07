import assert from 'node:assert/strict';
import type { ServiceLifecycleState } from './service-lifecycle-context';

export async function runServiceCatalogCartFlow(state: ServiceLifecycleState) {
  const { prisma, modules } = state;
  const { addCartItem, clearCart, getCartByToken, updateCartItem } = modules.cart;

  const product = await prisma.product.findUniqueOrThrow({
    where: { slug: 'e2e-red-rose-bouquet' },
    include: { category: true, productType: true, variants: true }
  });
  const variant = product.variants[0];
  assert.ok(variant);
  state.product = product;
  state.variant = variant;

  const secondProduct = await prisma.product.create({
    data: {
      slug: 'e2e-white-lily-bouquet',
      code: 'E2E-LILY-001',
      title: 'E2E White Lily Bouquet',
      description: 'Second deterministic product for multi-line lifecycle tests.',
      priceCents: 75000,
      currency: 'TOMAN',
      imageUrl: '/seed-images/photo-real/standard-bouquet.jpg',
      availableToday: true,
      isActive: true,
      categoryId: product.categoryId,
      productTypeId: product.productTypeId
    }
  });
  const secondVariant = await prisma.productVariant.create({
    data: {
      productId: secondProduct.id,
      sku: 'E2E-LILY-001-STANDARD',
      name: 'Standard',
      priceCents: secondProduct.priceCents,
      currency: secondProduct.currency,
      stockQuantity: 5,
      trackInventory: true,
      isActive: true
    }
  });
  const secondLocation = await prisma.warehouseLocation.create({
    data: {
      slug: 'e2e-richmond-studio',
      name: 'E2E Richmond Studio',
      countryCode: 'CA',
      isActive: true
    }
  });
  await prisma.productVariantLocationStock.create({
    data: {
      variantId: secondVariant.id,
      locationId: secondLocation.id,
      quantity: 5,
      reservedQuantity: 0
    }
  });
  state.secondProduct = secondProduct;
  state.secondVariant = secondVariant;

  const firstCart = await addCartItem({
    productId: product.id,
    variantId: variant.id,
    quantity: 1,
    locale: 'fa-IR',
    currency: 'TOMAN'
  });
  assert.ok(firstCart?.token);

  await addCartItem({
    token: firstCart.token,
    productId: product.id,
    variantId: variant.id,
    quantity: 2,
    locale: 'fa-IR',
    currency: 'TOMAN'
  });
  const mergedCart = await getCartByToken(firstCart.token);
  assert.equal(mergedCart?.items.length, 1);
  assert.equal(mergedCart?.items[0]?.quantity, 3);

  await updateCartItem({ token: firstCart.token, lineKey: variant.id, quantity: 2 });
  const cart = await getCartByToken(firstCart.token);
  assert.equal(cart?.items[0]?.quantity, 2);

  await addCartItem({
    token: firstCart.token,
    productId: secondProduct.id,
    variantId: secondVariant.id,
    quantity: 1,
    locale: 'fa-IR',
    currency: 'TOMAN'
  });
  state.multiLineCart = await getCartByToken(firstCart.token);
  assert.equal(state.multiLineCart?.items.length, 2);

  const expiringCart = await addCartItem({ productId: product.id, variantId: variant.id, quantity: 1, locale: 'fa-IR', currency: 'TOMAN' });
  assert.ok(expiringCart?.token);
  await prisma.cartSession.update({ where: { token: expiringCart.token }, data: { expiresAt: new Date('2020-01-01T00:00:00.000Z') } });
  assert.equal(await getCartByToken(expiringCart.token), null);

  const inactiveCart = await addCartItem({ productId: product.id, variantId: variant.id, quantity: 1, locale: 'fa-IR', currency: 'TOMAN' });
  assert.ok(inactiveCart?.token);
  await prisma.productVariant.update({ where: { id: variant.id }, data: { isActive: false } });
  assert.equal((await getCartByToken(inactiveCart.token))?.items.length, 0);
  await prisma.productVariant.update({ where: { id: variant.id }, data: { isActive: true } });

  const clearableCart = await addCartItem({ productId: product.id, variantId: variant.id, quantity: 1, locale: 'fa-IR', currency: 'TOMAN' });
  assert.ok(clearableCart?.token);
  assert.equal((await clearCart(clearableCart.token))?.items.length, 0);
}
