import 'server-only';

import { randomBytes } from 'node:crypto';
import { hasDatabase, prisma } from '@/lib/prisma';

const DEFAULT_CART_TTL_DAYS = 14;
const MAX_CART_QUANTITY = 99;

type CartCurrency = string | undefined;

type CreateCartInput = {
  locale?: string;
  currency?: CartCurrency;
};

type AddCartItemInput = {
  token?: string;
  productId: string;
  variantId?: string;
  quantity?: number;
  locale?: string;
  currency?: CartCurrency;
};

type UpdateCartItemInput = {
  token: string;
  lineKey: string;
  quantity: number;
};

function optionalText(value?: string) {
  const normalized = value?.trim();
  return normalized || undefined;
}

function normalizeLocale(locale?: string) {
  return optionalText(locale) || 'fa-IR';
}

function normalizeCurrency(currency?: string) {
  return optionalText(currency)?.toUpperCase() || process.env.CHECKOUT_DOMESTIC_CURRENCY || 'TOMAN';
}

function normalizeQuantity(quantity?: number) {
  if (!Number.isFinite(quantity)) return 1;
  return Math.max(1, Math.min(MAX_CART_QUANTITY, Math.floor(quantity ?? 1)));
}

function cartTtlDays() {
  const parsed = Number.parseInt(process.env.CART_SESSION_TTL_DAYS || String(DEFAULT_CART_TTL_DAYS), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_CART_TTL_DAYS;
}

function expiresAt() {
  const expires = new Date();
  expires.setDate(expires.getDate() + cartTtlDays());
  return expires;
}

function makeCartToken() {
  return randomBytes(32).toString('base64url');
}

async function findActiveCart(token?: string) {
  const normalized = optionalText(token);
  if (!normalized || !hasDatabase()) return null;

  return prisma.cartSession.findFirst({
    where: {
      token: normalized,
      status: 'active',
      expiresAt: { gt: new Date() }
    },
    include: {
      items: {
        orderBy: { createdAt: 'asc' },
        include: {
          product: {
            include: { category: true }
          },
          variant: true
        }
      }
    }
  });
}

async function createCart(input: CreateCartInput = {}) {
  if (!hasDatabase()) throw new Error('DATABASE_URL is required for cart sessions.');

  return prisma.cartSession.create({
    data: {
      token: makeCartToken(),
      locale: normalizeLocale(input.locale),
      currency: normalizeCurrency(input.currency),
      expiresAt: expiresAt()
    },
    include: {
      items: {
        include: {
          product: {
            include: { category: true }
          },
          variant: true
        }
      }
    }
  });
}

async function getOrCreateCart(input: CreateCartInput & { token?: string } = {}) {
  return (await findActiveCart(input.token)) ?? createCart(input);
}

export async function getCartByToken(token?: string) {
  const cart = await findActiveCart(token);
  if (!cart) return null;

  const activeItems = cart.items.filter((item) => item.product.isActive && item.product.category.isActive && (!item.variantId || item.variant?.isActive));
  if (activeItems.length === cart.items.length) return cart;

  await prisma.cartItem.deleteMany({
    where: {
      cartId: cart.id,
      id: { notIn: activeItems.map((item) => item.id) }
    }
  });

  return findActiveCart(cart.token);
}

export async function createCartSession(input: CreateCartInput = {}) {
  return createCart(input);
}

export async function addCartItem(input: AddCartItemInput) {
  if (!hasDatabase()) throw new Error('DATABASE_URL is required for cart sessions.');
  const productId = optionalText(input.productId);
  if (!productId) throw new Error('Product is required.');

  const product = await prisma.product.findFirst({
    where: {
      id: productId,
      isActive: true,
      category: { isActive: true }
    },
    select: {
      id: true,
      priceCents: true,
      requiresQuote: true,
      variants: {
        where: { isActive: true },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        select: { id: true }
      }
    }
  });
  if (!product) throw new Error('Product is unavailable.');
  if (product.requiresQuote || product.priceCents <= 0) throw new Error('Product is custom order only.');

  const requestedVariantId = optionalText(input.variantId);
  const variantId = requestedVariantId
    ? product.variants.find((variant) => variant.id === requestedVariantId)?.id
    : product.variants[0]?.id;
  if (requestedVariantId && !variantId) throw new Error('Variant is unavailable.');
  const lineKey = variantId ?? product.id;
  const cart = await getOrCreateCart(input);
  const quantity = normalizeQuantity(input.quantity);
  const existing = await prisma.cartItem.findUnique({
    where: { cartId_lineKey: { cartId: cart.id, lineKey } }
  });

  if (existing) {
    await prisma.cartItem.update({
      where: { id: existing.id },
      data: { quantity: Math.min(MAX_CART_QUANTITY, existing.quantity + quantity) }
    });
  } else {
    await prisma.cartItem.create({
      data: { cartId: cart.id, productId, variantId, lineKey, quantity }
    });
  }

  await prisma.cartSession.update({
    where: { id: cart.id },
    data: { expiresAt: expiresAt() }
  });

  return getCartByToken(cart.token);
}

export async function updateCartItem(input: UpdateCartItemInput) {
  if (!hasDatabase()) throw new Error('DATABASE_URL is required for cart sessions.');
  const cart = await findActiveCart(input.token);
  if (!cart) throw new Error('Cart was not found.');
  const lineKey = optionalText(input.lineKey);
  if (!lineKey) throw new Error('Cart line is required.');

  if (input.quantity <= 0) {
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id, lineKey } });
  } else {
    await prisma.cartItem.update({
      where: { cartId_lineKey: { cartId: cart.id, lineKey } },
      data: { quantity: normalizeQuantity(input.quantity) }
    });
  }

  await prisma.cartSession.update({
    where: { id: cart.id },
    data: { expiresAt: expiresAt() }
  });

  return getCartByToken(cart.token);
}

export async function removeCartItem(token: string, lineKey: string) {
  return updateCartItem({ token, lineKey, quantity: 0 });
}

export async function clearCart(token: string) {
  if (!hasDatabase()) throw new Error('DATABASE_URL is required for cart sessions.');
  const cart = await findActiveCart(token);
  if (!cart) return null;

  await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
  await prisma.cartSession.update({
    where: { id: cart.id },
    data: { expiresAt: expiresAt() }
  });

  return getCartByToken(cart.token);
}

export async function expireOldCarts() {
  if (!hasDatabase()) return { count: 0 };

  return prisma.cartSession.updateMany({
    where: {
      status: 'active',
      expiresAt: { lte: new Date() }
    },
    data: { status: 'expired' }
  });
}
