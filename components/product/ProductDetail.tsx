import Image from 'next/image';
import Link from 'next/link';
import { addToCartAction } from '@/app/cart/actions';
import type { Category, Product } from '@/lib/catalog';
import { formatPrice } from '@/lib/catalog-pricing';
import type { ProductCheckoutPolicy } from '@/lib/checkout/product-checkout-policy';
import type { SupportedLocale } from '@/lib/i18n/locales';
import { getStorefrontCloudinaryImage } from '@/lib/media/cloudinary-image';
import { formatStorefrontCopy, getStorefrontCopy } from '@/lib/localization/storefront-copy';

const categoryLinkClass = 'rounded-full outline-none transition focus-visible:ring-4 focus-visible:ring-olive/20';
const whatsAppLinkClass = 'rounded-full border border-rosewood/20 px-6 py-3 text-sm font-semibold text-rosewood outline-none transition focus-visible:ring-4 focus-visible:ring-olive/20';
const cartButtonClass = 'rounded-full bg-rosewood px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-rosewood/20 outline-none transition focus-visible:ring-4 focus-visible:ring-olive/30 disabled:cursor-not-allowed disabled:bg-stone-300 disabled:shadow-none';

export function ProductDetail({ product, category, checkoutPolicy, locale }: { product: Product; category?: Category; checkoutPolicy: ProductCheckoutPolicy; locale?: SupportedLocale }) {
  const canAddToCart = checkoutPolicy.canAddToCart;
  const copy = (key: Parameters<typeof getStorefrontCopy>[0]) => getStorefrontCopy(key, locale);
  const purchasableVariants = product.variants?.filter((variant) => variant.isActive) ?? [];

  return (
    <section className="mx-auto grid max-w-7xl gap-10 px-5 py-14 lg:grid-cols-2">
      <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] bg-blush shadow-2xl shadow-rosewood/10">
        <Image src={getStorefrontCloudinaryImage(product.image, 'productDetail')} alt={product.title} fill priority className="object-cover" sizes="(min-width: 1280px) 620px, (min-width: 1024px) calc(50vw - 40px), 100vw" />
      </div>
      <div className="flex flex-col justify-center">
        <Link href={`/categories/${product.category}`} className={categoryLinkClass}>
          <span className="text-sm font-semibold uppercase tracking-[0.3em] text-olive">
            {category?.title ?? product.categoryTitle ?? product.category}
          </span>
        </Link>
        <h1 className="mt-4 font-display text-6xl text-rosewood">{product.title}</h1>
        <p className="mt-2 text-sm uppercase tracking-[0.25em] text-rosewood/50">{product.code}</p>
        <p className="mt-6 text-lg leading-8 text-stone-700">{product.description}</p>
        <div className="mt-8 text-3xl font-semibold text-rosewood">{formatPrice(product, locale)}</div>
        <div className="mt-4 rounded-2xl border border-olive/20 bg-cream p-4 text-sm text-stone-700">
          <p className="font-semibold text-rosewood">{checkoutPolicy.summary}</p>
          <p className="mt-1 leading-6">{checkoutPolicy.detail}</p>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          {checkoutPolicy.canAddToCart ? (
            <form action={addToCartAction} className="flex flex-wrap items-center gap-3">
              <input type="hidden" name="productId" value={product.id ?? ''} />
              <input type="hidden" name="returnTo" value={`/products/${product.slug}`} />
              <input type="hidden" name="currency" value={product.currency} />
              {purchasableVariants.length > 1 ? (
                <>
                  <label className="sr-only" htmlFor={`variant-${product.slug}`}>{copy('product.variant')}</label>
                  <select id={`variant-${product.slug}`} name="variantId" defaultValue={purchasableVariants[0]?.id} disabled={!canAddToCart} className="rounded-full border border-rosewood/15 bg-white px-4 py-3 text-sm font-semibold text-rosewood outline-none transition focus:border-rosewood focus-visible:ring-4 focus-visible:ring-olive/20 disabled:cursor-not-allowed disabled:bg-stone-100 disabled:text-stone-400">
                    {purchasableVariants.map((variant) => <option key={variant.id} value={variant.id}>{variant.name} / {variant.sku}</option>)}
                  </select>
                </>
              ) : <input type="hidden" name="variantId" value={purchasableVariants[0]?.id ?? ''} />}
              <label className="sr-only" htmlFor={`quantity-${product.slug}`}>{copy('product.quantity')}</label>
              <select id={`quantity-${product.slug}`} name="quantity" defaultValue="1" disabled={!canAddToCart} className="rounded-full border border-rosewood/15 bg-white px-4 py-3 text-sm font-semibold text-rosewood outline-none transition focus:border-rosewood focus-visible:ring-4 focus-visible:ring-olive/20 disabled:cursor-not-allowed disabled:bg-stone-100 disabled:text-stone-400">
                {[1, 2, 3, 4, 5].map((quantity) => <option key={quantity} value={quantity}>{quantity}</option>)}
              </select>
              <button type="submit" className={cartButtonClass} disabled={!canAddToCart}>
                {copy('product.addToCart')}
              </button>
            </form>
          ) : null}
          <a href={`https://wa.me/?text=${encodeURIComponent(formatStorefrontCopy('product.interestedMessage', locale, { title: product.title }))}`} className={whatsAppLinkClass}>{copy('product.orderByWhatsApp')}</a>
          <span className="rounded-full border border-rosewood/20 px-6 py-3 text-sm font-semibold text-rosewood">
            {product.availableToday ? copy('product.availableToday') : copy('product.preOrderRequired')}
          </span>
        </div>
      </div>
    </section>
  );
}
