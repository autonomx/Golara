import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SiteHeader } from '@/components/SiteHeader';
import { formatMinorUnitAmount } from '@/lib/catalog';
import { fulfillmentStatusLabel, labelFor, orderStatusLabel, resultMessageFor } from '@/lib/checkout/public-order-labels';
import { getPublicOrderByToken } from '@/lib/checkout/public-order-repository';

export const dynamic = 'force-dynamic';

function formatDate(value: Date, locale?: string) {
  return new Intl.DateTimeFormat(locale || 'en-CA', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(value);
}

function formatDateOnly(value: Date, locale?: string) {
  return new Intl.DateTimeFormat(locale || 'en-CA', { dateStyle: 'medium' }).format(value);
}

function localeHref(token: string, locale: string, result?: string) {
  const params = new URLSearchParams({ locale });
  if (result) params.set('result', result);
  return `/orders/${token}?${params.toString()}`;
}

function ResultBanner({ result, locale }: { result?: string; locale?: string }) {
  const message = resultMessageFor(result, locale);
  if (!message) return null;
  const className = message.tone === 'success'
    ? 'mt-6 rounded-3xl border border-olive/20 bg-cream p-5 text-olive'
    : 'mt-6 rounded-3xl border border-amber-300 bg-amber-50 p-5 text-amber-900';
  return (
    <div className={className}>
      <p className="text-sm font-semibold uppercase tracking-[0.2em]">{message.title}</p>
      <p className="mt-2 text-sm leading-6">{message.body}</p>
    </div>
  );
}

export default async function PublicOrderStatusPage({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ result?: string; locale?: string }> }) {
  const [{ token }, { result, locale }] = await Promise.all([params, searchParams]);
  const order = await getPublicOrderByToken(token);
  if (!order) notFound();
  const latestAttempt = order.paymentAttempts[0];
  const isFa = locale?.toLowerCase().startsWith('fa');

  return (
    <main dir={isFa ? 'rtl' : 'ltr'}>
      <SiteHeader />
      <section className="mx-auto max-w-4xl px-5 py-20">
        <div className="rounded-[2rem] border border-rosewood/10 bg-white p-8 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-olive">Order status</p>
              <h1 className="mt-3 font-display text-5xl text-rosewood">{order.orderNumber}</h1>
            </div>
            <nav aria-label="Language" className="flex gap-2 text-sm font-semibold">
              <Link className="rounded-full border border-rosewood/15 px-4 py-2 text-rosewood" href={localeHref(token, 'en', result)}>English</Link>
              <Link className="rounded-full border border-rosewood/15 px-4 py-2 text-rosewood" href={localeHref(token, 'fa', result)}>فارسی</Link>
            </nav>
          </div>
          <p className="mt-5 text-lg leading-8 text-stone-700">
            Your order is currently <strong>{orderStatusLabel(order.status, locale)}</strong>. Staff will follow up if more information is needed.
          </p>
          <ResultBanner result={result} locale={locale} />

          <div className="mt-8 grid gap-4 md:grid-cols-4">
            <div className="rounded-3xl border border-rosewood/10 bg-cream p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rosewood/60">Total</p>
              <p className="mt-2 font-display text-3xl text-rosewood">{formatMinorUnitAmount(order.totalCents, order.currency)}</p>
            </div>
            <div className="rounded-3xl border border-rosewood/10 bg-cream p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rosewood/60">Order mode</p>
              <p className="mt-2 text-sm font-semibold capitalize text-rosewood">{labelFor({}, order.checkoutMode)}</p>
            </div>
            <div className="rounded-3xl border border-rosewood/10 bg-cream p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rosewood/60">Fulfillment</p>
              <p className="mt-2 text-sm font-semibold text-rosewood">{fulfillmentStatusLabel(order.fulfillmentStatus, locale)}</p>
            </div>
            <div className="rounded-3xl border border-rosewood/10 bg-cream p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rosewood/60">Created</p>
              <p className="mt-2 text-sm font-semibold text-rosewood">{formatDate(order.createdAt, locale)}</p>
            </div>
          </div>

          {(order.deliveryDate || order.deliveryWindow) ? (
            <section className="mt-8 rounded-3xl border border-rosewood/10 bg-cream p-5">
              <h2 className="font-display text-3xl text-rosewood">Delivery timing</h2>
              <div className="mt-4 grid gap-3 text-sm text-stone-700 md:grid-cols-2">
                <p><strong>Date:</strong> {order.deliveryDate ? formatDateOnly(order.deliveryDate, locale) : 'Not set yet'}</p>
                <p><strong>Window:</strong> {order.deliveryWindow || 'Not set yet'}</p>
              </div>
            </section>
          ) : null}

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
                    <p className="text-xs text-stone-500">{formatDate(event.createdAt, locale)}</p>
                  </article>
                ))}
              </div>
            )}
          </section>

          <p className="mt-6 text-sm leading-6 text-stone-600">
            For privacy, this page does not show address, phone, courier details, customer notes, or staff-only notes. Contact the shop with your order reference for detailed changes.
          </p>
          {latestAttempt ? <p className="mt-2 text-xs text-stone-500">Latest payment status: {labelFor({}, latestAttempt.provider)} · {labelFor({}, latestAttempt.status)}</p> : null}
        </div>
      </section>
    </main>
  );
}
