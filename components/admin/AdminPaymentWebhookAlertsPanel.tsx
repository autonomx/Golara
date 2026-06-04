import type { PaymentWebhookAlertSummary } from '@/lib/checkout/payment-webhook-alert-service';

function severityClass(severity: string) {
  if (severity === 'critical') return 'border-red-200 bg-red-50 text-red-900';
  if (severity === 'warning') return 'border-amber-200 bg-amber-50 text-amber-900';
  return 'border-stone-200 bg-stone-50 text-stone-700';
}

function label(value: string) {
  return value.replace(/_/g, ' ');
}

export function AdminPaymentWebhookAlertsPanel({ summary }: { summary: PaymentWebhookAlertSummary }) {
  const cards = [
    ['Alerts', summary.alerts],
    ['Critical', summary.critical],
    ['Warning', summary.warning],
    ['Retryable', summary.retryable]
  ] as const;

  return (
    <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-stone-500">Payments</p>
          <h2 className="mt-1 text-2xl font-bold text-stone-950">Webhook alerts</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">Read-only operator view for failed, pending, missing-match, and settlement-mismatch payment webhook events.</p>
        </div>
        <p className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-700">{summary.total} recent events</p>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-4">
        {cards.map(([name, value]) => (
          <div key={name} className="rounded-lg border border-stone-200 bg-stone-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">{name}</p>
            <p className="mt-2 text-2xl font-bold text-stone-950">{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-3">
        {summary.recent.length ? summary.recent.map((plan, index) => (
          <article key={`${plan.provider}-${plan.eventId ?? index}`} className={`rounded-lg border p-4 ${severityClass(plan.severity)}`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-bold capitalize">{label(plan.reason)}</p>
                <p className="mt-1 text-sm opacity-80">{plan.message}</p>
              </div>
              <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.12em]">
                <span>{plan.provider}</span>
                <span>{plan.severity}</span>
                {plan.retryable ? <span>Retryable</span> : null}
              </div>
            </div>
            <dl className="mt-3 grid gap-2 text-xs md:grid-cols-4">
              <div><dt className="font-semibold uppercase tracking-[0.12em] opacity-70">Order</dt><dd className="mt-1 font-mono">{plan.orderNumber ?? '—'}</dd></div>
              <div><dt className="font-semibold uppercase tracking-[0.12em] opacity-70">Attempt</dt><dd className="mt-1 font-mono">{plan.paymentAttemptId ?? '—'}</dd></div>
              <div><dt className="font-semibold uppercase tracking-[0.12em] opacity-70">Reference</dt><dd className="mt-1 font-mono">{plan.providerReference ?? '—'}</dd></div>
              <div><dt className="font-semibold uppercase tracking-[0.12em] opacity-70">Event</dt><dd className="mt-1 font-mono">{plan.eventId ?? '—'}</dd></div>
            </dl>
          </article>
        )) : <p className="rounded-lg border border-stone-200 bg-stone-50 p-6 text-center text-sm text-stone-500">No payment webhook alerts are currently available.</p>}
      </div>
    </section>
  );
}
