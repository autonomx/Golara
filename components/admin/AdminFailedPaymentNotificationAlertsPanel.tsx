import type { FailedPaymentNotificationAlertsSummary } from '@/lib/analytics/failed-payment-notification-alerts';

function Metric({ label, value, detail }: { label: string; value: string | number; detail?: string }) {
  return (
    <div className="rounded-md border border-stone-200 bg-stone-50 p-3 text-sm">
      <p className="font-bold text-stone-950">{value}</p>
      <p className="text-stone-600">{label}</p>
      {detail ? <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-stone-400">{detail}</p> : null}
    </div>
  );
}

export function AdminFailedPaymentNotificationAlertsPanel({ summary }: { summary: FailedPaymentNotificationAlertsSummary }) {
  return (
    <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-stone-500">Analytics</p>
          <h2 className="mt-1 text-2xl font-bold text-stone-950">Failed payment and notification alerts</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">Operational alerts for failed payment attempts and failed or retry-scheduled order notifications.</p>
        </div>
        <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-rose-700">
          {summary.totalAlerts} alerts
        </span>
      </div>
      <div className="mt-6 grid gap-3 md:grid-cols-4">
        <Metric label="Failed payments" value={summary.failedPayments} />
        <Metric label="Failed notifications" value={summary.failedNotifications} />
        <Metric label="Retry scheduled" value={summary.retryScheduledNotifications} />
        <Metric label="Alert sources" value={summary.byKind.length} />
      </div>
      {summary.alerts.length ? (
        <div className="mt-6 overflow-hidden rounded-md border border-stone-200">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-stone-50 text-xs font-bold uppercase tracking-[0.14em] text-stone-500">
              <tr>
                <th className="px-3 py-2">Alert</th>
                <th className="px-3 py-2">Order</th>
                <th className="px-3 py-2">Kind</th>
                <th className="px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {summary.alerts.map((row) => (
                <tr key={row.id} className="border-t border-stone-200">
                  <td className="px-3 py-2">
                    <p className="font-semibold text-stone-950">{row.title}</p>
                    <p className="text-xs text-stone-500">{row.detail}</p>
                  </td>
                  <td className="px-3 py-2 text-stone-700">{row.orderNumber}</td>
                  <td className="px-3 py-2 text-stone-700">{row.kind}</td>
                  <td className="px-3 py-2 text-stone-700">{row.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="mt-6 rounded-md border border-dashed border-stone-300 bg-stone-50 p-4 text-sm text-stone-600">
          No failed payment attempts or failed/retry-scheduled notifications need attention right now.
        </div>
      )}
    </section>
  );
}
