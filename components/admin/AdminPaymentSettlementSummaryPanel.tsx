import type { PaymentSettlementSummary } from '@/lib/checkout/payment-settlement-service';

function formatMoney(cents?: number, currency?: string) {
  if (cents === undefined) return '—';
  return `${currency ?? ''} ${(cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`.trim();
}

function statusLabel(status: string) {
  return status.replace(/_/g, ' ');
}

export function AdminPaymentSettlementSummaryPanel({ summary }: { summary: PaymentSettlementSummary }) {
  const cards = [
    ['Settled', summary.settled],
    ['Amount mismatch', summary.amountMismatch],
    ['Currency mismatch', summary.currencyMismatch],
    ['Pending', summary.pending],
    ['Needs attention', summary.needsAttention]
  ] as const;

  return (
    <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-stone-500">Payments</p>
          <h2 className="mt-1 text-2xl font-bold text-stone-950">Settlement reconciliation</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">Read-only summary of recent payment webhook events compared with checkout order totals and currencies.</p>
        </div>
        <p className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-700">{summary.total} recent events</p>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-5">
        {cards.map(([label, value]) => (
          <div key={label} className="rounded-lg border border-stone-200 bg-stone-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">{label}</p>
            <p className="mt-2 text-2xl font-bold text-stone-950">{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 overflow-hidden rounded-lg border border-stone-200">
        <table className="min-w-full divide-y divide-stone-200 text-sm">
          <thead className="bg-stone-50 text-left text-xs font-bold uppercase tracking-[0.14em] text-stone-500">
            <tr>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Provider</th>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Expected</th>
              <th className="px-4 py-3">Webhook</th>
              <th className="px-4 py-3">Reference</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 bg-white">
            {summary.recent.length ? summary.recent.map((plan, index) => (
              <tr key={`${plan.provider}-${plan.providerReference ?? index}`}>
                <td className="px-4 py-3 font-semibold capitalize text-stone-900">{statusLabel(plan.status)}</td>
                <td className="px-4 py-3 text-stone-700">{plan.provider}</td>
                <td className="px-4 py-3 text-stone-700">{plan.orderNumber ?? '—'}</td>
                <td className="px-4 py-3 text-stone-700">{formatMoney(plan.expectedAmountCents, plan.expectedCurrency)}</td>
                <td className="px-4 py-3 text-stone-700">{formatMoney(plan.actualAmountCents, plan.actualCurrency)}</td>
                <td className="px-4 py-3 font-mono text-xs text-stone-500">{plan.providerReference ?? '—'}</td>
              </tr>
            )) : (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-stone-500">No payment webhook events have been recorded yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
