import 'server-only';

import { createHash, randomBytes } from 'node:crypto';
import { hasDatabase, prisma } from '@/lib/prisma';

const DEFAULT_CART_TTL_DAYS = 14;
const MAX_CART_QUANTITY = 99;
const CHECKOUT_PENDING_STATUS = 'checkout_pending';
const CHECKED_OUT_STATUS = 'checked_out';
const CART_MUTATION_THROTTLE_WINDOW_MS = 60_000;
const CART_MUTATION_THROTTLE_LIMIT = 120;
const CART_EXPIRY_CLEANUP_BATCH_LIMIT = 500;

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

type CartMutationThrottleBucket = {
  count: number;
  resetAt: number;
};

const cartMutationThrottleBuckets = new Map<string, CartMutationThrottleBucket>();

function optionalText(value?: string) {
  const normalized = value?.trim();
  return normalized || undefined;
}

function cartMutationThrottleKey(token?: string, fallback?: string) {
  const normalizedToken = optionalText(token);
  const normalizedFallback = optionalText(fallback);
  const source = normalizedToken ? `token:${normalizedToken}` : `anonymous:${normalizedFallback || 'cart'}`;
  return createHash('sha256').update(source).digest('hex');
}

function enforceCartMutationThrottle(input: { token?: string; fallback?: string }) {
  const now = Date.now();
  const key = cartMutationThrottleKey(input.token, input.fallback);
  const bucket = cartMutationThrottleBuckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    cartMutationThrottleBuckets.set(key, { count: 1, resetAt: now + CART_MUTATION_THROTTLE_WINDOW_MS });
    return;
  }
  if (bucket.count >= CART_MUTATION_THROTTLE_LIMIT) {
    throw new Error('Too many cart updates. Please wait before trying again.');
  }
  bucket.count += 1;
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

function cartInclude() {
  return {
    items: {
      orderBy: { createdAt: 'asc' as const },
      include: {
        product: {
          include: { category: true }
        },
        variant: true
      }
    }
  };
}

async function findCartByStatus(token: string | undefined, statuses: string[]) {
  const normalized = optionalText(token);
  if (!normalized || !hasDatabase()) return null;

  return prisma.cartSession.findFirst({
    where: {
      token: normalized,
      status: { in: statuses },
      expiresAt: { gt: new Date() }
    },
    include: cartInclude()
  });
}

async function findActiveCart(token?: string) {
  return findCartByStatus(token, ['active']);
}

async function removeInactiveCartItems(cart: Awaited<ReturnType<typeof findActiveCart>>) {
  if (!cart) return null;

  const activeItems = cart.items.filter((item) => item.product.isActive && item.product.category.isActive && (!item.variantId || item.variant?.isActive));
  if (activeItems.length === cart.items.length) return cart;

  await prisma.cartItem.deleteMany({
    where: {
      cartId: cart.id,
      id: { notIn: activeItems.map((item) => item.id) }
    }
  });

  return findCartByStatus(cart.token, [cart.status]);
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
    include: cartInclude()
  });
}

async function getOrCreateCart(input: CreateCartInput & { token?: string } = {}) {
  return (await findActiveCart(input.token)) ?? createCart(input);
}

export async function getCartByToken(token?: string) {
  return removeInactiveCartItems(await findActiveCart(token));
}

export async function claimCartForCheckout(token: string) {
  if (!hasDatabase()) throw new Error('DATABASE_URL is required for cart sessions.');
  const normalized = optionalText(token);
  if (!normalized) return null;

  const claimed = await prisma.cartSession.updateMany({
    where: {
      token: normalized,
      status: 'active',
      expiresAt: { gt: new Date() }
    },
    data: {
      status: CHECKOUT_PENDING_STATUS,
      expiresAt: expiresAt()
    }
  });
  if (claimed.count !== 1) return null;

  return removeInactiveCartItems(await findCartByStatus(normalized, [CHECKOUT_PENDING_STATUS]));
}

export async function releaseCartCheckoutClaim(token: string) {
  if (!hasDatabase()) throw new Error('DATABASE_URL is required for cart sessions.');
  const normalized = optionalText(token);
  if (!normalized) return null;

  await prisma.cartSession.updateMany({
    where: { token: normalized, status: CHECKOUT_PENDING_STATUS },
    data: { status: 'active', expiresAt: expiresAt() }
  });
  return getCartByToken(normalized);
}

export async function completeCartCheckout(token: string) {
  if (!hasDatabase()) throw new Error('DATABASE_URL is required for cart sessions.');
  const normalized = optionalText(token);
  if (!normalized) return null;

  const cart = await findCartByStatus(normalized, [CHECKOUT_PENDING_STATUS, 'active']);
  if (!cart) return null;

  await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
  await prisma.cartSession.update({
    where: { id: cart.id },
    data: { status: CHECKED_OUT_STATUS, expiresAt: new Date() }
  });

  return null;
}

export async function createCartSession(input: CreateCartInput = {}) {
  return createCart(input);
}

export async function addCartItem(input: AddCartItemInput) {
  if (!hasDatabase()) throw new Error('DATABASE_URL is required for cart sessions.');
  const productId = optionalText(input.productId);
  if (!productId) throw new Error('Product is required.');
  enforceCartMutationThrottle({ token: input.token, fallback: productId });

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
  enforceCartMutationThrottle({ token: input.token, fallback: input.lineKey });
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
  enforceCartMutationThrottle({ token, fallback: 'clear' });
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
  if (!hasDatabase()) return { count: 0, itemCount: 0 };

  const expired = await prisma.cartSession.updateMany({
    where: {
      status: 'active',
      expiresAt: { lte: new Date() }
    },
    data: { status: 'expired' }
  });
  const expiredCarts = await prisma.cartSession.findMany({
    where: { status: 'expired' },
    orderBy: { updatedAt: 'asc' },
    take: CART_EXPIRY_CLEANUP_BATCH_LIMIT,
    select: { id: true }
  });
  const expiredCartIds = expiredCarts.map((cart) => cart.id);
  if (!expiredCartIds.length) return { count: expired.count, itemCount: 0 };

  const deletedItems = await prisma.cartItem.deleteMany({
    where: { cartId: { in: expiredCartIds } }
  });

  return { count: expired.count, itemCount: deletedItems.count };
}
