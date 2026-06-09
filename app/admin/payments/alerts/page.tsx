import Link from 'next/link';

import { AdminPageShell } from '@/components/admin/AdminPageShell';
import { AdminPaymentWebhookAlertsPanel } from '@/components/admin/AdminPaymentWebhookAlertsPanel';
import { getAdminIdentity, isAdminAuthConfigured, isAdminAuthenticated } from '@/lib/admin-auth';
import { paymentWebhookAlertService } from '@/lib/checkout/payment-webhook-alert-service';
import { listAdminCategories, listAdminProducts, listMedia } from '@/lib/cms/catalog-repository';
import { resolveStorefrontLocale } from '@/lib/i18n/resolve-locale';
import { createAdminTranslator } from '@/lib/localization/admin-copy';

export const dynamic = 'force-dynamic';

export default async function AdminPaymentWebhookAlertsPage() {
  const locale = await resolveStorefrontLocale();
  const t = createAdminTranslator(locale);
  const authenticated = await isAdminAuthenticated();
  const authConfigured = isAdminAuthConfigured();
  const identity = await getAdminIdentity();
  const [summary, products, categories, media] = await Promise.all([
    authenticated ? paymentWebhookAlertService.summary(50) : Promise.resolve({ total: 0, alerts: 0, warning: 0, critical: 0, retryable: 0, recent: [] }),
    listAdminProducts(),
    listAdminCategories(),
    listMedia()
  ]);

  return (
    <AdminPageShell
      activeTab="sales"
      activeNavKey="payment-alerts"
      authenticated={authenticated}
      authConfigured={authConfigured}
      adminLabel={identity.label ?? identity.email}
      locale={locale}
      returnTo="/admin/payments/alerts"
      productCount={products.length}
      categoryCount={categories.length}
      mediaCount={media.length}
    >
      <div className="mx-auto grid w-full max-w-7xl gap-6">
        <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-stone-500">{t('Admin / Payments')}</p>
              <h1 className="mt-1 text-3xl font-bold text-stone-950">{t('Webhook alerts')}</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">{t('Review payment webhook events that need operator attention, retries, or provider dashboard follow-up.')}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/admin/payments/settlement" className="rounded-md border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-700">{t('Settlement')}</Link>
              <Link href="/admin/orders" className="rounded-md bg-rosewood px-4 py-2 text-sm font-semibold text-white">{t('Back to orders')}</Link>
            </div>
          </div>
          <div className="mt-4 rounded-lg bg-stone-50 p-3 text-sm text-stone-600">
            {authConfigured ? authenticated ? `${t('Signed in as')} ${identity.label ?? identity.email ?? 'admin'}.` : t('Admin authentication is required to view webhook alerts.') : t('Admin authentication is not configured yet.')}
          </div>
        </section>

        {authenticated ? <AdminPaymentWebhookAlertsPanel summary={summary} /> : null}
      </div>
    </AdminPageShell>
  );
}
