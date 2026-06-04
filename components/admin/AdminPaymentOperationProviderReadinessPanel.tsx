import type { PaymentOperationProviderReadiness, PaymentOperationProviderReadinessSummary } from '@/lib/checkout/payment-operation-provider-readiness';

function statusLabel(status: PaymentOperationProviderReadiness['status']) {
  return status.replace(/_/g, ' ');
}

function statusClass(status: PaymentOperationProviderReadiness['status']) {
  if (status === 'ready') return 'bg-emerald-50 text-emerald-700';
  if (status === 'needs_operator_evidence') return 'bg-amber-50 text-amber-800';
  if (status === 'manual_review') return 'bg-sky-50 text-sky-800';
  return 'bg-rose-50 text-rose-700';
}

export function AdminPaymentOperationProviderReadinessPanel({ summary }: { summary: PaymentOperationProviderReadinessSummary }) {
  return (
    <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-stone-500">Payment operations</p>
          <h2 className="mt-1 text-2xl font-bold text-stone-950">Refund / void provider readiness</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">
            Read-only diagnostics for provider-operation readiness. This panel exposes credential names, endpoint evidence state, and validation evidence state without secrets, provider calls, or execution controls.
          </p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] ${summary.ready ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-800'}`}>
          {summary.ready ? 'ready' : `${summary.needsOperatorEvidence + summary.manualReview + summary.unavailable} need review`}
        </span>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-5">
        <div className="rounded-md border border-stone-200 bg-stone-50 p-3 text-sm"><p className="font-bold text-stone-950">{summary.total}</p><p className="text-stone-600">Providers</p></div>
        <div className="rounded-md border border-stone-200 bg-stone-50 p-3 text-sm"><p className="font-bold text-stone-950">{summary.readyCount}</p><p className="text-stone-600">Ready</p></div>
        <div className="rounded-md border border-stone-200 bg-stone-50 p-3 text-sm"><p className="font-bold text-stone-950">{summary.needsOperatorEvidence}</p><p className="text-stone-600">Evidence needed</p></div>
        <div className="rounded-md border border-stone-200 bg-stone-50 p-3 text-sm"><p className="font-bold text-stone-950">{summary.manualReview}</p><p className="text-stone-600">Manual review</p></div>
        <div className="rounded-md border border-stone-200 bg-stone-50 p-3 text-sm"><p className="font-bold text-stone-950">{summary.unavailable}</p><p className="text-stone-600">Unavailable</p></div>
      </div>

      <div className="mt-6 grid gap-3">
        {summary.providers.map((provider) => (
          <div key={provider.provider} className="rounded-md border border-stone-200 bg-stone-50 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-stone-950">{provider.provider}</h3>
                <p className="mt-1 text-sm text-stone-600">Supported operations: {provider.supportedOperations.length ? provider.supportedOperations.join(', ') : 'none'}</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] ${statusClass(provider.status)}`}>
                {statusLabel(provider.status)}
              </span>
            </div>
            <div className="mt-3 grid gap-3 text-sm text-stone-700 md:grid-cols-3">
              <p><span className="font-semibold text-stone-900">Execution:</span> disabled</p>
              <p><span className="font-semibold text-stone-900">Credentials:</span> {provider.credentialEnvironmentVariables.length ? provider.credentialEnvironmentVariables.join(', ') : 'none'}</p>
              <p><span className="font-semibold text-stone-900">Issues:</span> {provider.blockers.length + provider.warnings.length}</p>
            </div>
            <div className="mt-3 grid gap-2 text-sm text-stone-700">
              {provider.checks.map((check) => (
                <p key={check.key}><span className="font-semibold text-stone-900">{check.label}:</span> {check.status.replace(/_/g, ' ')} — {check.detail}</p>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
