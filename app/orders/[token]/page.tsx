import { notFound } from 'next/navigation';
import { SiteHeader } from '@/components/SiteHeader';
import { formatMinorUnitAmount } from '@/lib/catalog';
import { getPublicOrderByToken } from '@/lib/checkout/public-order-repository';

export const dynamic = 'force-dynamic';

function formatDate(value: Date) {
  return new Intl.DateTimeFormat('en-CA', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(value);
}

export default async function PublicOrderStatusPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const order = await getPublicOrderByToken(token);
  if (!order) notFound();
  const latestAttempt = order.paymentAttempts[0];

  return (
    <main>
      <SiteHeader />
      <section className="mx-auto max-w-4xl px-5 py-20">
        <div className="rounded-[2rem] border border-rosewood/10 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-olive">Order status</p>
          <h1 className="mt-3 font-display text-5xl text-rosewood">{order.orderNumber}</h1>
          <p className="mt-5 text-lg leading-8 text-stone-700">
            Your order draft is currently <strong>{order.status}</strong>. Staff will follow up if more information is needed.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl border border-rosewood/10 bg-cream p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rosewood/60">Total</p>
              <p className="mt-2 font-display text-3xl text-rosewood">{formatMinorUnitAmount(order.totalCents, order.currency)}</p>
            </div>
            <div className="rounded-3xl border border-rosewood/10 bg-cream p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rosewood/60">Mode</p>
              <p className="mt-2 font-display text-3xl text-rosewood">{order.checkoutMode}</p>
            </div>
            <div className="rounded-3xl border border-rosewood/10 bg-cream p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rosewood/60">Created</p>
              <p className="mt-2 text-sm font-semibold text-rosewood">{formatDate(order.createdAt)}</p>
            </div>
          </div>

          <section className="mt-8 rounded-3xl border border-rosewood/10 bg-cream p-5">
            <h2 className="font-display text-3xl text-rosewood">Items</h2>
            <div className="mt-4 grid gap-3 text-sm text-stone-700">
              {order.items.map((item) => (
                <div key={`${item.productTitle}-${item.quantity}`} className="flex justify-between gap-4 border-b border-rosewood/10 pb-2 last:border-0 last:pb-0">
                  <span>{item.productTitle}</span>
                  <strong>× {item.quantity}</strong>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-8 rounded-3xl border border-rosewood/10 bg-white p-5">
            <h2 className="font-display text-3xl text-rosewood">Progress</h2>
            {order.timelineEvents.length === 0 ? (
              <p className="mt-4 text-sm text-stone-700">No progress updates have been posted yet.</p>
            ) : (
              <div className="mt-4 grid gap-3">
                {order.timelineEvents.map((event) => (
                  <article key={`${event.type}-${event.createdAt.toISOString()}`} className="rounded-2xl border border-rosewood/10 bg-cream p-4">
                    <p className="font-semibold text-rosewood">{event.title}</p>
                    <p className="text-xs text-stone-500">{formatDate(event.createdAt)}</p>
                  </article>
                ))}
              </div>
            )}
          </section>

          <p className="mt-6 text-sm leading-6 text-stone-600">
            For privacy, this page does not show address, phone, customer notes, or staff-only notes. Contact the shop with your order reference for detailed changes.
          </p>
          {latestAttempt ? <p className="mt-2 text-xs text-stone-500">Latest payment status: {latestAttempt.provider} · {latestAttempt.status}</p> : null}
        </div>
      </section>
    </main>
  );
}
