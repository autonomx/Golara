import type { ProviderDiagnosticStatus, ProviderDiagnosticsSummary } from '@/lib/settings/provider-diagnostics';

function statusLabel(status: ProviderDiagnosticStatus) {
  return status.replace(/_/g, ' ');
}

function statusClass(status: ProviderDiagnosticStatus) {
  if (status === 'ready') return 'bg-emerald-50 text-emerald-700';
  if (status === 'needs_attention') return 'bg-amber-50 text-amber-800';
  if (status === 'inactive') return 'bg-stone-100 text-stone-700';
  return 'bg-rose-50 text-rose-700';
}

export function AdminProviderDiagnosticsPanel({ summary }: { summary: ProviderDiagnosticsSummary }) {
  return (
    <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-stone-500">Integrations</p>
          <h2 className="mt-1 text-2xl font-bold text-stone-950">Provider diagnostics</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">Unified readiness view for payment, notification, webhook, integration registry, and API token provider foundations.</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] ${summary.ready ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-800'}`}>
          {summary.ready ? 'ready' : `${summary.needsAttention + summary.inactive + summary.notConfigured} need review`}
        </span>
      </div>
      <div className="mt-6 grid gap-3 md:grid-cols-5">
        <div className="rounded-md border border-stone-200 bg-stone-50 p-3 text-sm"><p className="font-bold text-stone-950">{summary.total}</p><p className="text-stone-600">Providers</p></div>
        <div className="rounded-md border border-stone-200 bg-stone-50 p-3 text-sm"><p className="font-bold text-stone-950">{summary.readyCount}</p><p className="text-stone-600">Ready</p></div>
        <div className="rounded-md border border-stone-200 bg-stone-50 p-3 text-sm"><p className="font-bold text-stone-950">{summary.needsAttention}</p><p className="text-stone-600">Attention</p></div>
        <div className="rounded-md border border-stone-200 bg-stone-50 p-3 text-sm"><p className="font-bold text-stone-950">{summary.inactive}</p><p className="text-stone-600">Inactive</p></div>
        <div className="rounded-md border border-stone-200 bg-stone-50 p-3 text-sm"><p className="font-bold text-stone-950">{summary.notConfigured}</p><p className="text-stone-600">Missing config</p></div>
      </div>
      <div className="mt-6 grid gap-3">
        {summary.cards.map((card) => (
          <div key={card.key} className="rounded-md border border-stone-200 bg-stone-50 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-stone-950">{card.label}</h3>
                <p className="mt-1 text-sm text-stone-600">{card.summary}</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] ${statusClass(card.status)}`}>
                {statusLabel(card.status)}
              </span>
            </div>
            <div className="mt-3 grid gap-3 text-sm text-stone-700 md:grid-cols-4">
              <p><span className="font-semibold text-stone-900">Category:</span> {card.category}</p>
              <p><span className="font-semibold text-stone-900">Blockers:</span> {card.blockers}</p>
              <p><span className="font-semibold text-stone-900">Warnings:</span> {card.warnings}</p>
              <p><span className="font-semibold text-stone-900">Env:</span> {card.requiredEnvironmentVariables.length ? card.requiredEnvironmentVariables.join(', ') : 'none'}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
