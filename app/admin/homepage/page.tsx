import Image from 'next/image';
import Link from 'next/link';
import { BadgePercent, BarChart3, ClipboardList, FileText, Home, ImageIcon, LayoutDashboard, LogIn, Package, Settings, ShoppingBag, ShieldCheck, Users } from 'lucide-react';
import { MediaSelectWithPreview } from '@/components/admin/MediaSelectWithPreview';
import { getHomepageContent, listAdminCategories, listHomepageCategories, listMedia } from '@/lib/cms/catalog-repository';
import { isAdminAuthConfigured, isAdminAuthenticated } from '@/lib/admin-auth';
import { homepageBannerSlides } from '@/lib/homepage-assets';
import type { Category, MediaItem } from '@/lib/catalog';
import { updateExpandedHomepageAction } from '@/app/admin/homepage/actions';
import { addHomepageCategoryTileAction, removeHomepageCategoryTileAction, updateHomepageCategoryTileAction } from '@/app/admin/homepage/category-actions';

export const dynamic = 'force-dynamic';

const inputClass = 'w-full rounded-lg border border-rosewood/15 bg-white px-4 py-3 text-stone-800 outline-none transition focus:border-rosewood focus-visible:ring-4 focus-visible:ring-olive/20 disabled:cursor-not-allowed disabled:bg-stone-100';
const textAreaClass = 'min-h-28 w-full rounded-lg border border-rosewood/15 bg-white px-4 py-3 text-stone-800 outline-none transition focus:border-rosewood focus-visible:ring-4 focus-visible:ring-olive/20 disabled:cursor-not-allowed disabled:bg-stone-100';
const buttonClass = 'rounded-full bg-rosewood px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-rosewood/15 disabled:cursor-not-allowed disabled:bg-stone-300 disabled:shadow-none';
const secondaryButtonClass = 'rounded-full border border-rosewood/15 bg-white px-5 py-2.5 text-sm font-semibold text-rosewood disabled:cursor-not-allowed disabled:text-stone-400';
const dangerButtonClass = 'rounded-full border border-red-200 bg-red-50 px-5 py-2.5 text-sm font-semibold text-red-700 disabled:cursor-not-allowed disabled:text-stone-400';
const sectionClass = 'rounded-lg border border-stone-200 bg-white p-5 shadow-sm';
const occasionPageSize = 10;

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

function parsePage(value?: string) {
  const parsed = Number.parseInt(value ?? '1', 10);
  return Number.isFinite(parsed) ? Math.max(1, parsed) : 1;
}

function pageHref(page: number) {
  return page > 1 ? `/admin/homepage?occasionPage=${page}` : '/admin/homepage';
}

function Field({ label, name, defaultValue, placeholder, disabled = false, required = false, type = 'text' }: { label: string; name: string; defaultValue?: string | number; placeholder?: string; disabled?: boolean; required?: boolean; type?: string }) {
  return <label className="grid gap-2 text-sm font-semibold text-rosewood">{label}<input className={inputClass} name={name} type={type} defaultValue={defaultValue ?? ''} placeholder={placeholder} disabled={disabled} required={required} /></label>;
}

function TextArea({ label, name, defaultValue, disabled = false, required = false }: { label: string; name: string; defaultValue?: string; disabled?: boolean; required?: boolean }) {
  return <label className="grid gap-2 text-sm font-semibold text-rosewood">{label}<textarea className={textAreaClass} name={name} defaultValue={defaultValue ?? ''} disabled={disabled} required={required} /></label>;
}

function Toggle({ label, name, defaultChecked, disabled }: { label: string; name: string; defaultChecked?: boolean; disabled: boolean }) {
  return <label className="flex items-center gap-2 rounded-lg border border-rosewood/10 bg-white px-4 py-3 text-sm font-semibold text-rosewood"><input name={name} type="checkbox" defaultChecked={defaultChecked} disabled={disabled} />{label}</label>;
}

function AdminSidebar({ authenticated, authConfigured }: { authenticated: boolean; authConfigured: boolean }) {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-stone-200 bg-white lg:flex lg:flex-col">
      <div className="border-b border-stone-200 px-5 py-5"><Link href="/admin" className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-md bg-rosewood font-display text-xl text-white">G</span><span><span className="block text-sm font-bold text-stone-950">Golara</span><span className="block text-xs font-medium text-stone-500">Operations console</span></span></Link></div>
      <nav aria-label="Admin navigation" className="flex-1 overflow-y-auto px-3 py-4"><div className="grid gap-5">{sidebarSections.map((section) => <div key={section.label}><p className="px-3 pb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-stone-400">{section.label}</p><div className="grid gap-1">{section.items.map((item) => { const Icon = item.icon; const active = item.key === 'homepage'; return <Link key={item.href} href={item.href} aria-current={active ? 'page' : undefined} className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold transition ${active ? 'bg-rosewood text-white shadow-sm' : 'text-stone-700 hover:bg-stone-100 hover:text-stone-950'}`}><Icon aria-hidden="true" className="h-4 w-4" />{item.label}</Link>; })}</div></div>)}</div></nav>
      <div className="border-t border-stone-200 p-4">{authenticated ? <div className="rounded-md border border-stone-200 bg-stone-50 p-3"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">Signed in</p><p className="mt-1 text-sm font-semibold text-stone-900">Admin</p></div> : <Link href="/admin/login" className="flex items-center justify-center gap-2 rounded-md bg-rosewood px-4 py-2.5 text-sm font-semibold text-white"><LogIn aria-hidden="true" className="h-4 w-4" />{authConfigured ? 'Sign in' : 'Configure auth'}</Link>}</div>
    </aside>
  );
}

function CategoryTileEditor({ category, categories, media, disabled, occasionPage }: { category: Category; categories: Category[]; media: MediaItem[]; disabled: boolean; occasionPage: number }) {
  const categoryMedia = media.filter((item) => item.mediaCategory === 'category' || item.mediaCategory === 'homepageCategory' || item.mediaCategory === 'general' || item.url === category.image);
  return (
    <details className="rounded-lg border border-rosewood/10 bg-[#fffdfb] p-4 shadow-sm">
      <summary className="cursor-pointer list-none"><div className="grid gap-4 md:grid-cols-[160px_1fr_auto] md:items-center"><div className="relative h-28 overflow-hidden rounded-lg bg-blush">{category.image ? <Image src={category.image} alt={category.title} fill className="object-cover" sizes="160px" /> : null}</div><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-olive">{category.eyebrow}</p><h4 className="font-display text-2xl text-rosewood">{category.title}</h4><p className="mt-1 line-clamp-2 text-sm text-stone-600">{category.description}</p></div><span className="rounded-full border border-rosewood/15 bg-white px-4 py-2 text-sm font-semibold text-rosewood">Edit tile</span></div></summary>
      <div className="mt-5 grid gap-4">
        <form action={updateHomepageCategoryTileAction.bind(null, category.id ?? '')} className="grid gap-4">
          <input type="hidden" name="occasionPage" value={occasionPage} />
          <input type="hidden" name="existingImage" value={category.image ?? ''} />
          <div className="grid gap-4 md:grid-cols-2"><Field label="Tile title" name="title" defaultValue={category.title} disabled={disabled || !category.id} required /><Field label="Slug" name="slug" defaultValue={category.slug} disabled={disabled || !category.id} required /></div>
          <div className="grid gap-4 md:grid-cols-2"><Field label="Eyebrow" name="eyebrow" defaultValue={category.eyebrow} disabled={disabled || !category.id} /><Field label="Sort order" name="sortOrder" type="number" defaultValue={category.sortOrder ?? 100} disabled={disabled || !category.id} /></div>
          <TextArea label="Description" name="description" defaultValue={category.description} disabled={disabled || !category.id} />
          <MediaSelectWithPreview label="Tile image from media library" name="selectedMediaUrl" media={categoryMedia} defaultValue={category.image} disabled={disabled || !category.id} className={inputClass} />
          <Field label="Manual image URL" name="imageUrl" defaultValue="" placeholder={category.image} disabled={disabled || !category.id} />
          <label className="grid gap-2 text-sm font-semibold text-rosewood">Parent category<select className={inputClass} name="parentId" defaultValue={category.parentId ?? ''} disabled={disabled || !category.id}><option value="">No parent</option>{categories.filter((candidate) => candidate.id !== category.id).map((candidate) => <option key={candidate.id ?? candidate.slug} value={candidate.id ?? ''}>{candidate.parentTitle ? `${candidate.parentTitle} / ${candidate.title}` : candidate.title}</option>)}</select></label>
          <div className="grid gap-3 md:grid-cols-2"><Toggle label="Show on homepage" name="showOnHomepage" defaultChecked={category.showOnHomepage ?? true} disabled={disabled || !category.id} /><Toggle label="Active" name="isActive" defaultChecked={category.isActive ?? true} disabled={disabled || !category.id} /></div>
          <button className={secondaryButtonClass} type="submit" disabled={disabled || !category.id}>Save occasion tile</button>
        </form>
        <form action={removeHomepageCategoryTileAction.bind(null, category.id ?? '')}>
          <input type="hidden" name="occasionPage" value={occasionPage} />
          <button className={dangerButtonClass} type="submit" disabled={disabled || !category.id}>Remove from homepage</button>
        </form>
      </div>
    </details>
  );
}

function HomepageCategoryManager({ categories, homepageCategories, media, disabled, occasionPage }: { categories: Category[]; homepageCategories: Category[]; media: MediaItem[]; disabled: boolean; occasionPage: number }) {
  const homepageIds = new Set(homepageCategories.map((category) => category.id).filter(Boolean));
  const addableCategories = categories.filter((category) => category.id && !homepageIds.has(category.id));
  const pageCount = Math.max(1, Math.ceil(homepageCategories.length / occasionPageSize));
  const currentPage = Math.min(occasionPage, pageCount);
  const start = (currentPage - 1) * occasionPageSize;
  const pagedCategories = homepageCategories.slice(start, start + occasionPageSize);

  return (
    <section className={sectionClass}>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-olive">Displayed occasions</p><h3 className="mt-1 font-display text-3xl text-rosewood">Homepage occasion tiles</h3><p className="mt-2 max-w-3xl text-sm text-stone-600">Showing {pagedCategories.length ? `${start + 1}-${start + pagedCategories.length}` : '0'} of {homepageCategories.length}. Edit, remove, or add categories shown in the homepage occasion section.</p></div>
        <div className="flex items-center gap-2 text-sm font-semibold"><Link aria-disabled={currentPage <= 1} href={pageHref(Math.max(1, currentPage - 1))} className={`rounded-md border px-3 py-2 ${currentPage <= 1 ? 'pointer-events-none border-stone-200 text-stone-300' : 'border-rosewood/20 text-rosewood'}`}>Previous</Link><span className="rounded-md border border-stone-200 bg-stone-50 px-3 py-2 text-stone-700">Page {currentPage} of {pageCount}</span><Link aria-disabled={currentPage >= pageCount} href={pageHref(Math.min(pageCount, currentPage + 1))} className={`rounded-md border px-3 py-2 ${currentPage >= pageCount ? 'pointer-events-none border-stone-200 text-stone-300' : 'border-rosewood/20 text-rosewood'}`}>Next</Link></div>
      </div>
      <form action={addHomepageCategoryTileAction} className="mb-6 grid gap-3 rounded-lg border border-rosewood/10 bg-cream p-4 md:grid-cols-[1fr_180px_auto] md:items-end">
        <label className="grid gap-2 text-sm font-semibold text-rosewood">Add another category to homepage<select className={inputClass} name="categoryId" disabled={disabled || addableCategories.length === 0} required><option value="">Choose category...</option>{addableCategories.map((category) => <option key={category.id ?? category.slug} value={category.id ?? ''}>{category.parentTitle ? `${category.parentTitle} / ${category.title}` : category.title}</option>)}</select></label>
        <Field label="Sort order" name="sortOrder" type="number" defaultValue={100} disabled={disabled || addableCategories.length === 0} />
        <button className={buttonClass} type="submit" disabled={disabled || addableCategories.length === 0}>Add to homepage</button>
      </form>
      {pagedCategories.length ? <div className="grid gap-4">{pagedCategories.map((category) => <CategoryTileEditor key={category.id ?? category.slug} category={category} categories={categories} media={media} disabled={disabled} occasionPage={currentPage} />)}</div> : <div className="rounded-lg border border-dashed border-stone-300 bg-stone-50 p-8 text-center text-sm text-stone-600">No homepage occasion tiles are currently selected. Add one above.</div>}
    </section>
  );
}

export default async function AdminHomepagePage({ searchParams }: { searchParams: Promise<{ status?: string; occasionPage?: string }> }) {
  const [{ status, occasionPage }, homepage, media, categories, homepageCategories, authenticated] = await Promise.all([searchParams, getHomepageContent(), listMedia(), listAdminCategories(), listHomepageCategories(), isAdminAuthenticated()]);
  const authConfigured = isAdminAuthConfigured();
  const disabled = !authenticated;
  const fallbackHeroImage = homepageBannerSlides[0]?.image ?? '';
  const heroImage = homepage.heroImage || fallbackHeroImage;
  const heroMedia = media.filter((item) => item.mediaCategory === 'homepageHero' || item.mediaCategory === 'general' || item.url === heroImage);
  const parsedOccasionPage = parsePage(occasionPage);

  return (
    <main className="min-h-screen overflow-x-hidden bg-stone-50 lg:pl-72">
      <AdminSidebar authenticated={authenticated} authConfigured={authConfigured} />
      <header className="sticky top-0 z-20 border-b border-stone-200 bg-white/95 backdrop-blur"><div className="flex min-h-16 flex-wrap items-center justify-between gap-3 px-4 py-3 lg:px-6"><div className="flex min-w-0 items-center gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-stone-200 bg-stone-50 text-stone-700"><Home className="h-4 w-4" /></span><div className="min-w-0"><h1 className="text-lg font-bold text-stone-950">Homepage</h1><p className="truncate text-xs font-medium text-stone-500">Edit hero, calls to action, homepage sections, footer copy, and displayed occasions.</p></div></div><Link href="/" className="rounded-md border border-rosewood/15 bg-white px-4 py-2 text-sm font-semibold text-rosewood">View storefront</Link></div></header>
      <section className="grid min-w-0 gap-6 px-4 py-6 lg:px-6">
        {status ? <div className="rounded-lg border border-olive/20 bg-white p-4 text-sm font-semibold text-olive shadow-sm">{status === 'homepage-category-removed' ? 'Homepage occasion tile removed.' : status === 'homepage-category-added' ? 'Homepage occasion tile added.' : status === 'homepage-category-updated' ? 'Homepage occasion tile saved.' : 'Homepage saved.'}</div> : null}
        <section className={sectionClass}><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-stone-500">Admin / Content</p><h2 className="mt-1 text-2xl font-bold text-stone-950">Homepage editor</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">Control the live homepage hero, CTAs, trust chips, occasion section copy, footer text, and every occasion tile displayed on the homepage.</p></div>{!authenticated ? <Link href="/admin/login" className={buttonClass}>{authConfigured ? 'Sign in to edit' : 'Configure auth'}</Link> : null}</div></section>
        <form action={updateExpandedHomepageAction} className="grid gap-6">
          <section className={sectionClass}><div className="grid gap-6 xl:grid-cols-[1fr_360px]"><div className="grid gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-olive">Hero</p><h3 className="mt-1 font-display text-3xl text-rosewood">Main banner content</h3></div><div className="grid gap-4 md:grid-cols-2"><Field label="Hero eyebrow" name="eyebrow" defaultValue={homepage.eyebrow} disabled={disabled} /><Field label="Hero title" name="title" defaultValue={homepage.title} disabled={disabled} required /></div><TextArea label="Hero body" name="body" defaultValue={homepage.body} disabled={disabled} /><input type="hidden" name="existingHeroImage" value={heroImage} /><MediaSelectWithPreview label="Hero image from media library" name="heroSelectedMediaUrl" media={heroMedia} defaultValue={heroImage} disabled={disabled} className={inputClass} /><div className="grid gap-4 md:grid-cols-2"><Field label="Manual hero image URL" name="heroImageUrl" defaultValue="" placeholder={heroImage} disabled={disabled} /><Field label="Hero image alt text" name="heroImageAlt" defaultValue={homepage.heroImageAlt} placeholder="Luxury floral hero image" disabled={disabled} /></div></div><div className="overflow-hidden rounded-lg border border-rosewood/10 bg-stone-100">{heroImage ? <Image src={heroImage} alt={homepage.heroImageAlt || homepage.title} width={720} height={520} className="h-full min-h-72 w-full object-cover" /> : null}</div></div></section>
          <section className={sectionClass}><div className="mb-4"><p className="text-xs font-bold uppercase tracking-[0.18em] text-olive">Hero actions</p><h3 className="mt-1 font-display text-3xl text-rosewood">Buttons, chips, and badge</h3></div><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"><Field label="Primary CTA label" name="primaryCtaLabel" defaultValue={homepage.primaryCtaLabel} disabled={disabled} /><Field label="Primary CTA URL" name="primaryCtaHref" defaultValue={homepage.primaryCtaHref} disabled={disabled} /><Field label="Secondary CTA label" name="secondaryCtaLabel" defaultValue={homepage.secondaryCtaLabel} disabled={disabled} /><Field label="Secondary CTA URL" name="secondaryCtaHref" defaultValue={homepage.secondaryCtaHref} disabled={disabled} /><Field label="Third CTA label" name="tertiaryCtaLabel" defaultValue={homepage.tertiaryCtaLabel} placeholder="Best sellers" disabled={disabled} /><Field label="Third CTA URL" name="tertiaryCtaHref" defaultValue={homepage.tertiaryCtaHref} placeholder="/#best-sellers" disabled={disabled} /><Field label="Trust chip 1" name="trustItemOne" defaultValue={homepage.trustItemOne} placeholder="Same-day options" disabled={disabled} /><Field label="Trust chip 2" name="trustItemTwo" defaultValue={homepage.trustItemTwo} placeholder="Premium finish" disabled={disabled} /><Field label="Trust chip 3" name="trustItemThree" defaultValue={homepage.trustItemThree} placeholder="Sales guidance" disabled={disabled} /><Field label="Hero badge" name="studioBadge" defaultValue={homepage.studioBadge} placeholder="Golara studio selection" disabled={disabled} /></div></section>
          <section className={sectionClass}><div className="mb-4"><p className="text-xs font-bold uppercase tracking-[0.18em] text-olive">Sections</p><h3 className="mt-1 font-display text-3xl text-rosewood">Occasion/category block</h3></div><div className="grid gap-4 md:grid-cols-2"><Field label="Section eyebrow" name="collectionsEyebrow" defaultValue={homepage.collectionsEyebrow} placeholder="Occasions" disabled={disabled} /><Field label="Section title" name="collectionsTitle" defaultValue={homepage.collectionsTitle} placeholder="Shop by occasion" disabled={disabled} /></div><div className="mt-4"><TextArea label="Section body" name="collectionsBody" defaultValue={homepage.collectionsBody} disabled={disabled} /></div><div className="mt-4 grid gap-4 md:grid-cols-2"><Field label="Section CTA label" name="collectionsCtaLabel" defaultValue={homepage.collectionsCtaLabel} placeholder="See all occasions" disabled={disabled} /><Field label="Section CTA URL" name="collectionsCtaHref" defaultValue={homepage.collectionsCtaHref} placeholder="/categories" disabled={disabled} /></div></section>
          <section className={sectionClass}><div className="mb-4"><p className="text-xs font-bold uppercase tracking-[0.18em] text-olive">Footer and legacy panel</p><h3 className="mt-1 font-display text-3xl text-rosewood">Footer copy and saved panel fields</h3></div><div className="grid gap-4 md:grid-cols-2"><TextArea label="Footer brand body" name="footerBody" defaultValue={homepage.footerBody} disabled={disabled} /><TextArea label="Footer service body" name="footerServiceBody" defaultValue={homepage.footerServiceBody} disabled={disabled} /></div><div className="mt-4 grid gap-4 md:grid-cols-2"><Field label="Legacy panel eyebrow" name="panelEyebrow" defaultValue={homepage.panelEyebrow} disabled={disabled} /><Field label="Legacy panel title" name="panelTitle" defaultValue={homepage.panelTitle} disabled={disabled} /></div><div className="mt-4"><TextArea label="Legacy panel body" name="panelBody" defaultValue={homepage.panelBody} disabled={disabled} /></div></section>
          <div className="sticky bottom-4 z-10 flex justify-end"><button className={buttonClass} type="submit" disabled={disabled}>Save homepage</button></div>
        </form>
        <HomepageCategoryManager categories={categories} homepageCategories={homepageCategories} media={media} disabled={disabled} occasionPage={parsedOccasionPage} />
      </section>
    </main>
  );
}
