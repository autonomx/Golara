import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { SiteHeader } from '@/components/SiteHeader';
import { getHomepageContent, listAdminCategories, listAdminProducts } from '@/lib/cms/catalog-repository';
import { hasDatabase } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const [categories, products, homepage] = await Promise.all([
    listAdminCategories(),
    listAdminProducts(),
    getHomepageContent()
  ]);

  return (
    <main>
      <SiteHeader />
      <section className="mx-auto max-w-7xl px-5 py-14">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-olive">Admin CMS</p>
        <h1 className="mt-3 font-display text-6xl text-rosewood">Edit Golara without Joomla.</h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-stone-700">
          Manage homepage content, product categories, and product cards from one place. Phase 2 keeps this intentionally simple and database-backed; auth and roles come next.
        </p>
        <div className="mt-10">
          <AdminDashboard categories={categories} products={products} homepage={homepage} databaseReady={hasDatabase()} />
        </div>
      </section>
    </main>
  );
}
