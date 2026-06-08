import { updateStoreSettingAction } from '@/app/admin/settings/actions';
import type { StoreSetting } from '@/lib/catalog';
import { resolveStorefrontLocale } from '@/lib/i18n/resolve-locale';
import type { SupportedLocale } from '@/lib/i18n/locales';

type AdminLocale = 'en' | 'fa';

const copy = {
  en: {
    eyebrow: 'Settings',
    title: 'Store settings',
    body: 'Manage the public store identity, default locale, currency, timezone, and launch mode used across admin and storefront workflows.',
    databaseUnavailable: 'Database settings are unavailable until DATABASE_URL is configured. Showing safe defaults.',
    storeName: 'Store name',
    legalName: 'Legal name',
    supportEmail: 'Support email',
    supportPhone: 'Support phone',
    defaultLocale: 'Default locale',
    defaultCurrency: 'Default currency',
    timezone: 'Timezone',
    storefrontBaseUrl: 'Storefront base URL',
    maintenanceMode: 'Maintenance mode',
    save: 'Save store settings'
  },
  fa: {
    eyebrow: 'تنظیمات',
    title: 'تنظیمات فروشگاه',
    body: 'هویت عمومی فروشگاه، زبان پیش‌فرض، ارز، منطقه زمانی و حالت راه‌اندازی را برای مدیریت و فروشگاه تنظیم کنید.',
    databaseUnavailable: 'تنظیمات پایگاه داده تا زمان پیکربندی DATABASE_URL در دسترس نیست. مقادیر امن پیش‌فرض نمایش داده می‌شوند.',
    storeName: 'نام فروشگاه',
    legalName: 'نام حقوقی',
    supportEmail: 'ایمیل پشتیبانی',
    supportPhone: 'تلفن پشتیبانی',
    defaultLocale: 'زبان پیش‌فرض',
    defaultCurrency: 'ارز پیش‌فرض',
    timezone: 'منطقه زمانی',
    storefrontBaseUrl: 'نشانی پایه فروشگاه',
    maintenanceMode: 'حالت تعمیر و نگهداری',
    save: 'ذخیره تنظیمات فروشگاه'
  }
} as const;

function localeKey(locale?: SupportedLocale | string | null): AdminLocale {
  return locale?.toLowerCase().startsWith('fa') ? 'fa' : 'en';
}

const inputClass = 'rounded-md border border-stone-200 bg-white px-3 py-2 text-sm text-stone-800 outline-none transition focus:border-rosewood focus-visible:ring-4 focus-visible:ring-olive/20 disabled:cursor-not-allowed disabled:bg-stone-100';

export async function AdminStoreSettingsPanel({ setting, databaseReady, locale }: { setting: StoreSetting; databaseReady: boolean; locale?: SupportedLocale | string | null }) {
  const activeLocale = locale ?? await resolveStorefrontLocale();
  const labels = copy[localeKey(activeLocale)];

  return (
    <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-stone-500">{labels.eyebrow}</p>
        <h2 className="mt-1 text-2xl font-bold text-stone-950">{labels.title}</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">{labels.body}</p>
      </div>
      {!databaseReady ? (
        <div className="mt-5 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">{labels.databaseUnavailable}</div>
      ) : null}
      <form action={updateStoreSettingAction} className="mt-6 grid gap-4 rounded-md border border-stone-200 bg-stone-50 p-4">
        <div className="grid gap-3 md:grid-cols-2">
          <label className="grid gap-2 text-sm font-semibold text-stone-800">
            {labels.storeName}
            <input className={inputClass} name="storeName" defaultValue={setting.storeName} disabled={!databaseReady} />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-stone-800">
            {labels.legalName}
            <input className={inputClass} name="legalName" defaultValue={setting.legalName ?? ''} disabled={!databaseReady} />
          </label>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="grid gap-2 text-sm font-semibold text-stone-800">
            {labels.supportEmail}
            <input className={inputClass} name="supportEmail" type="email" defaultValue={setting.supportEmail ?? ''} disabled={!databaseReady} />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-stone-800">
            {labels.supportPhone}
            <input className={inputClass} name="supportPhone" defaultValue={setting.supportPhone ?? ''} disabled={!databaseReady} />
          </label>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <label className="grid gap-2 text-sm font-semibold text-stone-800">
            {labels.defaultLocale}
            <input className={inputClass} name="defaultLocale" defaultValue={setting.defaultLocale} disabled={!databaseReady} />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-stone-800">
            {labels.defaultCurrency}
            <input className={inputClass} name="defaultCurrency" defaultValue={setting.defaultCurrency} disabled={!databaseReady} />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-stone-800">
            {labels.timezone}
            <input className={inputClass} name="timezone" defaultValue={setting.timezone} disabled={!databaseReady} />
          </label>
        </div>
        <label className="grid gap-2 text-sm font-semibold text-stone-800">
          {labels.storefrontBaseUrl}
          <input className={inputClass} name="storefrontBaseUrl" defaultValue={setting.storefrontBaseUrl ?? ''} disabled={!databaseReady} />
        </label>
        <label className="flex items-center gap-2 rounded-md border border-stone-200 bg-white px-3 py-2 text-sm font-semibold text-stone-700">
          <input type="hidden" name="isMaintenanceMode" value="false" />
          <input name="isMaintenanceMode" type="checkbox" defaultChecked={setting.isMaintenanceMode} disabled={!databaseReady} />
          {labels.maintenanceMode}
        </label>
        <button className="w-fit rounded-full bg-rosewood px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-rosewood/20 disabled:cursor-not-allowed disabled:bg-stone-300 disabled:shadow-none" type="submit" disabled={!databaseReady}>
          {labels.save}
        </button>
      </form>
    </section>
  );
}
