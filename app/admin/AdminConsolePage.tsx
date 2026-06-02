import Link from 'next/link';
import { BarChart3, ClipboardList, FileText, Home, ImageIcon, LayoutDashboard, LogIn, Package, Settings, ShoppingBag, ShieldCheck, Users } from 'lucide-react';
import { AdminActionBanner } from '@/components/admin/AdminActionBanner';
import { AdminAuditLogPanel } from '@/components/admin/AdminAuditLogPanel';
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { AdminOrderPanel } from '@/components/admin/AdminOrderPanel';
import { AdminStaffReadinessPanel } from '@/components/admin/AdminStaffReadinessPanel';
import { InquiryBoard } from '@/components/admin/InquiryBoard';
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
  { key: 'overview', label: 'Overview', description: 'Readiness, access, audit, and security.', icon: LayoutDashboard },
  { key: 'catalog', label: 'Catalog', description: 'Products, categories, subcategories, and media.', icon: Package },
  { key: 'content', label: 'Content', description: 'Homepage copy and translations.', icon: FileText },
  { key: 'sales', label: 'Sales', description: 'Orders and customer inquiries.', icon: ShoppingBag }
] as const;

type AdminTab = (typeof adminTabs)[number]['key'];
type CatalogSection = 'all' | 'media' | 'categories' | 'products';
type AdminSearchParams = { tab?: string; status?: string; message?: string; catalogSearch?: string; catalogCategory?: string; catalogFlag?: string; inquiryStatus?: string; inquiryPage?: string; inquirySearch?: string; inquiryAssignment?: string; auditAction?: string; auditEntity?: string; auditActor?: string; auditSearch?: string; orderStatus?: string; orderPaymentStatus?: string; orderFulfillmentStatus?: string; orderSearch?: string; orderPage?: string };

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
  if (tab === 'catalog') return '/admin/products';
  if (tab === 'content') return '/admin?tab=content';
  if (tab === 'sales') return '/admin?tab=sales';
  return '/admin';
}

const sidebarSections = [
  {
    label: 'Store',
    items: [
      { href: '/admin', key: 'overview', tab: 'overview' as AdminTab, label: 'Overview', icon: LayoutDashboard },
      { href: '/admin/products', key: 'products', tab: 'catalog' as AdminTab, label: 'Products', icon: Package },
      { href: '/admin/categories', key: 'categories', tab: 'catalog' as AdminTab, label: 'Categories', icon: ClipboardList },
      { href: '/admin/media', key: 'media', tab: 'catalog' as AdminTab, label: 'Media library', icon: ImageIcon }
    ]
  },
  {
    label: 'Customer Ops',
    items: [
      { href: '/admin?tab=sales#orders', key: 'orders', tab: 'sales' as AdminTab, label: 'Orders', icon: ShoppingBag },
      { href: '/admin?tab=sales#inquiries', key: 'inquiries', tab: 'sales' as AdminTab, label: 'Inquiries', icon: Users }
    ]
  },
  {
    label: 'Content',
    items: [
      { href: '/admin?tab=content#homepage', key: 'homepage', tab: 'content' as AdminTab, label: 'Homepage', icon: Home },
      { href: '/admin?tab=content', key: 'translations', tab: 'content' as AdminTab, label: 'Translations', icon: FileText }
    ]
  },
  {
    label: 'System',
    items: [
      { href: '/admin?tab=overview#readiness', key: 'readiness', tab: 'overview' as AdminTab, label: 'Readiness', icon: ShieldCheck },
      { href: '/admin?tab=overview#audit-log', key: 'audit', tab: 'overview' as AdminTab, label: 'Audit log', icon: BarChart3 },
      { href: '/admin?tab=overview#staff-readiness', key: 'staff', tab: 'overview' as AdminTab, label: 'Staff access', icon: Settings }
    ]
  }
];

function AdminSidebar({ activeTab, activeNavKey, authenticated, authConfigured, adminLabel }: { activeTab: AdminTab; activeNavKey: string; authenticated: boolean; authConfigured: boolean; adminLabel?: string }) {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-stone-200 bg-white lg:flex lg:flex-col">
      <div className="border-b border-stone-200 px-5 py-5">
        <Link href="/admin" className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-md bg-rosewood font-display text-xl text-white">G</span>
          <span>
            <span className="block text-sm font-bold text-stone-950">Golara</span>
            <span className="block text-xs font-medium text-stone-500">Operations console</span>
          </span>
        </Link>
      </div>
      <nav aria-label="Admin navigation" className="flex-1 overflow-y-auto px-3 py-4">
        <div className="grid gap-5">
          {sidebarSections.map((section) => (
            <div key={section.label}>
              <p className="px-3 pb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-stone-400">{section.label}</p>
              <div className="grid gap-1">
                {section.items.map((item) => {
                  const active = item.key === activeNavKey || (activeNavKey === 'catalog' && item.tab === activeTab);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={active ? 'page' : undefined}
                      className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold transition ${active ? 'bg-rosewood text-white shadow-sm' : 'text-stone-700 hover:bg-stone-100 hover:text-stone-950'}`}
                    >
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
        {authenticated ? (
          <div className="rounded-md border border-stone-200 bg-stone-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">Signed in</p>
            <p className="mt-1 truncate text-sm font-semibold text-stone-900">{adminLabel ?? 'Admin'}</p>
          </div>
        ) : (
          <Link href="/admin/login" className="flex items-center justify-center gap-2 rounded-md bg-rosewood px-4 py-2.5 text-sm font-semibold text-white">
            <LogIn aria-hidden="true" className="h-4 w-4" />
            {authConfigured ? 'Sign in' : 'Configure auth'}
          </Link>
        )}
      </div>
    </aside>
  );
}

function AdminMobileNav({ activeTab }: { activeTab: AdminTab }) {
  return (
    <nav aria-label="Admin workspaces" className="lg:hidden">
      <div className="flex gap-2 overflow-x-auto border-b border-stone-200 bg-white px-4 py-3 [scrollbar-width:none]">
        {adminTabs.map((tab) => {
          const active = tab.key === activeTab;
          const Icon = tab.icon;
          return (
            <Link key={tab.key} href={tabHref(tab.key)} aria-current={active ? 'page' : undefined} className={`inline-flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold ${active ? 'bg-rosewood text-white' : 'bg-stone-100 text-stone-700'}`}>
              <Icon aria-hidden="true" className="h-4 w-4" />
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function AdminTopBar({ activeTab, productCount, categoryCount, mediaCount, authenticated, authConfigured }: { activeTab: AdminTab; productCount: number; categoryCount: number; mediaCount: number; authenticated: boolean; authConfigured: boolean }) {
  const active = adminTabs.find((tab) => tab.key === activeTab) ?? adminTabs[0];
  const ActiveIcon = active.icon;
  return (
    <header className="sticky top-0 z-20 border-b border-stone-200 bg-white/95 backdrop-blur">
      <div className="flex min-h-16 flex-wrap items-center justify-between gap-3 px-4 py-3 lg:px-6">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-md border border-stone-200 bg-stone-50 text-stone-700">
            <ActiveIcon aria-hidden="true" className="h-4 w-4" />
          </span>
          <div>
            <h1 className="text-lg font-bold text-stone-950">{active.label}</h1>
            <p className="text-xs font-medium text-stone-500">{active.description}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-md border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs font-semibold text-stone-700">{productCount} products</span>
          <span className="rounded-md border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs font-semibold text-stone-700">{categoryCount} categories</span>
          <span className="rounded-md border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs font-semibold text-stone-700">{mediaCount} media</span>
          {!authenticated ? (
            <Link href="/admin/login" className="inline-flex items-center gap-2 rounded-md bg-rosewood px-4 py-2 text-sm font-semibold text-white">
              <LogIn aria-hidden="true" className="h-4 w-4" />
              {authConfigured ? 'Sign in' : 'Configure auth'}
            </Link>
          ) : null}
        </div>
      </div>
    </header>
  );
}

export async function AdminConsolePage({ searchParams, forcedTab, catalogSection = 'all', activeNavKey }: { searchParams: Promise<AdminSearchParams>; forcedTab?: AdminTab; catalogSection?: CatalogSection; activeNavKey?: string }) {
  const { tab, status, message, catalogSearch, catalogCategory, catalogFlag, inquiryStatus, inquiryPage, inquirySearch, inquiryAssignment, auditAction, auditEntity, auditActor, auditSearch, orderStatus, orderPaymentStatus, orderFulfillmentStatus, orderSearch, orderPage } = await searchParams;
  const activeTab = forcedTab ?? parseAdminTab(tab);
  const resolvedActiveNavKey = activeNavKey ?? activeTab;
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
    <main id="main-content" tabIndex={-1} className="min-h-screen bg-stone-50">
      <div className="min-h-screen lg:pl-72">
        <AdminSidebar activeTab={activeTab} activeNavKey={resolvedActiveNavKey} authenticated={authenticated} authConfigured={authConfigured} adminLabel={adminIdentity?.label ?? adminIdentity?.email} />
        <div className="min-w-0">
          <AdminMobileNav activeTab={activeTab} />
          <AdminTopBar activeTab={activeTab} productCount={products.length} categoryCount={categories.length} mediaCount={media.length} authenticated={authenticated} authConfigured={authConfigured} />
          <section className="grid gap-6 px-4 py-6 lg:px-6">
          <AdminActionBanner status={status} message={message} />

          <AdminDashboard
            activeWorkspace={activeTab}
            catalogSection={catalogSection}
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
            catalogSearch={catalogSearch}
            catalogCategory={catalogCategory}
            catalogFlag={catalogFlag}
            status={status}
            message={message}
          />

          {activeTab === 'overview' && authenticated ? <AdminStaffReadinessPanel accounts={adminAccounts} summary={adminAccountSummary} identity={adminIdentity} /> : null}
          {activeTab === 'overview' && authenticated ? <AdminAuditLogPanel logs={auditLogs} filters={auditFilters} /> : null}

          {activeTab === 'sales' && authenticated ? <AdminOrderPanel orderPage={orderPageData} filters={orderFilters} /> : null}
          {activeTab === 'sales' ? <InquiryBoard inquiryPage={inquiryPageData} counts={inquiryCounts} assignmentSummary={assignmentSummary} activeStatus={inquiryStatus} search={inquirySearch} assignmentFilter={assignmentFilter} /> : null}
          </section>
        </div>
      </div>
    </main>
  );
}

export default async function AdminPage({ searchParams }: { searchParams: Promise<AdminSearchParams> }) {
  return <AdminConsolePage searchParams={searchParams} activeNavKey="overview" />;
}
