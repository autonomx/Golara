import { updatePaymentProviderSettingAction } from '@/app/admin/settings/actions';
import {
  CHECKOUT_CURRENCIES,
  CHECKOUT_MODES,
  OVERSEAS_FALLBACKS,
  PAYMENT_GATEWAY_PROVIDERS
} from '@/lib/checkout/payment-gateway-config';
import {
  buildPaymentProviderReadinessSummary,
  type PaymentProviderSetting
} from '@/lib/settings/payment-provider-settings';

const inputClass = 'rounded-md border border-stone-200 bg-white px-3 py-2 text-sm text-stone-800 outline-none transition focus:border-rosewood focus-visible:ring-4 focus-visible:ring-olive/20 disabled:cursor-not-allowed disabled:bg-stone-100';

function Toggle({ label, name, defaultChecked, disabled }: { label: string; name: string; defaultChecked: boolean; disabled: boolean }) {
  return (
    <label className="flex items-center gap-2 rounded-md border border-stone-200 bg-white px-3 py-2 text-sm font-semibold text-stone-700">
      <input type="hidden" name={name} value="false" />
      <input name={name} type="checkbox" defaultChecked={defaultChecked} disabled={disabled} />
      {label}
    </label>
  );
}

function OptionList({ values }: { values: readonly string[] }) {
  return (
    <>
      {values.map((value) => (
        <option key={value} value={value}>
          {value}
        </option>
      ))}
    </>
  );
}

export function AdminPaymentProviderSettingsPanel({ settings, databaseReady }: { settings: PaymentProviderSetting[]; databaseReady: boolean }) {
  return (
    <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-stone-500">Settings</p>
        <h2 className="mt-1 text-2xl font-bold text-stone-950">Payment provider readiness</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">Configure checkout mode, provider choices, currencies, and environment-readiness requirements. Secrets stay in environment variables and are only checked for readiness.</p>
      </div>
      {!databaseReady ? (
        <div className="mt-5 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">Database settings are unavailable until DATABASE_URL is configured. Showing safe defaults.</div>
      ) : null}
      <div className="mt-6 grid gap-4">
        {settings.map((setting) => {
          const readiness = buildPaymentProviderReadinessSummary(setting, process.env);
          return (
            <form key={setting.key} action={updatePaymentProviderSettingAction} className="grid gap-4 rounded-md border border-stone-200 bg-stone-50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-stone-950">{setting.label}</h3>
                  <p className="text-sm text-stone-600">{readiness.ready ? 'Ready for the selected mode.' : 'Readiness needs attention before gateway checkout.'}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] ${readiness.ready ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-800'}`}>
                  {readiness.ready ? 'ready' : 'needs setup'}
                </span>
              </div>
              <div className="grid gap-3 md:grid-cols-[1fr_1fr_0.8fr]">
                <label className="grid gap-2 text-sm font-semibold text-stone-800">
                  Key
                  <input className={inputClass} name="key" defaultValue={setting.key} disabled={!databaseReady} />
                </label>
                <label className="grid gap-2 text-sm font-semibold text-stone-800">
                  Label
                  <input className={inputClass} name="label" defaultValue={setting.label} disabled={!databaseReady} />
                </label>
                <label className="grid gap-2 text-sm font-semibold text-stone-800">
                  Checkout mode
                  <select className={inputClass} name="checkoutMode" defaultValue={setting.checkoutMode} disabled={!databaseReady}>
                    <OptionList values={CHECKOUT_MODES} />
                  </select>
                </label>
              </div>
              <label className="grid gap-2 text-sm font-semibold text-stone-800">
                Description
                <input className={inputClass} name="description" defaultValue={setting.description ?? ''} disabled={!databaseReady} />
              </label>
              <div className="grid gap-3 md:grid-cols-3">
                <label className="grid gap-2 text-sm font-semibold text-stone-800">
                  Domestic provider
                  <select className={inputClass} name="domesticProvider" defaultValue={setting.domesticProvider} disabled={!databaseReady}>
                    <OptionList values={PAYMENT_GATEWAY_PROVIDERS} />
                  </select>
                </label>
                <label className="grid gap-2 text-sm font-semibold text-stone-800">
                  Overseas provider
                  <select className={inputClass} name="overseasProvider" defaultValue={setting.overseasProvider ?? ''} disabled={!databaseReady}>
                    <option value="">Use fallback</option>
                    <OptionList values={PAYMENT_GATEWAY_PROVIDERS} />
                  </select>
                </label>
                <label className="grid gap-2 text-sm font-semibold text-stone-800">
                  Overseas fallback
                  <select className={inputClass} name="overseasFallback" defaultValue={setting.overseasFallback} disabled={!databaseReady}>
                    <OptionList values={OVERSEAS_FALLBACKS} />
                  </select>
                </label>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="grid gap-2 text-sm font-semibold text-stone-800">
                  Domestic currency
                  <select className={inputClass} name="domesticCurrency" defaultValue={setting.domesticCurrency} disabled={!databaseReady}>
                    <OptionList values={CHECKOUT_CURRENCIES} />
                  </select>
                </label>
                <label className="grid gap-2 text-sm font-semibold text-stone-800">
                  Overseas currency
                  <select className={inputClass} name="overseasCurrency" defaultValue={setting.overseasCurrency} disabled={!databaseReady}>
                    <OptionList values={CHECKOUT_CURRENCIES} />
                  </select>
                </label>
              </div>
              <div className="grid gap-3 md:grid-cols-4">
                <Toggle label="Default setting" name="isDefault" defaultChecked={setting.isDefault} disabled={!databaseReady} />
                <Toggle label="Active" name="isActive" defaultChecked={setting.isActive} disabled={!databaseReady} />
                <Toggle label="Require Iranian merchant env" name="requireIranianGatewayMerchantId" defaultChecked={setting.requireIranianGatewayMerchantId} disabled={!databaseReady} />
                <Toggle label="Require Stripe secret env" name="requireStripeSecretKey" defaultChecked={setting.requireStripeSecretKey} disabled={!databaseReady} />
              </div>
              <div className="grid gap-3 rounded-md border border-stone-200 bg-white p-4 text-sm text-stone-700">
                <p className="font-semibold text-stone-900">Required env: {readiness.requiredEnvironmentVariables.length ? readiness.requiredEnvironmentVariables.join(', ') : 'none'}</p>
                {readiness.blockers.length ? (
                  <ul className="list-disc pl-5 text-amber-800">
                    {readiness.blockers.map((issue) => (
                      <li key={issue.code}>{issue.summary}</li>
                    ))}
                  </ul>
                ) : null}
                {readiness.warnings.length ? (
                  <ul className="list-disc pl-5 text-stone-600">
                    {readiness.warnings.map((issue) => (
                      <li key={issue.code}>{issue.summary}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
              <button className="w-fit rounded-full bg-rosewood px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-rosewood/20 disabled:cursor-not-allowed disabled:bg-stone-300 disabled:shadow-none" type="submit" disabled={!databaseReady}>
                Save payment settings
              </button>
            </form>
          );
        })}
      </div>
    </section>
  );
}
