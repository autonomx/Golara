import { updateHomepageBannerMediaSettingAction } from '@/app/admin/settings/actions';
import type { HomepageBannerMediaSetting } from '@/lib/settings/homepage-banner-media-settings';

const inputClass = 'rounded-md border border-stone-200 bg-white px-3 py-2 text-sm text-stone-800 outline-none transition focus:border-rosewood focus-visible:ring-4 focus-visible:ring-olive/20 disabled:cursor-not-allowed disabled:bg-stone-100';

export function AdminHomepageBannerMediaSettingsPanel({ setting, databaseReady }: { setting: HomepageBannerMediaSetting; databaseReady: boolean }) {
  return (
    <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-stone-500">Settings</p>
        <h2 className="mt-1 text-2xl font-bold text-stone-950">Homepage banner/media</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">Manage homepage hero copy, image references, alt text, and call-to-action settings without rewriting the storefront homepage.</p>
      </div>
      {!databaseReady ? (
        <div className="mt-5 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">Database settings are unavailable until DATABASE_URL is configured. Showing safe defaults.</div>
      ) : null}
      <form action={updateHomepageBannerMediaSettingAction} className="mt-6 grid gap-4 rounded-md border border-stone-200 bg-stone-50 p-4">
        <div className="grid gap-3 md:grid-cols-3">
          <label className="grid gap-2 text-sm font-semibold text-stone-800">
            Key
            <input className={inputClass} name="key" defaultValue={setting.key} disabled={!databaseReady} />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-stone-800">
            Locale override
            <input className={inputClass} name="locale" defaultValue={setting.locale ?? ''} placeholder="Optional" disabled={!databaseReady} />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-stone-800">
            Sort order
            <input className={inputClass} name="sortOrder" type="number" defaultValue={setting.sortOrder} disabled={!databaseReady} />
          </label>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="grid gap-2 text-sm font-semibold text-stone-800">
            Eyebrow
            <input className={inputClass} name="eyebrow" defaultValue={setting.eyebrow ?? ''} disabled={!databaseReady} />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-stone-800">
            Title
            <input className={inputClass} name="title" defaultValue={setting.title} disabled={!databaseReady} />
          </label>
        </div>
        <label className="grid gap-2 text-sm font-semibold text-stone-800">
          Subtitle
          <textarea className={`${inputClass} min-h-24`} name="subtitle" defaultValue={setting.subtitle ?? ''} disabled={!databaseReady} />
        </label>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="grid gap-2 text-sm font-semibold text-stone-800">
            Media ID
            <input className={inputClass} name="mediaId" defaultValue={setting.mediaId ?? ''} placeholder="Optional Media.id" disabled={!databaseReady} />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-stone-800">
            Image URL fallback
            <input className={inputClass} name="imageUrl" defaultValue={setting.imageUrl ?? ''} placeholder="Optional external or uploaded URL" disabled={!databaseReady} />
          </label>
        </div>
        <label className="grid gap-2 text-sm font-semibold text-stone-800">
          Image alt text
          <input className={inputClass} name="imageAlt" defaultValue={setting.imageAlt ?? ''} maxLength={160} disabled={!databaseReady} />
        </label>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="grid gap-2 text-sm font-semibold text-stone-800">
            CTA label
            <input className={inputClass} name="ctaLabel" defaultValue={setting.ctaLabel ?? ''} disabled={!databaseReady} />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-stone-800">
            CTA href
            <input className={inputClass} name="ctaHref" defaultValue={setting.ctaHref ?? ''} disabled={!databaseReady} />
          </label>
        </div>
        <label className="flex items-center gap-2 rounded-md border border-stone-200 bg-white px-3 py-2 text-sm font-semibold text-stone-700">
          <input type="hidden" name="isActive" value="false" />
          <input name="isActive" type="checkbox" defaultChecked={setting.isActive} disabled={!databaseReady} />
          Active banner
        </label>
        <button className="w-fit rounded-full bg-rosewood px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-rosewood/20 disabled:cursor-not-allowed disabled:bg-stone-300 disabled:shadow-none" type="submit" disabled={!databaseReady}>
          Save homepage banner/media
        </button>
      </form>
    </section>
  );
}
