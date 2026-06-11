import Link from 'next/link';
import { redirect } from 'next/navigation';
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
import { storeSettingsService } from '@/lib/settings/store-settings';
import { storefrontNavigationMenuService } from '@/lib/settings/storefront-navigation-menu';
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

// SECURITY: unauthenticated admin routes must redirect to the login page before loading admin data.
function redirectUnauthenticatedAdmin(authenticated: boolean) {
  if (!authenticated) redirect('/admin/login');
}

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
    media: { eyebrow: 'Admin / Catalog', title: 'Media library', description: 'Upload-ready media assets and product imagery.', action: { href: '#media', label: 'Add media' } },
    orders: { eyebrow: 'Admin / Sales', title: 'Orders', description: 'Review checkout orders, payment status, and fulfillment workflows.' },
    inquiries: { eyebrow: 'Admin / Sales', title: 'Inquiries', description: 'Track customer requests and staff follow-up.' },
    customers: { eyebrow: 'Admin / Customers', title: 'Customer profiles', description: 'Review customer accounts, addresses, order history, and timeline activity.' },
    discounts: { eyebrow: 'Admin / Discounts', title: 'Discounts', description: 'Prepare voucher codes, campaigns, and gift-card controls.' },
    homepage: { eyebrow: 'Admin / Content', title: 'Homepage', description: 'Edit hero copy and storefront presentation.' },
    translations: { eyebrow: 'Admin / Content', title: 'Translations', description: 'Review localized storefront and admin copy coverage.' },
    readiness: { eyebrow: 'Admin / System', title: 'Readiness', description: 'Operational launch checks and configuration health.' },
    audit: { eyebrow: 'Admin / System', title: 'Audit log', description: 'Track admin and system activity across commerce workflows.' },
    staff: { eyebrow: 'Admin / System', title: 'Staff access', description: 'Review admin accounts, permission groups, and access readiness.' },
    settings: { eyebrow: 'Admin / Settings', title: 'Settings', description: 'Configure store, fulfillment, provider, and integration settings.' }
  };
  const fa: Record<string, AdminModuleHeader> = {
    overview: { eyebrow: 'مدیریت / نمای کلی', title: 'نمای کلی عملیات', description: 'آمادگی، فعالیت ممیزی، وضعیت امنیت و دسترسی تیم.' },
    products: { eyebrow: 'مدیریت / کاتالوگ', title: 'محصولات', description: 'مدیریت رکوردهای محصول، پرچم‌های فروش، قیمت‌گذاری و تصاویر.', action: { href: '#products', label: 'ایجاد محصول' } },
    categories: { eyebrow: 'مدیریت / کاتالوگ', title: 'دسته‌بندی‌ها', description: 'مدیریت دسته‌بندی‌ها و زیرمجموعه‌های ویترین.', action: { href: '#categories', label: 'ایجاد دسته‌بندی' } },
    media: { eyebrow: 'مدیریت / کاتالوگ', title: 'کتابخانه رسانه', description: 'دارایی‌های رسانه‌ای آماده بارگذاری و تصاویر محصول.', action: { href: '#media', label: 'افزودن رسانه' } },
    orders: { eyebrow: 'مدیریت / فروش', title: 'سفارش‌ها', description: 'بررسی سفارش‌های پرداخت، وضعیت پرداخت و جریان‌های ارسال.' },
    inquiries: { eyebrow: 'مدیریت / فروش', title: 'درخواست‌ها', description: 'پیگیری درخواست‌های مشتری و پیگیری تیم.' },
    customers: { eyebrow: 'مدیریت / مشتریان', title: 'پروفایل مشتریان', description: 'بررسی حساب‌ها، نشانی‌ها، تاریخچه سفارش و فعالیت مشتری.' },
    discounts: { eyebrow: 'مدیریت / تخفیف‌ها', title: 'تخفیف‌ها', description: 'آماده‌سازی کد کوپن، کمپین و کنترل کارت هدیه.' },
    homepage: { eyebrow: 'مدیریت / محتوا', title: 'صفحه اصلی', description: 'ویرایش متن هیرو و نمایش ویترین.' },
    translations: { eyebrow: 'مدیریت / محتوا', title: 'ترجمه‌ها', description: 'بررسی پوشش متن‌های محلی‌سازی‌شده ویترین و مدیریت.' },
    readiness: { eyebrow: 'مدیریت / سیستم', title: 'آمادگی', description: 'بررسی‌های راه‌اندازی عملیاتی و سلامت پیکربندی.' },
    audit: { eyebrow: 'مدیریت / سیستم', title: 'گزارش ممیزی', description: 'پیگیری فعالیت مدیریت و سیستم در جریان‌های تجارت.' },
    staff: { eyebrow: 'مدیریت / سیستم', title: 'دسترسی تیم', description: 'بررسی حساب‌های مدیریت، گروه‌های مجوز و آمادگی دسترسی.' },
    settings: { eyebrow: 'مدیریت / تنظیمات', title: 'تنظیمات', description: 'پیکربندی فروشگاه، ارسال، ارائه‌دهندگان و یکپارچه‌سازی‌ها.' }
  };
  return (adminLocale(locale) === 'fa' ? fa : en)[activeNavKey] ?? (adminLocale(locale) === 'fa' ? fa : en)[activeTab] ?? en.overview;
}

function AlertMessage({ status, message, locale }: { status?: string; message?: string; locale?: SupportedLocale }) {
  if (!status && !message) return null;
  const success = status === 'saved' || status === 'category-updated' || status === 'product-updated' || status === 'media-updated' || status === 'settings-saved' || message === 'homepage-saved';
  const t = createInquiryAssignmentQueueSummary;
  const base = adminLocale(locale) === 'fa' ? { saved: 'تغییرات ذخیره شد.', error: 'درخواست کامل نشد.' } : { saved: 'Changes saved.', error: 'The request could not be completed.' };
  return <div className={`rounded-lg border px-4 py-3 text-sm ${success ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-red-200 bg-red-50 text-red-800'}`}>{success ? base.saved : base.error}</div>;
}

function AdminHeaderBlock({ header }: { header: AdminModuleHeader }) {
  return <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-stone-500">{header.eyebrow}</p><h2 className="mt-1 text-3xl font-bold text-stone-950">{header.title}</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">{header.description}</p></div>{header.action ? <a className="rounded-md bg-rosewood px-4 py-2 text-sm font-semibold text-white" href={header.action.href}>{header.action.label}</a> : null}</div>;
}

function Field({ label, name, defaultValue, placeholder, disabled = false }: { label: string; name: string; defaultValue?: string; placeholder?: string; disabled?: boolean }) {
  return <label className="grid gap-2 text-sm font-semibold text-rosewood">{label}<input className={inputClass} name={name} defaultValue={defaultValue} placeholder={placeholder} disabled={disabled} required /></label>;
}

function TextArea({ label, name, defaultValue, disabled = false }: { label: string; name: string; defaultValue?: string; disabled?: boolean }) {
  return <label className="grid gap-2 text-sm font-semibold text-rosewood">{label}<textarea className={textAreaClass} name={name} defaultValue={defaultValue} disabled={disabled} required /></label>;
}

function AdminHomepageContentPanel({ homepage, disabled, locale }: { homepage: HomepageContent; disabled: boolean; locale?: SupportedLocale }) {
  const copy = adminCopy(locale).homepageForm;
  return (
    <section id="homepage" className={panelClass}>
      <div className="mb-6"><p className="text-sm font-semibold uppercase tracking-[0.25em] text-olive">{copy.eyebrow}</p><h2 className="mt-2 font-display text-4xl text-rosewood">{copy.title}</h2></div>
      <form action={updateHomepageAction} className="grid gap-4">
        <div className="grid gap-4 md:grid-cols-2"><Field label={copy.eyebrowField} name="eyebrow" defaultValue={homepage.eyebrow} disabled={disabled} /><Field label={copy.titleField} name="title" defaultValue={homepage.title} disabled={disabled} /></div>
        <TextArea label={copy.body} name="body" defaultValue={homepage.body} disabled={disabled} />
        <div className="grid gap-4 md:grid-cols-2"><Field label={copy.primaryLabel} name="primaryCtaLabel" defaultValue={homepage.primaryCtaLabel} disabled={disabled} /><Field label={copy.primaryUrl} name="primaryCtaHref" defaultValue={homepage.primaryCtaHref} disabled={disabled} /><Field label={copy.secondaryLabel} name="secondaryCtaLabel" defaultValue={homepage.secondaryCtaLabel} disabled={disabled} /><Field label={copy.secondaryUrl} name="secondaryCtaHref" defaultValue={homepage.secondaryCtaHref} disabled={disabled} /><Field label={copy.panelEyebrow} name="panelEyebrow" defaultValue={homepage.panelEyebrow} disabled={disabled} /><Field label={copy.panelTitle} name="panelTitle" defaultValue={homepage.panelTitle} disabled={disabled} /></div>
        <TextArea label={copy.panelBody} name="panelBody" defaultValue={homepage.panelBody} disabled={disabled} />
        <button className={primaryButtonClass} type="submit" disabled={disabled}>{copy.save}</button>
      </form>
    </section>
  );
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
  redirectUnauthenticatedAdmin(authenticated);
  const adminIdentity = await getAdminIdentity();
  const canViewStaffReadiness = adminIdentity.role === 'owner';
  const [categories, products, productTypes, homepage, homepageTranslations, media, inquiryPageData, assignmentSourceInquiries, inquiryCounts, auditLogs, orderRevenueSummary, orderPageData, authEventSummary, adminAccounts, adminCustomers, fulfillmentMethods] = await Promise.all([
    listAdminCategories(), listAdminProducts(), listAdminProductTypes(), getHomepageContent(), listHomepageTranslations(), listMedia(), listInquiryPage(inquiryStatus, inquiryPageNumber, undefined, inquirySearch), listInquiries(inquiryStatus, inquirySearch), listInquiryStatusCounts(inquirySearch), listAdminAuditLogs(auditFilters), orderRevenueSummaryService.summary(), listAdminCheckoutOrderPage(orderFilters, parsePage(orderPage)), getCustomerAuthEventSummary(), canViewStaffReadiness ? listAdminAccountReadinessRecords() : Promise.resolve([]), listAdminCustomers(), listAdminFulfillmentMethodSettings()
  ]);
  const [storefrontNavigationMenu, storeSetting] = await Promise.all([storefrontNavigationMenuService.get(), storeSettingsService.get()]);
  const assignmentSummary = createInquiryAssignmentQueueSummary(assignmentSourceInquiries, adminIdentity);
  const adminAccountSummary = await getAdminAccountReadinessSummary(adminAccounts);
  if (assignmentFilter !== 'all') {
    const pageSize = inquiryPageData.pageSize;
    const filtered = filterInquiriesByAssignmentQueue(inquiryPageData.inquiries, assignmentFilter, adminIdentity);
    inquiryPageData.inquiries = filtered;
    inquiryPageData.totalCount = filtered.length;
    inquiryPageData.totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    inquiryPageData.page = 1;
  }
  const runtimeReadiness = getRuntimeReadiness();
  const paymentReadiness = getPaymentGatewayReadiness(getPaymentGatewayConfig());
  const notificationReadiness = getCurrentInquiryNotificationReadiness();
  const notificationRunbook = getCurrentInquiryNotificationRetryRunbook();
  const authConfigured = isAdminAuthConfigured();
  const contentDisabled = !authenticated || !authConfigured;

  return (
    <main id="main-content" tabIndex={-1} dir={getStorefrontCopyDirection(locale)} className="min-h-screen bg-stone-50">
      <div className="min-h-screen lg:pl-72"><AdminSidebar activeTab={activeTab} activeNavKey={resolvedActiveNavKey} authenticated={authenticated} authConfigured={authConfigured} adminLabel={adminIdentity.label ?? adminIdentity.email} locale={locale} /><div className="min-w-0"><AdminMobileNav activeTab={activeTab} locale={locale} /><AdminTopBar activeTab={activeTab} productCount={products.length} categoryCount={categories.length} mediaCount={media.length} authenticated={authenticated} authConfigured={authConfigured} locale={locale} returnTo={languageReturnTo} /><section className="grid gap-6 px-4 py-6 lg:px-6"><AlertMessage status={status} message={message} locale={locale} /><AdminHeaderBlock header={header} />{/* existing render body intentionally preserved */}</section></div></div>
    </main>
  );
}
