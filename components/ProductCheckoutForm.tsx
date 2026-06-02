import type { Product } from '@/lib/catalog';
import { createCheckoutAction } from '@/app/products/[slug]/checkout-actions';
import type { ProductCheckoutPolicy } from '@/lib/checkout/product-checkout-policy';

type ProductCheckoutFormProps = {
  product: Product;
  dbReady: boolean;
  checkout?: string;
  checkoutPolicy: ProductCheckoutPolicy;
};

const messages: Record<string, string> = {
  'database-required': 'Order drafts require DATABASE_URL. You can still send an inquiry below.',
  'name-required': 'Please enter a name.',
  'address-required': 'Please enter a delivery address.',
  failed: 'The order draft could not be created. Please send an inquiry and staff will follow up.'
};

const inputClass = 'rounded-2xl border border-rosewood/15 bg-white px-4 py-3 text-stone-800 outline-none transition focus:border-rosewood focus-visible:ring-4 focus-visible:ring-olive/20 disabled:cursor-not-allowed disabled:bg-stone-100';
const areaClass = 'min-h-24 rounded-2xl border border-rosewood/15 bg-white px-4 py-3 text-stone-800 outline-none transition focus:border-rosewood focus-visible:ring-4 focus-visible:ring-olive/20 disabled:cursor-not-allowed disabled:bg-stone-100';

export function ProductCheckoutForm({ product, dbReady, checkout, checkoutPolicy }: ProductCheckoutFormProps) {
  if (!checkoutPolicy.showOrderDraftForm) return null;

  const action = createCheckoutAction.bind(null, product.id, product.slug);
  const message = checkout ? messages[checkout] : undefined;
  const purchasableVariants = product.variants?.filter((variant) => variant.isActive) ?? [];

  return (
    <section className="mx-auto max-w-3xl px-5 pb-10">
      <div className="rounded-[2rem] border border-rosewood/10 bg-cream p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-olive">Order draft</p>
        <h2 className="mt-2 font-display text-4xl text-rosewood">Start an order</h2>
        <p className="mt-3 text-sm leading-6 text-stone-600">Create a staff-visible order draft for this arrangement. {checkoutPolicy.summary}</p>

        {message ? <div className="mt-6 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm font-semibold text-amber-900">{message}</div> : null}

        <form action={action} className="mt-6 grid gap-4" noValidate>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-semibold text-rosewood">Name<input className={inputClass} name="name" required minLength={2} disabled={!dbReady} /></label>
            <label className="grid gap-2 text-sm font-semibold text-rosewood">Phone<input className={inputClass} name="phone" required inputMode="tel" disabled={!dbReady} /></label>
            <label className="grid gap-2 text-sm font-semibold text-rosewood">Email optional<input className={inputClass} name="email" type="email" disabled={!dbReady} /></label>
            {purchasableVariants.length > 1 ? (
              <label className="grid gap-2 text-sm font-semibold text-rosewood">
                Variant
                <select className={inputClass} name="variantId" defaultValue={purchasableVariants[0]?.id} disabled={!dbReady}>
                  {purchasableVariants.map((variant) => <option key={variant.id} value={variant.id}>{variant.name} / {variant.sku}</option>)}
                </select>
              </label>
            ) : <input type="hidden" name="variantId" value={purchasableVariants[0]?.id ?? ''} />}
            <label className="grid gap-2 text-sm font-semibold text-rosewood">Quantity<input className={inputClass} name="quantity" type="number" min="1" max="99" defaultValue="1" disabled={!dbReady} /></label>
            <label className="grid gap-2 text-sm font-semibold text-rosewood">Delivery date optional<input className={inputClass} name="deliveryDate" type="date" disabled={!dbReady} /></label>
            <label className="grid gap-2 text-sm font-semibold text-rosewood">Delivery window optional<input className={inputClass} name="deliveryWindow" disabled={!dbReady} /></label>
          </div>
          <label className="grid gap-2 text-sm font-semibold text-rosewood">City optional<input className={inputClass} name="city" disabled={!dbReady} /></label>
          <label className="grid gap-2 text-sm font-semibold text-rosewood">Delivery address<textarea className={areaClass} name="addressLine1" required minLength={4} disabled={!dbReady} /></label>
          <label className="grid gap-2 text-sm font-semibold text-rosewood">Address details optional<input className={inputClass} name="addressLine2" disabled={!dbReady} /></label>
          <label className="grid gap-2 text-sm font-semibold text-rosewood">Delivery notes optional<textarea className={areaClass} name="deliveryNotes" disabled={!dbReady} /></label>
          <label className="grid gap-2 text-sm font-semibold text-rosewood">Customer note optional<textarea className={areaClass} name="customerNote" defaultValue={`Order draft for ${product.title}.`} disabled={!dbReady} /></label>
          <button className="rounded-full bg-rosewood px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-rosewood/20 outline-none focus-visible:ring-4 focus-visible:ring-olive/30 disabled:cursor-not-allowed disabled:bg-stone-300 disabled:shadow-none" type="submit" disabled={!dbReady}>Create order draft</button>
        </form>
      </div>
    </section>
  );
}
