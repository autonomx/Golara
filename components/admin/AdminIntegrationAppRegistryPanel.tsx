import { updateIntegrationAppRegistryAction } from '@/app/admin/settings/actions';
import {
  INTEGRATION_APP_CATEGORIES,
  INTEGRATION_APP_STATUSES,
  type IntegrationAppRegistrySummary
} from '@/lib/settings/integration-app-registry';

const inputClass = 'rounded-md border border-stone-200 bg-white px-3 py-2 text-sm text-stone-800 outline-none transition focus:border-rosewood focus-visible:ring-4 focus-visible:ring-olive/20 disabled:cursor-not-allowed disabled:bg-stone-100';

function Toggle({ label, name, defaultChecked, disabled }: { label: string; name: string; defaultChecked: boolean; disabled: boolean }) {
  return (
    <label className="flex items-center gap-2 rounded-md border border-stone-200 bg-white px-3 py-2 text-sm font-semibold text-stone-700">
      <input type="hidden" name={name} value="false" />
      <input name={name} type="checkbox" defaultChecked={defaultChecked} disabled={disabled} />
      {label}
    </label>
  );
}

function OptionList({ values }: { values: readonly string[] }) {
  return (
    <>
      {values.map((value) => (
        <option key={value} value={value}>
          {value.replace(/_/g, ' ')}
        </option>
      ))}
    </>
  );
}

export function AdminIntegrationAppRegistryPanel({ summary, databaseReady }: { summary: IntegrationAppRegistrySummary; databaseReady: boolean }) {
  return (
    <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-stone-500">Integrations</p>
          <h2 className="mt-1 text-2xl font-bold text-stone-950">Integration app registry</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">Track internal and external integration apps, provider ownership, permissions, required environment variables, and optional webhook configuration links.</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] ${summary.needsAttention ? 'bg-amber-50 text-amber-800' : 'bg-emerald-50 text-emerald-700'}`}>
          {summary.needsAttention ? `${summary.needsAttention} need attention` : `${summary.total} registered`}
        </span>
      </div>
      {!databaseReady ? (
        <div className="mt-5 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">Database settings are unavailable until DATABASE_URL is configured. Showing safe defaults.</div>
      ) : null}
      <div className="mt-6 grid gap-3 md:grid-cols-4">
        <div className="rounded-md border border-stone-200 bg-stone-50 p-3 text-sm"><p className="font-bold text-stone-950">{summary.total}</p><p className="text-stone-600">Registered</p></div>
        <div className="rounded-md border border-stone-200 bg-stone-50 p-3 text-sm"><p className="font-bold text-stone-950">{summary.active}</p><p className="text-stone-600">Active</p></div>
        <div className="rounded-md border border-stone-200 bg-stone-50 p-3 text-sm"><p className="font-bold text-stone-950">{summary.internal}</p><p className="text-stone-600">Internal</p></div>
        <div className="rounded-md border border-stone-200 bg-stone-50 p-3 text-sm"><p className="font-bold text-stone-950">{summary.needsAttention}</p><p className="text-stone-600">Attention</p></div>
      </div>
      <div className="mt-6 grid gap-4">
        {summary.entries.map((entry) => (
          <form key={entry.key} action={updateIntegrationAppRegistryAction} className="grid gap-4 rounded-md border border-stone-200 bg-stone-50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-stone-950">{entry.label}</h3>
                <p className="text-sm text-stone-600">{entry.category} · {entry.status.replace(/_/g, ' ')}</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] ${entry.isActive || entry.status === 'active' ? 'bg-emerald-50 text-emerald-700' : entry.status === 'needs_attention' ? 'bg-amber-50 text-amber-800' : 'bg-stone-100 text-stone-700'}`}>
                {entry.isActive || entry.status === 'active' ? 'active' : entry.status.replace(/_/g, ' ')}
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
                Category
                <select className={inputClass} name="category" defaultValue={entry.category} disabled={!databaseReady}>
                  <OptionList values={INTEGRATION_APP_CATEGORIES} />
                </select>
              </label>
              <label className="grid gap-2 text-sm font-semibold text-stone-800">
                Status
                <select className={inputClass} name="status" defaultValue={entry.status} disabled={!databaseReady}>
                  <OptionList values={INTEGRATION_APP_STATUSES} />
                </select>
              </label>
              <label className="grid gap-2 text-sm font-semibold text-stone-800">
                Provider
                <input className={inputClass} name="provider" defaultValue={entry.provider ?? ''} placeholder="stripe, resend, golara" disabled={!databaseReady} />
              </label>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <label className="grid gap-2 text-sm font-semibold text-stone-800">
                Homepage URL
                <input className={inputClass} name="homepageUrl" defaultValue={entry.homepageUrl ?? ''} placeholder="https://example.com" disabled={!databaseReady} />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-stone-800">
                Docs URL
                <input className={inputClass} name="docsUrl" defaultValue={entry.docsUrl ?? ''} placeholder="https://docs.example.com" disabled={!databaseReady} />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-stone-800">
                Webhook config key
                <input className={inputClass} name="webhookConfigurationKey" defaultValue={entry.webhookConfigurationKey ?? ''} placeholder="default-webhook-configuration" disabled={!databaseReady} />
              </label>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="grid gap-2 text-sm font-semibold text-stone-800">
                Permissions
                <textarea className={inputClass} name="permissions" rows={4} defaultValue={entry.permissions.join('\n')} placeholder="webhooks:read\nwebhooks:write" disabled={!databaseReady} />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-stone-800">
                Required env vars
                <textarea className={inputClass} name="requiredEnvVars" rows={4} defaultValue={entry.requiredEnvVars.join('\n')} placeholder="GOLARA_WEBHOOK_SECRET" disabled={!databaseReady} />
              </label>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <Toggle label="Internal app" name="isInternal" defaultChecked={entry.isInternal} disabled={!databaseReady} />
              <Toggle label="Active" name="isActive" defaultChecked={entry.isActive} disabled={!databaseReady} />
            </div>
            <button className="w-fit rounded-full bg-rosewood px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-rosewood/20 disabled:cursor-not-allowed disabled:bg-stone-300 disabled:shadow-none" type="submit" disabled={!databaseReady}>
              Save integration app
            </button>
          </form>
        ))}
      </div>
    </section>
  );
}
