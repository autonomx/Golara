import type { CustomerAuthEventSummary, CustomerAuthEventType } from '@/lib/customers/customer-auth-event-summary';

const EVENT_LABELS: Record<CustomerAuthEventType, string> = {
  otp_request_allowed: 'Requests allowed',
  otp_request_blocked: 'Requests blocked',
  otp_delivery_failed: 'Delivery failures',
  otp_verify_failed: 'Verify failures',
  otp_verify_blocked: 'Verify blocked',
  otp_verify_success: 'Verify successes'
};

function shortHash(hash: string) {
  if (hash.length <= 16) return hash;
  return `${hash.slice(0, 10)}…${hash.slice(-6)}`;
}

function HashTable({ title, rows }: { title: string; rows: Array<{ hash: string; count: number }> }) {
  return (
    <div className="rounded-3xl border border-rosewood/10 bg-cream p-5">
      <h3 className="font-display text-2xl text-rosewood">{title}</h3>
      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-stone-600">No recent hashed activity.</p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-[0.16em] text-stone-500">
              <tr>
                <th className="pb-2 pr-4">Hash</th>
                <th className="pb-2 text-right">Events</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rosewood/10">
              {rows.map((row) => (
                <tr key={row.hash}>
                  <td className="py-3 pr-4 font-mono text-xs text-stone-700" title={row.hash}>{shortHash(row.hash)}</td>
                  <td className="py-3 text-right font-semibold text-rosewood">{row.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function AdminSecurityPanel({ summary }: { summary: CustomerAuthEventSummary }) {
  const totalEvents = Object.values(summary.countsByType).reduce((total, count) => total + count, 0);

  return (
    <section id="security" className="scroll-mt-8 rounded-[2rem] border border-rosewood/10 bg-white p-6 shadow-sm">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-olive">Security</p>
          <h2 className="mt-2 font-display text-4xl text-rosewood">OTP auth activity</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-600">
            PII-safe summary of recent customer OTP request, delivery, and verification events. Raw phone numbers, IP addresses, user agents, and OTP codes are not shown.
          </p>
        </div>
        <div className="rounded-full border border-rosewood/10 bg-cream px-4 py-2 text-sm font-semibold text-rosewood">
          Last {summary.windowHours}h · {totalEvents} events
        </div>
      </div>

      {!summary.databaseReady ? (
        <div className="rounded-3xl border border-amber-300 bg-amber-50 p-5 text-sm leading-6 text-amber-900">
          Database is not configured, so OTP security activity is unavailable in seeded preview mode.
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            {(Object.keys(EVENT_LABELS) as CustomerAuthEventType[]).map((eventType) => (
              <article key={eventType} className="rounded-3xl border border-rosewood/10 bg-cream p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">{EVENT_LABELS[eventType]}</p>
                <p className="mt-3 font-display text-4xl text-rosewood">{summary.countsByType[eventType]}</p>
              </article>
            ))}
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <HashTable title="Top phone hashes" rows={summary.topPhoneHashes} />
            <HashTable title="Top IP hashes" rows={summary.topIpHashes} />
          </div>
          <p className="mt-4 text-xs text-stone-500">Generated {summary.generatedAt}. Hashes are truncated for display; hover to inspect the full hash.</p>
        </>
      )}
    </section>
  );
}
