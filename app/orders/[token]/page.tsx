import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SiteHeader } from '@/components/SiteHeader';
import { formatMinorUnitAmount } from '@/lib/catalog';
import { fulfillmentStatusLabel, labelFor, orderStatusLabel, publicOrderCopyFor, resultMessageFor } from '@/lib/checkout/public-order-labels';
import { getPublicOrderByToken } from '@/lib/checkout/public-order-repository';

export const dynamic = 'force-dynamic';

const languageLinkClass = 'rounded-full border border-rosewood/15 px-4 py-2 text-rosewood outline-none transition focus-visible:ring-4 focus-visible:ring-olive/20';

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

function eyebrowClass(isFa: boolean) {
  return isFa ? 'text-sm font-semibold text-olive' : 'text-sm font-semibold uppercase tracking-[0.25em] text-olive';
}

function smallLabelClass(isFa: boolean) {
  return isFa ? 'text-xs font-semibold text-rosewood/60' : 'text-xs font-semibold uppercase tracking-[0.2em] text-rosewood/60';
}

function ResultBanner({ result, locale, isFa }: { result?: string; locale?: string; isFa: boolean }) {
  const message = resultMessageFor(result, locale);
  if (!message) return null;
  const className = message.tone === 'success'
    ? 'mt-6 rounded-3xl border border-olive/20 bg-cream p-5 text-olive'
    : 'mt-6 rounded-3xl border border-amber-300 bg-amber-50 p-5 text-amber-900';
  return (
    <div className={className} role="status" aria-live="polite">
      <p className={isFa ? 'text-sm font-semibold' : 'text-sm font-semibold uppercase tracking-[0.2em]'}>{message.title}</p>
      <p className="mt-2 text-sm leading-6">{message.body}</p>
    </div>
  );
}

export default async function PublicOrderStatusPage({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ result?: string; locale?: string }> }) {
  const [{ token }, { result, locale }] = await Promise.all([params, searchParams]);
  const order = await getPublicOrderByToken(token);
  if (!order) notFound();
  const latestAttempt = order.paymentAttempts[0];
  const copy = publicOrderCopyFor(locale);
  const isFa = locale?.toLowerCase().startsWith('fa') ?? false;
  const currentLanguage = isFa ? 'Persian' : 'English';

  return (
    <main id="main-content" tabIndex={-1} dir={isFa ? 'rtl' : 'ltr'}>
      <SiteHeader />
      <section className="mx-auto max-w-4xl px-5 py-20">
        <div className="rounded-[2rem] border border-rosewood/10 bg-white p-8 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className={eyebrowClass(isFa)}>{copy.eyebrow}</p>
              <h1 className="mt-3 font-display text-5xl text-rosewood" dir="ltr">{order.orderNumber}</h1>
            </div>
            <nav aria-label={`Order status language. Current language: ${currentLanguage}.`} className="flex flex-row gap-2 text-sm font-semibold" dir="ltr">
              <Link className={languageLinkClass} href={localeHref(token, 'en', result)} aria-label="View this order status in English" aria-current={!isFa ? 'page' : undefined}>English</Link>
              <Link className={languageLinkClass} href={localeHref(token, 'fa', result)} aria-label="View this order status in Persian" aria-current={isFa ? 'page' : undefined}>فارسی</Link>
            </nav>
          </div>
          <p className="mt-5 text-lg leading-8 text-stone-700" aria-live="polite">
            {copy.introPrefix} <strong>{orderStatusLabel(order.status, locale)}</strong>. {copy.introSuffix}
          </p>
          <ResultBanner result={result} locale={locale} isFa={isFa} />

          <div className="mt-8 grid gap-4 md:grid-cols-4">
            <div className="rounded-3xl border border-rosewood/10 bg-cream p-5">
              <p className={smallLabelClass(isFa)}>{copy.total}</p>
              <p className="mt-2 font-display text-3xl text-rosewood" dir="ltr">{formatMinorUnitAmount(order.totalCents, order.currency)}</p>
            </div>
            <div className="rounded-3xl border border-rosewood/10 bg-cream p-5">
              <p className={smallLabelClass(isFa)}>{copy.orderMode}</p>
              <p className="mt-2 text-sm font-semibold capitalize text-rosewood">{labelFor({}, order.checkoutMode)}</p>
            </div>
            <div className="rounded-3xl border border-rosewood/10 bg-cream p-5">
              <p className={smallLabelClass(isFa)}>{copy.fulfillment}</p>
              <p className="mt-2 text-sm font-semibold text-rosewood">{fulfillmentStatusLabel(order.fulfillmentStatus, locale)}</p>
            </div>
            <div className="rounded-3xl border border-rosewood/10 bg-cream p-5">
              <p className={smallLabelClass(isFa)}>{copy.created}</p>
              <p className="mt-2 text-sm font-semibold text-rosewood">{formatDate(order.createdAt, locale)}</p>
            </div>
          </div>

          {(order.deliveryDate || order.deliveryWindow) ? (
            <section className="mt-8 rounded-3xl border border-rosewood/10 bg-cream p-5">
              <h2 className="font-display text-3xl text-rosewood">{copy.deliveryTiming}</h2>
              <div className="mt-4 grid gap-3 text-sm text-stone-700 md:grid-cols-2">
                <p><strong>{copy.date}:</strong> {order.deliveryDate ? formatDateOnly(order.deliveryDate, locale) : copy.notSetYet}</p>
                <p><strong>{copy.window}:</strong> {order.deliveryWindow || copy.notSetYet}</p>
              </div>
            </section>
          ) : null}

          <section className="mt-8 rounded-3xl border border-rosewood/10 bg-cream p-5">
            <h2 className="font-display text-3xl text-rosewood">{copy.items}</h2>
            <div className="mt-4 grid gap-3 text-sm text-stone-700">
              {order.items.map((item) => (
                <div key={`${item.productTitle}-${item.quantity}`} className="flex flex-wrap items-start justify-between gap-4 border-b border-rosewood/10 pb-2 last:border-0 last:pb-0">
                  <span>{item.productTitle}</span>
                  <strong dir="ltr">× {item.quantity}</strong>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-8 rounded-3xl border border-rosewood/10 bg-white p-5" aria-labelledby="order-progress-heading">
            <h2 id="order-progress-heading" className="font-display text-3xl text-rosewood">{copy.progress}</h2>
            {order.timelineEvents.length === 0 ? (
              <p className="mt-4 text-sm text-stone-700">{copy.noProgress}</p>
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

          <p className="mt-6 text-sm leading-6 text-stone-600">{copy.privacy}</p>
          {latestAttempt ? <p className="mt-2 text-xs text-stone-500">{copy.latestPaymentStatus}: {labelFor({}, latestAttempt.provider)} · {labelFor({}, latestAttempt.status)}</p> : null}
        </div>
      </section>
    </main>
  );
}
