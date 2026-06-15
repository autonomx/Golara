import { updatePaymentMethodSettingAction } from '@/app/admin/settings/actions';
import {
  PAYMENT_METHOD_CAPTURE_MODES,
  PAYMENT_METHOD_SETTLEMENT_MODES,
  PAYMENT_METHOD_TYPES,
  buildPaymentMethodReadinessNotes,
  type PaymentMethodSetting
} from '@/lib/settings/payment-method-settings';

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

export function AdminPaymentMethodSettingsPanel({ methods, databaseReady }: { methods: PaymentMethodSetting[]; databaseReady: boolean }) {
  return (
    <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-stone-500">Settings</p>
        <h2 className="mt-1 text-2xl font-bold text-stone-950">DigiKala-style payment methods</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">Enable or disable checkout payment lanes independently. Defaults mirror a DigiKala-style stack: Iranian IPG, wallet/store credit, installment credit, bank transfer, and cash/pay-on-delivery. Private DigiPay APIs are not connected until provider credentials and adapters are added.</p>
      </div>
      {!databaseReady ? (
        <div className="mt-5 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">Database settings are unavailable until DATABASE_URL is configured. Showing the default enabled method stack.</div>
      ) : null}
      <div className="mt-6 grid gap-4">
        {methods.map((method) => {
          const notes = buildPaymentMethodReadinessNotes(method, process.env);
          return (
            <form key={method.key} action={updatePaymentMethodSettingAction} className="grid gap-4 rounded-md border border-stone-200 bg-stone-50 p-4">
              <input type="hidden" name="key" value={method.key} />
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-stone-950">{method.label}</h3>
                  <p className="mt-1 max-w-3xl text-sm leading-6 text-stone-600">{method.description}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] ${method.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-stone-100 text-stone-500'}`}>
                  {method.isActive ? 'enabled' : 'disabled'}
                </span>
              </div>
              <div className="grid gap-3 md:grid-cols-[1fr_0.8fr_0.5fr]">
                <label className="grid gap-2 text-sm font-semibold text-stone-800">
                  Label
                  <input className={inputClass} name="label" defaultValue={method.label} disabled={!databaseReady} />
                </label>
                <label className="grid gap-2 text-sm font-semibold text-stone-800">
                  Provider key
                  <input className={inputClass} name="providerKey" defaultValue={method.providerKey} disabled={!databaseReady} />
                </label>
                <label className="grid gap-2 text-sm font-semibold text-stone-800">
                  Sort
                  <input className={inputClass} name="sortOrder" type="number" defaultValue={method.sortOrder} disabled={!databaseReady} />
                </label>
              </div>
              <label className="grid gap-2 text-sm font-semibold text-stone-800">
                Description
                <input className={inputClass} name="description" defaultValue={method.description ?? ''} disabled={!databaseReady} />
              </label>
              <div className="grid gap-3 md:grid-cols-4">
                <label className="grid gap-2 text-sm font-semibold text-stone-800">
                  Method type
                  <select className={inputClass} name="methodType" defaultValue={method.methodType} disabled={!databaseReady}>
                    <OptionList values={PAYMENT_METHOD_TYPES} />
                  </select>
                </label>
                <label className="grid gap-2 text-sm font-semibold text-stone-800">
                  Settlement
                  <select className={inputClass} name="settlementMode" defaultValue={method.settlementMode} disabled={!databaseReady}>
                    <OptionList values={PAYMENT_METHOD_SETTLEMENT_MODES} />
                  </select>
                </label>
                <label className="grid gap-2 text-sm font-semibold text-stone-800">
                  Capture
                  <select className={inputClass} name="captureMode" defaultValue={method.captureMode} disabled={!databaseReady}>
                    <OptionList values={PAYMENT_METHOD_CAPTURE_MODES} />
                  </select>
                </label>
                <label className="grid gap-2 text-sm font-semibold text-stone-800">
                  Currency
                  <input className={inputClass} name="currency" defaultValue={method.currency} disabled={!databaseReady} />
                </label>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <Toggle label="Active" name="isActive" defaultChecked={method.isActive} disabled={!databaseReady} />
                <Toggle label="Default" name="isDefault" defaultChecked={method.isDefault} disabled={!databaseReady} />
                <Toggle label="Manual review" name="requiresManualReview" defaultChecked={method.requiresManualReview} disabled={!databaseReady} />
              </div>
              {notes.length ? (
                <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                  <p className="font-bold">Readiness notes</p>
                  <ul className="mt-2 list-disc pl-5">
                    {notes.map((note) => <li key={note}>{note}</li>)}
                  </ul>
                </div>
              ) : null}
              <button className="w-fit rounded-full bg-rosewood px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-rosewood/20 disabled:cursor-not-allowed disabled:bg-stone-300 disabled:shadow-none" type="submit" disabled={!databaseReady}>
                Save payment method
              </button>
            </form>
          );
        })}
      </div>
    </section>
  );
}
