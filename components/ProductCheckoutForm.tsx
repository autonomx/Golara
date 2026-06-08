import type { Product } from '@/lib/catalog';
import { createCheckoutAction } from '@/app/products/[slug]/checkout-actions';
import type { ProductCheckoutPolicy } from '@/lib/checkout/product-checkout-policy';
import type { SupportedLocale } from '@/lib/i18n/locales';
import { formatStorefrontCopy } from '@/lib/localization/storefront-copy';

type ProductCheckoutFormProps = {
  product: Product;
  dbReady: boolean;
  checkout?: string;
  checkoutPolicy: ProductCheckoutPolicy;
  locale?: SupportedLocale;
};

const copy = {
  en: {
    eyebrow: 'Order draft',
    title: 'Start an order',
    bodyPrefix: 'Create a staff-visible order draft for this arrangement.',
    name: 'Name',
    phone: 'Phone',
    emailOptional: 'Email optional',
    variant: 'Variant',
    quantity: 'Quantity',
    deliveryDateOptional: 'Delivery date optional',
    deliveryWindowOptional: 'Delivery window optional',
    cityOptional: 'City optional',
    deliveryAddress: 'Delivery address',
    addressDetailsOptional: 'Address details optional',
    deliveryNotesOptional: 'Delivery notes optional',
    customerNoteOptional: 'Customer note optional',
    customerNoteDefault: 'Order draft for {title}.',
    submit: 'Create order draft',
    messages: {
      'database-required': 'Order drafts require DATABASE_URL. You can still send an inquiry below.',
      'name-required': 'Please enter a name.',
      'address-required': 'Please enter a delivery address.',
      failed: 'The order draft could not be created. Please send an inquiry and staff will follow up.'
    }
  },
  fa: {
    eyebrow: 'پیش‌نویس سفارش',
    title: 'شروع سفارش',
    bodyPrefix: 'برای این چیدمان یک پیش‌نویس سفارش قابل مشاهده برای تیم فروش ایجاد کنید.',
    name: 'نام',
    phone: 'تلفن',
    emailOptional: 'ایمیل اختیاری',
    variant: 'مدل',
    quantity: 'تعداد',
    deliveryDateOptional: 'تاریخ تحویل اختیاری',
    deliveryWindowOptional: 'بازه تحویل اختیاری',
    cityOptional: 'شهر اختیاری',
    deliveryAddress: 'نشانی تحویل',
    addressDetailsOptional: 'جزئیات نشانی اختیاری',
    deliveryNotesOptional: 'توضیحات تحویل اختیاری',
    customerNoteOptional: 'یادداشت مشتری اختیاری',
    customerNoteDefault: 'پیش‌نویس سفارش برای {title}.',
    submit: 'ایجاد پیش‌نویس سفارش',
    messages: {
      'database-required': 'ثبت پیش‌نویس سفارش به DATABASE_URL نیاز دارد. همچنان می‌توانید درخواست خود را ارسال کنید.',
      'name-required': 'لطفاً نام را وارد کنید.',
      'address-required': 'لطفاً نشانی تحویل را وارد کنید.',
      failed: 'پیش‌نویس سفارش ایجاد نشد. لطفاً درخواست ارسال کنید تا تیم فروش پیگیری کند.'
    }
  }
} as const;

const inputClass = 'rounded-2xl border border-rosewood/15 bg-white px-4 py-3 text-stone-800 outline-none transition focus:border-rosewood focus-visible:ring-4 focus-visible:ring-olive/20 disabled:cursor-not-allowed disabled:bg-stone-100';
const areaClass = 'min-h-24 rounded-2xl border border-rosewood/15 bg-white px-4 py-3 text-stone-800 outline-none transition focus:border-rosewood focus-visible:ring-4 focus-visible:ring-olive/20 disabled:cursor-not-allowed disabled:bg-stone-100';

function localeKey(locale?: SupportedLocale) {
  return locale?.toLowerCase().startsWith('fa') ? 'fa' : 'en';
}

export function ProductCheckoutForm({ product, dbReady, checkout, checkoutPolicy, locale }: ProductCheckoutFormProps) {
  if (!checkoutPolicy.showOrderDraftForm) return null;

  const labels = copy[localeKey(locale)];
  const action = createCheckoutAction.bind(null, product.id, product.slug);
  const message = checkout ? labels.messages[checkout as keyof typeof labels.messages] : undefined;
  const purchasableVariants = product.variants?.filter((variant) => variant.isActive) ?? [];

  return (
    <section className="mx-auto max-w-3xl px-5 pb-10">
      <div className="rounded-[2rem] border border-rosewood/10 bg-cream p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-olive">{labels.eyebrow}</p>
        <h2 className="mt-2 font-display text-4xl text-rosewood">{labels.title}</h2>
        <p className="mt-3 text-sm leading-6 text-stone-600">{labels.bodyPrefix} {checkoutPolicy.summary}</p>

        {message ? <div className="mt-6 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm font-semibold text-amber-900">{message}</div> : null}

        <form action={action} className="mt-6 grid gap-4" noValidate>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-semibold text-rosewood">{labels.name}<input className={inputClass} name="name" required minLength={2} disabled={!dbReady} /></label>
            <label className="grid gap-2 text-sm font-semibold text-rosewood">{labels.phone}<input className={inputClass} name="phone" required inputMode="tel" disabled={!dbReady} /></label>
            <label className="grid gap-2 text-sm font-semibold text-rosewood">{labels.emailOptional}<input className={inputClass} name="email" type="email" disabled={!dbReady} /></label>
            {purchasableVariants.length > 1 ? (
              <label className="grid gap-2 text-sm font-semibold text-rosewood">
                {labels.variant}
                <select className={inputClass} name="variantId" defaultValue={purchasableVariants[0]?.id} disabled={!dbReady}>
                  {purchasableVariants.map((variant) => <option key={variant.id} value={variant.id}>{variant.name} / {variant.sku}</option>)}
                </select>
              </label>
            ) : <input type="hidden" name="variantId" value={purchasableVariants[0]?.id ?? ''} />}
            <label className="grid gap-2 text-sm font-semibold text-rosewood">{labels.quantity}<input className={inputClass} name="quantity" type="number" min="1" max="99" defaultValue="1" disabled={!dbReady} /></label>
            <label className="grid gap-2 text-sm font-semibold text-rosewood">{labels.deliveryDateOptional}<input className={inputClass} name="deliveryDate" type="date" disabled={!dbReady} /></label>
            <label className="grid gap-2 text-sm font-semibold text-rosewood">{labels.deliveryWindowOptional}<input className={inputClass} name="deliveryWindow" disabled={!dbReady} /></label>
          </div>
          <label className="grid gap-2 text-sm font-semibold text-rosewood">{labels.cityOptional}<input className={inputClass} name="city" disabled={!dbReady} /></label>
          <label className="grid gap-2 text-sm font-semibold text-rosewood">{labels.deliveryAddress}<textarea className={areaClass} name="addressLine1" required minLength={4} disabled={!dbReady} /></label>
          <label className="grid gap-2 text-sm font-semibold text-rosewood">{labels.addressDetailsOptional}<input className={inputClass} name="addressLine2" disabled={!dbReady} /></label>
          <label className="grid gap-2 text-sm font-semibold text-rosewood">{labels.deliveryNotesOptional}<textarea className={areaClass} name="deliveryNotes" disabled={!dbReady} /></label>
          <label className="grid gap-2 text-sm font-semibold text-rosewood">{labels.customerNoteOptional}<textarea className={areaClass} name="customerNote" defaultValue={formatStorefrontCopy('product.interestedMessage', locale, { title: product.title }) || labels.customerNoteDefault.replace('{title}', product.title)} disabled={!dbReady} /></label>
          <button className="rounded-full bg-rosewood px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-rosewood/20 outline-none focus-visible:ring-4 focus-visible:ring-olive/30 disabled:cursor-not-allowed disabled:bg-stone-300 disabled:shadow-none" type="submit" disabled={!dbReady}>{labels.submit}</button>
        </form>
      </div>
    </section>
  );
}
