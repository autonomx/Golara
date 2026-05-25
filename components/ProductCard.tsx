import Image from 'next/image';
import Link from 'next/link';
import { formatPrice, type Product } from '@/lib/catalog';

export function ProductCard({ product, priority = false }: { product: Product; priority?: boolean }) {
  return (
    <Link href={`/products/${product.slug}`} className="group overflow-hidden rounded-3xl border border-rosewood/10 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
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
          {product.bestSeller ? <span className="rounded-full bg-rosewood px-3 py-1 text-white">Best seller</span> : null}
          {product.availableToday ? <span className="rounded-full bg-white/90 px-3 py-1 text-rosewood">Available today</span> : null}
        </div>
      </div>
      <div className="space-y-2 p-5">
        <div className="text-xs uppercase tracking-[0.25em] text-rosewood/50">{product.code}</div>
        <h3 className="font-display text-2xl text-rosewood">{product.title}</h3>
        <p className="line-clamp-2 text-sm text-stone-600">{product.description}</p>
        <div className="pt-2 text-lg font-semibold text-rosewood">{formatPrice(product)}</div>
      </div>
    </Link>
  );
}
