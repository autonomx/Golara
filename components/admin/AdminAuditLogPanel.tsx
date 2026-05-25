import type { AdminAuditLogEntry } from '@/lib/catalog';
import type { AdminAuditLogFilters } from '@/lib/cms/catalog-repository';

const filterInputClass = 'rounded-2xl border border-rosewood/15 bg-white px-4 py-3 text-stone-800 outline-none transition focus:border-rosewood focus-visible:ring-4 focus-visible:ring-olive/20';
const primaryButtonClass = 'rounded-full bg-rosewood px-5 py-2 text-sm font-semibold text-white outline-none transition focus-visible:ring-4 focus-visible:ring-olive/30';
const secondaryLinkClass = 'rounded-full border border-rosewood/20 px-5 py-2 text-sm font-semibold text-rosewood outline-none transition focus-visible:ring-4 focus-visible:ring-olive/20';

function formatDate(value: Date) {
  return new Intl.DateTimeFormat('en-CA', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(value);
}

function Field({ label, name, defaultValue, placeholder }: { label: string; name: string; defaultValue?: string; placeholder?: string }) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-rosewood">
      {label}
      <input
        className={filterInputClass}
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
      />
    </label>
  );
}

export function AdminAuditLogPanel({ logs, filters }: { logs: AdminAuditLogEntry[]; filters: AdminAuditLogFilters }) {
  const hasFilters = Boolean(filters.action || filters.entity || filters.actor || filters.search);

  return (
    <section id="audit-log" className="scroll-mt-8 rounded-[2rem] border border-rosewood/10 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-olive">Admin audit</p>
        <h2 className="mt-2 font-display text-4xl text-rosewood">Recent staff activity</h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-600">
          A read-only view of CMS and inquiry mutations with staff attribution from the current admin identity seam.
        </p>
      </div>

      <form className="mb-6 grid gap-4 rounded-3xl border border-rosewood/10 bg-cream p-5 md:grid-cols-4" action="/admin#audit-log">
        <Field label="Action" name="auditAction" defaultValue={filters.action} placeholder="product.update" />
        <Field label="Entity" name="auditEntity" defaultValue={filters.entity} placeholder="product" />
        <Field label="Actor" name="auditActor" defaultValue={filters.actor} placeholder="Admin, owner, email" />
        <Field label="Search" name="auditSearch" defaultValue={filters.search} placeholder="summary or ID" />
        <div className="flex flex-wrap gap-3 md:col-span-4">
          <button className={primaryButtonClass} type="submit">Filter audit log</button>
          {hasFilters ? <a className={secondaryLinkClass} href="/admin#audit-log">Clear filters</a> : null}
        </div>
      </form>

      {logs.length === 0 ? (
        <div className="rounded-3xl border border-rosewood/10 bg-cream p-5 text-sm text-stone-700">
          {hasFilters ? 'No audit events match the current filters.' : 'No audit events found yet. New CMS and inquiry writes will appear here after the latest database schema is pushed.'}
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-rosewood/10">
          <table className="min-w-full divide-y divide-rosewood/10 text-left text-sm">
            <thead className="bg-cream text-xs uppercase tracking-[0.18em] text-rosewood/60">
              <tr>
                <th className="px-4 py-3 font-semibold">Time</th>
                <th className="px-4 py-3 font-semibold">Actor</th>
                <th className="px-4 py-3 font-semibold">Action</th>
                <th className="px-4 py-3 font-semibold">Entity</th>
                <th className="px-4 py-3 font-semibold">Summary</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rosewood/10 bg-white text-stone-700">
              {logs.map((log) => (
                <tr key={log.id}>
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-stone-500">{formatDate(log.createdAt)}</td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-rosewood">{log.actorLabel}</p>
                    <p className="text-xs text-stone-500">{log.actorEmail || log.actorRole} · {log.actorProvider}</p>
                  </td>
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
