import type { PaymentOperationHistoryView } from '@/lib/checkout/payment-operation-history-view';

function toneClass(tone: string) {
  if (tone === 'success') return 'border-emerald-200 bg-emerald-50 text-emerald-950';
  if (tone === 'warning') return 'border-amber-200 bg-amber-50 text-amber-950';
  if (tone === 'danger') return 'border-red-200 bg-red-50 text-red-950';
  return 'border-stone-200 bg-stone-50 text-stone-900';
}

export function AdminPaymentOperationHistoryPanel({ view }: { view: PaymentOperationHistoryView }) {
  return (
    <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-stone-500">Payments</p>
          <h2 className="mt-1 text-2xl font-bold text-stone-950">{view.heading}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">{view.summary}</p>
        </div>
        <div className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-stone-700">
          Read-only
        </div>
      </div>

      <dl className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {view.summaryRows.map((summary) => (
          <div key={summary.label} className="rounded-lg border border-stone-200 bg-stone-50 p-3">
            <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">{summary.label}</dt>
            <dd className="mt-2 break-words text-lg font-bold text-stone-950">{summary.value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-4 flex flex-wrap gap-2">
        {view.filterLabels.map((filter) => (
          <span key={filter.label} className="rounded-full border border-stone-200 bg-white px-3 py-1 text-xs font-semibold text-stone-700">
            {filter.label}: {filter.value}
          </span>
        ))}
      </div>

      <dl className="mt-4 grid gap-3 md:grid-cols-3">
        {view.facetLabels.map((facet) => (
          <div key={facet.label} className="rounded-lg border border-stone-200 bg-white p-3">
            <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">{facet.label}</dt>
            <dd className="mt-2 break-words text-sm font-semibold text-stone-900">{facet.value}</dd>
          </div>
        ))}
      </dl>

      {view.status === 'empty' ? (
        <div className="mt-5 rounded-lg border border-dashed border-stone-300 bg-stone-50 p-4 text-sm text-stone-600">
          No payment operation records have been persisted for this order. This read-only panel only displays rows after the target environment confirms the migration gate.
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          {view.rows.map((row) => (
            <article key={row.id} className="rounded-lg border border-stone-200 bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-stone-950">{row.title}</h3>
                  <p className="mt-1 text-sm text-stone-600">{row.providerLabel} · {row.referenceLabel}</p>
                  <p className="mt-1 text-xs text-stone-500">Requested by {row.requestedByLabel}</p>
                </div>
                <span className={`rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] ${toneClass(row.tone)}`}>
                  {row.statusLabel}
                </span>
              </div>

              <dl className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {row.detailRows.map((detail) => (
                  <div key={detail.label} className="rounded-lg border border-stone-200 bg-stone-50 p-3">
                    <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">{detail.label}</dt>
                    <dd className="mt-2 break-words text-sm font-semibold text-stone-900">{detail.value}</dd>
                  </div>
                ))}
              </dl>

              <p className="mt-4 text-xs leading-5 text-stone-500">
                Created {row.createdAtLabel}. Last updated {row.updatedAtLabel}. This panel does not render refund or void execution controls.
              </p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
