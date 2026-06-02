import { updateApiTokenManagementAction } from '@/app/admin/settings/actions';
import type { ApiTokenManagementSummary } from '@/lib/settings/api-token-management';

const inputClass = 'rounded-md border border-stone-200 bg-white px-3 py-2 text-sm text-stone-800 outline-none transition focus:border-rosewood focus-visible:ring-4 focus-visible:ring-olive/20 disabled:cursor-not-allowed disabled:bg-stone-100';

function formatDateInput(value?: Date | null) {
  if (!value) return '';
  return value.toISOString().slice(0, 10);
}

function Toggle({ label, name, defaultChecked, disabled }: { label: string; name: string; defaultChecked: boolean; disabled: boolean }) {
  return (
    <label className="flex items-center gap-2 rounded-md border border-stone-200 bg-white px-3 py-2 text-sm font-semibold text-stone-700">
      <input type="hidden" name={name} value="false" />
      <input name={name} type="checkbox" defaultChecked={defaultChecked} disabled={disabled} />
      {label}
    </label>
  );
}

export function AdminApiTokenManagementPanel({ summary, databaseReady }: { summary: ApiTokenManagementSummary; databaseReady: boolean }) {
  return (
    <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-stone-500">Integrations</p>
          <h2 className="mt-1 text-2xl font-bold text-stone-950">API token management</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">Manage API token metadata, scopes, expiry, and integration ownership. Raw token values are accepted only to compute a digest and are never displayed after save.</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] ${summary.revoked || summary.expired ? 'bg-amber-50 text-amber-800' : 'bg-emerald-50 text-emerald-700'}`}>
          {summary.revoked || summary.expired ? `${summary.revoked + summary.expired} need review` : `${summary.total} tracked`}
        </span>
      </div>
      {!databaseReady ? (
        <div className="mt-5 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">Database settings are unavailable until DATABASE_URL is configured. Showing safe defaults.</div>
      ) : null}
      <div className="mt-6 grid gap-3 md:grid-cols-5">
        <div className="rounded-md border border-stone-200 bg-stone-50 p-3 text-sm"><p className="font-bold text-stone-950">{summary.total}</p><p className="text-stone-600">Tracked</p></div>
        <div className="rounded-md border border-stone-200 bg-stone-50 p-3 text-sm"><p className="font-bold text-stone-950">{summary.active}</p><p className="text-stone-600">Active</p></div>
        <div className="rounded-md border border-stone-200 bg-stone-50 p-3 text-sm"><p className="font-bold text-stone-950">{summary.revoked}</p><p className="text-stone-600">Revoked</p></div>
        <div className="rounded-md border border-stone-200 bg-stone-50 p-3 text-sm"><p className="font-bold text-stone-950">{summary.expired}</p><p className="text-stone-600">Expired</p></div>
        <div className="rounded-md border border-stone-200 bg-stone-50 p-3 text-sm"><p className="font-bold text-stone-950">{summary.expiringSoon}</p><p className="text-stone-600">Expiring soon</p></div>
      </div>
      <div className="mt-6 grid gap-4">
        {summary.entries.map((entry) => (
          <form key={entry.key} action={updateApiTokenManagementAction} className="grid gap-4 rounded-md border border-stone-200 bg-stone-50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-stone-950">{entry.label}</h3>
                <p className="text-sm text-stone-600">{entry.tokenPrefix ?? 'no prefix'} · {entry.scopes.join(', ')}</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] ${entry.isActive && !entry.isRevoked ? 'bg-emerald-50 text-emerald-700' : entry.isRevoked ? 'bg-amber-50 text-amber-800' : 'bg-stone-100 text-stone-700'}`}>
                {entry.isRevoked ? 'revoked' : entry.isActive ? 'active' : 'inactive'}
              </span>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="grid gap-2 text-sm font-semibold text-stone-800">
                Key
                <input className={inputClass} name="key" defaultValue={entry.key} disabled={!databaseReady} />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-stone-800">
                Label
                <input className={inputClass} name="label" defaultValue={entry.label} disabled={!databaseReady} />
              </label>
            </div>
            <label className="grid gap-2 text-sm font-semibold text-stone-800">
              Description
              <input className={inputClass} name="description" defaultValue={entry.description ?? ''} disabled={!databaseReady} />
            </label>
            <div className="grid gap-3 md:grid-cols-3">
              <label className="grid gap-2 text-sm font-semibold text-stone-800">
                Token value for digest rotation
                <input className={inputClass} name="tokenValue" type="password" placeholder="Paste only when rotating" disabled={!databaseReady} />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-stone-800">
                Token prefix
                <input className={inputClass} name="tokenPrefix" defaultValue={entry.tokenPrefix ?? ''} placeholder="golara_live" disabled={!databaseReady} />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-stone-800">
                Expires at
                <input className={inputClass} name="expiresAt" type="date" defaultValue={formatDateInput(entry.expiresAt)} disabled={!databaseReady} />
              </label>
            </div>
            <label className="grid gap-2 text-sm font-semibold text-stone-800">
              Integration app key
              <input className={inputClass} name="integrationAppKey" defaultValue={entry.integrationAppKey ?? ''} placeholder="default-webhook-app" disabled={!databaseReady} />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-stone-800">
              Scopes
              <textarea className={inputClass} name="scopes" rows={4} defaultValue={entry.scopes.join('\n')} placeholder="admin:read\nwebhooks:read" disabled={!databaseReady} />
            </label>
            <div className="grid gap-3 rounded-md border border-stone-200 bg-white p-3 text-sm text-stone-600 md:grid-cols-3">
              <p><span className="font-semibold text-stone-900">Digest:</span> {entry.tokenDigest ? `${entry.tokenDigest.slice(0, 12)}…` : 'not set'}</p>
              <p><span className="font-semibold text-stone-900">Last used:</span> {entry.lastUsedAt ? entry.lastUsedAt.toISOString().slice(0, 10) : 'never'}</p>
              <p><span className="font-semibold text-stone-900">Updated:</span> {entry.updatedAt ? entry.updatedAt.toISOString().slice(0, 10) : '—'}</p>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <Toggle label="Active" name="isActive" defaultChecked={entry.isActive} disabled={!databaseReady} />
              <Toggle label="Revoked" name="isRevoked" defaultChecked={entry.isRevoked} disabled={!databaseReady} />
            </div>
            <button className="w-fit rounded-full bg-rosewood px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-rosewood/20 disabled:cursor-not-allowed disabled:bg-stone-300 disabled:shadow-none" type="submit" disabled={!databaseReady}>
              Save token metadata
            </button>
          </form>
        ))}
      </div>
    </section>
  );
}
