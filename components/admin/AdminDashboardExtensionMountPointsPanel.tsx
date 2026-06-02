import { updateDashboardExtensionMountPointAction } from '@/app/admin/settings/actions';
import {
  DASHBOARD_EXTENSION_MOUNT_LOCATIONS,
  DASHBOARD_EXTENSION_ROLES,
  type DashboardExtensionMountPointSummary
} from '@/lib/settings/dashboard-extension-mount-points';

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

export function AdminDashboardExtensionMountPointsPanel({ summary, databaseReady }: { summary: DashboardExtensionMountPointSummary; databaseReady: boolean }) {
  return (
    <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-stone-500">Integrations</p>
          <h2 className="mt-1 text-2xl font-bold text-stone-950">Dashboard extension mount points</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">Register internal tools and future custom admin modules by mount location, role/permission metadata, integration ownership, and active state.</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] ${summary.active ? 'bg-emerald-50 text-emerald-700' : 'bg-stone-100 text-stone-700'}`}>
          {summary.active ? `${summary.active} active` : `${summary.total} staged`}
        </span>
      </div>
      {!databaseReady ? (
        <div className="mt-5 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">Database settings are unavailable until DATABASE_URL is configured. Showing safe defaults.</div>
      ) : null}
      <div className="mt-6 grid gap-3 md:grid-cols-5">
        <div className="rounded-md border border-stone-200 bg-stone-50 p-3 text-sm"><p className="font-bold text-stone-950">{summary.total}</p><p className="text-stone-600">Registered</p></div>
        <div className="rounded-md border border-stone-200 bg-stone-50 p-3 text-sm"><p className="font-bold text-stone-950">{summary.active}</p><p className="text-stone-600">Active</p></div>
        <div className="rounded-md border border-stone-200 bg-stone-50 p-3 text-sm"><p className="font-bold text-stone-950">{summary.inactive}</p><p className="text-stone-600">Inactive</p></div>
        <div className="rounded-md border border-stone-200 bg-stone-50 p-3 text-sm"><p className="font-bold text-stone-950">{summary.internal}</p><p className="text-stone-600">Internal</p></div>
        <div className="rounded-md border border-stone-200 bg-stone-50 p-3 text-sm"><p className="font-bold text-stone-950">{summary.external}</p><p className="text-stone-600">External</p></div>
      </div>
      <div className="mt-6 grid gap-4">
        {summary.entries.map((entry) => (
          <form key={entry.key} action={updateDashboardExtensionMountPointAction} className="grid gap-4 rounded-md border border-stone-200 bg-stone-50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-stone-950">{entry.label}</h3>
                <p className="text-sm text-stone-600">{entry.mountLocation.replace(/_/g, ' ')} · {entry.integrationAppKey ?? 'no app link'}</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] ${entry.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-stone-100 text-stone-700'}`}>
                {entry.isActive ? 'active' : 'staged'}
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
                Mount location
                <select className={inputClass} name="mountLocation" defaultValue={entry.mountLocation} disabled={!databaseReady}>
                  <OptionList values={DASHBOARD_EXTENSION_MOUNT_LOCATIONS} />
                </select>
              </label>
              <label className="grid gap-2 text-sm font-semibold text-stone-800">
                Integration app key
                <input className={inputClass} name="integrationAppKey" defaultValue={entry.integrationAppKey ?? ''} placeholder="default-webhook-app" disabled={!databaseReady} />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-stone-800">
                Sort order
                <input className={inputClass} name="sortOrder" type="number" defaultValue={entry.sortOrder} disabled={!databaseReady} />
              </label>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="grid gap-2 text-sm font-semibold text-stone-800">
                Required roles
                <textarea className={inputClass} name="requiredRoles" rows={4} defaultValue={entry.requiredRoles.join('\n')} placeholder={DASHBOARD_EXTENSION_ROLES.join('\n')} disabled={!databaseReady} />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-stone-800">
                Required permissions
                <textarea className={inputClass} name="requiredPermissions" rows={4} defaultValue={entry.requiredPermissions.join('\n')} placeholder="admin:extensions:read\nadmin:extensions:write" disabled={!databaseReady} />
              </label>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <Toggle label="Internal tool" name="isInternal" defaultChecked={entry.isInternal} disabled={!databaseReady} />
              <Toggle label="Active" name="isActive" defaultChecked={entry.isActive} disabled={!databaseReady} />
            </div>
            <button className="w-fit rounded-full bg-rosewood px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-rosewood/20 disabled:cursor-not-allowed disabled:bg-stone-300 disabled:shadow-none" type="submit" disabled={!databaseReady}>
              Save mount point
            </button>
          </form>
        ))}
      </div>
    </section>
  );
}
