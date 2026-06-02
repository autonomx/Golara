import Link from 'next/link';
import { BadgePercent, BarChart3, ClipboardList, FileText, Home, ImageIcon, LayoutDashboard, LogIn, Package, Settings, ShoppingBag, ShieldCheck, Users } from 'lucide-react';
import { AdminActionBanner } from '@/components/admin/AdminActionBanner';
import { AdminAuditLogPanel } from '@/components/admin/AdminAuditLogPanel';
import { AdminCustomerPanel } from '@/components/admin/AdminCustomerPanel';
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { AdminFulfillmentSettingsPanel } from '@/components/admin/AdminFulfillmentSettingsPanel';
import { AdminModulePlaceholder } from '@/components/admin/AdminModulePlaceholder';
import { AdminOrderPanel } from '@/components/admin/AdminOrderPanel';
import { AdminStaffReadinessPanel } from '@/components/admin/AdminStaffReadinessPanel';
import { AdminStorefrontNavigationPanel } from '@/components/admin/AdminStorefrontNavigationPanel';
import { AdminStoreSettingsPanel } from '@/components/admin/AdminStoreSettingsPanel';
import { InquiryBoard } from '@/components/admin/InquiryBoard';
import { getAdminIdentity, isAdminAuthConfigured, isAdminAuthenticated } from '@/lib/admin-auth';
import { getAdminAccountReadinessSummary, listAdminAccountReadinessRecords } from '@/lib/admin-account-repository';
import { getHomepageContent, listAdminAuditLogs, listAdminCategories, listAdminFulfillmentMethodSettings, listAdminProducts, listAdminProductTypes, listInquiries, listInquiryPage, listInquiryStatusCounts, listMedia } from '@/lib/cms/catalog-repository';
import { listHomepageTranslations } from '@/lib/cms/homepage-translation-repository';
import { listAdminCheckoutOrderPage } from '@/lib/checkout/admin-order-repository';
import { getPaymentGatewayConfig, getPaymentGatewayReadiness } from '@/lib/checkout/payment-gateway-config';
import { getCustomerAuthEventSummary } from '@/lib/customers/customer-auth-event-summary';
import { listAdminCustomers } from '@/lib/customers/customer-repository';
import { createInquiryAssignmentQueueSummary, filterInquiriesByAssignmentQueue, parseInquiryAssignmentQueueFilter } from '@/lib/inquiries/inquiry-assignment-queue';
import { getCurrentInquiryNotificationReadiness, getCurrentInquiryNotificationRetryRunbook } from '@/lib/notifications/inquiry-notifications';
import { getRuntimeReadiness } from '@/lib/runtime-readiness';
import { storeSettingsService } from '@/lib/settings/store-settings';
import { storefrontNavigationMenuService } from '@/lib/settings/storefront-navigation-menu';

export const dynamic = 'force-dynamic';

const adminTabs = [
  { key: 'overview', label: 'Overview', description: 'Readiness, access, audit, and security.', icon: LayoutDashboard },
  { key: 'catalog', label: 'Catalog', description: 'Products, categories, subcategories, and media.', icon: Package },
  { key: 'content', label: 'Content', description: 'Homepage copy and translations.', icon: FileText },
  { key: 'sales', label: 'Sales', description: 'Orders and customer inquiries.', icon: ShoppingBag },
  { key: 'customers', label: 'Customers', description: 'Profiles, addresses, accounts, and activity.', icon: Users },
  { key: 'discounts', label: 'Discounts', description: 'Vouchers, campaigns, and gift-card planning.', icon: BadgePercent },
  { key: 'settings', label: 'Settings', description: 'Store configuration, staff access, and providers.', icon: Settings }
] as const;

type AdminTab = (typeof adminTabs)[number]['key'];
type DashboardWorkspace = 'overview' | 'catalog' | 'content' | 'sales';
type CatalogSection = 'all' | 'media' | 'categories' | 'products';
type SalesSection = 'all' | 'orders' | 'inquiries';
type AdminSearchParams = { tab?: string; status?: string; message?: string; catalogSearch?: string; catalogCategory?: string; catalogFlag?: string; productPage?: string; categoryPage?: string; mediaPage?: string; productColumns?: string | string[]; mediaColumns?: string | string[]; inquiryStatus?: string; inquiryPage?: string; inquirySearch?: string; inquiryAssignment?: string; auditAction?: string; auditEntity?: string; auditActor?: string; auditSearch?: string; orderStatus?: string; orderPaymentStatus?: string; orderFulfillmentStatus?: string; orderSearch?: string; orderPage?: string };
type AdminModuleHeader = { eyebrow: string; title: string; description: string; action?: { href: string; label: string } };

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
  if (tab === 'sales') return '/admin/orders';
  if (tab === 'customers') return '/admin/customers';
  if (tab === 'discounts') return '/admin/discounts';
  if (tab === 'settings') return '/admin/settings';
  return '/admin';
}

function dashboardWorkspace(tab: AdminTab): DashboardWorkspace | undefined {
  return tab === 'overview' || tab === 'catalog' || tab === 'content' || tab === 'sales' ? tab : undefined;
}

function moduleHeader(activeTab: AdminTab, activeNavKey: string): AdminModuleHeader {
  const headers: Record<string, AdminModuleHeader> = {
    overview: { eyebrow: 'Admin / Overview', title: 'Operations overview', description: 'Readiness, audit activity, security posture, and staff access.' },
    products: { eyebrow: 'Admin / Catalog', title: 'Products', description: 'Manage product records, merchandising flags, pricing, and images.', action: { href: '#products', label: 'Create product' } },
    categories: { eyebrow: 'Admin / Catalog', title: 'Categories', description: 'Manage storefront categories and subcategories.', action: { href: '#categories', label: 'Create category' } },
    media: { eyebrow: 'Admin / Catalog', title: 'Media library', description: 'Manage image uploads, URL media, category tags, and usage.', action: { href: '#media', label: 'Add image' } },
    catalog: { eyebrow: 'Admin / Catalog', title: 'Catalog', description: 'Manage products, categories, subcategories, and media.', action: { href: '#products', label: 'Create product' } },
    content: { eyebrow: 'Admin / Content', title: 'Homepage content', description: 'Manage homepage copy and translations.', action: { href: '#homepage', label: 'Edit homepage' } },
    homepage: { eyebrow: 'Admin / Content', title: 'Homepage content', description: 'Manage homepage copy and translations.', action: { href: '#homepage', label: 'Edit homepage' } },
    translations: { eyebrow: 'Admin / Content', title: 'Translations', description: 'Manage localized storefront content.' },
    sales: { eyebrow: 'Admin / Sales', title: 'Sales operations', description: 'Review orders and customer inquiries.' },
    orders: { eyebrow: 'Admin / Sales', title: 'Orders', description: 'Review checkout orders, fulfillment, payment status, and exports.', action: { href: '/admin/orders/print', label: 'Print orders' } },
    inquiries: { eyebrow: 'Admin / Sales', title: 'Inquiries', description: 'Review customer requests, assignments, follow-ups, and exports.', action: { href: '/admin/inquiries/print', label: 'Print inquiries' } },
    customers: { eyebrow: 'Admin / Customer Ops', title: 'Customers', description: 'Review customer profiles, addresses, accounts, and order counts.' },
    discounts: { eyebrow: 'Admin / Customer Ops', title: 'Discounts', description: 'Plan voucher, campaign, and gift-card workflows.' },
    settings: { eyebrow: 'Admin / System', title: 'Settings', description: 'Group store, provider, delivery, and staff configuration.' }
  };
  return headers[activeNavKey] ?? headers[activeTab] ?? headers.overview;
}

function AdminModuleHeader({ header }: { header: AdminModuleHeader }) {
  return (
    <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-stone-500">{header.eyebrow}</p>
          <h2 className="mt-1 text-2xl font-bold text-stone-950">{header.title}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">{header.description}</p>
        </div>
        {header.action ? (
          <Link href={header.action.href} className="rounded-md bg-rosewood px-4 py-2 text-sm font-semibold text-white">
            {header.action.label}
          </Link>
        ) : null}
      </div>
    </section>
  );
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
      { href: '/admin/orders', key: 'orders', tab: 'sales' as AdminTab, label: 'Orders', icon: ShoppingBag },
      { href: '/admin/inquiries', key: 'inquiries', tab: 'sales' as AdminTab, label: 'Inquiries', icon: Users },
      { href: '/admin/customers', key: 'customers', tab: 'customers' as AdminTab, label: 'Customers', icon: Users },
      { href: '/admin/discounts', key: 'discounts', tab: 'discounts' as AdminTab, label: 'Discounts', icon: BadgePercent }
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
      { href: '/admin?tab=overview#staff-readiness', key: 'staff', tab: 'overview' as AdminTab, label: 'Staff access', icon: Settings },
      { href: '/admin/settings', key: 'settings', tab: 'settings' as AdminTab, label: 'Settings', icon: Settings }
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

export async function AdminConsolePage({ searchParams, forcedTab, catalogSection = 'all', salesSection = 'all', activeNavKey }: { searchParams: Promise<AdminSearchParams>; forcedTab?: AdminTab; catalogSection?: CatalogSection; salesSection?: SalesSection; activeNavKey?: string }) {
  const { tab, status, message, catalogSearch, catalogCategory, catalogFlag, productPage, categoryPage, mediaPage, productColumns, mediaColumns, inquiryStatus, inquiryPage, inquirySearch, inquiryAssignment, auditAction, auditEntity, auditActor, auditSearch, orderStatus, orderPaymentStatus, orderFulfillmentStatus, orderSearch, orderPage } = await searchParams;
  const activeTab = forcedTab ?? parseAdminTab(tab);
  const activeWorkspace = dashboardWorkspace(activeTab);
  const resolvedActiveNavKey = activeNavKey ?? activeTab;
  const header = moduleHeader(activeTab, resolvedActiveNavKey);
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
  const [categories, products, productTypes, homepage, homepageTranslations, media, inquiryPageData, assignmentSourceInquiries, inquiryCounts, auditLogs, orderPageData, authEventSummary, adminAccounts, adminCustomers, fulfillmentMethods, storeSetting, storefrontNavigationMenu] = await Promise.all([
    listAdminCategories(),
    listAdminProducts(),
    listAdminProductTypes(),
    getHomepageContent(),
    authenticated ? listHomepageTranslations() : Promise.resolve([]),
    listMedia(),
    listInquiryPage(inquiryStatus, inquiryPageNumber, undefined, inquirySearch),
    listInquiries(inquiryStatus, inquirySearch),
    listInquiryStatusCounts(inquirySearch),
    authenticated ? listAdminAuditLogs(auditFilters) : Promise.resolve([]),
    authenticated ? listAdminCheckoutOrderPage(orderFilters, parsePage(orderPage)) : Promise.resolve({ orders: [], page: 1, pageSize: 12, totalCount: 0, totalPages: 1 }),
    authenticated ? getCustomerAuthEventSummary() : getCustomerAuthEventSummary(1),
    canViewStaffReadiness ? listAdminAccountReadinessRecords() : Promise.resolve([]),
    authenticated ? listAdminCustomers() : Promise.resolve([]),
    authenticated ? listAdminFulfillmentMethodSettings() : Promise.resolve([]),
    storeSettingsService.get(),
    storefrontNavigationMenuService.get()
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
          <AdminModuleHeader header={header} />

          {activeWorkspace ? (
            <AdminDashboard
              activeWorkspace={activeWorkspace}
              catalogSection={catalogSection}
              categories={categories}
              products={products}
              productTypes={productTypes}
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
              productPage={parsePage(productPage)}
              categoryPage={parsePage(categoryPage)}
              mediaPage={parsePage(mediaPage)}
              productColumns={productColumns}
              mediaColumns={mediaColumns}
              status={status}
              message={message}
            />
          ) : null}

          {activeTab === 'overview' && authenticated ? <AdminStaffReadinessPanel accounts={adminAccounts} summary={adminAccountSummary} identity={adminIdentity} /> : null}
          {activeTab === 'overview' && authenticated ? <AdminAuditLogPanel logs={auditLogs} filters={auditFilters} /> : null}

          {activeTab === 'sales' && authenticated && (salesSection === 'all' || salesSection === 'orders') ? <AdminOrderPanel orderPage={orderPageData} filters={orderFilters} /> : null}
          {activeTab === 'sales' && (salesSection === 'all' || salesSection === 'inquiries') ? <InquiryBoard inquiryPage={inquiryPageData} counts={inquiryCounts} assignmentSummary={assignmentSummary} activeStatus={inquiryStatus} search={inquirySearch} assignmentFilter={assignmentFilter} /> : null}
          {activeTab === 'customers' ? <AdminCustomerPanel customers={adminCustomers} databaseReady={runtimeReadiness.databaseUrlPresent} /> : null}
          {activeTab === 'discounts' ? (
            <AdminModulePlaceholder
              eyebrow="Discounts"
              title="Promotions workspace"
              body="Discounts are now represented in navigation so the admin shell has a stable place for voucher and campaign work."
              items={['Voucher codes', 'Product/category eligibility', 'Usage limits and windows']}
            />
          ) : null}
          {activeTab === 'settings' ? (
            <div className="grid gap-6">
              <AdminStoreSettingsPanel setting={storeSetting} databaseReady={runtimeReadiness.databaseUrlPresent} />
              <AdminStorefrontNavigationPanel menu={storefrontNavigationMenu} databaseReady={runtimeReadiness.databaseUrlPresent} />
              <AdminFulfillmentSettingsPanel methods={fulfillmentMethods} databaseReady={runtimeReadiness.databaseUrlPresent} />
            </div>
          ) : null}
          </section>
        </div>
      </div>
    </main>
  );
}
