import Link from 'next/link';
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { SiteHeader } from '@/components/SiteHeader';
import { isAdminAuthConfigured, isAdminAuthenticated } from '@/lib/admin-auth';
import { getHomepageContent, listAdminCategories, listAdminProducts } from '@/lib/cms/catalog-repository';
import { hasDatabase } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const [categories, products, homepage, authenticated] = await Promise.all([
    listAdminCategories(),
    listAdminProducts(),
    getHomepageContent(),
    isAdminAuthenticated()
  ]);

  const authConfigured = isAdminAuthConfigured();

  return (
    <main>
      <SiteHeader />
      <section className="mx-auto max-w-7xl px-5 py-14">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-olive">Admin CMS</p>
            <h1 className="mt-3 font-display text-6xl text-rosewood">Edit Golara without Joomla.</h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-stone-700">
              Manage homepage content, product categories, and product cards from one place. Phase 2.1 adds an admin login gate before production-ready roles.
            </p>
          </div>
          {!authenticated ? (
            <Link href="/admin/login" className="rounded-full bg-rosewood px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-rosewood/20">
              {authConfigured ? 'Sign in' : 'Configure auth'}
            </Link>
          ) : null}
        </div>
        <div className="mt-10">
          <AdminDashboard categories={categories} products={products} homepage={homepage} databaseReady={hasDatabase()} authenticated={authenticated} />
        </div>
      </section>
    </main>
  );
}
