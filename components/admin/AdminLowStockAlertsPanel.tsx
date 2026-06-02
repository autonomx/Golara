import type { LowStockAlertsSummary } from '@/lib/analytics/low-stock-alerts';

function Metric({ label, value, detail }: { label: string; value: string | number; detail?: string }) {
  return (
    <div className="rounded-md border border-stone-200 bg-stone-50 p-3 text-sm">
      <p className="font-bold text-stone-950">{value}</p>
      <p className="text-stone-600">{label}</p>
      {detail ? <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-stone-400">{detail}</p> : null}
    </div>
  );
}

export function AdminLowStockAlertsPanel({ summary }: { summary: LowStockAlertsSummary }) {
  const alertCount = summary.lowStockVariants + summary.outOfStockVariants;

  return (
    <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-stone-500">Analytics</p>
          <h2 className="mt-1 text-2xl font-bold text-stone-950">Low-stock alerts</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">Operational inventory alerts for active tracked variants that are out of stock or at/below their low-stock threshold.</p>
        </div>
        <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-rose-700">
          {alertCount} alerts
        </span>
      </div>
      <div className="mt-6 grid gap-3 md:grid-cols-5">
        <Metric label="Tracked variants" value={summary.trackedVariants} />
        <Metric label="Out of stock" value={summary.outOfStockVariants} />
        <Metric label="Low stock" value={summary.lowStockVariants} />
        <Metric label="Untracked" value={summary.untrackedVariants} />
        <Metric label="Inactive" value={summary.inactiveVariants} />
      </div>
      {summary.alerts.length ? (
        <div className="mt-6 overflow-hidden rounded-md border border-stone-200">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-stone-50 text-xs font-bold uppercase tracking-[0.14em] text-stone-500">
              <tr>
                <th className="px-3 py-2">Variant</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">On hand</th>
                <th className="px-3 py-2">Threshold</th>
                <th className="px-3 py-2">Can sell</th>
              </tr>
            </thead>
            <tbody>
              {summary.alerts.map((row) => (
                <tr key={row.variantId} className="border-t border-stone-200">
                  <td className="px-3 py-2">
                    <p className="font-semibold text-stone-950">{row.productTitle} / {row.variantName}</p>
                    <p className="text-xs text-stone-500">{row.productCode} · {row.sku}</p>
                  </td>
                  <td className="px-3 py-2">
                    <p className="font-semibold text-stone-900">{row.statusLabel}</p>
                    <p className="text-xs text-stone-500">{row.detail}</p>
                  </td>
                  <td className="px-3 py-2 text-stone-700">{row.stockQuantity}</td>
                  <td className="px-3 py-2 text-stone-700">{row.lowStockThreshold ?? 'Not set'}</td>
                  <td className="px-3 py-2 text-stone-700">{row.canSell ? 'Yes' : 'No'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="mt-6 rounded-md border border-dashed border-stone-300 bg-stone-50 p-4 text-sm text-stone-600">
          No low-stock or out-of-stock tracked variants need attention right now.
        </div>
      )}
    </section>
  );
}
