import Link from 'next/link';
import { AdminActionBanner } from '@/components/admin/AdminActionBanner';
import { AdminAuditLogPanel } from '@/components/admin/AdminAuditLogPanel';
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { AdminOrderPanel } from '@/components/admin/AdminOrderPanel';
import { InquiryBoard } from '@/components/admin/InquiryBoard';
import { SiteHeader } from '@/components/SiteHeader';
import { isAdminAuthConfigured, isAdminAuthenticated } from '@/lib/admin-auth';
import { getHomepageContent, listAdminAuditLogs, listAdminCategories, listAdminProducts, listInquiryPage, listInquiryStatusCounts, listMedia } from '@/lib/cms/catalog-repository';
import { listHomepageTranslations } from '@/lib/cms/homepage-translation-repository';
import { listAdminCheckoutOrderPage } from '@/lib/checkout/admin-order-repository';
import { getCustomerAuthEventSummary } from '@/lib/customers/customer-auth-event-summary';
import { getRuntimeReadiness } from '@/lib/runtime-readiness';

export const dynamic = 'force-dynamic';

function parsePage(value?: string) {
  const parsed = Number.parseInt(value ?? '1', 10);
  return Number.isFinite(parsed) ? Math.max(1, parsed) : 1;
}

function optionalParam(value?: string) {
  const normalized = value?.trim();
  return normalized || undefined;
}

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ status?: string; message?: string; inquiryStatus?: string; inquiryPage?: string; inquirySearch?: string; auditAction?: string; auditEntity?: string; auditActor?: string; auditSearch?: string; orderStatus?: string; orderPaymentStatus?: string; orderFulfillmentStatus?: string; orderSearch?: string; orderPage?: string }> }) {
  const { status, message, inquiryStatus, inquiryPage, inquirySearch, auditAction, auditEntity, auditActor, auditSearch, orderStatus, orderPaymentStatus, orderFulfillmentStatus, orderSearch, orderPage } = await searchParams;
  const auditFilters = {
    action: optionalParam(auditAction),
    entity: optionalParam(auditEntity),
    actor: optionalParam(auditActor),
    search: optionalParam(auditSearch)
  };
  const orderFilters = {
    status: optionalParam(orderStatus),
    paymentStatus: optionalParam(orderPaymentStatus),
    fulfillmentStatus: optionalParam(orderFulfillmentStatus),
    search: optionalParam(orderSearch)
  };
  const authenticated = await isAdminAuthenticated();
  const [categories, products, homepage, homepageTranslations, media, inquiryPageData, inquiryCounts, auditLogs, orderPageData, authEventSummary] = await Promise.all([
    listAdminCategories(),
    listAdminProducts(),
    getHomepageContent(),
    authenticated ? listHomepageTranslations() : Promise.resolve([]),
    listMedia(),
    listInquiryPage(inquiryStatus, parsePage(inquiryPage), undefined, inquirySearch),
    listInquiryStatusCounts(inquirySearch),
    authenticated ? listAdminAuditLogs(auditFilters) : Promise.resolve([]),
    authenticated ? listAdminCheckoutOrderPage(orderFilters, parsePage(orderPage)) : Promise.resolve({ orders: [], page: 1, pageSize: 12, totalCount: 0, totalPages: 1 }),
    authenticated ? getCustomerAuthEventSummary() : getCustomerAuthEventSummary(1)
  ]);

  const authConfigured = isAdminAuthConfigured();
  const runtimeReadiness = getRuntimeReadiness();
  const notificationMode = process.env.INQUIRY_NOTIFICATION_MODE?.trim() || 'log';
  const hasProductionStorage = Boolean(process.env.MEDIA_STORAGE_PROVIDER?.trim());

  return (
    <main id="main-content" tabIndex={-1}>
      <SiteHeader />
      <section className="mx-auto max-w-7xl px-5 py-14">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-olive">Admin CMS</p>
            <h1 className="mt-3 font-display text-6xl text-rosewood">Edit Golara without Joomla.</h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-stone-700">
              Manage homepage content, product categories, media, customer inquiries, orders, and product cards from one place.
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
          {authenticated ? <AdminAuditLogPanel logs={auditLogs} filters={auditFilters} /> : null}
          {authenticated ? <AdminOrderPanel orderPage={orderPageData} filters={orderFilters} /> : null}
          <InquiryBoard inquiryPage={inquiryPageData} counts={inquiryCounts} activeStatus={inquiryStatus} search={inquirySearch} />
          <AdminDashboard
            categories={categories}
            products={products}
            homepage={homepage}
            homepageTranslations={homepageTranslations}
            media={media}
            authEventSummary={authEventSummary}
            runtimeReadiness={runtimeReadiness}
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
