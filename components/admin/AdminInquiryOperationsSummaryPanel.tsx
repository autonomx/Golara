import type { InquiryOperationsSummary } from '@/lib/analytics/inquiry-operations-summary';

function Metric({ label, value, detail }: { label: string; value: string | number; detail?: string }) {
  return (
    <div className="rounded-md border border-stone-200 bg-stone-50 p-3 text-sm">
      <p className="font-bold text-stone-950">{value}</p>
      <p className="text-stone-600">{label}</p>
      {detail ? <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-stone-400">{detail}</p> : null}
    </div>
  );
}

export function AdminInquiryOperationsSummaryPanel({ summary }: { summary: InquiryOperationsSummary }) {
  return (
    <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-stone-500">Analytics</p>
          <h2 className="mt-1 text-2xl font-bold text-stone-950">Inquiry operations summary</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">Daily support snapshot for inquiry volume, assignment load, recent requests, and resolution progress. This is not an order conversion metric.</p>
        </div>
        <span className="rounded-full bg-olive/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-olive">
          {summary.resolutionRatePercent}% resolved
        </span>
      </div>
      <div className="mt-6 grid gap-3 md:grid-cols-4">
        <Metric label="Total inquiries" value={summary.totalInquiries} />
        <Metric label="New inquiries" value={summary.newInquiries} />
        <Metric label="Open inquiries" value={summary.openInquiries} />
        <Metric label="Recent inquiries" value={summary.recentInquiries} detail="last 30 days" />
      </div>
      <div className="mt-3 grid gap-3 md:grid-cols-4">
        <Metric label="Assigned" value={summary.assignedInquiries} />
        <Metric label="Unassigned" value={summary.unassignedInquiries} />
        <Metric label="With follow-up" value={summary.followUpInquiries} />
        <Metric label="Closed/resolved" value={summary.closedInquiries} />
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {summary.byStatus.length ? (
          <div className="overflow-hidden rounded-md border border-stone-200">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-stone-50 text-xs font-bold uppercase tracking-[0.14em] text-stone-500">
                <tr>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Inquiries</th>
                </tr>
              </thead>
              <tbody>
                {summary.byStatus.map((row) => (
                  <tr key={row.status} className="border-t border-stone-200">
                    <td className="px-3 py-2 font-semibold text-stone-950">{row.status}</td>
                    <td className="px-3 py-2 text-stone-700">{row.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
        {summary.bySource.length ? (
          <div className="overflow-hidden rounded-md border border-stone-200">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-stone-50 text-xs font-bold uppercase tracking-[0.14em] text-stone-500">
                <tr>
                  <th className="px-3 py-2">Source</th>
                  <th className="px-3 py-2">Inquiries</th>
                </tr>
              </thead>
              <tbody>
                {summary.bySource.map((row) => (
                  <tr key={row.source} className="border-t border-stone-200">
                    <td className="px-3 py-2 font-semibold text-stone-950">{row.source}</td>
                    <td className="px-3 py-2 text-stone-700">{row.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </section>
  );
}
