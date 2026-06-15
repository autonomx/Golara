import Link from 'next/link';
import { BadgePercent, BarChart3, Bell, ClipboardList, CreditCard, FileText, Home, ImageIcon, LayoutDashboard, LogIn, Package, Settings, ShoppingBag, ShieldCheck, Users } from 'lucide-react';
import { AdminActionBanner } from '@/components/admin/AdminActionBanner';
import { AdminAuditLogPanel } from '@/components/admin/AdminAuditLogPanel';
import { AdminCustomerPanel } from '@/components/admin/AdminCustomerPanel';
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { AdminFulfillmentSettingsPanel } from '@/components/admin/AdminFulfillmentSettingsPanel';
import { AdminModulePlaceholder } from '@/components/admin/AdminModulePlaceholder';
import { AdminOrderPanel } from '@/components/admin/AdminOrderPanel';
import { AdminOrderRevenueSummaryPanel } from '@/components/admin/AdminOrderRevenueSummaryPanel';
import { AdminStaffReadinessPanel } from '@/components/admin/AdminStaffReadinessPanel';
import { AdminStorefrontNavigationPanel } from '@/components/admin/AdminStorefrontNavigationPanel';
import { AdminStoreSettingsPanel } from '@/components/admin/AdminStoreSettingsPanel';
import { AdminTranslationPanel } from '@/components/admin/AdminTranslationPanel';
import { InquiryBoard } from '@/components/admin/InquiryBoard';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { updateHomepageAction } from '@/app/admin/actions';
import { EMPTY_ORDER_REVENUE_SUMMARY, orderRevenueSummaryService } from '@/lib/analytics/order-revenue-summary';
import { getAdminIdentity, isAdminAuthConfigured, isAdminAuthenticated } from '@/lib/admin-auth';
import { getAdminAccountReadinessSummary, listAdminAccountReadinessRecords } from '@/lib/admin-account-repository';
import { getHomepageContent, listAdminAuditLogs, listAdminCategories, listAdminFulfillmentMethodSettings, listAdminProducts, listAdminProductTypes, listInquiries, listInquiryPage, listInquiryStatusCounts, listMedia } from '@/lib/cms/catalog-repository';
import { listHomepageTranslations } from '@/lib/cms/homepage-translation-repository';
import { listAdminCheckoutOrderPage } from '@/lib/checkout/admin-order-repository';
import { getPaymentGatewayConfig, getPaymentGatewayReadiness } from '@/lib/checkout/payment-gateway-config';
import { getCustomerAuthEventSummary } from '@/lib/customers/customer-auth-event-summary';
import { listAdminCustomers } from '@/lib/customers/customer-repository';
import { resolveStorefrontLocale } from '@/lib/i18n/resolve-locale';
import { createInquiryAssignmentQueueSummary, filterInquiriesByAssignmentQueue, parseInquiryAssignmentQueueFilter } from '@/lib/inquiries/inquiry-assignment-queue';
import { getCurrentInquiryNotificationReadiness, getCurrentInquiryNotificationRetryRunbook } from '@/lib/notifications/inquiry-notifications';
import { getRuntimeReadiness } from '@/lib/runtime-readiness';
import { DEFAULT_STORE_SETTING, storeSettingsService } from '@/lib/settings/store-settings';
import { DEFAULT_STOREFRONT_NAVIGATION_MENU, storefrontNavigationMenuService } from '@/lib/settings/storefront-navigation-menu';
import { getStorefrontCopyDirection } from '@/lib/localization/storefront-copy';
import type { HomepageContent } from '@/lib/catalog';
import type { SupportedLocale } from '@/lib/i18n/locales';

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
type ContentSection = 'all' | 'homepage' | 'translations';
type OverviewSection = 'all' | 'readiness' | 'audit' | 'staff';
type AdminSearchParams = { tab?: string; status?: string; message?: string; catalogSearch?: string; catalogCategory?: string; catalogFlag?: string; productPage?: string; categoryPage?: string; mediaPage?: string; productColumns?: string | string[]; mediaColumns?: string | string[]; inquiryStatus?: string; inquiryPage?: string; inquirySearch?: string; inquiryAssignment?: string; auditAction?: string; auditEntity?: string; auditActor?: string; auditSearch?: string; orderStatus?: string; orderPaymentStatus?: string; orderFulfillmentStatus?: string; orderSearch?: string; orderPage?: string };
type AdminModuleHeader = { eyebrow: string; title: string; description: string; action?: { href: string; label: string } };
type AdminLocale = 'en' | 'fa';

const inputClass = 'rounded-lg border border-rosewood/15 bg-white px-4 py-3 text-stone-800 outline-none transition focus:border-rosewood focus-visible:ring-4 focus-visible:ring-olive/20 disabled:cursor-not-allowed disabled:bg-stone-100';
const textAreaClass = 'min-h-28 rounded-lg border border-rosewood/15 bg-white px-4 py-3 text-stone-800 outline-none transition focus:border-rosewood focus-visible:ring-4 focus-visible:ring-olive/20 disabled:cursor-not-allowed disabled:bg-stone-100';
const primaryButtonClass = 'w-fit rounded-full bg-rosewood px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-rosewood/20 outline-none transition focus-visible:ring-4 focus-visible:ring-olive/30 disabled:cursor-not-allowed disabled:bg-stone-300 disabled:shadow-none';
const panelClass = 'scroll-mt-24 rounded-lg border border-stone-200 bg-white p-5 shadow-sm';

const adminShellCopy = {
  en: {
    console: 'Operations console',
    nav: 'Admin navigation',
    workspaces: 'Admin workspaces',
    signedIn: 'Signed in',
    admin: 'Admin',
    signIn: 'Sign in',
    configureAuth: 'Configure auth',
    products: 'products',
    categories: 'categories',
    media: 'media',
    tabs: {
      overview: ['Overview', 'Readiness, access, audit, and security.'],
      catalog: ['Catalog', 'Products, categories, subcategories, and media.'],
      content: ['Content', 'Homepage copy and translations.'],
      sales: ['Sales', 'Orders and customer inquiries.'],
      customers: ['Customers', 'Profiles, addresses, accounts, and activity.'],
      discounts: ['Discounts', 'Vouchers, campaigns, and gift-card planning.'],
      settings: ['Settings', 'Store configuration, staff access, and providers.']
    },
    sections: { store: 'Store', customerOps: 'Customer Ops', content: 'Content', system: 'System' },
    navItems: {
      overview: 'Overview', products: 'Products', categories: 'Categories', media: 'Media library', orders: 'Orders', 'payment-settlement': 'Payment settlement', 'payment-alerts': 'Payment alerts', inquiries: 'Inquiries', customers: 'Customers', discounts: 'Discounts', homepage: 'Homepage', translations: 'Translations', readiness: 'Readiness', audit: 'Audit log', staff: 'Staff access', settings: 'Settings'
    },
    homepageForm: { eyebrow: 'Homepage', title: 'Hero content', eyebrowField: 'Eyebrow', titleField: 'Title', body: 'Body', primaryLabel: 'Primary CTA label', primaryUrl: 'Primary CTA URL', secondaryLabel: 'Secondary CTA label', secondaryUrl: 'Secondary CTA URL', panelEyebrow: 'Panel eyebrow', panelTitle: 'Panel title', panelBody: 'Panel body', save: 'Save homepage' },
    discountsPlaceholder: { eyebrow: 'Discounts', title: 'Promotions workspace', body: 'Discounts are now represented in navigation so the admin shell has a stable place for voucher and campaign work.', items: ['Voucher codes', 'Product/category eligibility', 'Usage limits and windows'] }
  },
  fa: {
    console: 'کنسول عملیات',
    nav: 'ناوبری مدیریت',
    workspaces: 'بخش‌های مدیریت',
    signedIn: 'وارد شده',
    admin: 'مدیر',
    signIn: 'ورود',
    configureAuth: 'تنظیم احراز هویت',
    products: 'محصول',
    categories: 'دسته‌بندی',
    media: 'رسانه',
    tabs: {
      overview: ['نمای کلی', 'آمادگی، دسترسی، ممیزی و امنیت.'],
      catalog: ['کاتالوگ', 'محصولات، دسته‌بندی‌ها، زیرمجموعه‌ها و رسانه‌ها.'],
      content: ['محتوا', 'متن صفحه اصلی و ترجمه‌ها.'],
      sales: ['فروش', 'سفارش‌ها و درخواست‌های مشتریان.'],
      customers: ['مشتریان', 'پروفایل‌ها، نشانی‌ها، حساب‌ها و فعالیت‌ها.'],
      discounts: ['تخفیف‌ها', 'کوپن‌ها، کمپین‌ها و برنامه‌ریزی کارت هدیه.'],
      settings: ['تنظیمات', 'پیکربندی فروشگاه، دسترسی تیم و ارائه‌دهندگان.']
    },
    sections: { store: 'فروشگاه', customerOps: 'عملیات مشتری', content: 'محتوا', system: 'سیستم' },
    navItems: {
      overview: 'نمای کلی', products: 'محصولات', categories: 'دسته‌بندی‌ها', media: 'کتابخانه رسانه', orders: 'سفارش‌ها', 'payment-settlement': 'تسویه پرداخت', 'payment-alerts': 'هشدارهای پرداخت', inquiries: 'درخواست‌ها', customers: 'مشتریان', discounts: 'تخفیف‌ها', homepage: 'صفحه اصلی', translations: 'ترجمه‌ها', readiness: 'آمادگی', audit: 'گزارش ممیزی', staff: 'دسترسی تیم', settings: 'تنظیمات'
    },
    homepageForm: { eyebrow: 'صفحه اصلی', title: 'محتوای هیرو', eyebrowField: 'برچسب بالایی', titleField: 'عنوان', body: 'متن', primaryLabel: 'عنوان دکمه اصلی', primaryUrl: 'نشانی دکمه اصلی', secondaryLabel: 'عنوان دکمه دوم', secondaryUrl: 'نشانی دکمه دوم', panelEyebrow: 'برچسب پنل', panelTitle: 'عنوان پنل', panelBody: 'متن پنل', save: 'ذخیره صفحه اصلی' },
    discountsPlaceholder: { eyebrow: 'تخفیف‌ها', title: 'فضای کاری پروموشن', body: 'تخفیف‌ها در ناوبری مدیریت جایگاه ثابت دارند تا کارهای کوپن و کمپین در همین بخش ادامه پیدا کند.', items: ['کدهای کوپن', 'قابلیت اعمال روی محصول یا دسته‌بندی', 'محدودیت مصرف و بازه زمانی'] }
  }
} as const;

function adminLocale(locale?: SupportedLocale | string | null): AdminLocale {
  return locale?.toLowerCase().startsWith('fa') ? 'fa' : 'en';
}

function adminCopy(locale?: SupportedLocale | string | null) {
  return adminShellCopy[adminLocale(locale)];
}

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
  if (tab === 'content') return '/admin/homepage';
  if (tab === 'sales') return '/admin/orders';
  if (tab === 'customers') return '/admin/customers';
  if (tab === 'discounts') return '/admin/discounts';
  if (tab === 'settings') return '/admin/settings';
  return '/admin';
}

function dashboardWorkspace(tab: AdminTab): DashboardWorkspace | undefined {
  return tab === 'overview' || tab === 'catalog' || tab === 'content' || tab === 'sales' ? tab : undefined;
}

function localizedAdminTab(tab: AdminTab, locale?: SupportedLocale | string | null) {
  const base = adminTabs.find((item) => item.key === tab) ?? adminTabs[0];
  const [label, description] = adminCopy(locale).tabs[tab];
  return { ...base, label, description };
}

function moduleHeader(activeTab: AdminTab, activeNavKey: string, locale?: SupportedLocale | string | null): AdminModuleHeader {
  const en: Record<string, AdminModuleHeader> = {
    overview: { eyebrow: 'Admin / Overview', title: 'Operations overview', description: 'Readiness, audit activity, security posture, and staff access.' },
    products: { eyebrow: 'Admin / Catalog', title: 'Products', description: 'Manage product records, merchandising flags, pricing, and images.', action: { href: '#products', label: 'Create product' } },
    categories: { eyebrow: 'Admin / Catalog', title: 'Categories', description: 'Manage storefront categories and subcategories.', action: { href: '#categories', label: 'Create category' } },
    media: { eyebrow: 'Admin / Catalog', title: 'Media library', description: 'Review, upload, and assign product/category media.', action: { href: '#media', label: 'Upload media' } },
    homepage: { eyebrow: 'Admin / Content', title: 'Homepage', description: 'Edit the storefront hero and content blocks.' },
    translations: { eyebrow: 'Admin / Content', title: 'Translations', description: 'Localize homepage, categories, and product copy.' },
    orders: { eyebrow: 'Admin / Sales', title: 'Orders', description: 'Review checkout orders, payment state, fulfillment, and customer details.' },
    inquiries: { eyebrow: 'Admin / Sales', title: 'Inquiries', description: 'Triage customer inquiries, follow-ups, assignments, and quote requests.' },
    customers: { eyebrow: 'Admin / Customers', title: 'Customers', description: 'Review customer profiles, saved addresses, order history, and account activity.' },
    discounts: { eyebrow: 'Admin / Discounts', title: 'Discounts', description: 'Plan and manage promotions, vouchers, campaigns, and gift-card work.' },
    readiness: { eyebrow: 'Admin / System', title: 'Readiness', description: 'Review runtime configuration, auth posture, notifications, and checkout readiness.' },
    audit: { eyebrow: 'Admin / System', title: 'Audit log', description: 'Track sensitive admin actions and operational changes.' },
    staff: { eyebrow: 'Admin / System', title: 'Staff access', description: 'Review admin account readiness and owner-only access state.' },
    settings: { eyebrow: 'Admin / Settings', title: 'Settings', description: 'Configure store settings, navigation, fulfillment, and provider options.' }
  };
  const fa: Record<string, AdminModuleHeader> = {
    overview: { eyebrow: 'مدیریت / نمای کلی', title: 'نمای عملیات', description: 'آمادگی، فعالیت ممیزی، وضعیت امنیت و دسترسی تیم.' },
    products: { eyebrow: 'مدیریت / کاتالوگ', title: 'محصولات', description: 'مدیریت رکوردهای محصول، پرچم‌های فروش، قیمت‌گذاری و تصاویر.', action: { href: '#products', label: 'ایجاد محصول' } },
    categories: { eyebrow: 'مدیریت / کاتالوگ', title: 'دسته‌بندی‌ها', description: 'مدیریت دسته‌بندی‌ها و زیرمجموعه‌های فروشگاه.', action: { href: '#categories', label: 'ایجاد دسته‌بندی' } },
    media: { eyebrow: 'مدیریت / کاتالوگ', title: 'کتابخانه رسانه', description: 'بررسی، بارگذاری و اتصال رسانه به محصول یا دسته‌بندی.', action: { href: '#media', label: 'بارگذاری رسانه' } },
    homepage: { eyebrow: 'مدیریت / محتوا', title: 'صفحه اصلی', description: 'ویرایش هیرو و بلوک‌های محتوایی فروشگاه.' },
    translations: { eyebrow: 'مدیریت / محتوا', title: 'ترجمه‌ها', description: 'محلی‌سازی متن صفحه اصلی، دسته‌بندی‌ها و محصولات.' },
    orders: { eyebrow: 'مدیریت / فروش', title: 'سفارش‌ها', description: 'بررسی سفارش‌های پرداخت، وضعیت پرداخت، انجام سفارش و اطلاعات مشتری.' },
    inquiries: { eyebrow: 'مدیریت / فروش', title: 'درخواست‌ها', description: 'رسیدگی به درخواست‌ها، پیگیری‌ها، ارجاع‌ها و درخواست‌های قیمت.' },
    customers: { eyebrow: 'مدیریت / مشتریان', title: 'مشتریان', description: 'بررسی پروفایل‌ها، نشانی‌های ذخیره‌شده، تاریخچه سفارش و فعالیت حساب.' },
    discounts: { eyebrow: 'مدیریت / تخفیف‌ها', title: 'تخفیف‌ها', description: 'برنامه‌ریزی و مدیریت پروموشن‌ها، کوپن‌ها، کمپین‌ها و کارت هدیه.' },
    readiness: { eyebrow: 'مدیریت / سیستم', title: 'آمادگی', description: 'بررسی پیکربندی اجرا، احراز هویت، اعلان‌ها و آمادگی پرداخت.' },
    audit: { eyebrow: 'مدیریت / سیستم', title: 'گزارش ممیزی', description: 'ردیابی اقدامات حساس مدیریت و تغییرات عملیاتی.' },
    staff: { eyebrow: 'مدیریت / سیستم', title: 'دسترسی تیم', description: 'بررسی آمادگی حساب‌های مدیریت و وضعیت دسترسی مالک.' },
    settings: { eyebrow: 'مدیریت / تنظیمات', title: 'تنظیمات', description: 'پیکربندی تنظیمات فروشگاه، ناوبری، انجام سفارش و ارائه‌دهندگان.' }
  };
  return (adminLocale(locale) === 'fa' ? fa : en)[activeNavKey] ?? (adminLocale(locale) === 'fa' ? fa : en)[activeTab] ?? en.overview;
}

function AdminModuleHeader({ header }: { header: AdminModuleHeader }) {
  return <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm"><div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-rosewood">{header.eyebrow}</p><h2 className="mt-2 text-2xl font-bold text-stone-950">{header.title}</h2><p className="mt-1 max-w-3xl text-sm text-stone-600">{header.description}</p></div>{header.action ? <Link href={header.action.href} className="rounded-full bg-rosewood px-5 py-2.5 text-sm font-semibold text-white shadow-sm">{header.action.label}</Link> : null}</div></section>;
}

function AdminHomepageContentPanel({ homepage, disabled, locale }: { homepage: HomepageContent; disabled: boolean; locale: SupportedLocale }) {
  const copy = adminCopy(locale).homepageForm;
  return <section id="homepage" className={panelClass}><form action={updateHomepageAction} className="grid gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-rosewood">{copy.eyebrow}</p><h3 className="text-xl font-bold text-stone-950">{copy.title}</h3></div><label className="grid gap-1 text-sm font-semibold text-stone-700">{copy.eyebrowField}<input name="eyebrow" defaultValue={homepage.eyebrow} disabled={disabled} className={inputClass} /></label><label className="grid gap-1 text-sm font-semibold text-stone-700">{copy.titleField}<input name="title" defaultValue={homepage.title} disabled={disabled} className={inputClass} /></label><label className="grid gap-1 text-sm font-semibold text-stone-700">{copy.body}<textarea name="body" defaultValue={homepage.body} disabled={disabled} className={textAreaClass} /></label><div className="grid gap-4 md:grid-cols-2"><label className="grid gap-1 text-sm font-semibold text-stone-700">{copy.primaryLabel}<input name="primaryLabel" defaultValue={homepage.primaryLabel} disabled={disabled} className={inputClass} /></label><label className="grid gap-1 text-sm font-semibold text-stone-700">{copy.primaryUrl}<input name="primaryUrl" defaultValue={homepage.primaryUrl} disabled={disabled} className={inputClass} /></label><label className="grid gap-1 text-sm font-semibold text-stone-700">{copy.secondaryLabel}<input name="secondaryLabel" defaultValue={homepage.secondaryLabel} disabled={disabled} className={inputClass} /></label><label className="grid gap-1 text-sm font-semibold text-stone-700">{copy.secondaryUrl}<input name="secondaryUrl" defaultValue={homepage.secondaryUrl} disabled={disabled} className={inputClass} /></label></div><div className="grid gap-4 md:grid-cols-3"><label className="grid gap-1 text-sm font-semibold text-stone-700">{copy.panelEyebrow}<input name="panelEyebrow" defaultValue={homepage.panelEyebrow} disabled={disabled} className={inputClass} /></label><label className="grid gap-1 text-sm font-semibold text-stone-700">{copy.panelTitle}<input name="panelTitle" defaultValue={homepage.panelTitle} disabled={disabled} className={inputClass} /></label><label className="grid gap-1 text-sm font-semibold text-stone-700">{copy.panelBody}<input name="panelBody" defaultValue={homepage.panelBody} disabled={disabled} className={inputClass} /></label></div><button type="submit" disabled={disabled} className={primaryButtonClass}>{copy.save}</button></form></section>;
}

const sidebarSections = [
  { labelKey: 'store', items: [
    { href: '/admin', key: 'overview', tab: 'overview' as AdminTab, icon: LayoutDashboard },
    { href: '/admin/products', key: 'products', tab: 'catalog' as AdminTab, icon: Package },
    { href: '/admin/categories', key: 'categories', tab: 'catalog' as AdminTab, icon: ClipboardList },
    { href: '/admin/media', key: 'media', tab: 'catalog' as AdminTab, icon: ImageIcon }
  ]},
  { labelKey: 'customerOps', items: [
    { href: '/admin/orders', key: 'orders', tab: 'sales' as AdminTab, icon: ShoppingBag },
    { href: '/admin/payments/settlement', key: 'payment-settlement', tab: 'sales' as AdminTab, icon: CreditCard },
    { href: '/admin/payments/alerts', key: 'payment-alerts', tab: 'sales' as AdminTab, icon: Bell },
    { href: '/admin/inquiries', key: 'inquiries', tab: 'sales' as AdminTab, icon: Users },
    { href: '/admin/customers', key: 'customers', tab: 'customers' as AdminTab, icon: Users },
    { href: '/admin/discounts', key: 'discounts', tab: 'discounts' as AdminTab, icon: BadgePercent }
  ]},
  { labelKey: 'content', items: [
    { href: '/admin/homepage', key: 'homepage', tab: 'content' as AdminTab, icon: Home },
    { href: '/admin/translations', key: 'translations', tab: 'content' as AdminTab, icon: FileText }
  ]},
  { labelKey: 'system', items: [
    { href: '/admin/readiness', key: 'readiness', tab: 'overview' as AdminTab, icon: ShieldCheck },
    { href: '/admin/audit', key: 'audit', tab: 'overview' as AdminTab, icon: BarChart3 },
    { href: '/admin/staff-access', key: 'staff', tab: 'overview' as AdminTab, icon: Settings },
    { href: '/admin/settings', key: 'settings', tab: 'settings' as AdminTab, icon: Settings }
  ]}
] as const;

function AdminSidebar({ activeNavKey, authenticated, authConfigured, adminLabel, locale }: { activeTab: AdminTab; activeNavKey: string; authenticated: boolean; authConfigured: boolean; adminLabel?: string; locale?: SupportedLocale }) {
  const copy = adminCopy(locale);
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-stone-200 bg-white lg:flex lg:flex-col">
      <div className="border-b border-stone-200 px-5 py-5"><Link href="/admin" className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-md bg-rosewood font-display text-xl text-white">G</span><span><span className="block text-sm font-bold text-stone-950">Golara</span><span className="block text-xs font-medium text-stone-500">{copy.console}</span></span></Link></div>
      <nav aria-label={copy.nav} className="flex-1 overflow-y-auto px-3 py-4"><div className="grid gap-5">{sidebarSections.map((section) => <div key={section.labelKey}><p className="px-3 pb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-stone-400">{copy.sections[section.labelKey]}</p><div className="grid gap-1">{section.items.map((item) => { const active = item.key === activeNavKey; const Icon = item.icon; return <Link key={item.href} href={item.href} aria-current={active ? 'page' : undefined} className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold transition ${active ? 'bg-rosewood text-white shadow-sm' : 'text-stone-700 hover:bg-stone-100 hover:text-stone-950'}`}><Icon aria-hidden="true" className="h-4 w-4" />{copy.navItems[item.key]}</Link>; })}</div></div>)}</div></nav>
      <div className="border-t border-stone-200 p-4">{authenticated ? <div className="rounded-md border border-stone-200 bg-stone-50 p-3"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">{copy.signedIn}</p><p className="mt-1 truncate text-sm font-semibold text-stone-900">{adminLabel ?? copy.admin}</p></div> : <Link href="/admin/login" className="flex items-center justify-center gap-2 rounded-md bg-rosewood px-4 py-2.5 text-sm font-semibold text-white"><LogIn aria-hidden="true" className="h-4 w-4" />{authConfigured ? copy.signIn : copy.configureAuth}</Link>}</div>
    </aside>
  );
}

function AdminMobileNav({ activeTab, locale }: { activeTab: AdminTab; locale?: SupportedLocale }) {
  return <nav aria-label={adminCopy(locale).workspaces} className="lg:hidden"><div className="flex gap-2 overflow-x-auto border-b border-stone-200 bg-white px-4 py-3 [scrollbar-width:none]">{adminTabs.map((tab) => { const active = tab.key === activeTab; const Icon = tab.icon; const localized = localizedAdminTab(tab.key, locale); return <Link key={tab.key} href={tabHref(tab.key)} aria-current={active ? 'page' : undefined} className={`inline-flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold ${active ? 'bg-rosewood text-white' : 'bg-stone-100 text-stone-700'}`}><Icon aria-hidden="true" className="h-4 w-4" />{localized.label}</Link>; })}</div></nav>;
}

function adminPathForNavKey(activeNavKey: string, activeTab: AdminTab) {
  for (const section of sidebarSections) {
    const item = section.items.find((candidate) => candidate.key === activeNavKey);
    if (item) return item.href;
  }
  return tabHref(activeTab);
}

function adminReturnPath(activeNavKey: string, activeTab: AdminTab, params: AdminSearchParams) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (!value || key === 'tab') continue;
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item) search.append(key, item);
      }
      continue;
    }
    search.set(key, value);
  }
  const query = search.toString();
  return `${adminPathForNavKey(activeNavKey, activeTab)}${query ? `?${query}` : ''}`;
}

function AdminTopBar({ activeTab, productCount, categoryCount, mediaCount, authenticated, authConfigured, locale, returnTo }: { activeTab: AdminTab; productCount: number; categoryCount: number; mediaCount: number; authenticated: boolean; authConfigured: boolean; locale: SupportedLocale; returnTo: string }) {
  const active = localizedAdminTab(activeTab, locale);
  const base = adminTabs.find((tab) => tab.key === activeTab) ?? adminTabs[0];
  const ActiveIcon = base.icon;
  const copy = adminCopy(locale);
  return <header className="sticky top-0 z-20 border-b border-stone-200 bg-white/95 backdrop-blur"><div className="flex min-h-16 flex-wrap items-center justify-between gap-3 px-4 py-3 lg:px-6"><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-md border border-stone-200 bg-stone-50 text-stone-700"><ActiveIcon aria-hidden="true" className="h-4 w-4" /></span><div><h1 className="text-lg font-bold text-stone-950">{active.label}</h1><p className="text-xs font-medium text-stone-500">{active.description}</p></div></div><div className="flex flex-wrap items-center gap-2"><LanguageSwitcher locale={locale} returnTo={returnTo} /><span className="rounded-md border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs font-semibold text-stone-700">{productCount} {copy.products}</span><span className="rounded-md border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs font-semibold text-stone-700">{categoryCount} {copy.categories}</span><span className="rounded-md border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs font-semibold text-stone-700">{mediaCount} {copy.media}</span>{!authenticated ? <Link href="/admin/login" className="inline-flex items-center gap-2 rounded-md bg-rosewood px-4 py-2 text-sm font-semibold text-white"><LogIn aria-hidden="true" className="h-4 w-4" />{authConfigured ? copy.signIn : copy.configureAuth}</Link> : null}</div></div></header>;
}

export async function AdminConsolePage({ searchParams, forcedTab, catalogSection = 'all', salesSection = 'all', contentSection = 'all', overviewSection = 'all', activeNavKey }: { searchParams: Promise<AdminSearchParams>; forcedTab?: AdminTab; catalogSection?: CatalogSection; salesSection?: SalesSection; contentSection?: ContentSection; overviewSection?: OverviewSection; activeNavKey?: string }) {
  const locale = await resolveStorefrontLocale();
  const { tab, status, message, catalogSearch, catalogCategory, catalogFlag, productPage, categoryPage, mediaPage, productColumns, mediaColumns, inquiryStatus, inquiryPage, inquirySearch, inquiryAssignment, auditAction, auditEntity, auditActor, auditSearch, orderStatus, orderPaymentStatus, orderFulfillmentStatus, orderSearch, orderPage } = await searchParams;
  const activeTab = forcedTab ?? parseAdminTab(tab);
  const resolvedActiveNavKey = activeNavKey ?? activeTab;
  const languageReturnTo = adminReturnPath(resolvedActiveNavKey, activeTab, { tab, status, message, catalogSearch, catalogCategory, catalogFlag, productPage, categoryPage, mediaPage, productColumns, mediaColumns, inquiryStatus, inquiryPage, inquirySearch, inquiryAssignment, auditAction, auditEntity, auditActor, auditSearch, orderStatus, orderPaymentStatus, orderFulfillmentStatus, orderSearch, orderPage });
  const standaloneContentPage = activeTab === 'content' && (contentSection === 'homepage' || contentSection === 'translations');
  const standaloneOverviewPage = activeTab === 'overview' && (overviewSection === 'audit' || overviewSection === 'staff');
  const activeWorkspace = standaloneContentPage || standaloneOverviewPage ? undefined : dashboardWorkspace(activeTab);
  const header = moduleHeader(activeTab, resolvedActiveNavKey, locale);
  const assignmentFilter = parseInquiryAssignmentQueueFilter(inquiryAssignment);
  const inquiryPageNumber = parsePage(inquiryPage);
  const auditFilters = { action: optionalParam(auditAction), entity: optionalParam(auditEntity), actor: optionalParam(auditActor), search: optionalParam(auditSearch) };
  const orderFilters = { status: optionalParam(orderStatus), paymentStatus: optionalParam(orderPaymentStatus), fulfillmentStatus: optionalParam(orderFulfillmentStatus), search: optionalParam(orderSearch) };
  const authenticated = await isAdminAuthenticated();
  const adminIdentity = authenticated ? await getAdminIdentity() : undefined;
  const canViewStaffReadiness = adminIdentity?.role === 'owner';
  const needsSettingsReads = activeTab === 'settings';
  const needsCustomerReads = activeTab === 'customers';
  const [categories, products, productTypes, homepage, homepageTranslations, media, inquiryPageData, assignmentSourceInquiries, inquiryCounts, auditLogs, orderRevenueSummary, orderPageData, authEventSummary, adminAccounts, adminCustomers, fulfillmentMethods] = await Promise.all([
    listAdminCategories(), listAdminProducts(), listAdminProductTypes(), getHomepageContent(), authenticated ? listHomepageTranslations() : Promise.resolve([]), listMedia(), listInquiryPage(inquiryStatus, inquiryPageNumber, undefined, inquirySearch), listInquiries(inquiryStatus, inquirySearch), listInquiryStatusCounts(inquirySearch), authenticated ? listAdminAuditLogs(auditFilters) : Promise.resolve([]), authenticated ? orderRevenueSummaryService.summary() : Promise.resolve(EMPTY_ORDER_REVENUE_SUMMARY), authenticated ? listAdminCheckoutOrderPage(orderFilters, parsePage(orderPage)) : Promise.resolve({ orders: [], page: 1, pageSize: 12, totalCount: 0, totalPages: 1 }), authenticated ? getCustomerAuthEventSummary() : getCustomerAuthEventSummary(1), canViewStaffReadiness ? listAdminAccountReadinessRecords() : Promise.resolve([]), needsCustomerReads && authenticated ? listAdminCustomers() : Promise.resolve([]), needsSettingsReads && authenticated ? listAdminFulfillmentMethodSettings() : Promise.resolve([])
  ]);
  const [storefrontNavigationMenu, storeSetting] = await Promise.all([
    needsSettingsReads ? storefrontNavigationMenuService.get() : Promise.resolve(DEFAULT_STOREFRONT_NAVIGATION_MENU),
    needsSettingsReads ? storeSettingsService.get() : Promise.resolve(DEFAULT_STORE_SETTING)
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
  const disabled = !runtimeReadiness.databaseUrlPresent || !authenticated;
  const showOverviewExtras = activeTab === 'overview' && overviewSection === 'all';
  const placeholder = adminCopy(locale).discountsPlaceholder;

  return (
    <main id="main-content" tabIndex={-1} dir={getStorefrontCopyDirection(locale)} className="min-h-screen bg-stone-50"><div className="min-h-screen lg:pl-72"><AdminSidebar activeTab={activeTab} activeNavKey={resolvedActiveNavKey} authenticated={authenticated} authConfigured={authConfigured} adminLabel={adminIdentity?.label ?? adminIdentity?.email} locale={locale} /><div className="min-w-0"><AdminMobileNav activeTab={activeTab} locale={locale} /><AdminTopBar activeTab={activeTab} productCount={products.length} categoryCount={categories.length} mediaCount={media.length} authenticated={authenticated} authConfigured={authConfigured} locale={locale} returnTo={languageReturnTo} /><section className="grid gap-6 px-4 py-6 lg:px-6"><AdminActionBanner status={status} message={message} locale={locale} /><AdminModuleHeader header={header} />
      {activeWorkspace ? <AdminDashboard activeWorkspace={activeWorkspace} catalogSection={catalogSection} categories={categories} products={products} productTypes={productTypes} homepage={homepage} homepageTranslations={homepageTranslations} media={media} authEventSummary={authEventSummary} runtimeReadiness={runtimeReadiness} authConfigured={authConfigured} authenticated={authenticated} notificationReadiness={notificationReadiness} notificationRetryRunbook={notificationRetryRunbook} checkoutReadiness={checkoutReadiness} catalogSearch={catalogSearch} catalogCategory={catalogCategory} catalogFlag={catalogFlag} productPage={parsePage(productPage)} categoryPage={parsePage(categoryPage)} mediaPage={parsePage(mediaPage)} productColumns={productColumns} mediaColumns={mediaColumns} status={status} message={message} locale={locale} /> : null}
      {standaloneContentPage && contentSection === 'homepage' ? <AdminHomepageContentPanel homepage={homepage} disabled={disabled} locale={locale} /> : null}
      {standaloneContentPage && contentSection === 'translations' && authenticated ? <AdminTranslationPanel homepage={homepage} homepageTranslations={homepageTranslations} categories={categories} products={products} disabled={disabled} locale={locale} /> : null}
      {showOverviewExtras && authenticated ? <AdminOrderRevenueSummaryPanel summary={orderRevenueSummary} /> : null}
      {(showOverviewExtras || overviewSection === 'staff') && activeTab === 'overview' && authenticated ? <AdminStaffReadinessPanel accounts={adminAccounts} summary={adminAccountSummary} identity={adminIdentity} /> : null}
      {(showOverviewExtras || overviewSection === 'audit') && activeTab === 'overview' && authenticated ? <AdminAuditLogPanel logs={auditLogs} filters={auditFilters} /> : null}
      {activeTab === 'sales' && authenticated && (salesSection === 'all' || salesSection === 'orders') ? <AdminOrderPanel orderPage={orderPageData} filters={orderFilters} locale={locale} /> : null}
      {activeTab === 'sales' && (salesSection === 'all' || salesSection === 'inquiries') ? <InquiryBoard inquiryPage={inquiryPageData} counts={inquiryCounts} assignmentSummary={assignmentSummary} activeStatus={inquiryStatus} search={inquirySearch} assignmentFilter={assignmentFilter} locale={locale} /> : null}
      {activeTab === 'customers' ? <AdminCustomerPanel customers={adminCustomers} databaseReady={runtimeReadiness.databaseUrlPresent} locale={locale} /> : null}
      {activeTab === 'discounts' ? <AdminModulePlaceholder eyebrow={placeholder.eyebrow} title={placeholder.title} body={placeholder.body} items={[...placeholder.items]} locale={locale} /> : null}
      {activeTab === 'settings' ? <div className="grid gap-6"><AdminStoreSettingsPanel setting={storeSetting} databaseReady={runtimeReadiness.databaseUrlPresent} locale={locale} /><AdminStorefrontNavigationPanel menu={storefrontNavigationMenu} databaseReady={runtimeReadiness.databaseUrlPresent} /><AdminFulfillmentSettingsPanel methods={fulfillmentMethods} databaseReady={runtimeReadiness.databaseUrlPresent} locale={locale} /></div> : null}
    </section></div></div></main>
  );
}
