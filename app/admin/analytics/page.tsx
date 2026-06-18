import { AdminOrderRevenueSummaryPanel } from '@/components/admin/AdminOrderRevenueSummaryPanel';
import { AdminPageShell } from '@/components/admin/AdminPageShell';
import { requireAdminRouteSession } from '@/lib/admin-page-auth-boundary';
import { getAdminIdentity, isAdminAuthConfigured, isAdminAuthenticated } from '@/lib/admin-auth';
import { EMPTY_ORDER_REVENUE_SUMMARY, orderRevenueSummaryService } from '@/lib/analytics/order-revenue-summary';
import { listAdminCategories, listAdminProducts, listMedia } from '@/lib/cms/catalog-repository';
import { resolveStorefrontLocale } from '@/lib/i18n/resolve-locale';
import type { SupportedLocale } from '@/lib/i18n/locales';

export const dynamic = 'force-dynamic';

type AdminAnalyticsLocale = 'en' | 'fa';

const copy = {
  en: {
    eyebrow: 'Admin / Analytics',
    title: 'Analytics workspace',
    body: 'Business analytics, order health, inventory pressure, inquiry operations, recent activity, and readiness signals in one place.',
    badge: 'Dedicated analytics page',
    note: 'This first slice reuses the existing operations analytics panels. Chart primitives and site event analytics can be added here next without crowding the Overview page.'
  },
  fa: {
    eyebrow: 'مدیریت / تحلیل‌ها',
    title: 'فضای کاری تحلیل‌ها',
    body: 'تحلیل کسب‌وکار، وضعیت سفارش، فشار موجودی، عملیات درخواست‌ها، فعالیت اخیر و سیگنال‌های آمادگی در یک صفحه.',
    badge: 'صفحه اختصاصی تحلیل‌ها',
    note: 'این مرحله اول از پنل‌های تحلیلی موجود استفاده می‌کند. نمودارها و تحلیل رویدادهای سایت می‌توانند در مرحله بعد همین‌جا اضافه شوند بدون اینکه صفحه نمای کلی شلوغ شود.'
  }
} as const;

function localeKey(locale?: SupportedLocale | string | null): AdminAnalyticsLocale {
  return locale?.toLowerCase().startsWith('fa') ? 'fa' : 'en';
}

export default async function AdminAnalyticsPage() {
  await requireAdminRouteSession();

  const locale = await resolveStorefrontLocale();
  const labels = copy[localeKey(locale)];
  const authenticated = await isAdminAuthenticated();
  const authConfigured = isAdminAuthConfigured();
  const identity = await getAdminIdentity();
  const [products, categories, media, orderRevenueSummary] = await Promise.all([
    listAdminProducts(),
    listAdminCategories(),
    listMedia(),
    authenticated ? orderRevenueSummaryService.summary() : Promise.resolve(EMPTY_ORDER_REVENUE_SUMMARY)
  ]);

  return (
    <AdminPageShell
      activeTab="analytics"
      activeNavKey="analytics"
      authenticated={authenticated}
      authConfigured={authConfigured}
      adminLabel={identity.label ?? identity.email}
      locale={locale}
      returnTo="/admin/analytics"
      productCount={products.length}
      categoryCount={categories.length}
      mediaCount={media.length}
    >
      <div className="mx-auto grid w-full max-w-6xl gap-6">
        <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-stone-500">{labels.eyebrow}</p>
              <h1 className="mt-1 text-3xl font-bold text-stone-950">{labels.title}</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">{labels.body}</p>
            </div>
            <span className="rounded-full bg-olive/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-olive">{labels.badge}</span>
          </div>
          <p className="mt-4 rounded-md border border-stone-200 bg-stone-50 px-4 py-3 text-sm leading-6 text-stone-600">{labels.note}</p>
        </section>
        <AdminOrderRevenueSummaryPanel summary={orderRevenueSummary} />
      </div>
    </AdminPageShell>
  );
}
