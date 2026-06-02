'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { addCartItem, clearCart, removeCartItem, updateCartItem } from '@/lib/cart/cart-repository';
import { clearCartTokenCookie, getCartTokenCookie, setCartTokenCookie } from '@/lib/cart/cart-cookie';
import { hasDatabase } from '@/lib/prisma';

function stringField(formData: FormData, name: string, fallback = '') {
  const value = formData.get(name);
  if (typeof value !== 'string') return fallback;
  return value.trim();
}

function intField(formData: FormData, name: string, fallback = 1) {
  const parsed = Number.parseInt(stringField(formData, name, String(fallback)), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function safeReturnPath(value?: string) {
  const fallback = '/cart';
  if (!value || !value.startsWith('/')) return fallback;
  if (value.startsWith('//')) return fallback;
  return value;
}

function statusPath(path: string, status: string) {
  const [base, query = ''] = path.split('?');
  const params = new URLSearchParams(query);
  params.set('cart', status);
  const nextQuery = params.toString();
  return `${base}${nextQuery ? `?${nextQuery}` : ''}`;
}

function revalidateCartSurfaces(returnTo: string) {
  revalidatePath('/cart');
  if (returnTo.startsWith('/products/')) revalidatePath(returnTo.split('?')[0]);
  if (returnTo.startsWith('/categories/')) revalidatePath(returnTo.split('?')[0]);
}

export async function addToCartAction(formData: FormData) {
  const returnTo = safeReturnPath(stringField(formData, 'returnTo', '/cart'));
  if (!hasDatabase()) redirect(statusPath(returnTo, 'database-required'));

  try {
    const cart = await addCartItem({
      token: await getCartTokenCookie(),
      productId: stringField(formData, 'productId'),
      variantId: stringField(formData, 'variantId'),
      quantity: intField(formData, 'quantity', 1),
      locale: stringField(formData, 'locale', 'fa-IR'),
      currency: stringField(formData, 'currency')
    });
    if (cart?.token) await setCartTokenCookie(cart.token);
    revalidateCartSurfaces(returnTo);
    redirect(statusPath(returnTo, 'added'));
  } catch (error) {
    console.warn('[cart] failed to add item', error);
    redirect(statusPath(returnTo, 'failed'));
  }
}

export async function updateCartItemAction(formData: FormData) {
  const returnTo = safeReturnPath(stringField(formData, 'returnTo', '/cart'));
  const token = await getCartTokenCookie();
  if (!hasDatabase() || !token) redirect(statusPath(returnTo, 'missing'));

  try {
    await updateCartItem({
      token,
      lineKey: stringField(formData, 'lineKey'),
      quantity: intField(formData, 'quantity', 1)
    });
    revalidateCartSurfaces(returnTo);
    redirect(statusPath(returnTo, 'updated'));
  } catch (error) {
    console.warn('[cart] failed to update item', error);
    redirect(statusPath(returnTo, 'failed'));
  }
}

export async function removeCartItemAction(formData: FormData) {
  const returnTo = safeReturnPath(stringField(formData, 'returnTo', '/cart'));
  const token = await getCartTokenCookie();
  if (!hasDatabase() || !token) redirect(statusPath(returnTo, 'missing'));

  try {
    await removeCartItem(token, stringField(formData, 'lineKey'));
    revalidateCartSurfaces(returnTo);
    redirect(statusPath(returnTo, 'removed'));
  } catch (error) {
    console.warn('[cart] failed to remove item', error);
    redirect(statusPath(returnTo, 'failed'));
  }
}

export async function clearCartAction(formData: FormData) {
  const returnTo = safeReturnPath(stringField(formData, 'returnTo', '/cart'));
  const token = await getCartTokenCookie();
  if (!hasDatabase() || !token) redirect(statusPath(returnTo, 'missing'));

  try {
    await clearCart(token);
    await clearCartTokenCookie();
    revalidateCartSurfaces(returnTo);
    redirect(statusPath(returnTo, 'cleared'));
  } catch (error) {
    console.warn('[cart] failed to clear cart', error);
    redirect(statusPath(returnTo, 'failed'));
  }
}
