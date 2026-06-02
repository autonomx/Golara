import {
  ADMIN_MODULE_ACCESS_POLICIES,
  buildAdminModuleAccessReadiness
} from '@/lib/settings/admin-module-access';

export function AdminModuleAccessSettingsPanel() {
  const readiness = buildAdminModuleAccessReadiness();

  return (
    <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-stone-500">Settings</p>
        <h2 className="mt-1 text-2xl font-bold text-stone-950">Role-based module access</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">Review the deterministic owner/staff and permission requirements for each admin module. This foundation centralizes access policy before deeper per-module enforcement.</p>
      </div>

      <div className="mt-6 grid gap-4 rounded-md border border-stone-200 bg-stone-50 p-4 text-sm text-stone-700 md:grid-cols-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-stone-500">Modules</p>
          <p className="text-2xl font-bold text-stone-950">{readiness.total}</p>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-stone-500">Owner write</p>
          <p className="text-2xl font-bold text-stone-950">{readiness.ownerWriteModules}</p>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-stone-500">Staff write</p>
          <p className="text-2xl font-bold text-stone-950">{readiness.staffWriteModules}</p>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-stone-500">Permission-backed</p>
          <p className="text-2xl font-bold text-stone-950">{readiness.permissionBackedModules}</p>
        </div>
      </div>

      <div className="mt-6 overflow-x-auto rounded-md border border-stone-200">
        <table className="min-w-full divide-y divide-stone-200 text-left text-sm">
          <thead className="bg-stone-50 text-xs font-bold uppercase tracking-[0.14em] text-stone-500">
            <tr>
              <th className="px-4 py-3">Module</th>
              <th className="px-4 py-3">Read role</th>
              <th className="px-4 py-3">Write role</th>
              <th className="px-4 py-3">Read permissions</th>
              <th className="px-4 py-3">Write permissions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 bg-white text-stone-700">
            {ADMIN_MODULE_ACCESS_POLICIES.map((policy) => (
              <tr key={policy.key}>
                <td className="px-4 py-3">
                  <p className="font-bold text-stone-950">{policy.label}</p>
                  <p className="mt-1 max-w-sm text-xs leading-5 text-stone-500">{policy.description}</p>
                </td>
                <td className="px-4 py-3 font-semibold text-stone-800">{policy.readRole}</td>
                <td className="px-4 py-3 font-semibold text-stone-800">{policy.writeRole}</td>
                <td className="px-4 py-3 text-xs text-stone-600">{policy.readPermissions.length ? policy.readPermissions.join(', ') : 'role only'}</td>
                <td className="px-4 py-3 text-xs text-stone-600">{policy.writePermissions.length ? policy.writePermissions.join(', ') : 'role only'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
