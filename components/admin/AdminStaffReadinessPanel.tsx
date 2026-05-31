import type { AdminIdentity } from '@/lib/admin-auth-core';
import type { AdminAccountReadinessRecord, AdminAccountReadinessSummary } from '@/lib/admin-account-core';

function formatDate(value?: Date) {
  if (!value) return 'Never';
  return new Intl.DateTimeFormat('en-CA', { dateStyle: 'medium', timeStyle: 'short' }).format(value);
}

function sourceLabel(account: AdminAccountReadinessRecord) {
  const source = account.metadata?.source;
  return typeof source === 'string' ? source : 'database';
}

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-3xl border border-rosewood/10 bg-cream p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-olive">{label}</p>
      <p className="mt-2 font-display text-3xl text-rosewood">{value}</p>
    </div>
  );
}

export function AdminStaffReadinessPanel({ accounts, summary, identity }: { accounts: AdminAccountReadinessRecord[]; summary: AdminAccountReadinessSummary; identity?: AdminIdentity }) {
  if (identity?.role !== 'owner') return null;

  return (
    <section id="staff-readiness" className="scroll-mt-8 rounded-[2rem] border border-rosewood/10 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-olive">Staff access</p>
          <h2 className="mt-2 font-display text-4xl text-rosewood">Admin account readiness</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-600">
            Owner-only view of admin identities used for CMS access and inquiry assignment matching.
          </p>
        </div>
        <span className={`rounded-full border px-4 py-2 text-sm font-semibold ${summary.assignmentStable ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-amber-300 bg-amber-50 text-amber-800'}`}>
          {summary.assignmentStable ? 'Assignment identities stable' : 'Needs identity cleanup'}
        </span>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        <StatCard label="Total" value={summary.total} />
        <StatCard label="Active" value={summary.active} />
        <StatCard label="Inactive" value={summary.inactive} />
        <StatCard label="Owners" value={summary.owners} />
        <StatCard label="Staff" value={summary.staff} />
        <StatCard label="Missing email" value={summary.missingEmail} />
      </div>

      <div className="mt-6 overflow-hidden rounded-3xl border border-rosewood/10">
        <table className="min-w-full divide-y divide-rosewood/10 text-left text-sm">
          <thead className="bg-cream text-xs uppercase tracking-[0.16em] text-olive">
            <tr>
              <th className="px-4 py-3 font-semibold">Label</th>
              <th className="px-4 py-3 font-semibold">Role</th>
              <th className="px-4 py-3 font-semibold">Email</th>
              <th className="px-4 py-3 font-semibold">Assignment key</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Last login</th>
              <th className="px-4 py-3 font-semibold">Source</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-rosewood/10 bg-white text-stone-700">
            {accounts.length === 0 ? (
              <tr>
                <td className="px-4 py-5 text-stone-600" colSpan={7}>No admin accounts are visible yet. Configure admin auth or seed AdminAccount records before launch.</td>
              </tr>
            ) : accounts.map((account) => (
              <tr key={`${account.provider}:${account.providerAccountId}`}>
                <td className="px-4 py-3 font-semibold text-rosewood">{account.label}</td>
                <td className="px-4 py-3 capitalize">{account.role}</td>
                <td className="px-4 py-3">{account.email ?? '—'}</td>
                <td className="px-4 py-3 font-mono text-xs">{account.assignmentKey}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${account.isActive ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-stone-300 bg-stone-100 text-stone-700'}`}>
                    {account.accessStatus}
                  </span>
                </td>
                <td className="px-4 py-3">{formatDate(account.lastLoginAt)}</td>
                <td className="px-4 py-3 capitalize">{sourceLabel(account)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 rounded-3xl border border-olive/20 bg-cream p-5 text-sm text-stone-700">
        <p className="font-semibold text-rosewood">Access rotation and deactivation runbook</p>
        <ol className="mt-3 grid gap-2 pl-5 list-decimal leading-6">
          {summary.rotationRunbook.map((step) => <li key={step}>{step}</li>)}
        </ol>
      </div>
    </section>
  );
}
