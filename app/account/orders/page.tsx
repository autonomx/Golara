import Link from 'next/link';
import { redirect } from 'next/navigation';
import { SiteHeader } from '@/components/SiteHeader';
import { formatMinorUnitAmount } from '@/lib/catalog';
import { getCustomerSession, listCustomerOrders } from '@/lib/customers/customer-account-repository';
import { getCustomerSessionCookie } from '@/lib/customers/customer-session-cookie';
import {
  customerOrderDateLocale,
  customerOrderItemCountLabel,
  customerOrderMoreItemLabel,
  customerOrderPaymentSummary,
  getCustomerOrderCopy,
  type CustomerOrderCopyKey
} from '@/lib/localization/customer-order-copy';
import { hasDatabase } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

function formatDate(value: Date, locale?: string | null) {
  return new Intl.DateTimeFormat(customerOrderDateLocale(locale), {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(value);
}

export default async function CustomerOrderHistoryPage() {
  if (!hasDatabase()) {
    const copy = (key: CustomerOrderCopyKey) => getCustomerOrderCopy(key);
    return (
      <main id="main-content" tabIndex={-1}>
        <SiteHeader />
        <section className="mx-auto max-w-5xl px-5 py-14">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-olive">{copy('eyebrow')}</p>
          <h1 className="mt-3 font-display text-6xl text-rosewood">{copy('title')}</h1>
          <div className="mt-8 rounded-[2rem] border border-amber-300 bg-amber-50 p-6 text-amber-900">
            <h2 className="font-display text-3xl">{copy('unavailableTitle')}</h2>
            <p className="mt-3 text-sm leading-6">{copy('unavailableBody')}</p>
          </div>
        </section>
      </main>
    );
  }

  const token = await getCustomerSessionCookie();
  const session = await getCustomerSession(token);
  if (!session) redirect('/account?status=session-required');

  const locale = session.customer.locale;
  const copy = (key: CustomerOrderCopyKey) => getCustomerOrderCopy(key, locale);
  const orders = await listCustomerOrders(session.customerId);

  return (
    <main id="main-content" tabIndex={-1}>
      <SiteHeader />
      <section className="mx-auto max-w-6xl px-5 py-14">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-olive">{copy('eyebrow')}</p>
            <h1 className="mt-3 font-display text-6xl text-rosewood">{copy('title')}</h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-stone-700">
              {copy('subtitle')}
            </p>
          </div>
          <Link href="/account" className="rounded-full border border-rosewood/15 bg-white px-5 py-3 text-sm font-semibold text-rosewood outline-none transition focus-visible:ring-4 focus-visible:ring-olive/20">
            {copy('accountOverview')}
          </Link>
        </div>

        {orders.length === 0 ? (
          <section className="mt-8 rounded-[2rem] border border-rosewood/10 bg-white p-8 shadow-sm">
            <h2 className="font-display text-4xl text-rosewood">{copy('emptyTitle')}</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-700">{copy('emptyBody')}</p>
            <Link href="/products" className="mt-6 inline-flex rounded-full bg-rosewood px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-rosewood/20 outline-none transition focus-visible:ring-4 focus-visible:ring-olive/30">
              {copy('browseProducts')}
            </Link>
          </section>
        ) : (
          <div className="mt-8 grid gap-4">
            {orders.map((order) => {
              const latestAttempt = order.paymentAttempts[0];
              const publicHref = order.publicLookupToken ? `/orders/${order.publicLookupToken}` : undefined;
              return (
                <article key={order.id} className="rounded-[2rem] border border-rosewood/10 bg-white p-6 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-rosewood/50">{formatDate(order.createdAt, locale)}</p>
                      <h2 className="mt-2 font-display text-4xl text-rosewood">{order.orderNumber}</h2>
                      <p className="mt-2 text-sm text-stone-600">{order.status.replace(/_/g, ' ')} · {order.fulfillmentStatus.replace(/_/g, ' ')} · {customerOrderPaymentSummary(latestAttempt?.status, locale)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-display text-3xl text-rosewood">{formatMinorUnitAmount(order.totalCents, order.currency)}</p>
                      <p className="mt-1 text-xs text-stone-500">{customerOrderItemCountLabel(order.items.reduce((sum, item) => sum + item.quantity, 0), locale)}</p>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-2 text-sm text-stone-700">
                    {order.items.slice(0, 3).map((item) => (
                      <div key={item.id} className="flex justify-between gap-4 border-b border-rosewood/10 pb-2 last:border-0 last:pb-0">
                        <span>{item.productTitle} × {item.quantity}</span>
                        <strong>{formatMinorUnitAmount(item.lineTotalCents, order.currency)}</strong>
                      </div>
                    ))}
                    {order.items.length > 3 ? <p className="text-xs text-stone-500">+ {customerOrderMoreItemLabel(order.items.length - 3, locale)}</p> : null}
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3">
                    {publicHref ? (
                      <Link href={publicHref} className="rounded-full bg-rosewood px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-rosewood/20 outline-none transition focus-visible:ring-4 focus-visible:ring-olive/30">
                        {copy('viewPublicStatus')}
                      </Link>
                    ) : null}
                    <span className="rounded-full border border-rosewood/15 px-5 py-3 text-sm font-semibold text-rosewood">
                      {order.checkoutMode.replace(/_/g, ' ')}
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
