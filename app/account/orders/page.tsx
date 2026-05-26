import Link from 'next/link';
import { redirect } from 'next/navigation';
import { SiteHeader } from '@/components/SiteHeader';
import { formatMinorUnitAmount } from '@/lib/catalog';
import { getCustomerSession, listCustomerOrders } from '@/lib/customers/customer-account-repository';
import { getCustomerSessionCookie } from '@/lib/customers/customer-session-cookie';
import { hasDatabase } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

function formatDate(value: Date) {
  return new Intl.DateTimeFormat('en-CA', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(value);
}

function paymentSummary(status?: string) {
  if (!status) return 'No payment attempt yet';
  if (status === 'verified_paid') return 'Payment verified';
  if (status === 'redirect_required') return 'Waiting for gateway payment';
  if (status === 'manual_pending') return 'Manual follow-up pending';
  if (status === 'failed') return 'Payment failed';
  if (status === 'cancelled') return 'Payment cancelled';
  return status.replace(/_/g, ' ');
}

export default async function CustomerOrderHistoryPage() {
  if (!hasDatabase()) {
    return (
      <main id="main-content" tabIndex={-1}>
        <SiteHeader />
        <section className="mx-auto max-w-5xl px-5 py-14">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-olive">Order history</p>
          <h1 className="mt-3 font-display text-6xl text-rosewood">Your orders</h1>
          <div className="mt-8 rounded-[2rem] border border-amber-300 bg-amber-50 p-6 text-amber-900">
            <h2 className="font-display text-3xl">Order history unavailable</h2>
            <p className="mt-3 text-sm leading-6">Customer order history requires a configured database.</p>
          </div>
        </section>
      </main>
    );
  }

  const token = await getCustomerSessionCookie();
  const session = await getCustomerSession(token);
  if (!session) redirect('/account?status=session-required');

  const orders = await listCustomerOrders(session.customerId);

  return (
    <main id="main-content" tabIndex={-1}>
      <SiteHeader />
      <section className="mx-auto max-w-6xl px-5 py-14">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-olive">Order history</p>
            <h1 className="mt-3 font-display text-6xl text-rosewood">Your orders</h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-stone-700">
              Review orders connected to your signed-in customer profile. Public order pages still use privacy-safe lookup tokens.
            </p>
          </div>
          <Link href="/account" className="rounded-full border border-rosewood/15 bg-white px-5 py-3 text-sm font-semibold text-rosewood outline-none transition focus-visible:ring-4 focus-visible:ring-olive/20">
            Account overview
          </Link>
        </div>

        {orders.length === 0 ? (
          <section className="mt-8 rounded-[2rem] border border-rosewood/10 bg-white p-8 shadow-sm">
            <h2 className="font-display text-4xl text-rosewood">No orders yet.</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-700">Orders created while signed in will appear here.</p>
            <Link href="/products" className="mt-6 inline-flex rounded-full bg-rosewood px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-rosewood/20 outline-none transition focus-visible:ring-4 focus-visible:ring-olive/30">
              Browse products
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
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-rosewood/50">{formatDate(order.createdAt)}</p>
                      <h2 className="mt-2 font-display text-4xl text-rosewood">{order.orderNumber}</h2>
                      <p className="mt-2 text-sm text-stone-600">{order.status.replace(/_/g, ' ')} · {order.fulfillmentStatus.replace(/_/g, ' ')} · {paymentSummary(latestAttempt?.status)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-display text-3xl text-rosewood">{formatMinorUnitAmount(order.totalCents, order.currency)}</p>
                      <p className="mt-1 text-xs text-stone-500">{order.items.reduce((sum, item) => sum + item.quantity, 0)} item(s)</p>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-2 text-sm text-stone-700">
                    {order.items.slice(0, 3).map((item) => (
                      <div key={item.id} className="flex justify-between gap-4 border-b border-rosewood/10 pb-2 last:border-0 last:pb-0">
                        <span>{item.productTitle} × {item.quantity}</span>
                        <strong>{formatMinorUnitAmount(item.lineTotalCents, order.currency)}</strong>
                      </div>
                    ))}
                    {order.items.length > 3 ? <p className="text-xs text-stone-500">+ {order.items.length - 3} more item(s)</p> : null}
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3">
                    {publicHref ? (
                      <Link href={publicHref} className="rounded-full bg-rosewood px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-rosewood/20 outline-none transition focus-visible:ring-4 focus-visible:ring-olive/30">
                        View public status
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
