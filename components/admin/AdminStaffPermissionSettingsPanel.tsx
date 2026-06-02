import { updateStaffAccountAction, updateStaffPermissionGroupAction } from '@/app/admin/settings/actions';
import {
  STAFF_PERMISSION_KEYS,
  type StaffPermissionSettingsSnapshot
} from '@/lib/settings/staff-permission-settings';

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

function permissionsText(permissions: string[]) {
  return permissions.join('\n');
}

export function AdminStaffPermissionSettingsPanel({ snapshot, databaseReady }: { snapshot: StaffPermissionSettingsSnapshot; databaseReady: boolean }) {
  const defaultGroup = snapshot.groups[0];
  const account = snapshot.accounts[0];

  return (
    <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-stone-500">Settings</p>
        <h2 className="mt-1 text-2xl font-bold text-stone-950">Staff accounts and permission groups</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">Create a durable staff account directory and permission-group foundation for later role-based access controls. This does not replace the current password session provider.</p>
      </div>
      {!databaseReady ? (
        <div className="mt-5 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">Database settings are unavailable until DATABASE_URL is configured. Showing safe defaults.</div>
      ) : null}

      <div className="mt-6 grid gap-4 rounded-md border border-stone-200 bg-stone-50 p-4 text-sm text-stone-700 md:grid-cols-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-stone-500">Total</p>
          <p className="text-2xl font-bold text-stone-950">{snapshot.summary.total}</p>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-stone-500">Active</p>
          <p className="text-2xl font-bold text-stone-950">{snapshot.summary.active}</p>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-stone-500">Owners</p>
          <p className="text-2xl font-bold text-stone-950">{snapshot.summary.owners}</p>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-stone-500">Staff</p>
          <p className="text-2xl font-bold text-stone-950">{snapshot.summary.staff}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4">
        <form action={updateStaffPermissionGroupAction} className="grid gap-4 rounded-md border border-stone-200 bg-stone-50 p-4">
          <div>
            <h3 className="text-lg font-bold text-stone-950">Permission group</h3>
            <p className="text-sm text-stone-600">Available permissions: {STAFF_PERMISSION_KEYS.join(', ')}</p>
          </div>
          <div className="grid gap-3 md:grid-cols-[1fr_1fr_0.5fr]">
            <label className="grid gap-2 text-sm font-semibold text-stone-800">
              Key
              <input className={inputClass} name="key" defaultValue={defaultGroup.key} disabled={!databaseReady} />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-stone-800">
              Label
              <input className={inputClass} name="label" defaultValue={defaultGroup.label} disabled={!databaseReady} />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-stone-800">
              Role
              <select className={inputClass} name="role" defaultValue={defaultGroup.role} disabled={!databaseReady}>
                <option value="staff">staff</option>
                <option value="owner">owner</option>
              </select>
            </label>
          </div>
          <label className="grid gap-2 text-sm font-semibold text-stone-800">
            Description
            <input className={inputClass} name="description" defaultValue={defaultGroup.description ?? ''} disabled={!databaseReady} />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-stone-800">
            Permissions
            <textarea className={`${inputClass} min-h-32`} name="permissions" defaultValue={permissionsText(defaultGroup.permissions)} disabled={!databaseReady} />
          </label>
          <div className="grid gap-3 md:grid-cols-2">
            <Toggle label="Default group" name="isDefault" defaultChecked={defaultGroup.isDefault} disabled={!databaseReady} />
            <Toggle label="Active" name="isActive" defaultChecked={defaultGroup.isActive} disabled={!databaseReady} />
          </div>
          <button className="w-fit rounded-full bg-rosewood px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-rosewood/20 disabled:cursor-not-allowed disabled:bg-stone-300 disabled:shadow-none" type="submit" disabled={!databaseReady}>
            Save permission group
          </button>
        </form>

        <form action={updateStaffAccountAction} className="grid gap-4 rounded-md border border-stone-200 bg-stone-50 p-4">
          <div>
            <h3 className="text-lg font-bold text-stone-950">Staff account</h3>
            <p className="text-sm text-stone-600">Add or update one staff/owner account at a time. Provider credentials are still configured outside this form.</p>
          </div>
          <div className="grid gap-3 md:grid-cols-[0.7fr_1fr_1fr]">
            <label className="grid gap-2 text-sm font-semibold text-stone-800">
              Provider
              <input className={inputClass} name="provider" defaultValue={account?.provider ?? 'password'} disabled={!databaseReady} />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-stone-800">
              Provider account ID
              <input className={inputClass} name="providerAccountId" defaultValue={account?.providerAccountId ?? ''} placeholder="staff@example.com" disabled={!databaseReady} />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-stone-800">
              Label
              <input className={inputClass} name="label" defaultValue={account?.label ?? ''} placeholder="Staff name" disabled={!databaseReady} />
            </label>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <label className="grid gap-2 text-sm font-semibold text-stone-800">
              Email
              <input className={inputClass} name="email" defaultValue={account?.email ?? ''} disabled={!databaseReady} />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-stone-800">
              Role
              <select className={inputClass} name="role" defaultValue={account?.role ?? 'staff'} disabled={!databaseReady}>
                <option value="staff">staff</option>
                <option value="owner">owner</option>
              </select>
            </label>
            <label className="grid gap-2 text-sm font-semibold text-stone-800">
              Permission group
              <select className={inputClass} name="permissionGroupKey" defaultValue={account?.permissionGroupKey ?? defaultGroup.key} disabled={!databaseReady}>
                {snapshot.groups.map((group) => (
                  <option key={group.key} value={group.key}>{group.label}</option>
                ))}
              </select>
            </label>
          </div>
          <Toggle label="Active" name="isActive" defaultChecked={account?.isActive ?? true} disabled={!databaseReady} />
          <button className="w-fit rounded-full bg-rosewood px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-rosewood/20 disabled:cursor-not-allowed disabled:bg-stone-300 disabled:shadow-none" type="submit" disabled={!databaseReady}>
            Save staff account
          </button>
        </form>
      </div>
    </section>
  );
}
