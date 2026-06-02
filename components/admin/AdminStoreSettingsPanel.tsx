import { updateStoreSettingAction } from '@/app/admin/settings/actions';
import type { StoreSetting } from '@/lib/catalog';

const inputClass = 'rounded-md border border-stone-200 bg-white px-3 py-2 text-sm text-stone-800 outline-none transition focus:border-rosewood focus-visible:ring-4 focus-visible:ring-olive/20 disabled:cursor-not-allowed disabled:bg-stone-100';

export function AdminStoreSettingsPanel({ setting, databaseReady }: { setting: StoreSetting; databaseReady: boolean }) {
  return (
    <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-stone-500">Settings</p>
        <h2 className="mt-1 text-2xl font-bold text-stone-950">Store settings</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">Manage the public store identity, default locale, currency, timezone, and launch mode used across admin and storefront workflows.</p>
      </div>
      {!databaseReady ? (
        <div className="mt-5 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">Database settings are unavailable until DATABASE_URL is configured. Showing safe defaults.</div>
      ) : null}
      <form action={updateStoreSettingAction} className="mt-6 grid gap-4 rounded-md border border-stone-200 bg-stone-50 p-4">
        <div className="grid gap-3 md:grid-cols-2">
          <label className="grid gap-2 text-sm font-semibold text-stone-800">
            Store name
            <input className={inputClass} name="storeName" defaultValue={setting.storeName} disabled={!databaseReady} />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-stone-800">
            Legal name
            <input className={inputClass} name="legalName" defaultValue={setting.legalName ?? ''} disabled={!databaseReady} />
          </label>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="grid gap-2 text-sm font-semibold text-stone-800">
            Support email
            <input className={inputClass} name="supportEmail" type="email" defaultValue={setting.supportEmail ?? ''} disabled={!databaseReady} />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-stone-800">
            Support phone
            <input className={inputClass} name="supportPhone" defaultValue={setting.supportPhone ?? ''} disabled={!databaseReady} />
          </label>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <label className="grid gap-2 text-sm font-semibold text-stone-800">
            Default locale
            <input className={inputClass} name="defaultLocale" defaultValue={setting.defaultLocale} disabled={!databaseReady} />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-stone-800">
            Default currency
            <input className={inputClass} name="defaultCurrency" defaultValue={setting.defaultCurrency} disabled={!databaseReady} />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-stone-800">
            Timezone
            <input className={inputClass} name="timezone" defaultValue={setting.timezone} disabled={!databaseReady} />
          </label>
        </div>
        <label className="grid gap-2 text-sm font-semibold text-stone-800">
          Storefront base URL
          <input className={inputClass} name="storefrontBaseUrl" defaultValue={setting.storefrontBaseUrl ?? ''} disabled={!databaseReady} />
        </label>
        <label className="flex items-center gap-2 rounded-md border border-stone-200 bg-white px-3 py-2 text-sm font-semibold text-stone-700">
          <input type="hidden" name="isMaintenanceMode" value="false" />
          <input name="isMaintenanceMode" type="checkbox" defaultChecked={setting.isMaintenanceMode} disabled={!databaseReady} />
          Maintenance mode
        </label>
        <button className="w-fit rounded-full bg-rosewood px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-rosewood/20 disabled:cursor-not-allowed disabled:bg-stone-300 disabled:shadow-none" type="submit" disabled={!databaseReady}>
          Save store settings
        </button>
      </form>
    </section>
  );
}
