import Image from 'next/image';
import Link from 'next/link';
import { addToCartAction } from '@/app/cart/actions';
import type { Category, Product } from '@/lib/catalog';
import { formatPrice } from '@/lib/catalog';

const categoryLinkClass = 'rounded-full outline-none transition focus-visible:ring-4 focus-visible:ring-olive/20';
const whatsAppLinkClass = 'rounded-full border border-rosewood/20 px-6 py-3 text-sm font-semibold text-rosewood outline-none transition focus-visible:ring-4 focus-visible:ring-olive/20';
const cartButtonClass = 'rounded-full bg-rosewood px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-rosewood/20 outline-none transition focus-visible:ring-4 focus-visible:ring-olive/30 disabled:cursor-not-allowed disabled:bg-stone-300 disabled:shadow-none';

export function ProductDetail({ product, category, dbReady = false }: { product: Product; category?: Category; dbReady?: boolean }) {
  const canAddToCart = Boolean(dbReady && product.id);

  return (
    <section className="mx-auto grid max-w-7xl gap-10 px-5 py-14 lg:grid-cols-2">
      <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] bg-blush shadow-2xl shadow-rosewood/10">
        <Image src={product.image} alt={product.title} fill priority className="object-cover" sizes="(min-width: 1024px) 50vw, 100vw" />
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
        <div className="mt-8 text-3xl font-semibold text-rosewood">{formatPrice(product)}</div>
        <div className="mt-6 flex flex-wrap gap-3">
          <form action={addToCartAction} className="flex flex-wrap items-center gap-3">
            <input type="hidden" name="productId" value={product.id ?? ''} />
            <input type="hidden" name="returnTo" value={`/products/${product.slug}`} />
            <input type="hidden" name="currency" value={product.currency} />
            <label className="sr-only" htmlFor={`quantity-${product.slug}`}>Quantity</label>
            <select id={`quantity-${product.slug}`} name="quantity" defaultValue="1" disabled={!canAddToCart} className="rounded-full border border-rosewood/15 bg-white px-4 py-3 text-sm font-semibold text-rosewood outline-none transition focus:border-rosewood focus-visible:ring-4 focus-visible:ring-olive/20 disabled:cursor-not-allowed disabled:bg-stone-100 disabled:text-stone-400">
              {[1, 2, 3, 4, 5].map((quantity) => <option key={quantity} value={quantity}>{quantity}</option>)}
            </select>
            <button type="submit" className={cartButtonClass} disabled={!canAddToCart}>
              Add to cart
            </button>
          </form>
          <a href={`https://wa.me/?text=I%20am%20interested%20in%20${encodeURIComponent(product.title)}`} className={whatsAppLinkClass}>Order by WhatsApp</a>
          <span className="rounded-full border border-rosewood/20 px-6 py-3 text-sm font-semibold text-rosewood">
            {product.availableToday ? 'Available today' : 'Pre-order required'}
          </span>
        </div>
        {!canAddToCart ? (
          <p className="mt-3 text-sm leading-6 text-stone-500">Cart checkout is available when the database-backed product catalog is enabled.</p>
        ) : null}
      </div>
    </section>
  );
}
