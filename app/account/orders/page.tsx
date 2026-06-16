import Link from 'next/link';
import { redirect } from 'next/navigation';
import { SiteHeader } from '@/components/SiteHeader';
import { formatMinorUnitAmount } from '@/lib/catalog';
import { listCustomerInstallmentScheduleStatuses, type CustomerInstallmentScheduleStatus } from '@/lib/checkout/customer-installment-status';
import { getCustomerSession, listCustomerOrdersForSession } from '@/lib/customers/customer-account-repository';
import { getCustomerSessionCookie } from '@/lib/customers/customer-session-cookie';
import { resolveStorefrontLocale } from '@/lib/i18n/resolve-locale';
import {
  customerOrderDateLocale,
  customerOrderItemCountLabel,
  customerOrderManualTransferInstructions,
  customerOrderMethodConfirmation,
  customerOrderMoreItemLabel,
  customerOrderPaymentSummary,
  getCustomerOrderCopy,
  type CustomerOrderCopyKey
} from '@/lib/localization/customer-order-copy';
import { getCustomerCopyDirection } from '@/lib/localization/customer-copy';
import { hasDatabase } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

function formatDate(value: Date, locale?: string | null) {
  return new Intl.DateTimeFormat(customerOrderDateLocale(locale), {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(value);
}

function metadataRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function textMetadataValue(value: unknown) {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return undefined;
}

function numberMetadataValue(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function installmentStatusLabel(status?: string, locale?: string | null) {
  const isFa = locale?.toLowerCase().startsWith('fa');
  if (status === 'approved') return isFa ? 'تایید شده' : 'Approved';
  if (status === 'rejected') return isFa ? 'رد شده' : 'Rejected';
  if (status === 'needs_follow_up') return isFa ? 'نیازمند پیگیری' : 'Needs follow-up';
  return isFa ? 'در انتظار بررسی' : 'Pending review';
}

function installmentCopy(locale?: string | null) {
  const isFa = locale?.toLowerCase().startsWith('fa');
  return {
    title: isFa ? 'وضعیت اقساط' : 'Installment status',
    approvedTerm: isFa ? 'مدت تایید شده' : 'Approved term',
    requestedTerm: isFa ? 'مدت درخواستی' : 'Requested term',
    downPayment: isFa ? 'پیش‌پرداخت' : 'Down payment',
    financed: isFa ? 'مبلغ اقساطی' : 'Financed amount',
    schedule: isFa ? 'برنامه پرداخت' : 'Payment schedule',
    noSchedule: isFa ? 'برنامه پرداخت پس از تایید نمایش داده می‌شود.' : 'Payment schedule will appear after approval.',
    firstDue: isFa ? 'اولین سررسید' : 'First due',
    payment: isFa ? 'قسط' : 'Payment',
    months: isFa ? 'ماه' : 'months'
  };
}

function InstallmentStatusCard({
  metadata,
  schedule,
  currency,
  locale
}: {
  metadata: Record<string, unknown>;
  schedule?: CustomerInstallmentScheduleStatus;
  currency: string;
  locale?: string | null;
}) {
  const copy = installmentCopy(locale);
  const approvalStatus = textMetadataValue(metadata.installmentApprovalStatus);
  const requestedTerm = numberMetadataValue(metadata.installmentRequestedTermMonths);
  const approvedTerm = numberMetadataValue(metadata.installmentApprovedTermMonths) ?? schedule?.termMonths;
  const downPaymentCents = numberMetadataValue(metadata.installmentDownPaymentCents) ?? schedule?.downPaymentCents;

  return (
    <section className="mt-5 rounded-3xl border border-olive/20 bg-cream p-4 text-sm text-stone-700">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-olive">{copy.title}</p>
          <h3 className="mt-1 font-display text-3xl text-rosewood">{installmentStatusLabel(approvalStatus, locale)}</h3>
        </div>
        {schedule ? <span className="rounded-full border border-olive/20 bg-white px-3 py-1 text-xs font-semibold text-olive">{schedule.status.replace(/_/g, ' ')}</span> : null}
      </div>
      <dl className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl bg-white p-3"><dt className="font-semibold text-stone-500">{approvedTerm ? copy.approvedTerm : copy.requestedTerm}</dt><dd className="mt-1 text-stone-900">{approvedTerm ?? requestedTerm ?? '—'} {approvedTerm || requestedTerm ? copy.months : ''}</dd></div>
        <div className="rounded-2xl bg-white p-3"><dt className="font-semibold text-stone-500">{copy.downPayment}</dt><dd className="mt-1 text-stone-900">{downPaymentCents !== undefined ? formatMinorUnitAmount(downPaymentCents, currency) : '—'}</dd></div>
        <div className="rounded-2xl bg-white p-3"><dt className="font-semibold text-stone-500">{copy.financed}</dt><dd className="mt-1 text-stone-900">{schedule ? formatMinorUnitAmount(schedule.financedAmountCents, schedule.currency) : '—'}</dd></div>
      </dl>
      {schedule ? (
        <div className="mt-4 rounded-2xl bg-white p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h4 className="font-semibold text-rosewood">{copy.schedule}</h4>
            <span className="text-xs text-stone-500">{copy.firstDue}: {formatDate(schedule.firstDueAt, locale)}</span>
          </div>
          <div className="mt-3 grid gap-2">
            {schedule.entries.slice(0, 6).map((entry) => (
              <div key={entry.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rosewood/10 px-3 py-2">
                <span>{copy.payment} {entry.sequence} · {formatDate(entry.dueAt, locale)}</span>
                <strong>{formatMinorUnitAmount(entry.totalCents, schedule.currency)}</strong>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="mt-4 rounded-2xl bg-white p-3 text-stone-600">{copy.noSchedule}</p>
      )}
    </section>
  );
}

export default async function CustomerOrderHistoryPage() {
  if (!hasDatabase()) {
    const storefrontLocale = await resolveStorefrontLocale();
    const dir = getCustomerCopyDirection(storefrontLocale);
    const copy = (key: CustomerOrderCopyKey) => getCustomerOrderCopy(key, storefrontLocale);
    return (
      <main id="main-content" tabIndex={-1} dir={dir}>
        <SiteHeader locale={storefrontLocale} />
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
  const dir = getCustomerCopyDirection(locale);
  const copy = (key: CustomerOrderCopyKey) => getCustomerOrderCopy(key, locale);
  const [orders, installmentStatuses] = await Promise.all([
    listCustomerOrdersForSession(session),
    listCustomerInstallmentScheduleStatuses(session.customerId)
  ]);
  const installmentStatusByAttemptId = new Map(installmentStatuses.map((status) => [status.paymentAttemptId, status]));

  return (
    <main id="main-content" tabIndex={-1} dir={dir}>
      <SiteHeader locale={locale} />
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
              const metadata = metadataRecord(latestAttempt?.metadata);
              const isInstallment = textMetadataValue(metadata.paymentMethodType) === 'installment';
              const installmentStatus = latestAttempt ? installmentStatusByAttemptId.get(latestAttempt.id) : undefined;
              const publicHref = order.publicLookupToken ? `/orders/${order.publicLookupToken}` : undefined;
              const methodConfirmation = customerOrderMethodConfirmation(metadata, locale);
              const manualTransferInstructions = customerOrderManualTransferInstructions(metadata, order.orderNumber, locale);
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

                  {methodConfirmation ? (
                    <section className="mt-5 rounded-3xl border border-sage/20 bg-sage/5 p-4 text-sm text-stone-700">
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-olive">{methodConfirmation.methodLabel ?? methodConfirmation.title}</p>
                      <h3 className="mt-1 font-display text-3xl text-rosewood">{methodConfirmation.title}</h3>
                      <p className="mt-2 leading-6">{methodConfirmation.body}</p>
                    </section>
                  ) : null}

                  {manualTransferInstructions ? (
                    <section className="mt-5 rounded-3xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-700">{manualTransferInstructions.title}</p>
                      <p className="mt-2 leading-6">{manualTransferInstructions.body}</p>
                      {manualTransferInstructions.reference || manualTransferInstructions.proofUrl ? (
                        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                          {manualTransferInstructions.reference ? (
                            <div className="rounded-2xl bg-white p-3">
                              <dt className="font-semibold text-amber-700">{manualTransferInstructions.referenceLabel}</dt>
                              <dd className="mt-1 break-words text-stone-900">{manualTransferInstructions.reference}</dd>
                            </div>
                          ) : null}
                          {manualTransferInstructions.proofUrl ? (
                            <div className="rounded-2xl bg-white p-3">
                              <dt className="font-semibold text-amber-700">{manualTransferInstructions.proofUrlLabel}</dt>
                              <dd className="mt-1 break-words text-stone-900">{manualTransferInstructions.proofUrl}</dd>
                            </div>
                          ) : null}
                        </dl>
                      ) : (
                        <p className="mt-4 rounded-2xl bg-white p-3 text-stone-700">{manualTransferInstructions.noEvidenceLabel}</p>
                      )}
                      <details className="mt-4 rounded-2xl bg-white p-3">
                        <summary className="cursor-pointer font-semibold text-amber-800">{manualTransferInstructions.emailSubject}</summary>
                        <p className="mt-2 whitespace-pre-line text-stone-700">{manualTransferInstructions.emailBody}</p>
                      </details>
                    </section>
                  ) : null}

                  <div className="mt-5 grid gap-2 text-sm text-stone-700">
                    {order.items.slice(0, 3).map((item) => (
                      <div key={item.id} className="flex justify-between gap-4 border-b border-rosewood/10 pb-2 last:border-0 last:pb-0">
                        <span>{item.productTitle} × {item.quantity}</span>
                        <strong>{formatMinorUnitAmount(item.lineTotalCents, order.currency)}</strong>
                      </div>
                    ))}
                    {order.items.length > 3 ? <p className="text-xs text-stone-500">+ {customerOrderMoreItemLabel(order.items.length - 3, locale)}</p> : null}
                  </div>

                  {isInstallment ? <InstallmentStatusCard metadata={metadata} schedule={installmentStatus} currency={order.currency} locale={locale} /> : null}

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
