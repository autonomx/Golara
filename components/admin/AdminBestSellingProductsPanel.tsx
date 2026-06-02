import { formatBestSellingRevenue, type BestSellingProductsSummary } from '@/lib/analytics/best-selling-products';

export function AdminBestSellingProductsPanel({ summary }: { summary: BestSellingProductsSummary }) {
  const primaryCurrency = summary.products[0]?.currency ?? 'CAD';

  return (
    <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-stone-500">Analytics</p>
          <h2 className="mt-1 text-2xl font-bold text-stone-950">Best-selling products</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">Sales-derived product leaderboard from recent checkout line items, excluding cancelled, refunded, and voided orders.</p>
        </div>
        <span className="rounded-full bg-olive/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-olive">
          {summary.totalQuantitySold} units sold
        </span>
      </div>
      <div className="mt-6 grid gap-3 md:grid-cols-3">
        <div className="rounded-md border border-stone-200 bg-stone-50 p-3 text-sm">
          <p className="font-bold text-stone-950">{summary.products.length}</p>
          <p className="text-stone-600">Ranked products</p>
        </div>
        <div className="rounded-md border border-stone-200 bg-stone-50 p-3 text-sm">
          <p className="font-bold text-stone-950">{summary.recentQuantitySold}</p>
          <p className="text-stone-600">Recent units</p>
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-stone-400">last 30 days</p>
        </div>
        <div className="rounded-md border border-stone-200 bg-stone-50 p-3 text-sm">
          <p className="font-bold text-stone-950">{formatBestSellingRevenue(summary.totalRevenueCents, primaryCurrency)}</p>
          <p className="text-stone-600">Leaderboard revenue</p>
        </div>
      </div>
      {summary.products.length ? (
        <div className="mt-6 overflow-hidden rounded-md border border-stone-200">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-stone-50 text-xs font-bold uppercase tracking-[0.14em] text-stone-500">
              <tr>
                <th className="px-3 py-2">Product</th>
                <th className="px-3 py-2">Units</th>
                <th className="px-3 py-2">Orders</th>
                <th className="px-3 py-2">Revenue</th>
                <th className="px-3 py-2">Recent</th>
              </tr>
            </thead>
            <tbody>
              {summary.products.map((row) => (
                <tr key={row.productId} className="border-t border-stone-200">
                  <td className="px-3 py-2">
                    <p className="font-semibold text-stone-950">{row.productTitle}</p>
                    <p className="text-xs text-stone-500">{row.productCode ?? 'No code'}{row.variantNames.length ? ` · ${row.variantNames.join(', ')}` : ''}</p>
                  </td>
                  <td className="px-3 py-2 text-stone-700">{row.quantitySold}</td>
                  <td className="px-3 py-2 text-stone-700">{row.orderCount}</td>
                  <td className="px-3 py-2 text-stone-700">{formatBestSellingRevenue(row.revenueCents, row.currency)}</td>
                  <td className="px-3 py-2 text-stone-700">{row.recentQuantitySold}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="mt-6 rounded-md border border-dashed border-stone-300 bg-stone-50 p-4 text-sm text-stone-600">
          No eligible checkout line items are available yet, so best-selling products will appear after completed sales data exists.
        </div>
      )}
    </section>
  );
}
