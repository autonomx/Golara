import Image from 'next/image';
import Link from 'next/link';
import { BadgePercent, BarChart3, ClipboardList, FileText, Home, ImageIcon, LayoutDashboard, LogIn, Package, Settings, ShoppingBag, ShieldCheck, Users } from 'lucide-react';
import { createMediaFromUrlAction, updateMediaAction, updateMediaCategoryAction, uploadMediaAction } from '@/app/admin/actions';
import { isAdminAuthConfigured, isAdminAuthenticated } from '@/lib/admin-auth';
import { listMedia } from '@/lib/cms/catalog-repository';

export const dynamic = 'force-dynamic';

const inputClass = 'rounded-lg border border-rosewood/15 bg-white px-4 py-3 text-stone-800 outline-none transition focus:border-rosewood focus-visible:ring-4 focus-visible:ring-olive/20 disabled:cursor-not-allowed disabled:bg-stone-100';
const compactInputClass = 'w-full min-w-0 rounded-lg border border-rosewood/15 bg-white px-3 py-2 text-sm text-stone-800 outline-none transition focus:border-rosewood focus-visible:ring-4 focus-visible:ring-olive/20 disabled:cursor-not-allowed disabled:bg-stone-100';
const buttonClass = 'rounded-full bg-rosewood px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-rosewood/15 disabled:cursor-not-allowed disabled:bg-stone-300 disabled:shadow-none';
const secondaryButtonClass = 'rounded-full border border-rosewood/15 bg-white px-4 py-2 text-xs font-semibold text-rosewood disabled:cursor-not-allowed disabled:text-stone-400';

const mediaCategoryOptions = [
  { value: 'product', label: 'Product' },
  { value: 'category', label: 'Category' },
  { value: 'homepageHero', label: 'Homepage hero' },
  { value: 'homepageBestSeller', label: 'Homepage best seller' },
  { value: 'homepageCategory', label: 'Homepage category' },
  { value: 'general', label: 'General / other' }
];

const sidebarSections = [
  { label: 'Store', items: [
    { href: '/admin', key: 'overview', label: 'Overview', icon: LayoutDashboard },
    { href: '/admin/products', key: 'products', label: 'Products', icon: Package },
    { href: '/admin/categories', key: 'categories', label: 'Categories', icon: ClipboardList },
    { href: '/admin/media', key: 'media', label: 'Media library', icon: ImageIcon }
  ]},
  { label: 'Customer Ops', items: [
    { href: '/admin/orders', key: 'orders', label: 'Orders', icon: ShoppingBag },
    { href: '/admin/inquiries', key: 'inquiries', label: 'Inquiries', icon: Users },
    { href: '/admin/customers', key: 'customers', label: 'Customers', icon: Users },
    { href: '/admin/discounts', key: 'discounts', label: 'Discounts', icon: BadgePercent }
  ]},
  { label: 'Content', items: [
    { href: '/admin/homepage', key: 'homepage', label: 'Homepage', icon: Home },
    { href: '/admin/translations', key: 'translations', label: 'Translations', icon: FileText }
  ]},
  { label: 'System', items: [
    { href: '/admin/readiness', key: 'readiness', label: 'Readiness', icon: ShieldCheck },
    { href: '/admin/audit', key: 'audit', label: 'Audit log', icon: BarChart3 },
    { href: '/admin/staff-access', key: 'staff', label: 'Staff access', icon: Settings },
    { href: '/admin/settings', key: 'settings', label: 'Settings', icon: Settings }
  ]}
];

function normalizeMediaUrl(value: unknown) {
  if (typeof value === 'string') return value.trim() || null;
  if (value && typeof value === 'object' && 'src' in value && typeof value.src === 'string') return value.src.trim() || null;
  return null;
}

function mediaUrlLabel(value: unknown) {
  const url = normalizeMediaUrl(value);
  if (!url) return 'No URL';
  try {
    const parsed = new URL(url);
    return parsed.pathname.split('/').filter(Boolean).at(-1) ?? parsed.hostname;
  } catch {
    return url.split('/').filter(Boolean).at(-1) ?? url;
  }
}

function mediaUrlFolder(value: unknown) {
  const url = normalizeMediaUrl(value);
  if (!url) return 'unavailable';
  try {
    const parsed = new URL(url);
    const parts = parsed.pathname.split('/').filter(Boolean);
    return parts.length > 1 ? `/${parts.slice(0, -1).join('/')}` : parsed.hostname;
  } catch {
    const parts = url.split('/').filter(Boolean);
    return parts.length > 1 ? `/${parts.slice(0, -1).join('/')}` : 'local asset';
  }
}

function MediaCategorySelect({ defaultValue = 'product', disabled = false, compact = false }: { defaultValue?: string | null; disabled?: boolean; compact?: boolean }) {
  return (
    <select className={compact ? compactInputClass : inputClass} name="mediaCategory" defaultValue={defaultValue ?? 'general'} disabled={disabled} required>
      {mediaCategoryOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
    </select>
  );
}

function AdminSidebar({ authenticated, authConfigured }: { authenticated: boolean; authConfigured: boolean }) {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-stone-200 bg-white lg:flex lg:flex-col">
      <div className="border-b border-stone-200 px-5 py-5">
        <Link href="/admin" className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-md bg-rosewood font-display text-xl text-white">G</span>
          <span><span className="block text-sm font-bold text-stone-950">Golara</span><span className="block text-xs font-medium text-stone-500">Operations console</span></span>
        </Link>
      </div>
      <nav aria-label="Admin navigation" className="flex-1 overflow-y-auto px-3 py-4">
        <div className="grid gap-5">
          {sidebarSections.map((section) => (
            <div key={section.label}>
              <p className="px-3 pb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-stone-400">{section.label}</p>
              <div className="grid gap-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const active = item.key === 'media';
                  return (
                    <Link key={item.href} href={item.href} aria-current={active ? 'page' : undefined} className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold transition ${active ? 'bg-rosewood text-white shadow-sm' : 'text-stone-700 hover:bg-stone-100 hover:text-stone-950'}`}>
                      <Icon aria-hidden="true" className="h-4 w-4" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </nav>
      <div className="border-t border-stone-200 p-4">
        {authenticated ? <div className="rounded-md border border-stone-200 bg-stone-50 p-3"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">Signed in</p><p className="mt-1 text-sm font-semibold text-stone-900">Admin</p></div> : <Link href="/admin/login" className="flex items-center justify-center gap-2 rounded-md bg-rosewood px-4 py-2.5 text-sm font-semibold text-white"><LogIn aria-hidden="true" className="h-4 w-4" />{authConfigured ? 'Sign in' : 'Configure auth'}</Link>}
      </div>
    </aside>
  );
}

export default async function AdminMediaPage() {
  const [media, authenticated] = await Promise.all([listMedia(), isAdminAuthenticated()]);
  const authConfigured = isAdminAuthConfigured();
  const disabled = !authenticated;

  return (
    <main className="min-h-screen overflow-x-hidden bg-stone-50 lg:pl-72">
      <AdminSidebar authenticated={authenticated} authConfigured={authConfigured} />

      <header className="sticky top-0 z-20 border-b border-stone-200 bg-white/95 backdrop-blur">
        <div className="flex min-h-16 flex-wrap items-center justify-between gap-3 px-4 py-3 lg:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-stone-200 bg-stone-50 text-stone-700"><ImageIcon className="h-4 w-4" /></span>
            <div className="min-w-0"><h1 className="text-lg font-bold text-stone-950">Media library</h1><p className="truncate text-xs font-medium text-stone-500">Manage image uploads, URL media, category tags, and usage.</p></div>
          </div>
          <span className="rounded-md border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs font-semibold text-stone-700">{media.length} media</span>
        </div>
      </header>

      <section className="grid min-w-0 gap-6 px-4 py-6 lg:px-6">
        <section className="min-w-0 rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-stone-500">Admin / Catalog</p>
              <h2 className="mt-1 text-2xl font-bold text-stone-950">Media library</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">Manage image uploads, URL media, category tags, and usage.</p>
            </div>
            {!authenticated ? <Link href="/admin/login" className={buttonClass}>{authConfigured ? 'Sign in' : 'Configure auth'}</Link> : null}
          </div>
        </section>

        <section className="min-w-0 rounded-lg border border-rosewood/10 bg-white p-6 shadow-sm">
          <details className="rounded-lg border border-rosewood/10 bg-cream p-5">
            <summary className="cursor-pointer font-display text-3xl text-rosewood">Add image</summary>
            <div className="mt-5 grid gap-6 lg:grid-cols-2">
              <form action={createMediaFromUrlAction} className="grid gap-4 rounded-lg border border-rosewood/10 bg-white p-5 shadow-sm">
                <h3 className="font-display text-3xl text-rosewood">Add image URL</h3>
                <MediaCategorySelect disabled={disabled} />
                <label className="grid gap-2 text-sm font-semibold text-rosewood">Image URL<input className={inputClass} name="url" placeholder="https://..." disabled={disabled} required /></label>
                <label className="grid gap-2 text-sm font-semibold text-rosewood">Alt text<input className={inputClass} name="alt" placeholder="Blush rose bouquet" disabled={disabled} required /></label>
                <button className={buttonClass} type="submit" disabled={disabled}>Add media</button>
              </form>
              <form action={uploadMediaAction} className="grid gap-4 rounded-lg border border-rosewood/10 bg-white p-5 shadow-sm">
                <h3 className="font-display text-3xl text-rosewood">Upload image</h3>
                <MediaCategorySelect disabled={disabled} />
                <label className="grid gap-2 text-sm font-semibold text-rosewood">Image file<input className={inputClass} name="file" type="file" accept="image/jpeg,image/png,image/webp,image/gif" required disabled={disabled} /></label>
                <label className="grid gap-2 text-sm font-semibold text-rosewood">Alt text<input className={inputClass} name="alt" placeholder="Optional descriptive text" disabled={disabled} /></label>
                <button className={buttonClass} type="submit" disabled={disabled}>Upload image</button>
              </form>
            </div>
          </details>

          <div className="mt-8 max-h-[760px] overflow-y-auto rounded-lg border border-rosewood/10 bg-white">
            <table className="w-full table-fixed border-collapse text-left text-sm">
              <thead className="sticky top-0 z-[1] bg-cream text-xs font-semibold uppercase tracking-[0.16em] text-rosewood/70">
                <tr>
                  <th className="w-[28%] px-3 py-3">Image</th>
                  <th className="w-[20%] px-3 py-3">Category</th>
                  <th className="w-[13%] px-3 py-3">Source</th>
                  <th className="w-[21%] px-3 py-3">URL</th>
                  <th className="w-[18%] px-3 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {media.map((item) => {
                  const safeUrl = normalizeMediaUrl(item.url);
                  return (
                    <tr key={item.id ?? safeUrl ?? item.alt} className="border-t border-rosewood/10 align-top">
                      <td className="px-3 py-4">
                        <div className="flex min-w-0 gap-3">
                          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-blush">
                            {safeUrl ? <Image src={safeUrl} alt={item.alt} fill className="object-cover" sizes="56px" /> : null}
                          </div>
                          <div className="min-w-0"><div className="truncate font-semibold text-rosewood">{item.alt}</div><div className="mt-1 truncate text-xs text-stone-500">{item.createdAt ? item.createdAt.toLocaleDateString('en-CA') : 'Seed or static asset'}</div></div>
                        </div>
                      </td>
                      <td className="px-3 py-4">
                        {item.id ? (
                          <form action={updateMediaCategoryAction.bind(null, item.id)} className="grid min-w-0 gap-2">
                            <MediaCategorySelect defaultValue={item.mediaCategory} disabled={disabled} compact />
                            <button type="submit" className={secondaryButtonClass} disabled={disabled}>Save</button>
                          </form>
                        ) : <span className="truncate text-sm text-stone-700">{item.mediaCategory ?? 'general'}</span>}
                      </td>
                      <td className="px-3 py-4"><div className="grid min-w-0 gap-1 text-xs font-semibold uppercase tracking-[0.12em] text-olive"><span className="truncate">{item.source ?? 'static'}</span>{item.storageKey ? <span className="truncate text-stone-400">{item.storageKey}</span> : null}</div></td>
                      <td className="px-3 py-4"><div className="min-w-0" title={safeUrl ?? ''}><span className="inline-flex max-w-full rounded-md border border-stone-200 bg-stone-50 px-2 py-1 font-mono text-[11px] font-semibold text-stone-700"><span className="truncate">{mediaUrlLabel(item.url)}</span></span><div className="mt-1 truncate text-[11px] font-semibold uppercase tracking-[0.1em] text-olive">{mediaUrlFolder(item.url)}</div></div></td>
                      <td className="px-3 py-4">
                        {item.id ? (
                          <details className="min-w-0">
                            <summary className="cursor-pointer text-xs font-semibold text-rosewood underline-offset-4 hover:underline">Edit</summary>
                            <form action={updateMediaAction.bind(null, item.id)} className="mt-4 grid min-w-0 gap-3 rounded-lg border border-rosewood/10 bg-[#fffdfb] p-3">
                              <label className="grid min-w-0 gap-2 text-xs font-semibold text-rosewood">Image URL<input className={compactInputClass} name="url" defaultValue={safeUrl ?? ''} disabled={disabled} required /></label>
                              <label className="grid min-w-0 gap-2 text-xs font-semibold text-rosewood">Alt text<input className={compactInputClass} name="alt" defaultValue={item.alt} disabled={disabled} required /></label>
                              <MediaCategorySelect defaultValue={item.mediaCategory} disabled={disabled} compact />
                              <button className={buttonClass} type="submit" disabled={disabled}>Update</button>
                            </form>
                          </details>
                        ) : <span className="text-xs font-semibold text-stone-400">Static</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </section>
    </main>
  );
}
