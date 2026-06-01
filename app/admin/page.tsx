import Link from 'next/link';
import { AdminActionBanner } from '@/components/admin/AdminActionBanner';
import { AdminAuditLogPanel } from '@/components/admin/AdminAuditLogPanel';
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { AdminOrderPanel } from '@/components/admin/AdminOrderPanel';
import { AdminStaffReadinessPanel } from '@/components/admin/AdminStaffReadinessPanel';
import { InquiryBoard } from '@/components/admin/InquiryBoard';
import { SiteHeader } from '@/components/SiteHeader';
import { getAdminIdentity, isAdminAuthConfigured, isAdminAuthenticated } from '@/lib/admin-auth';
import { getAdminAccountReadinessSummary, listAdminAccountReadinessRecords } from '@/lib/admin-account-repository';
import { getHomepageContent, listAdminAuditLogs, listAdminCategories, listAdminProducts, listInquiries, listInquiryPage, listInquiryStatusCounts, listMedia } from '@/lib/cms/catalog-repository';
import { listHomepageTranslations } from '@/lib/cms/homepage-translation-repository';
import { listAdminCheckoutOrderPage } from '@/lib/checkout/admin-order-repository';
import { getPaymentGatewayConfig, getPaymentGatewayReadiness } from '@/lib/checkout/payment-gateway-config';
import { getCustomerAuthEventSummary } from '@/lib/customers/customer-auth-event-summary';
import { createInquiryAssignmentQueueSummary, filterInquiriesByAssignmentQueue, parseInquiryAssignmentQueueFilter } from '@/lib/inquiries/inquiry-assignment-queue';
import { getCurrentInquiryNotificationReadiness, getCurrentInquiryNotificationRetryRunbook } from '@/lib/notifications/inquiry-notifications';
import { getRuntimeReadiness } from '@/lib/runtime-readiness';

export const dynamic = 'force-dynamic';

const adminTabs = [
  { key: 'overview', label: 'Overview', description: 'Readiness, access, audit, and security.' },
  { key: 'catalog', label: 'Catalog', description: 'Products, categories, subcategories, and media.' },
  { key: 'content', label: 'Content', description: 'Homepage copy and translations.' },
  { key: 'sales', label: 'Sales', description: 'Orders and customer inquiries.' }
] as const;

type AdminTab = (typeof adminTabs)[number]['key'];

function parsePage(value?: string) {
  const parsed = Number.parseInt(value ?? '1', 10);
  return Number.isFinite(parsed) ? Math.max(1, parsed) : 1;
}

function optionalParam(value?: string) {
  const normalized = value?.trim();
  return normalized || undefined;
}

function parseAdminTab(value?: string): AdminTab {
  return adminTabs.some((tab) => tab.key === value) ? (value as AdminTab) : 'overview';
}

function tabHref(tab: AdminTab) {
  return `/admin?tab=${tab}`;
}

function AdminTabNav({ activeTab }: { activeTab: AdminTab }) {
  return (
    <nav aria-label="Admin workspaces" className="sticky top-28 z-10 rounded-lg border border-rosewood/10 bg-white/95 p-2 shadow-[0_18px_50px_rgba(111,36,56,0.08)] backdrop-blur">
      <div className="grid gap-2 md:grid-cols-4">
        {adminTabs.map((tab) => {
          const active = tab.key === activeTab;
          return (
            <Link
              key={tab.key}
              href={tabHref(tab.key)}
              aria-current={active ? 'page' : undefined}
              className={`rounded-lg border px-4 py-3 text-left transition ${active ? 'border-rosewood bg-rosewood text-white shadow-sm' : 'border-transparent bg-white text-stone-700 hover:border-rosewood/15 hover:bg-cream'}`}
            >
              <span className="block text-sm font-semibold">{tab.label}</span>
              <span className={`mt-1 block text-xs leading-5 ${active ? 'text-white/75' : 'text-stone-500'}`}>{tab.description}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ tab?: string; status?: string; message?: string; inquiryStatus?: string; inquiryPage?: string; inquirySearch?: string; inquiryAssignment?: string; auditAction?: string; auditEntity?: string; auditActor?: string; auditSearch?: string; orderStatus?: string; orderPaymentStatus?: string; orderFulfillmentStatus?: string; orderSearch?: string; orderPage?: string }> }) {
  const { tab, status, message, inquiryStatus, inquiryPage, inquirySearch, inquiryAssignment, auditAction, auditEntity, auditActor, auditSearch, orderStatus, orderPaymentStatus, orderFulfillmentStatus, orderSearch, orderPage } = await searchParams;
  const activeTab = parseAdminTab(tab);
  const assignmentFilter = parseInquiryAssignmentQueueFilter(inquiryAssignment);
  const inquiryPageNumber = parsePage(inquiryPage);
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
  const adminIdentity = authenticated ? await getAdminIdentity() : undefined;
  const canViewStaffReadiness = adminIdentity?.role === 'owner';
  const [categories, products, homepage, homepageTranslations, media, inquiryPageData, assignmentSourceInquiries, inquiryCounts, auditLogs, orderPageData, authEventSummary, adminAccounts] = await Promise.all([
    listAdminCategories(),
    listAdminProducts(),
    getHomepageContent(),
    authenticated ? listHomepageTranslations() : Promise.resolve([]),
    listMedia(),
    listInquiryPage(inquiryStatus, inquiryPageNumber, undefined, inquirySearch),
    listInquiries(inquiryStatus, inquirySearch),
    listInquiryStatusCounts(inquirySearch),
    authenticated ? listAdminAuditLogs(auditFilters) : Promise.resolve([]),
    authenticated ? listAdminCheckoutOrderPage(orderFilters, parsePage(orderPage)) : Promise.resolve({ orders: [], page: 1, pageSize: 12, totalCount: 0, totalPages: 1 }),
    authenticated ? getCustomerAuthEventSummary() : getCustomerAuthEventSummary(1),
    canViewStaffReadiness ? listAdminAccountReadinessRecords() : Promise.resolve([])
  ]);

  const assignmentSummary = createInquiryAssignmentQueueSummary(assignmentSourceInquiries, adminIdentity);
  const adminAccountSummary = await getAdminAccountReadinessSummary(adminAccounts);

  if (assignmentFilter !== 'all') {
    const pageSize = inquiryPageData.pageSize;
    const filtered = filterInquiriesByAssignmentQueue(assignmentSourceInquiries, assignmentFilter, adminIdentity);
    const start = (inquiryPageNumber - 1) * pageSize;
    inquiryPageData.inquiries = filtered.slice(start, start + pageSize);
    inquiryPageData.total = filtered.length;
    inquiryPageData.page = inquiryPageNumber;
    inquiryPageData.pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  }

  const authConfigured = isAdminAuthConfigured();
  const runtimeReadiness = getRuntimeReadiness();
  const notificationReadiness = getCurrentInquiryNotificationReadiness();
  const notificationRetryRunbook = getCurrentInquiryNotificationRetryRunbook();
  const checkoutReadiness = getPaymentGatewayReadiness(getPaymentGatewayConfig(process.env), process.env);

  return (
    <main id="main-content" tabIndex={-1}>
      <SiteHeader />
      <section className="mx-auto max-w-[1500px] px-5 py-10">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-olive">Admin CMS</p>
            <h1 className="mt-3 font-display text-5xl text-rosewood md:text-6xl">Golara operations console</h1>
            <p className="mt-5 max-w-3xl text-base leading-8 text-stone-700 md:text-lg">
              Manage catalog, storefront content, orders, inquiries, media, and readiness from focused workspaces.
            </p>
          </div>
          {!authenticated ? (
            <Link href="/admin/login" className="rounded-full bg-rosewood px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-rosewood/20">
              {authConfigured ? 'Sign in' : 'Configure auth'}
            </Link>
          ) : null}
        </div>
        <div className="mt-8 grid gap-8">
          <AdminTabNav activeTab={activeTab} />
          <AdminActionBanner status={status} message={message} />

          <AdminDashboard
            activeWorkspace={activeTab}
            categories={categories}
            products={products}
            homepage={homepage}
            homepageTranslations={homepageTranslations}
            media={media}
            authEventSummary={authEventSummary}
            runtimeReadiness={runtimeReadiness}
            authConfigured={authConfigured}
            authenticated={authenticated}
            notificationReadiness={notificationReadiness}
            notificationRetryRunbook={notificationRetryRunbook}
            checkoutReadiness={checkoutReadiness}
            status={status}
            message={message}
          />

          {activeTab === 'overview' && authenticated ? <AdminStaffReadinessPanel accounts={adminAccounts} summary={adminAccountSummary} identity={adminIdentity} /> : null}
          {activeTab === 'overview' && authenticated ? <AdminAuditLogPanel logs={auditLogs} filters={auditFilters} /> : null}

          {activeTab === 'sales' && authenticated ? <AdminOrderPanel orderPage={orderPageData} filters={orderFilters} /> : null}
          {activeTab === 'sales' ? <InquiryBoard inquiryPage={inquiryPageData} counts={inquiryCounts} assignmentSummary={assignmentSummary} activeStatus={inquiryStatus} search={inquirySearch} assignmentFilter={assignmentFilter} /> : null}
        </div>
      </section>
    </main>
  );
}
