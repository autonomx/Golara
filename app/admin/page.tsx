import Link from 'next/link';
import { AdminActionBanner } from '@/components/admin/AdminActionBanner';
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { InquiryBoard } from '@/components/admin/InquiryBoard';
import { SiteHeader } from '@/components/SiteHeader';
import { isAdminAuthConfigured, isAdminAuthenticated } from '@/lib/admin-auth';
import { getHomepageContent, listAdminCategories, listAdminProducts, listInquiryPage, listInquiryStatusCounts, listMedia } from '@/lib/cms/catalog-repository';
import { hasDatabase } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

function parsePage(value?: string) {
  const parsed = Number.parseInt(value ?? '1', 10);
  return Number.isFinite(parsed) ? Math.max(1, parsed) : 1;
}

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ status?: string; message?: string; inquiryStatus?: string; inquiryPage?: string; inquirySearch?: string }> }) {
  const { status, message, inquiryStatus, inquiryPage, inquirySearch } = await searchParams;
  const [categories, products, homepage, media, inquiryPageData, inquiryCounts, authenticated] = await Promise.all([
    listAdminCategories(),
    listAdminProducts(),
    getHomepageContent(),
    listMedia(),
    listInquiryPage(inquiryStatus, parsePage(inquiryPage), undefined, inquirySearch),
    listInquiryStatusCounts(inquirySearch),
    isAdminAuthenticated()
  ]);

  const authConfigured = isAdminAuthConfigured();
  const databaseReady = hasDatabase();
  const notificationMode = process.env.INQUIRY_NOTIFICATION_MODE?.trim() || 'log';
  const hasProductionStorage = Boolean(process.env.MEDIA_STORAGE_PROVIDER?.trim());

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
          <AdminActionBanner status={status} message={message} />
          <InquiryBoard inquiryPage={inquiryPageData} counts={inquiryCounts} activeStatus={inquiryStatus} search={inquirySearch} />
          <AdminDashboard
            categories={categories}
            products={products}
            homepage={homepage}
            media={media}
            databaseReady={databaseReady}
            authConfigured={authConfigured}
            authenticated={authenticated}
            notificationMode={notificationMode}
            hasProductionStorage={hasProductionStorage}
            status={status}
            message={message}
          />
        </div>
      </section>
    </main>
  );
}
