import type { PrismaClient } from '@prisma/client';

export async function createLifecycleCartWithItem(
  prisma: PrismaClient,
  deps: {
    productId: string;
    variantId: string;
  }
) {
  const cart = await prisma.cartSession.create({
    data: {
      token: 'e2e-cart-token',
      locale: 'fa-IR',
      currency: 'TOMAN',
      status: 'active',
      expiresAt: new Date('2026-06-15T12:00:00.000Z')
    }
  });

  const item = await prisma.cartItem.create({
    data: {
      cartId: cart.id,
      productId: deps.productId,
      variantId: deps.variantId,
      lineKey: `${deps.productId}:${deps.variantId}`,
      quantity: 2
    }
  });

  return { cart, item };
}
