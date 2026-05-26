import Image from 'next/image';
import Link from 'next/link';
import { addToCartAction } from '@/app/cart/actions';
import { formatPrice, productRequiresQuote, type Product } from '@/lib/catalog';
import { getStorefrontCopy } from '@/lib/localization/storefront-copy';

const copy = (key: Parameters<typeof getStorefrontCopy>[0]) => getStorefrontCopy(key);

export function ProductCard({ product, priority = false }: { product: Product; priority?: boolean }) {
  const requiresQuote = productRequiresQuote(product);
  const canAddToCart = Boolean(product.id && !requiresQuote);

  return (
    <article className="group overflow-hidden rounded-3xl border border-rosewood/10 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
      <Link href={`/products/${product.slug}`} aria-label={`View ${product.title}`} className="block outline-none focus-visible:ring-4 focus-visible:ring-olive/30">
        <div className="relative aspect-[4/5] overflow-hidden bg-blush">
          <Image
            src={product.image}
            alt={product.title}
            fill
            className="object-cover transition duration-500 group-hover:scale-105"
            sizes="(min-width: 1024px) 25vw, (min-width: 768px) 50vw, 100vw"
            priority={priority}
          />
          <div className="absolute left-4 top-4 flex gap-2 text-xs font-semibold">
            {product.bestSeller ? <span className="rounded-full bg-rosewood px-3 py-1 text-white">{copy('product.bestSeller')}</span> : null}
            {product.availableToday ? <span className="rounded-full bg-white/90 px-3 py-1 text-rosewood">{copy('product.availableToday')}</span> : null}
          </div>
        </div>
        <div className="space-y-2 p-5 pb-3">
          <div className="text-xs uppercase tracking-[0.25em] text-rosewood/50">{product.code}</div>
          <h3 className="font-display text-2xl text-rosewood">{product.title}</h3>
          <p className="line-clamp-2 text-sm text-stone-600">{product.description}</p>
          <div className="pt-2 text-lg font-semibold text-rosewood">{formatPrice(product)}</div>
        </div>
      </Link>
      {requiresQuote ? (
        <div className="px-5 pb-5">
          <Link href={`/products/${product.slug}`} className="block w-full rounded-full border border-rosewood/20 px-4 py-2 text-center text-xs font-semibold text-rosewood outline-none transition focus-visible:ring-4 focus-visible:ring-olive/20">
            {copy('product.orderByWhatsApp')}
          </Link>
        </div>
      ) : (
        <form action={addToCartAction} className="flex items-center gap-2 px-5 pb-5">
          <input type="hidden" name="productId" value={product.id ?? ''} />
          <input type="hidden" name="returnTo" value={`/products/${product.slug}`} />
          <input type="hidden" name="currency" value={product.currency} />
          <input type="hidden" name="quantity" value="1" />
          <button type="submit" disabled={!canAddToCart} className="w-full rounded-full bg-rosewood px-4 py-2 text-xs font-semibold text-white outline-none transition focus-visible:ring-4 focus-visible:ring-olive/30 disabled:cursor-not-allowed disabled:bg-stone-300">
            {copy('product.addToCart')}
          </button>
        </form>
      )}
    </article>
  );
}
