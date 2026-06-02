import { updateTaxCategorySettingAction } from '@/app/admin/settings/actions';
import { formatTaxRatePercent, type TaxCategorySetting } from '@/lib/settings/tax-category-settings';

const inputClass = 'rounded-md border border-stone-200 bg-white px-3 py-2 text-sm text-stone-800 outline-none transition focus:border-rosewood focus-visible:ring-4 focus-visible:ring-olive/20 disabled:cursor-not-allowed disabled:bg-stone-100';

function basisPointsToPercent(basisPoints: number) {
  return (basisPoints / 100).toFixed(2);
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

export function AdminTaxCategorySettingsPanel({ categories, databaseReady }: { categories: TaxCategorySetting[]; databaseReady: boolean }) {
  return (
    <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-stone-500">Settings</p>
        <h2 className="mt-1 text-2xl font-bold text-stone-950">Tax categories</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">Configure tax category labels, regional rates, default status, and whether taxes apply to delivery charges. Checkout application can be wired later without changing this settings foundation.</p>
      </div>
      {!databaseReady ? (
        <div className="mt-5 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">Database settings are unavailable until DATABASE_URL is configured. Showing safe defaults.</div>
      ) : null}
      <div className="mt-6 grid gap-4">
        {categories.map((category) => (
          <form key={category.key} action={updateTaxCategorySettingAction} className="grid gap-4 rounded-md border border-stone-200 bg-stone-50 p-4">
            <div className="grid gap-3 md:grid-cols-[1fr_1fr_0.6fr]">
              <label className="grid gap-2 text-sm font-semibold text-stone-800">
                Key
                <input className={inputClass} name="key" defaultValue={category.key} disabled={!databaseReady} />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-stone-800">
                Label
                <input className={inputClass} name="label" defaultValue={category.label} disabled={!databaseReady} />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-stone-800">
                Tax rate %
                <input className={inputClass} name="taxRatePercent" inputMode="decimal" defaultValue={basisPointsToPercent(category.taxRateBasisPoints)} disabled={!databaseReady} />
                <span className="text-xs font-medium text-stone-500">Current: {formatTaxRatePercent(category.taxRateBasisPoints)}</span>
              </label>
            </div>
            <label className="grid gap-2 text-sm font-semibold text-stone-800">
              Description
              <input className={inputClass} name="description" defaultValue={category.description ?? ''} disabled={!databaseReady} />
            </label>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="grid gap-2 text-sm font-semibold text-stone-800">
                Country code
                <input className={inputClass} name="countryCode" defaultValue={category.countryCode} disabled={!databaseReady} />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-stone-800">
                Region code
                <input className={inputClass} name="regionCode" defaultValue={category.regionCode ?? ''} placeholder="Optional" disabled={!databaseReady} />
              </label>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <Toggle label="Default category" name="isDefault" defaultChecked={category.isDefault} disabled={!databaseReady} />
              <Toggle label="Active" name="isActive" defaultChecked={category.isActive} disabled={!databaseReady} />
              <Toggle label="Applies to shipping" name="appliesToShipping" defaultChecked={category.appliesToShipping} disabled={!databaseReady} />
            </div>
            <button className="w-fit rounded-full bg-rosewood px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-rosewood/20 disabled:cursor-not-allowed disabled:bg-stone-300 disabled:shadow-none" type="submit" disabled={!databaseReady}>
              Save tax category
            </button>
          </form>
        ))}
      </div>
    </section>
  );
}
