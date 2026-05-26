import Link from 'next/link';
import { createCartCheckoutAction } from '@/app/cart/checkout/actions';
import { SiteHeader } from '@/components/SiteHeader';
import { getCartTokenCookie } from '@/lib/cart/cart-cookie';
import { getCartByToken } from '@/lib/cart/cart-repository';
import { formatMinorUnitAmount } from '@/lib/catalog';
import { getCustomerSession } from '@/lib/customers/customer-account-repository';
import { getCustomerSessionCookie } from '@/lib/customers/customer-session-cookie';
import { getCustomerCopy, getCustomerCopyDirection } from '@/lib/localization/customer-copy';
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
  const [{ checkout }, cartToken, customerToken] = await Promise.all([searchParams, getCartTokenCookie(), getCustomerSessionCookie()]);
  const message = checkoutMessage(checkout);
  const [cart, customerSession] = hasDatabase()
    ? await Promise.all([getCartByToken(cartToken), getCustomerSession(customerToken)])
    : [null, null] as const;
  const locale = customerSession?.customer.locale;
  const dir = getCustomerCopyDirection(locale);
  const copy = (key: Parameters<typeof getCustomerCopy>[0]) => getCustomerCopy(key, locale);
  const items = cart?.items ?? [];
  const subtotalCents = items.reduce((sum, item) => sum + item.product.priceCents * item.quantity, 0);
  const currency = cart?.currency || items[0]?.product.currency || process.env.CHECKOUT_DOMESTIC_CURRENCY || 'TOMAN';
  const defaultAddress = customerSession?.customer.addresses.find((address) => address.isDefault) ?? customerSession?.customer.addresses[0];
  const defaultName = defaultAddress?.recipient || customerSession?.customer.displayName || '';
  const defaultPhone = defaultAddress?.phone || customerSession?.customer.phone || '';
  const defaultEmail = customerSession?.customer.email || '';

  return (
    <main id="main-content" tabIndex={-1} dir={dir}>
      <SiteHeader />
      <section className="mx-auto max-w-7xl px-5 py-14">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-olive">{copy('checkout.eyebrow')}</p>
            <h1 className="mt-3 font-display text-6xl text-rosewood">{copy('checkout.title')}</h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-stone-700">
              {copy('checkout.subtitle')}
            </p>
          </div>
          <Link href="/cart" className="rounded-full border border-rosewood/15 bg-white px-5 py-3 text-sm font-semibold text-rosewood outline-none transition focus-visible:ring-4 focus-visible:ring-olive/20">
            {copy('checkout.backToCart')}
          </Link>
        </div>

        {message ? (
          <div className="mt-8 rounded-3xl border border-amber-300 bg-amber-50 p-4 text-sm font-semibold text-amber-900" role="status" aria-live="polite">
            {message}
          </div>
        ) : null}

        {customerSession ? (
          <div className="mt-8 rounded-3xl border border-olive/20 bg-cream p-4 text-sm font-semibold text-olive" role="status">
            {defaultAddress ? copy('checkout.prefillWithAddressNotice') : copy('checkout.prefillNotice')}
          </div>
        ) : null}

        {!hasDatabase() ? (
          <div className="mt-8 rounded-[2rem] border border-amber-300 bg-amber-50 p-6 text-amber-900">
            <h2 className="font-display text-3xl">{copy('checkout.unavailableTitle')}</h2>
            <p className="mt-3 text-sm leading-6">{copy('checkout.unavailableBody')}</p>
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
            <form action={createCartCheckoutAction} className="grid gap-5 rounded-[2rem] border border-rosewood/10 bg-white p-6 shadow-sm">
              <h2 className="font-display text-4xl text-rosewood">{copy('checkout.recipientDetails')}</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2 text-sm font-semibold text-rosewood">
                  {copy('checkout.recipientName')}
                  <input name="name" required minLength={2} defaultValue={defaultName} className="rounded-2xl border border-rosewood/15 bg-white px-4 py-3 text-stone-800 outline-none transition focus:border-rosewood focus-visible:ring-4 focus-visible:ring-olive/20" />
                </label>
                <label className="grid gap-2 text-sm font-semibold text-rosewood">
                  {copy('common.phone')}
                  <input name="phone" required defaultValue={defaultPhone} className="rounded-2xl border border-rosewood/15 bg-white px-4 py-3 text-stone-800 outline-none transition focus:border-rosewood focus-visible:ring-4 focus-visible:ring-olive/20" />
                </label>
                <label className="grid gap-2 text-sm font-semibold text-rosewood">
                  {copy('checkout.emailOptional')}
                  <input name="email" type="email" defaultValue={defaultEmail} className="rounded-2xl border border-rosewood/15 bg-white px-4 py-3 text-stone-800 outline-none transition focus:border-rosewood focus-visible:ring-4 focus-visible:ring-olive/20" />
                </label>
                <label className="grid gap-2 text-sm font-semibold text-rosewood">
                  {copy('checkout.city')}
                  <input name="city" defaultValue={defaultAddress?.city ?? ''} className="rounded-2xl border border-rosewood/15 bg-white px-4 py-3 text-stone-800 outline-none transition focus:border-rosewood focus-visible:ring-4 focus-visible:ring-olive/20" />
                </label>
                <label className="grid gap-2 text-sm font-semibold text-rosewood md:col-span-2">
                  {copy('checkout.addressLine1')}
                  <input name="addressLine1" required minLength={4} defaultValue={defaultAddress?.line1 ?? ''} className="rounded-2xl border border-rosewood/15 bg-white px-4 py-3 text-stone-800 outline-none transition focus:border-rosewood focus-visible:ring-4 focus-visible:ring-olive/20" />
                </label>
                <label className="grid gap-2 text-sm font-semibold text-rosewood md:col-span-2">
                  {copy('checkout.addressLine2Optional')}
                  <input name="addressLine2" defaultValue={defaultAddress?.line2 ?? ''} className="rounded-2xl border border-rosewood/15 bg-white px-4 py-3 text-stone-800 outline-none transition focus:border-rosewood focus-visible:ring-4 focus-visible:ring-olive/20" />
                </label>
                <label className="grid gap-2 text-sm font-semibold text-rosewood">
                  {copy('checkout.deliveryDateOptional')}
                  <input name="deliveryDate" type="date" className="rounded-2xl border border-rosewood/15 bg-white px-4 py-3 text-stone-800 outline-none transition focus:border-rosewood focus-visible:ring-4 focus-visible:ring-olive/20" />
                </label>
                <label className="grid gap-2 text-sm font-semibold text-rosewood">
                  {copy('checkout.deliveryWindowOptional')}
                  <input name="deliveryWindow" placeholder={copy('checkout.deliveryWindowPlaceholder')} className="rounded-2xl border border-rosewood/15 bg-white px-4 py-3 text-stone-800 outline-none transition focus:border-rosewood focus-visible:ring-4 focus-visible:ring-olive/20" />
                </label>
                <label className="grid gap-2 text-sm font-semibold text-rosewood md:col-span-2">
                  {copy('checkout.deliveryNotesOptional')}
                  <textarea name="deliveryNotes" defaultValue={defaultAddress?.notes ?? ''} className="min-h-24 rounded-2xl border border-rosewood/15 bg-white px-4 py-3 text-stone-800 outline-none transition focus:border-rosewood focus-visible:ring-4 focus-visible:ring-olive/20" />
                </label>
                <label className="grid gap-2 text-sm font-semibold text-rosewood md:col-span-2">
                  {copy('checkout.customerNoteOptional')}
                  <textarea name="customerNote" className="min-h-24 rounded-2xl border border-rosewood/15 bg-white px-4 py-3 text-stone-800 outline-none transition focus:border-rosewood focus-visible:ring-4 focus-visible:ring-olive/20" />
                </label>
              </div>
              <button type="submit" className="rounded-full bg-rosewood px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-rosewood/20 outline-none transition focus-visible:ring-4 focus-visible:ring-olive/30">
                {copy('checkout.createOrderAndPay')}
              </button>
            </form>

            <aside className="rounded-[2rem] border border-rosewood/10 bg-white p-6 shadow-sm lg:sticky lg:top-24 lg:self-start">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-olive">{copy('checkout.orderSummary')}</p>
              <h2 className="mt-2 font-display text-4xl text-rosewood">{formatMinorUnitAmount(subtotalCents, currency)}</h2>
              <div className="mt-5 grid gap-3 text-sm text-stone-700">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between gap-4 border-b border-rosewood/10 pb-2 last:border-0 last:pb-0">
                    <span>{item.product.title} × {item.quantity}</span>
                    <strong>{formatMinorUnitAmount(item.product.priceCents * item.quantity, item.product.currency)}</strong>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-xs leading-5 text-stone-500">{copy('checkout.finalizedNote')}</p>
              {customerSession ? (
                <Link href="/account/addresses" className="mt-4 inline-flex rounded-full border border-rosewood/20 px-4 py-2 text-xs font-semibold text-rosewood outline-none transition focus-visible:ring-4 focus-visible:ring-olive/20">
                  {copy('checkout.manageAddresses')}
                </Link>
              ) : null}
            </aside>
          </div>
        ) : null}
      </section>
    </main>
  );
}
