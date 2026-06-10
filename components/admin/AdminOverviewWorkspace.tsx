import type { PaymentGatewayReadiness } from '@/lib/checkout/payment-gateway-config';
import type { CustomerAuthEventSummary } from '@/lib/customers/customer-auth-event-summary';
import type { SupportedLocale } from '@/lib/i18n/locales';
import type { InquiryNotificationReadiness } from '@/lib/notifications/inquiry-notifications-core';
import type { RuntimeReadiness } from '@/lib/runtime-readiness';
import { AdminCmsStatusPanel } from '@/components/admin/AdminCmsStatusPanel';
import { AdminReadinessPanel } from '@/components/admin/AdminReadinessPanel';
import { AdminSecurityPanel } from '@/components/admin/AdminSecurityPanel';

type AdminOverviewWorkspaceProps = {
  authEventSummary: CustomerAuthEventSummary;
  runtimeReadiness: RuntimeReadiness;
  authConfigured: boolean;
  authenticated: boolean;
  notificationReadiness: InquiryNotificationReadiness;
  notificationRetryRunbook: string[];
  checkoutReadiness: PaymentGatewayReadiness;
  locale?: SupportedLocale | string | null;
  t?: (key: string) => string;
};

export function AdminOverviewWorkspace({
  authEventSummary,
  runtimeReadiness,
  authConfigured,
  authenticated,
  notificationReadiness,
  notificationRetryRunbook,
  checkoutReadiness,
  locale,
  t = (key: string) => key
}: AdminOverviewWorkspaceProps) {
  const databaseReady = runtimeReadiness.databaseUrlPresent;

  return (
    <>
      <AdminReadinessPanel
        runtimeReadiness={runtimeReadiness}
        authConfigured={authConfigured}
        authenticated={authenticated}
        notificationReadiness={notificationReadiness}
        notificationRetryRunbook={notificationRetryRunbook}
        checkoutReadiness={checkoutReadiness}
        locale={locale}
      />
      {authenticated ? <AdminSecurityPanel summary={authEventSummary} locale={locale} /> : null}
      <AdminCmsStatusPanel databaseReady={databaseReady} authenticated={authenticated} t={t} />
    </>
  );
}
