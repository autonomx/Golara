import Link from 'next/link';
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { InquiryBoard } from '@/components/admin/InquiryBoard';
import { SiteHeader } from '@/components/SiteHeader';
import { isAdminAuthConfigured, isAdminAuthenticated } from '@/lib/admin-auth';
import { getHomepageContent, listAdminCategories, listAdminProducts, listInquiries, listInquiryStatusCounts, listMedia } from '@/lib/cms/catalog-repository';
import { hasDatabase } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ status?: string; message?: string; inquiryStatus?: string }> }) {
  const { status, message, inquiryStatus } = await searchParams;
  const [categories, products, homepage, media, inquiries, inquiryCounts, authenticated] = await Promise.all([
    listAdminCategories(),
    listAdminProducts(),
    getHomepageContent(),
    listMedia(),
    listInquiries(inquiryStatus),
    listInquiryStatusCounts(),
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
              Manage homepage content, product categories, media, customer inquiries, and product cards from one place.
            </p>
          </div>
          {!authenticated ? (
            <Link href="/admin/login" className="rounded-full bg-rosewood px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-rosewood/20">
              {authConfigured ? 'Sign in' : 'Configure auth'}
            </Link>
          ) : null}
        </div>
        <div className="mt-10 grid gap-12">
          <InquiryBoard inquiries={inquiries} counts={inquiryCounts} activeStatus={inquiryStatus} />
          <AdminDashboard
            categories={categories}
            products={products}
            homepage={homepage}
            media={media}
            databaseReady={hasDatabase()}
            authenticated={authenticated}
            status={status}
            message={message}
          />
        </div>
      </section>
    </main>
  );
}
