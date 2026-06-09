import Link from 'next/link';
import { BadgePercent, BarChart3, Bell, ClipboardList, CreditCard, FileText, Home, ImageIcon, LayoutDashboard, LogIn, Package, Settings, ShoppingBag, ShieldCheck, Users } from 'lucide-react';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { getStorefrontCopyDirection } from '@/lib/localization/storefront-copy';
import type { SupportedLocale } from '@/lib/i18n/locales';

type AdminNavKey =
  | 'overview'
  | 'products'
  | 'categories'
  | 'media'
  | 'orders'
  | 'payment-settlement'
  | 'payment-alerts'
  | 'inquiries'
  | 'customers'
  | 'discounts'
  | 'homepage'
  | 'translations'
  | 'readiness'
  | 'audit'
  | 'staff'
  | 'settings';

type AdminTab = 'overview' | 'catalog' | 'content' | 'sales' | 'customers' | 'discounts' | 'settings';

type AdminPageShellProps = {
  activeTab: AdminTab;
  activeNavKey: AdminNavKey;
  authenticated: boolean;
  authConfigured: boolean;
  adminLabel?: string | null;
  locale: SupportedLocale;
  returnTo: string;
  productCount?: number;
  categoryCount?: number;
  mediaCount?: number;
  children: React.ReactNode;
};

const adminTabs = [
  { key: 'overview', label: 'Overview', description: 'Readiness, access, audit, and security.', icon: LayoutDashboard },
  { key: 'catalog', label: 'Catalog', description: 'Products, categories, subcategories, and media.', icon: Package },
  { key: 'content', label: 'Content', description: 'Homepage copy and translations.', icon: FileText },
  { key: 'sales', label: 'Sales', description: 'Orders and customer inquiries.', icon: ShoppingBag },
  { key: 'customers', label: 'Customers', description: 'Profiles, addresses, accounts, and activity.', icon: Users },
  { key: 'discounts', label: 'Discounts', description: 'Vouchers, campaigns, and gift-card planning.', icon: BadgePercent },
  { key: 'settings', label: 'Settings', description: 'Store configuration, staff access, and providers.', icon: Settings }
] as const;

const copy = {
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
    sections: { store: 'Store', customerOps: 'Customer Ops', content: 'Content', system: 'System' },
    navItems: { overview: 'Overview', products: 'Products', categories: 'Categories', media: 'Media library', orders: 'Orders', 'payment-settlement': 'Payment settlement', 'payment-alerts': 'Payment alerts', inquiries: 'Inquiries', customers: 'Customers', discounts: 'Discounts', homepage: 'Homepage', translations: 'Translations', readiness: 'Readiness', audit: 'Audit log', staff: 'Staff access', settings: 'Settings' }
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
    sections: { store: 'فروشگاه', customerOps: 'عملیات مشتری', content: 'محتوا', system: 'سیستم' },
    navItems: { overview: 'نمای کلی', products: 'محصولات', categories: 'دسته‌بندی‌ها', media: 'کتابخانه رسانه', orders: 'سفارش‌ها', 'payment-settlement': 'تسویه پرداخت', 'payment-alerts': 'هشدارهای پرداخت', inquiries: 'درخواست‌ها', customers: 'مشتریان', discounts: 'تخفیف‌ها', homepage: 'صفحه اصلی', translations: 'ترجمه‌ها', readiness: 'آمادگی', audit: 'گزارش ممیزی', staff: 'دسترسی تیم', settings: 'تنظیمات' }
  }
} as const;

const sidebarSections = [
  { labelKey: 'store', items: [
    { href: '/admin', key: 'overview', icon: LayoutDashboard },
    { href: '/admin/products', key: 'products', icon: Package },
    { href: '/admin/categories', key: 'categories', icon: ClipboardList },
    { href: '/admin/media', key: 'media', icon: ImageIcon }
  ]},
  { labelKey: 'customerOps', items: [
    { href: '/admin/orders', key: 'orders', icon: ShoppingBag },
    { href: '/admin/payments/settlement', key: 'payment-settlement', icon: CreditCard },
    { href: '/admin/payments/alerts', key: 'payment-alerts', icon: Bell },
    { href: '/admin/inquiries', key: 'inquiries', icon: Users },
    { href: '/admin/customers', key: 'customers', icon: Users },
    { href: '/admin/discounts', key: 'discounts', icon: BadgePercent }
  ]},
  { labelKey: 'content', items: [
    { href: '/admin/homepage', key: 'homepage', icon: Home },
    { href: '/admin/translations', key: 'translations', icon: FileText }
  ]},
  { labelKey: 'system', items: [
    { href: '/admin/readiness', key: 'readiness', icon: ShieldCheck },
    { href: '/admin/audit', key: 'audit', icon: BarChart3 },
    { href: '/admin/staff-access', key: 'staff', icon: Settings },
    { href: '/admin/settings', key: 'settings', icon: Settings }
  ]}
] as const;

function localeKey(locale?: SupportedLocale | string | null) {
  return locale?.toLowerCase().startsWith('fa') ? 'fa' : 'en';
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

function localizedTab(tab: AdminTab, locale: SupportedLocale) {
  const current = adminTabs.find((item) => item.key === tab) ?? adminTabs[0];
  if (localeKey(locale) === 'fa') {
    const labels: Record<AdminTab, [string, string]> = {
      overview: ['نمای کلی', 'آمادگی، دسترسی، ممیزی و امنیت.'],
      catalog: ['کاتالوگ', 'محصولات، دسته‌بندی‌ها، زیرمجموعه‌ها و رسانه‌ها.'],
      content: ['محتوا', 'متن صفحه اصلی و ترجمه‌ها.'],
      sales: ['فروش', 'سفارش‌ها و درخواست‌های مشتریان.'],
      customers: ['مشتریان', 'پروفایل‌ها، نشانی‌ها، حساب‌ها و فعالیت‌ها.'],
      discounts: ['تخفیف‌ها', 'کوپن‌ها، کمپین‌ها و برنامه‌ریزی کارت هدیه.'],
      settings: ['تنظیمات', 'پیکربندی فروشگاه، دسترسی تیم و ارائه‌دهندگان.']
    };
    const [label, description] = labels[tab];
    return { ...current, label, description };
  }
  return current;
}

function AdminSidebar({ activeNavKey, authenticated, authConfigured, adminLabel, locale }: Pick<AdminPageShellProps, 'activeNavKey' | 'authenticated' | 'authConfigured' | 'adminLabel' | 'locale'>) {
  const t = copy[localeKey(locale)];
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-stone-200 bg-white lg:flex lg:flex-col">
      <div className="border-b border-stone-200 px-5 py-5">
        <Link href="/admin" className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-md bg-rosewood font-display text-xl text-white">G</span><span><span className="block text-sm font-bold text-stone-950">Golara</span><span className="block text-xs font-medium text-stone-500">{t.console}</span></span></Link>
      </div>
      <nav aria-label={t.nav} className="flex-1 overflow-y-auto px-3 py-4">
        <div className="grid gap-5">{sidebarSections.map((section) => <div key={section.labelKey}><p className="px-3 pb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-stone-400">{t.sections[section.labelKey]}</p><div className="grid gap-1">{section.items.map((item) => { const Icon = item.icon; const active = item.key === activeNavKey; return <Link key={item.href} href={item.href} aria-current={active ? 'page' : undefined} className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold transition ${active ? 'bg-rosewood text-white shadow-sm' : 'text-stone-700 hover:bg-stone-100 hover:text-stone-950'}`}><Icon aria-hidden="true" className="h-4 w-4" />{t.navItems[item.key]}</Link>; })}</div></div>)}</div>
      </nav>
      <div className="border-t border-stone-200 p-4">{authenticated ? <div className="rounded-md border border-stone-200 bg-stone-50 p-3"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">{t.signedIn}</p><p className="mt-1 truncate text-sm font-semibold text-stone-900">{adminLabel ?? t.admin}</p></div> : <Link href="/admin/login" className="flex items-center justify-center gap-2 rounded-md bg-rosewood px-4 py-2.5 text-sm font-semibold text-white"><LogIn aria-hidden="true" className="h-4 w-4" />{authConfigured ? t.signIn : t.configureAuth}</Link>}</div>
    </aside>
  );
}

function AdminMobileNav({ activeTab, locale }: { activeTab: AdminTab; locale: SupportedLocale }) {
  const t = copy[localeKey(locale)];
  return <nav aria-label={t.workspaces} className="lg:hidden"><div className="flex gap-2 overflow-x-auto border-b border-stone-200 bg-white px-4 py-3 [scrollbar-width:none]">{adminTabs.map((tab) => { const active = tab.key === activeTab; const Icon = tab.icon; const localized = localizedTab(tab.key, locale); return <Link key={tab.key} href={tabHref(tab.key)} aria-current={active ? 'page' : undefined} className={`inline-flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold ${active ? 'bg-rosewood text-white' : 'bg-stone-100 text-stone-700'}`}><Icon aria-hidden="true" className="h-4 w-4" />{localized.label}</Link>; })}</div></nav>;
}

function AdminTopBar({ activeTab, productCount = 0, categoryCount = 0, mediaCount = 0, authenticated, authConfigured, locale, returnTo }: Omit<AdminPageShellProps, 'activeNavKey' | 'adminLabel' | 'children'>) {
  const active = localizedTab(activeTab, locale);
  const ActiveIcon = active.icon;
  const t = copy[localeKey(locale)];
  return <header className="sticky top-0 z-20 border-b border-stone-200 bg-white/95 backdrop-blur"><div className="flex min-h-16 flex-wrap items-center justify-between gap-3 px-4 py-3 lg:px-6"><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-md border border-stone-200 bg-stone-50 text-stone-700"><ActiveIcon aria-hidden="true" className="h-4 w-4" /></span><div><h1 className="text-lg font-bold text-stone-950">{active.label}</h1><p className="text-xs font-medium text-stone-500">{active.description}</p></div></div><div className="flex flex-wrap items-center gap-2"><LanguageSwitcher locale={locale} returnTo={returnTo} /><span className="rounded-md border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs font-semibold text-stone-700">{productCount} {t.products}</span><span className="rounded-md border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs font-semibold text-stone-700">{categoryCount} {t.categories}</span><span className="rounded-md border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs font-semibold text-stone-700">{mediaCount} {t.media}</span>{!authenticated ? <Link href="/admin/login" className="inline-flex items-center gap-2 rounded-md bg-rosewood px-4 py-2 text-sm font-semibold text-white"><LogIn aria-hidden="true" className="h-4 w-4" />{authConfigured ? t.signIn : t.configureAuth}</Link> : null}</div></div></header>;
}

export function AdminPageShell(props: AdminPageShellProps) {
  return (
    <main id="main-content" tabIndex={-1} dir={getStorefrontCopyDirection(props.locale)} className="min-h-screen bg-stone-50">
      <div className="min-h-screen lg:pl-72">
        <AdminSidebar activeNavKey={props.activeNavKey} authenticated={props.authenticated} authConfigured={props.authConfigured} adminLabel={props.adminLabel} locale={props.locale} />
        <div className="min-w-0">
          <AdminMobileNav activeTab={props.activeTab} locale={props.locale} />
          <AdminTopBar activeTab={props.activeTab} authenticated={props.authenticated} authConfigured={props.authConfigured} locale={props.locale} returnTo={props.returnTo} productCount={props.productCount} categoryCount={props.categoryCount} mediaCount={props.mediaCount} />
          <section className="grid gap-6 px-4 py-6 lg:px-6">{props.children}</section>
        </div>
      </div>
    </main>
  );
}
