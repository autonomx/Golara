import type { PaymentOperationPreviewRouteResult } from '@/lib/checkout/payment-operation-preview-route-core';

function toneClass(tone: PaymentOperationPreviewRouteResult['body']['preview']['tone']) {
  if (tone === 'success') return 'border-emerald-200 bg-emerald-50 text-emerald-950';
  if (tone === 'warning') return 'border-amber-200 bg-amber-50 text-amber-950';
  return 'border-red-200 bg-red-50 text-red-950';
}

function displayLabel(value: string) {
  return value.replace(/_/g, ' ');
}

export function AdminPaymentOperationPreviewPanel({ result }: { result: PaymentOperationPreviewRouteResult }) {
  const preview = result.body.preview;
  const operation = preview.preview.plan.operation;
  const warnings = preview.preview.warnings;

  return (
    <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-stone-500">Payments</p>
          <h2 className="mt-1 text-2xl font-bold text-stone-950">Payment operation preview</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">
            Read-only refund and void preview for operator review before any persistence, provider execution, order mutation, or payment attempt mutation is added.
          </p>
        </div>
        <div className={`rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] ${toneClass(preview.tone)}`}>
          {preview.statusLabel}
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="rounded-lg border border-stone-200 bg-stone-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">Preview summary</p>
          <h3 className="mt-2 text-lg font-bold capitalize text-stone-950">{displayLabel(operation)}</h3>
          <p className="mt-2 text-sm leading-6 text-stone-700">{preview.preview.summary}</p>
          <p className="mt-3 text-sm font-semibold text-stone-900">{preview.preview.nextAction}</p>
          {preview.disabledReason ? <p className="mt-2 text-xs text-stone-500">{preview.disabledReason}</p> : null}
        </div>

        <div className="rounded-lg border border-stone-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">Read-only action</p>
          <p className="mt-2 text-lg font-bold text-stone-950">{preview.actionLabel}</p>
          <p className="mt-2 text-sm leading-6 text-stone-600">This panel does not render a refund or void execution button.</p>
        </div>
      </div>

      <dl className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {preview.detailRows.map((row) => (
          <div key={row.label} className="rounded-lg border border-stone-200 bg-stone-50 p-4">
            <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">{row.label}</dt>
            <dd className="mt-2 break-words text-sm font-semibold text-stone-900">{displayLabel(row.value)}</dd>
          </div>
        ))}
      </dl>

      {warnings.length ? (
        <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-950">
          <p className="text-xs font-bold uppercase tracking-[0.16em]">Preview warnings</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6">
            {warnings.map((warning) => <li key={warning}>{warning}</li>)}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
