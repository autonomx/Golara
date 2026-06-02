import type { WebhookEventLogSummary } from '@/lib/settings/webhook-event-log';

function formatDate(value?: Date | null) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(value);
}

function StatusBadge({ status }: { status: string }) {
  const attention = ['failed', 'retry_scheduled', 'abandoned'].includes(status);
  const delivered = status === 'delivered';
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-[0.12em] ${delivered ? 'bg-emerald-50 text-emerald-700' : attention ? 'bg-amber-50 text-amber-800' : 'bg-stone-100 text-stone-700'}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}

export function AdminWebhookEventLogPanel({ summary, databaseReady }: { summary: WebhookEventLogSummary; databaseReady: boolean }) {
  return (
    <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-stone-500">Integrations</p>
          <h2 className="mt-1 text-2xl font-bold text-stone-950">Webhook event log</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">Read-only delivery diagnostics for outgoing webhook attempts. This panel stores payload digests and delivery metadata, not full payload bodies or secrets.</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] ${summary.needsAttention ? 'bg-amber-50 text-amber-800' : 'bg-emerald-50 text-emerald-700'}`}>
          {summary.needsAttention ? `${summary.needsAttention} need attention` : 'clear'}
        </span>
      </div>
      {!databaseReady ? (
        <div className="mt-5 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">Database settings are unavailable until DATABASE_URL is configured. Webhook event history is hidden.</div>
      ) : null}
      <div className="mt-6 grid gap-3 md:grid-cols-6">
        <div className="rounded-md border border-stone-200 bg-stone-50 p-3 text-sm"><p className="font-bold text-stone-950">{summary.total}</p><p className="text-stone-600">Recent</p></div>
        <div className="rounded-md border border-stone-200 bg-stone-50 p-3 text-sm"><p className="font-bold text-stone-950">{summary.queued}</p><p className="text-stone-600">Queued</p></div>
        <div className="rounded-md border border-stone-200 bg-stone-50 p-3 text-sm"><p className="font-bold text-stone-950">{summary.delivered}</p><p className="text-stone-600">Delivered</p></div>
        <div className="rounded-md border border-stone-200 bg-stone-50 p-3 text-sm"><p className="font-bold text-stone-950">{summary.failed}</p><p className="text-stone-600">Failed</p></div>
        <div className="rounded-md border border-stone-200 bg-stone-50 p-3 text-sm"><p className="font-bold text-stone-950">{summary.retryScheduled}</p><p className="text-stone-600">Retry</p></div>
        <div className="rounded-md border border-stone-200 bg-stone-50 p-3 text-sm"><p className="font-bold text-stone-950">{summary.abandoned}</p><p className="text-stone-600">Abandoned</p></div>
      </div>
      <div className="mt-6 overflow-x-auto rounded-md border border-stone-200">
        <table className="min-w-full divide-y divide-stone-200 text-left text-sm">
          <thead className="bg-stone-50 text-xs font-bold uppercase tracking-[0.12em] text-stone-500">
            <tr>
              <th className="px-3 py-2">Event</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Attempts</th>
              <th className="px-3 py-2">HTTP</th>
              <th className="px-3 py-2">Digest</th>
              <th className="px-3 py-2">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 bg-white">
            {summary.recent.length ? summary.recent.map((record) => (
              <tr key={record.id}>
                <td className="px-3 py-3 align-top">
                  <p className="font-semibold text-stone-900">{record.eventName}</p>
                  <p className="max-w-xs truncate text-xs text-stone-500">{record.targetUrl}</p>
                  {record.lastError ? <p className="mt-1 max-w-xs truncate text-xs text-amber-800">{record.lastError}</p> : null}
                </td>
                <td className="px-3 py-3 align-top"><StatusBadge status={record.status} /></td>
                <td className="px-3 py-3 align-top text-stone-700">{record.attemptCount}</td>
                <td className="px-3 py-3 align-top text-stone-700">{record.lastStatusCode ?? '—'}</td>
                <td className="px-3 py-3 align-top font-mono text-xs text-stone-600">{record.payloadDigest.slice(0, 12)}</td>
                <td className="px-3 py-3 align-top text-stone-700">{formatDate(record.createdAt)}</td>
              </tr>
            )) : (
              <tr>
                <td className="px-3 py-6 text-center text-sm text-stone-500" colSpan={6}>No webhook event logs yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
