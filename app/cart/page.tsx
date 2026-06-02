import Image from 'next/image';
import Link from 'next/link';
import { clearCartAction, removeCartItemAction, updateCartItemAction } from '@/app/cart/actions';
import { SiteHeader } from '@/components/SiteHeader';
import { getCartTokenCookie } from '@/lib/cart/cart-cookie';
import { getCartByToken } from '@/lib/cart/cart-repository';
import { formatMinorUnitAmount } from '@/lib/catalog';
import { getCustomerCopy } from '@/lib/localization/customer-copy';
import { hasDatabase } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const copy = (key: Parameters<typeof getCustomerCopy>[0]) => getCustomerCopy(key);

function statusMessage(status?: string) {
  if (status === 'added') return 'Item added to your cart.';
  if (status === 'updated') return 'Cart quantity updated.';
  if (status === 'removed') return 'Item removed from your cart.';
  if (status === 'cleared') return 'Cart cleared.';
  if (status === 'missing') return 'Your cart session was not found.';
  if (status === 'database-required') return 'Cart checkout requires a configured database.';
  if (status === 'failed') return 'We could not update your cart. Please try again.';
  return undefined;
}

function quantityOptions(current: number) {
  const values = new Set([1, 2, 3, 4, 5, current]);
  return [...values].filter((value) => value > 0 && value <= 99).sort((a, b) => a - b);
}

export default async function CartPage({ searchParams }: { searchParams: Promise<{ cart?: string }> }) {
  const [{ cart: cartStatus }, token] = await Promise.all([searchParams, getCartTokenCookie()]);
  const message = statusMessage(cartStatus);
  const cart = hasDatabase() ? await getCartByToken(token) : null;
  const items = cart?.items ?? [];
  const subtotalCents = items.reduce((sum, item) => sum + (item.variant?.priceCents ?? item.product.priceCents) * item.quantity, 0);
  const currency = cart?.currency || items[0]?.product.currency || process.env.CHECKOUT_DOMESTIC_CURRENCY || 'TOMAN';

  return (
    <main id="main-content" tabIndex={-1}>
      <SiteHeader />
      <section className="mx-auto max-w-7xl px-5 py-14">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-olive">{copy('cart.eyebrow')}</p>
            <h1 className="mt-3 font-display text-6xl text-rosewood">{copy('cart.title')}</h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-stone-700">
              {copy('cart.subtitle')}
            </p>
          </div>
          <Link href="/products" className="rounded-full border border-rosewood/15 bg-white px-5 py-3 text-sm font-semibold text-rosewood outline-none transition focus-visible:ring-4 focus-visible:ring-olive/20">
            {copy('common.continueShopping')}
          </Link>
        </div>

        {message ? (
          <div className="mt-8 rounded-3xl border border-olive/20 bg-cream p-4 text-sm font-semibold text-olive" role="status" aria-live="polite">
            {message}
          </div>
        ) : null}

        {!hasDatabase() ? (
          <div className="mt-8 rounded-[2rem] border border-amber-300 bg-amber-50 p-6 text-amber-900">
            <h2 className="font-display text-3xl">{copy('cart.unavailableTitle')}</h2>
            <p className="mt-3 text-sm leading-6">{copy('cart.unavailableBody')}</p>
          </div>
        ) : null}

        {hasDatabase() && items.length === 0 ? (
          <div className="mt-8 rounded-[2rem] border border-rosewood/10 bg-white p-8 shadow-sm">
            <h2 className="font-display text-4xl text-rosewood">{copy('cart.emptyTitle')}</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-700">{copy('cart.emptyBody')}</p>
            <Link href="/products" className="mt-6 inline-flex rounded-full bg-rosewood px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-rosewood/20 outline-none transition focus-visible:ring-4 focus-visible:ring-olive/30">
              {copy('cart.shopProducts')}
            </Link>
          </div>
        ) : null}

        {items.length > 0 ? (
          <div className="mt-8 grid gap-6 lg:grid-cols-[2fr_1fr]">
            <div className="grid gap-4">
              {items.map((item) => {
                const unitPriceCents = item.variant?.priceCents ?? item.product.priceCents;
                const lineTotal = unitPriceCents * item.quantity;
                return (
                  <article key={item.id} className="grid gap-4 rounded-[2rem] border border-rosewood/10 bg-white p-5 shadow-sm md:grid-cols-[140px_1fr]">
                    <div className="relative aspect-square overflow-hidden rounded-3xl bg-blush">
                      <Image src={item.product.imageUrl} alt={item.product.title} fill className="object-cover" sizes="140px" />
                    </div>
                    <div className="grid gap-4">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <Link href={`/products/${item.product.slug}`} className="font-display text-3xl text-rosewood underline-offset-4 outline-none transition hover:underline focus-visible:ring-4 focus-visible:ring-olive/20">
                            {item.product.title}
                          </Link>
                          <p className="mt-1 text-xs uppercase tracking-[0.2em] text-rosewood/50">{item.product.code}</p>
                          {item.variant ? <p className="mt-1 text-sm font-semibold text-rosewood">{item.variant.name} / {item.variant.sku}</p> : null}
                          <p className="mt-2 text-sm text-stone-600">{formatMinorUnitAmount(unitPriceCents, item.variant?.currency ?? item.product.currency)} {copy('cart.each')}</p>
                        </div>
                        <p className="font-display text-3xl text-rosewood">{formatMinorUnitAmount(lineTotal, item.product.currency)}</p>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        <form action={updateCartItemAction} className="flex flex-wrap items-end gap-2 rounded-3xl border border-rosewood/10 bg-cream p-3">
                          <input type="hidden" name="lineKey" value={item.lineKey} />
                          <input type="hidden" name="returnTo" value="/cart" />
                          <label className="grid gap-1 text-xs font-semibold uppercase tracking-[0.16em] text-rosewood/60">
                            {copy('cart.quantity')}
                            <select name="quantity" defaultValue={item.quantity} className="rounded-2xl border border-rosewood/15 bg-white px-3 py-2 text-sm text-stone-800 outline-none transition focus:border-rosewood focus-visible:ring-4 focus-visible:ring-olive/20">
                              {quantityOptions(item.quantity).map((quantity) => <option key={quantity} value={quantity}>{quantity}</option>)}
                            </select>
                          </label>
                          <button type="submit" className="rounded-full bg-rosewood px-4 py-2 text-xs font-semibold text-white outline-none transition focus-visible:ring-4 focus-visible:ring-olive/30">{copy('cart.update')}</button>
                        </form>
                        <form action={removeCartItemAction}>
                          <input type="hidden" name="lineKey" value={item.lineKey} />
                          <input type="hidden" name="returnTo" value="/cart" />
                          <button type="submit" className="rounded-full border border-rosewood/20 bg-white px-4 py-2 text-xs font-semibold text-rosewood outline-none transition focus-visible:ring-4 focus-visible:ring-olive/20">{copy('cart.remove')}</button>
                        </form>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            <aside className="rounded-[2rem] border border-rosewood/10 bg-white p-6 shadow-sm lg:sticky lg:top-24 lg:self-start">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-olive">{copy('cart.summary')}</p>
              <h2 className="mt-2 font-display text-4xl text-rosewood">{copy('cart.total')}</h2>
              <div className="mt-5 grid gap-3 text-sm text-stone-700">
                <div className="flex justify-between gap-4">
                  <span>{copy('cart.items')}</span>
                  <strong>{items.reduce((sum, item) => sum + item.quantity, 0)}</strong>
                </div>
                <div className="flex justify-between gap-4 border-t border-rosewood/10 pt-3 text-lg text-rosewood">
                  <span>{copy('cart.subtotal')}</span>
                  <strong>{formatMinorUnitAmount(subtotalCents, currency)}</strong>
                </div>
              </div>
              <p className="mt-4 text-xs leading-5 text-stone-500">{copy('cart.finalTotalsNote')}</p>
              <div className="mt-6 grid gap-3">
                <Link href="/cart/checkout" className="rounded-full bg-rosewood px-6 py-3 text-center text-sm font-semibold text-white shadow-lg shadow-rosewood/20 outline-none transition focus-visible:ring-4 focus-visible:ring-olive/30">
                  {copy('cart.checkout')}
                </Link>
                <form action={clearCartAction}>
                  <input type="hidden" name="returnTo" value="/cart" />
                  <button type="submit" className="w-full rounded-full border border-rosewood/20 px-6 py-3 text-sm font-semibold text-rosewood outline-none transition focus-visible:ring-4 focus-visible:ring-olive/20">
                    {copy('cart.clear')}
                  </button>
                </form>
              </div>
            </aside>
          </div>
        ) : null}
      </section>
    </main>
  );
}
