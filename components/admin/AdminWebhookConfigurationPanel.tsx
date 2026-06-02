import { updateWebhookConfigurationAction } from '@/app/admin/settings/actions';
import { buildWebhookReadinessSummary, type WebhookConfiguration } from '@/lib/settings/webhook-configuration';

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

export function AdminWebhookConfigurationPanel({ settings, databaseReady }: { settings: WebhookConfiguration[]; databaseReady: boolean }) {
  return (
    <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-stone-500">Integrations</p>
        <h2 className="mt-1 text-2xl font-bold text-stone-950">Webhook configuration</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">Configure webhook targets, subscribed events, signing metadata, and active/default state. Secrets stay in environment variables; admin settings only store the environment variable name.</p>
      </div>
      {!databaseReady ? (
        <div className="mt-5 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">Database settings are unavailable until DATABASE_URL is configured. Showing safe defaults.</div>
      ) : null}
      <div className="mt-6 grid gap-4">
        {settings.map((setting) => {
          const readiness = buildWebhookReadinessSummary(setting, process.env);
          return (
            <form key={setting.key} action={updateWebhookConfigurationAction} className="grid gap-4 rounded-md border border-stone-200 bg-stone-50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-stone-950">{setting.label}</h3>
                  <p className="text-sm text-stone-600">{readiness.ready ? 'Ready for configured webhook delivery.' : 'Webhook readiness needs attention.'}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] ${readiness.ready ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-800'}`}>
                  {readiness.ready ? 'ready' : 'needs setup'}
                </span>
              </div>
              <div className="grid gap-3 md:grid-cols-[1fr_1fr]">
                <label className="grid gap-2 text-sm font-semibold text-stone-800">
                  Key
                  <input className={inputClass} name="key" defaultValue={setting.key} disabled={!databaseReady} />
                </label>
                <label className="grid gap-2 text-sm font-semibold text-stone-800">
                  Label
                  <input className={inputClass} name="label" defaultValue={setting.label} disabled={!databaseReady} />
                </label>
              </div>
              <label className="grid gap-2 text-sm font-semibold text-stone-800">
                Description
                <input className={inputClass} name="description" defaultValue={setting.description ?? ''} disabled={!databaseReady} />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-stone-800">
                Target URL
                <input className={inputClass} name="targetUrl" defaultValue={setting.targetUrl} placeholder="https://example.com/webhooks/golara" disabled={!databaseReady} />
              </label>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="grid gap-2 text-sm font-semibold text-stone-800">
                  Events
                  <textarea className={inputClass} name="events" rows={4} defaultValue={setting.events.join('\n')} placeholder="order.created\norder.updated" disabled={!databaseReady} />
                </label>
                <label className="grid gap-2 text-sm font-semibold text-stone-800">
                  Header names
                  <textarea className={inputClass} name="headerNames" rows={4} defaultValue={setting.headerNames.join('\n')} placeholder="x-golara-signature" disabled={!databaseReady} />
                </label>
              </div>
              <label className="grid gap-2 text-sm font-semibold text-stone-800">
                Signing secret env var
                <input className={inputClass} name="secretEnvVar" defaultValue={setting.secretEnvVar ?? ''} placeholder="GOLARA_WEBHOOK_SECRET" disabled={!databaseReady} />
              </label>
              <div className="grid gap-3 md:grid-cols-2">
                <Toggle label="Default setting" name="isDefault" defaultChecked={setting.isDefault} disabled={!databaseReady} />
                <Toggle label="Active" name="isActive" defaultChecked={setting.isActive} disabled={!databaseReady} />
              </div>
              <div className="grid gap-3 rounded-md border border-stone-200 bg-white p-4 text-sm text-stone-700">
                <p className="font-semibold text-stone-900">Events: {readiness.events.length ? readiness.events.join(', ') : 'none'}</p>
                <p className="text-stone-600">Signing env: {readiness.secretEnvVar ?? 'not configured'}</p>
                <p className="text-stone-600">Headers: {readiness.headerNames.length ? readiness.headerNames.join(', ') : 'none'}</p>
                {readiness.blockers.length ? (
                  <ul className="list-disc pl-5 text-amber-800">
                    {readiness.blockers.map((issue) => (
                      <li key={issue.code}>{issue.summary}</li>
                    ))}
                  </ul>
                ) : null}
                {readiness.warnings.length ? (
                  <ul className="list-disc pl-5 text-stone-600">
                    {readiness.warnings.map((issue) => (
                      <li key={issue.code}>{issue.summary}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
              <button className="w-fit rounded-full bg-rosewood px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-rosewood/20 disabled:cursor-not-allowed disabled:bg-stone-300 disabled:shadow-none" type="submit" disabled={!databaseReady}>
                Save webhook configuration
              </button>
            </form>
          );
        })}
      </div>
    </section>
  );
}
