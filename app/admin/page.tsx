import { SiteHeader } from '@/components/SiteHeader';

const adminModules = [
  ['Products', 'Create and edit products, prices, product codes, images, stock, and availability badges.'],
  ['Categories', 'Manage collections such as bouquets, flower boxes, weddings, events, condolences, and birthday gifts.'],
  ['Homepage', 'Edit hero copy, banners, featured categories, best-seller rows, and seasonal campaigns.'],
  ['Orders', 'Track WhatsApp inquiries first, then full checkout and delivery scheduling later.'],
  ['Media Library', 'Upload and reuse product, banner, and gallery images.']
];

export default function AdminPreviewPage() {
  return (
    <main>
      <SiteHeader />
      <section className="mx-auto max-w-7xl px-5 py-14">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-olive">CMS plan</p>
        <h1 className="mt-3 font-display text-6xl text-rosewood">Editable like Joomla, built custom.</h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-stone-700">This page is a Phase 1 placeholder for the admin dashboard. In Phase 2 it becomes a protected dashboard backed by Prisma and PostgreSQL, so the shop owner can update the storefront without touching code.</p>
        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {adminModules.map(([title, description]) => (
            <article key={title} className="rounded-3xl border border-rosewood/10 bg-white p-6 shadow-sm">
              <h2 className="font-display text-3xl text-rosewood">{title}</h2>
              <p className="mt-3 text-sm leading-6 text-stone-600">{description}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
