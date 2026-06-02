import { AdminBestSellingProductsPanel } from '@/components/admin/AdminBestSellingProductsPanel';
import { AdminFulfillmentQueueSummaryPanel } from '@/components/admin/AdminFulfillmentQueueSummaryPanel';
import { AdminInquiryOperationsSummaryPanel } from '@/components/admin/AdminInquiryOperationsSummaryPanel';
import { AdminLowStockAlertsPanel } from '@/components/admin/AdminLowStockAlertsPanel';
import { AdminRecentActivitySummaryPanel } from '@/components/admin/AdminRecentActivitySummaryPanel';
import { bestSellingProductsService } from '@/lib/analytics/best-selling-products';
import { fulfillmentQueueSummaryService } from '@/lib/analytics/fulfillment-queue-summary';
import { inquiryOperationsSummaryService } from '@/lib/analytics/inquiry-operations-summary';
import { lowStockAlertsService } from '@/lib/analytics/low-stock-alerts';
import { formatRevenueCents, type OrderRevenueSummary } from '@/lib/analytics/order-revenue-summary';
import { recentActivitySummaryService } from '@/lib/analytics/recent-activity-summary';

function Metric({ label, value, detail }: { label: string; value: string | number; detail?: string }) {
  return (
    <div className="rounded-md border border-stone-200 bg-stone-50 p-3 text-sm">
      <p className="font-bold text-stone-950">{value}</p>
      <p className="text-stone-600">{label}</p>
      {detail ? <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-stone-400">{detail}</p> : null}
    </div>
  );
}

export async function AdminOrderRevenueSummaryPanel({ summary }: { summary: OrderRevenueSummary }) {
  const primaryCurrency = summary.primaryCurrency;
  const [inquiryOperationsSummary, bestSellingProductsSummary, lowStockAlertsSummary, fulfillmentQueueSummary, recentActivitySummary] = await Promise.all([
    inquiryOperationsSummaryService.summary(),
    bestSellingProductsService.summary(),
    lowStockAlertsService.summary(),
    fulfillmentQueueSummaryService.summary(),
    recentActivitySummaryService.summary()
  ]);

  return (
    <>
      <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-stone-500">Analytics</p>
            <h2 className="mt-1 text-2xl font-bold text-stone-950">Order count and revenue</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">Daily operations snapshot for order volume, eligible revenue, recent activity, and open order load.</p>
          </div>
          <span className="rounded-full bg-olive/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-olive">
            {primaryCurrency}
          </span>
        </div>
        <div className="mt-6 grid gap-3 md:grid-cols-4">
          <Metric label="Total orders" value={summary.totalOrders} />
          <Metric label="Revenue" value={formatRevenueCents(summary.totalRevenueCents, primaryCurrency)} detail="excludes cancelled/refunded" />
          <Metric label="Average order value" value={formatRevenueCents(summary.averageOrderValueCents, primaryCurrency)} />
          <Metric label="Open orders" value={summary.openOrders} />
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-4">
          <Metric label="Recent orders" value={summary.recentOrders} detail="last 30 days" />
          <Metric label="Recent revenue" value={formatRevenueCents(summary.recentRevenueCents, primaryCurrency)} detail="last 30 days" />
          <Metric label="Completed" value={summary.completedOrders} />
          <Metric label="Cancelled" value={summary.cancelledOrders} />
        </div>
        {summary.byCurrency.length ? (
          <div className="mt-6 overflow-hidden rounded-md border border-stone-200">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-stone-50 text-xs font-bold uppercase tracking-[0.14em] text-stone-500">
                <tr>
                  <th className="px-3 py-2">Currency</th>
                  <th className="px-3 py-2">Orders</th>
                  <th className="px-3 py-2">Revenue</th>
                  <th className="px-3 py-2">AOV</th>
                </tr>
              </thead>
              <tbody>
                {summary.byCurrency.map((row) => (
                  <tr key={row.currency} className="border-t border-stone-200">
                    <td className="px-3 py-2 font-semibold text-stone-950">{row.currency}</td>
                    <td className="px-3 py-2 text-stone-700">{row.orderCount}</td>
                    <td className="px-3 py-2 text-stone-700">{formatRevenueCents(row.revenueCents, row.currency)}</td>
                    <td className="px-3 py-2 text-stone-700">{formatRevenueCents(row.averageOrderValueCents, row.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>
      <AdminInquiryOperationsSummaryPanel summary={inquiryOperationsSummary} />
      <AdminBestSellingProductsPanel summary={bestSellingProductsSummary} />
      <AdminLowStockAlertsPanel summary={lowStockAlertsSummary} />
      <AdminFulfillmentQueueSummaryPanel summary={fulfillmentQueueSummary} />
      <AdminRecentActivitySummaryPanel summary={recentActivitySummary} />
    </>
  );
}
