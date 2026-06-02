import { updateNotificationProviderSettingAction } from '@/app/admin/settings/actions';
import {
  NOTIFICATION_EMAIL_PROVIDERS,
  NOTIFICATION_SMS_PROVIDERS,
  buildNotificationProviderReadinessSummary,
  type NotificationProviderSetting
} from '@/lib/settings/notification-provider-settings';

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
          {value}
        </option>
      ))}
    </>
  );
}

export function AdminNotificationProviderSettingsPanel({ settings, databaseReady }: { settings: NotificationProviderSetting[]; databaseReady: boolean }) {
  return (
    <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-stone-500">Settings</p>
        <h2 className="mt-1 text-2xl font-bold text-stone-950">Notification provider readiness</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">Configure order email/SMS channel readiness, provider choices, sender defaults, and required environment variables. Provider secrets stay in environment configuration.</p>
      </div>
      {!databaseReady ? (
        <div className="mt-5 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">Database settings are unavailable until DATABASE_URL is configured. Showing safe defaults.</div>
      ) : null}
      <div className="mt-6 grid gap-4">
        {settings.map((setting) => {
          const readiness = buildNotificationProviderReadinessSummary(setting, process.env);
          return (
            <form key={setting.key} action={updateNotificationProviderSettingAction} className="grid gap-4 rounded-md border border-stone-200 bg-stone-50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-stone-950">{setting.label}</h3>
                  <p className="text-sm text-stone-600">{readiness.ready ? 'Ready for configured notification channels.' : 'Notification readiness needs attention.'}</p>
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
              <div className="grid gap-3 md:grid-cols-2">
                <label className="grid gap-2 text-sm font-semibold text-stone-800">
                  Email provider
                  <select className={inputClass} name="emailProvider" defaultValue={setting.emailProvider} disabled={!databaseReady}>
                    <OptionList values={NOTIFICATION_EMAIL_PROVIDERS} />
                  </select>
                </label>
                <label className="grid gap-2 text-sm font-semibold text-stone-800">
                  SMS provider
                  <select className={inputClass} name="smsProvider" defaultValue={setting.smsProvider} disabled={!databaseReady}>
                    <OptionList values={NOTIFICATION_SMS_PROVIDERS} />
                  </select>
                </label>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <label className="grid gap-2 text-sm font-semibold text-stone-800">
                  Default from email
                  <input className={inputClass} name="defaultFromEmail" defaultValue={setting.defaultFromEmail ?? ''} placeholder="orders@example.com" disabled={!databaseReady} />
                </label>
                <label className="grid gap-2 text-sm font-semibold text-stone-800">
                  Reply-to email
                  <input className={inputClass} name="replyToEmail" defaultValue={setting.replyToEmail ?? ''} placeholder="support@example.com" disabled={!databaseReady} />
                </label>
                <label className="grid gap-2 text-sm font-semibold text-stone-800">
                  Default from phone
                  <input className={inputClass} name="defaultFromPhone" defaultValue={setting.defaultFromPhone ?? ''} placeholder="Optional" disabled={!databaseReady} />
                </label>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <Toggle label="Default setting" name="isDefault" defaultChecked={setting.isDefault} disabled={!databaseReady} />
                <Toggle label="Active" name="isActive" defaultChecked={setting.isActive} disabled={!databaseReady} />
                <Toggle label="Order email" name="enableOrderEmail" defaultChecked={setting.enableOrderEmail} disabled={!databaseReady} />
                <Toggle label="Order SMS" name="enableOrderSms" defaultChecked={setting.enableOrderSms} disabled={!databaseReady} />
                <Toggle label="Require email env" name="requireEmailProviderEnv" defaultChecked={setting.requireEmailProviderEnv} disabled={!databaseReady} />
                <Toggle label="Require SMS env" name="requireSmsProviderEnv" defaultChecked={setting.requireSmsProviderEnv} disabled={!databaseReady} />
              </div>
              <div className="grid gap-3 rounded-md border border-stone-200 bg-white p-4 text-sm text-stone-700">
                <p className="font-semibold text-stone-900">Required env: {readiness.requiredEnvironmentVariables.length ? readiness.requiredEnvironmentVariables.join(', ') : 'none'}</p>
                <p className="text-stone-600">Channels: {readiness.channels.length ? readiness.channels.join(', ') : 'none'}</p>
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
                Save notification settings
              </button>
            </form>
          );
        })}
      </div>
    </section>
  );
}
