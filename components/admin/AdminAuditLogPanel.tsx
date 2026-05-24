import type { AdminAuditLogEntry } from '@/lib/catalog';

function formatDate(value: Date) {
  return new Intl.DateTimeFormat('en-CA', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(value);
}

export function AdminAuditLogPanel({ logs }: { logs: AdminAuditLogEntry[] }) {
  return (
    <section id="audit-log" className="scroll-mt-8 rounded-[2rem] border border-rosewood/10 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-olive">Admin audit</p>
        <h2 className="mt-2 font-display text-4xl text-rosewood">Recent staff activity</h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-600">
          A read-only view of the latest CMS and inquiry mutations. Future auth work can attach staff identities and filtering.
        </p>
      </div>

      {logs.length === 0 ? (
        <div className="rounded-3xl border border-rosewood/10 bg-cream p-5 text-sm text-stone-700">
          No audit events found yet. New CMS and inquiry writes will appear here after the latest database schema is pushed.
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-rosewood/10">
          <table className="min-w-full divide-y divide-rosewood/10 text-left text-sm">
            <thead className="bg-cream text-xs uppercase tracking-[0.18em] text-rosewood/60">
              <tr>
                <th className="px-4 py-3 font-semibold">Time</th>
                <th className="px-4 py-3 font-semibold">Action</th>
                <th className="px-4 py-3 font-semibold">Entity</th>
                <th className="px-4 py-3 font-semibold">Summary</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rosewood/10 bg-white text-stone-700">
              {logs.map((log) => (
                <tr key={log.id}>
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-stone-500">{formatDate(log.createdAt)}</td>
                  <td className="px-4 py-3 font-semibold text-rosewood">{log.action}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full border border-rosewood/15 bg-cream px-3 py-1 text-xs font-semibold text-rosewood">
                      {log.entity}
                    </span>
                    {log.entityId ? <p className="mt-1 max-w-48 truncate text-xs text-stone-400">{log.entityId}</p> : null}
                  </td>
                  <td className="px-4 py-3">{log.summary}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
