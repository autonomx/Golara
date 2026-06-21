import { AdminConsolePage } from '@/app/admin/AdminConsolePage';
import { AdminOverviewActionDashboard } from '@/components/admin/AdminOverviewActionDashboard';
import { AdminTodayCommandCenter } from '@/components/admin/AdminTodayCommandCenter';
import { buildAdminTodayCards } from '@/lib/admin/admin-today-cards';
import { requireAdminRouteSession } from '@/lib/admin-page-auth-boundary';
import { listAdminProducts, listInquiryStatusCounts } from '@/lib/cms/catalog-repository';
import { listAdminCheckoutOrderPage } from '@/lib/checkout/admin-order-repository';
import { getPaymentGatewayConfig, getPaymentGatewayReadiness } from '@/lib/checkout/payment-gateway-config';
import { resolveStorefrontLocale } from '@/lib/i18n/resolve-locale';
import { getRuntimeReadiness } from '@/lib/runtime-readiness';

export const dynamic = 'force-dynamic';

type AdminPageSearchParams = { [key: string]: string | undefined };

export default async function AdminPage({ searchParams }: { searchParams: Promise<AdminPageSearchParams> }) {
  await requireAdminRouteSession();

  const params = await searchParams;
  const [locale, products, inquiryStatusCounts, orderPage, runtimeReadiness] = await Promise.all([
    resolveStorefrontLocale(),
    listAdminProducts(),
    listInquiryStatusCounts(params.inquirySearch),
    listAdminCheckoutOrderPage({}, 1),
    Promise.resolve(getRuntimeReadiness())
  ]);
  const checkoutReadiness = getPaymentGatewayReadiness(getPaymentGatewayConfig(process.env), process.env);
  const todayCards = buildAdminTodayCards({
    products,
    orders: orderPage.orders,
    orderTotalCount: orderPage.totalCount,
    inquiryStatusCounts,
    runtimeReadiness,
    checkoutReadiness
  });

  return (
    <>
      <div className="admin-shell-prelude bg-cream px-4 pt-4 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-4">
          <AdminTodayCommandCenter cards={todayCards} locale={locale} />
          <AdminOverviewActionDashboard cards={todayCards} locale={locale} />
        </div>
      </div>
      <AdminConsolePage searchParams={Promise.resolve(params)} activeNavKey="overview" />
    </>
  );
}
