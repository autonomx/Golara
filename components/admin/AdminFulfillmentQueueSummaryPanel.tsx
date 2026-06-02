import type { FulfillmentQueueSummary } from '@/lib/analytics/fulfillment-queue-summary';

function Metric({ label, value, detail }: { label: string; value: string | number; detail?: string }) {
  return (
    <div className="rounded-md border border-stone-200 bg-stone-50 p-3 text-sm">
      <p className="font-bold text-stone-950">{value}</p>
      <p className="text-stone-600">{label}</p>
      {detail ? <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-stone-400">{detail}</p> : null}
    </div>
  );
}

export function AdminFulfillmentQueueSummaryPanel({ summary }: { summary: FulfillmentQueueSummary }) {
  return (
    <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-stone-500">Analytics</p>
          <h2 className="mt-1 text-2xl font-bold text-stone-950">Fulfillment queue</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">Open fulfillment work for non-cancelled orders that are not fulfilled, delivered, or completed.</p>
        </div>
        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-amber-800">
          {summary.queueCount} queued
        </span>
      </div>
      <div className="mt-6 grid gap-3 md:grid-cols-5">
        <Metric label="Queued orders" value={summary.queueCount} />
        <Metric label="Overdue" value={summary.overdueCount} detail="2+ days old" />
        <Metric label="New today" value={summary.dueTodayCount} />
        <Metric label="In progress" value={summary.inProgressCount} />
        <Metric label="Ready/scheduled" value={summary.readyOrScheduledCount} />
      </div>
      {summary.queuedOrders.length ? (
        <div className="mt-6 overflow-hidden rounded-md border border-stone-200">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-stone-50 text-xs font-bold uppercase tracking-[0.14em] text-stone-500">
              <tr>
                <th className="px-3 py-2">Order</th>
                <th className="px-3 py-2">Customer</th>
                <th className="px-3 py-2">Fulfillment</th>
                <th className="px-3 py-2">Items</th>
                <th className="px-3 py-2">Age</th>
              </tr>
            </thead>
            <tbody>
              {summary.queuedOrders.map((row) => (
                <tr key={row.id} className="border-t border-stone-200">
                  <td className="px-3 py-2">
                    <p className="font-semibold text-stone-950">{row.orderNumber}</p>
                    <p className="text-xs text-stone-500">{row.orderStatus} · {row.checkoutMode}</p>
                  </td>
                  <td className="px-3 py-2 text-stone-700">{row.customerLabel}</td>
                  <td className="px-3 py-2">
                    <p className="font-semibold text-stone-900">{row.fulfillmentStatus}</p>
                    <p className="text-xs text-stone-500">{row.priority}</p>
                  </td>
                  <td className="px-3 py-2 text-stone-700">{row.itemCount}</td>
                  <td className="px-3 py-2 text-stone-700">{row.ageDays}d</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="mt-6 rounded-md border border-dashed border-stone-300 bg-stone-50 p-4 text-sm text-stone-600">
          No open fulfillment queue items need attention right now.
        </div>
      )}
    </section>
  );
}
