import Link from 'next/link';
import { createCartCheckoutAction } from '@/app/cart/checkout/actions';
import { SiteHeader } from '@/components/SiteHeader';
import { getCartTokenCookie } from '@/lib/cart/cart-cookie';
import { getCartByToken } from '@/lib/cart/cart-repository';
import { formatMinorUnitAmount } from '@/lib/catalog';
import { hasDatabase } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

function checkoutMessage(status?: string) {
  if (status === 'cart-empty') return 'Your cart is empty. Add products before checkout.';
  if (status === 'cart-missing') return 'Your cart session was not found.';
  if (status === 'name-required') return 'Please enter a recipient name.';
  if (status === 'address-required') return 'Please enter a delivery address.';
  if (status === 'database-required') return 'Checkout requires a configured database.';
  if (status === 'failed') return 'We could not create checkout. Please try again.';
  return undefined;
}

export default async function CartCheckoutPage({ searchParams }: { searchParams: Promise<{ checkout?: string }> }) {
  const [{ checkout }, token] = await Promise.all([searchParams, getCartTokenCookie()]);
  const message = checkoutMessage(checkout);
  const cart = hasDatabase() ? await getCartByToken(token) : null;
  const items = cart?.items ?? [];
  const subtotalCents = items.reduce((sum, item) => sum + item.product.priceCents * item.quantity, 0);
  const currency = cart?.currency || items[0]?.product.currency || process.env.CHECKOUT_DOMESTIC_CURRENCY || 'TOMAN';

  return (
    <main id="main-content" tabIndex={-1}>
      <SiteHeader />
      <section className="mx-auto max-w-7xl px-5 py-14">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-olive">Cart checkout</p>
            <h1 className="mt-3 font-display text-6xl text-rosewood">Delivery and payment</h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-stone-700">
              Confirm delivery details. Final totals are recomputed on the server before the payment handoff.
            </p>
          </div>
          <Link href="/cart" className="rounded-full border border-rosewood/15 bg-white px-5 py-3 text-sm font-semibold text-rosewood outline-none transition focus-visible:ring-4 focus-visible:ring-olive/20">
            Back to cart
          </Link>
        </div>

        {message ? (
          <div className="mt-8 rounded-3xl border border-amber-300 bg-amber-50 p-4 text-sm font-semibold text-amber-900" role="status" aria-live="polite">
            {message}
          </div>
        ) : null}

        {!hasDatabase() ? (
          <div className="mt-8 rounded-[2rem] border border-amber-300 bg-amber-50 p-6 text-amber-900">
            <h2 className="font-display text-3xl">Checkout unavailable</h2>
            <p className="mt-3 text-sm leading-6">Cart checkout requires a configured database.</p>
          </div>
        ) : null}

        {hasDatabase() && items.length === 0 ? (
          <div className="mt-8 rounded-[2rem] border border-rosewood/10 bg-white p-8 shadow-sm">
            <h2 className="font-display text-4xl text-rosewood">Your cart is empty.</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-700">Add arrangements to your cart before checkout.</p>
            <Link href="/products" className="mt-6 inline-flex rounded-full bg-rosewood px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-rosewood/20 outline-none transition focus-visible:ring-4 focus-visible:ring-olive/30">
              Shop products
            </Link>
          </div>
        ) : null}

        {items.length > 0 ? (
          <div className="mt-8 grid gap-6 lg:grid-cols-[2fr_1fr]">
            <form action={createCartCheckoutAction} className="grid gap-5 rounded-[2rem] border border-rosewood/10 bg-white p-6 shadow-sm">
              <h2 className="font-display text-4xl text-rosewood">Recipient details</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2 text-sm font-semibold text-rosewood">
                  Recipient name
                  <input name="name" required minLength={2} className="rounded-2xl border border-rosewood/15 bg-white px-4 py-3 text-stone-800 outline-none transition focus:border-rosewood focus-visible:ring-4 focus-visible:ring-olive/20" />
                </label>
                <label className="grid gap-2 text-sm font-semibold text-rosewood">
                  Phone
                  <input name="phone" required className="rounded-2xl border border-rosewood/15 bg-white px-4 py-3 text-stone-800 outline-none transition focus:border-rosewood focus-visible:ring-4 focus-visible:ring-olive/20" />
                </label>
                <label className="grid gap-2 text-sm font-semibold text-rosewood">
                  Email optional
                  <input name="email" type="email" className="rounded-2xl border border-rosewood/15 bg-white px-4 py-3 text-stone-800 outline-none transition focus:border-rosewood focus-visible:ring-4 focus-visible:ring-olive/20" />
                </label>
                <label className="grid gap-2 text-sm font-semibold text-rosewood">
                  City
                  <input name="city" className="rounded-2xl border border-rosewood/15 bg-white px-4 py-3 text-stone-800 outline-none transition focus:border-rosewood focus-visible:ring-4 focus-visible:ring-olive/20" />
                </label>
                <label className="grid gap-2 text-sm font-semibold text-rosewood md:col-span-2">
                  Address line 1
                  <input name="addressLine1" required minLength={4} className="rounded-2xl border border-rosewood/15 bg-white px-4 py-3 text-stone-800 outline-none transition focus:border-rosewood focus-visible:ring-4 focus-visible:ring-olive/20" />
                </label>
                <label className="grid gap-2 text-sm font-semibold text-rosewood md:col-span-2">
                  Address line 2 optional
                  <input name="addressLine2" className="rounded-2xl border border-rosewood/15 bg-white px-4 py-3 text-stone-800 outline-none transition focus:border-rosewood focus-visible:ring-4 focus-visible:ring-olive/20" />
                </label>
                <label className="grid gap-2 text-sm font-semibold text-rosewood">
                  Delivery date optional
                  <input name="deliveryDate" type="date" className="rounded-2xl border border-rosewood/15 bg-white px-4 py-3 text-stone-800 outline-none transition focus:border-rosewood focus-visible:ring-4 focus-visible:ring-olive/20" />
                </label>
                <label className="grid gap-2 text-sm font-semibold text-rosewood">
                  Delivery window optional
                  <input name="deliveryWindow" placeholder="Morning, afternoon, evening" className="rounded-2xl border border-rosewood/15 bg-white px-4 py-3 text-stone-800 outline-none transition focus:border-rosewood focus-visible:ring-4 focus-visible:ring-olive/20" />
                </label>
                <label className="grid gap-2 text-sm font-semibold text-rosewood md:col-span-2">
                  Delivery notes optional
                  <textarea name="deliveryNotes" className="min-h-24 rounded-2xl border border-rosewood/15 bg-white px-4 py-3 text-stone-800 outline-none transition focus:border-rosewood focus-visible:ring-4 focus-visible:ring-olive/20" />
                </label>
                <label className="grid gap-2 text-sm font-semibold text-rosewood md:col-span-2">
                  Customer note optional
                  <textarea name="customerNote" className="min-h-24 rounded-2xl border border-rosewood/15 bg-white px-4 py-3 text-stone-800 outline-none transition focus:border-rosewood focus-visible:ring-4 focus-visible:ring-olive/20" />
                </label>
              </div>
              <button type="submit" className="rounded-full bg-rosewood px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-rosewood/20 outline-none transition focus-visible:ring-4 focus-visible:ring-olive/30">
                Create order and continue to payment
              </button>
            </form>

            <aside className="rounded-[2rem] border border-rosewood/10 bg-white p-6 shadow-sm lg:sticky lg:top-24 lg:self-start">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-olive">Order summary</p>
              <h2 className="mt-2 font-display text-4xl text-rosewood">{formatMinorUnitAmount(subtotalCents, currency)}</h2>
              <div className="mt-5 grid gap-3 text-sm text-stone-700">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between gap-4 border-b border-rosewood/10 pb-2 last:border-0 last:pb-0">
                    <span>{item.product.title} × {item.quantity}</span>
                    <strong>{formatMinorUnitAmount(item.product.priceCents * item.quantity, item.product.currency)}</strong>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-xs leading-5 text-stone-500">Delivery, discounts, and payment state are finalized when the order is created.</p>
            </aside>
          </div>
        ) : null}
      </section>
    </main>
  );
}
