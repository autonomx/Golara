import { updateStorefrontNavigationMenuAction } from '@/app/admin/settings/actions';
import { AdminHomepageBannerMediaSettingsPanel } from '@/components/admin/AdminHomepageBannerMediaSettingsPanel';
import { homepageBannerMediaSettingsService } from '@/lib/settings/homepage-banner-media-settings';
import type { StorefrontNavigationMenu } from '@/lib/settings/storefront-navigation-menu';

const inputClass = 'rounded-md border border-stone-200 bg-white px-3 py-2 text-sm text-stone-800 outline-none transition focus:border-rosewood focus-visible:ring-4 focus-visible:ring-olive/20 disabled:cursor-not-allowed disabled:bg-stone-100';

export async function AdminStorefrontNavigationPanel({ menu, databaseReady }: { menu: StorefrontNavigationMenu; databaseReady: boolean }) {
  const homepageBannerMediaSetting = await homepageBannerMediaSettingsService.get();
  const serializedItems = JSON.stringify(
    menu.items.map((item) => ({
      label: item.label,
      href: item.href,
      locale: item.locale ?? null,
      isVisible: item.isVisible,
      opensInNewTab: item.opensInNewTab,
      sortOrder: item.sortOrder
    })),
    null,
    2
  );

  return (
    <>
      <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-stone-500">Settings</p>
          <h2 className="mt-1 text-2xl font-bold text-stone-950">Storefront navigation</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">Manage the primary storefront menu items without hardcoding header links. This foundation uses JSON editing until a richer drag-and-drop menu builder is added.</p>
        </div>
        {!databaseReady ? (
          <div className="mt-5 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">Database settings are unavailable until DATABASE_URL is configured. Showing safe defaults.</div>
        ) : null}
        <form action={updateStorefrontNavigationMenuAction} className="mt-6 grid gap-4 rounded-md border border-stone-200 bg-stone-50 p-4">
          <div className="grid gap-3 md:grid-cols-3">
            <label className="grid gap-2 text-sm font-semibold text-stone-800">
              Key
              <input className={inputClass} name="key" defaultValue={menu.key} disabled={!databaseReady} />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-stone-800">
              Label
              <input className={inputClass} name="label" defaultValue={menu.label} disabled={!databaseReady} />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-stone-800">
              Locale override
              <input className={inputClass} name="locale" defaultValue={menu.locale ?? ''} placeholder="Optional" disabled={!databaseReady} />
            </label>
          </div>
          <label className="grid gap-2 text-sm font-semibold text-stone-800">
            Menu items JSON
            <textarea className={`${inputClass} min-h-72 font-mono text-xs`} name="itemsJson" defaultValue={serializedItems} disabled={!databaseReady} />
          </label>
          <label className="flex items-center gap-2 rounded-md border border-stone-200 bg-white px-3 py-2 text-sm font-semibold text-stone-700">
            <input type="hidden" name="isActive" value="false" />
            <input name="isActive" type="checkbox" defaultChecked={menu.isActive} disabled={!databaseReady} />
            Active menu
          </label>
          <button className="w-fit rounded-full bg-rosewood px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-rosewood/20 disabled:cursor-not-allowed disabled:bg-stone-300 disabled:shadow-none" type="submit" disabled={!databaseReady}>
            Save navigation menu
          </button>
        </form>
      </section>
      <AdminHomepageBannerMediaSettingsPanel setting={homepageBannerMediaSetting} databaseReady={databaseReady} />
    </>
  );
}
