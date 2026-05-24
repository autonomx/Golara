import Image from 'next/image';
import Link from 'next/link';
import type { Category, Product } from '@/lib/catalog';
import { formatPrice } from '@/lib/catalog';

export function ProductDetail({ product, category }: { product: Product; category?: Category }) {
  return (
    <section className="mx-auto grid max-w-7xl gap-10 px-5 py-14 lg:grid-cols-2">
      <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] bg-blush shadow-2xl shadow-rosewood/10">
        <Image src={product.image} alt={product.title} fill className="object-cover" sizes="50vw" />
      </div>
      <div className="flex flex-col justify-center">
        <Link href={`/categories/${product.category}`} className="text-sm font-semibold uppercase tracking-[0.3em] text-olive">
          {category?.title ?? product.categoryTitle ?? product.category}
        </Link>
        <h1 className="mt-4 font-display text-6xl text-rosewood">{product.title}</h1>
        <p className="mt-2 text-sm uppercase tracking-[0.25em] text-rosewood/50">{product.code}</p>
        <p className="mt-6 text-lg leading-8 text-stone-700">{product.description}</p>
        <div className="mt-8 text-3xl font-semibold text-rosewood">{formatPrice(product)}</div>
        <div className="mt-6 flex flex-wrap gap-3">
          <a href={`https://wa.me/?text=I%20am%20interested%20in%20${encodeURIComponent(product.title)}`} className="rounded-full bg-rosewood px-6 py-3 text-sm font-semibold text-white">Order by WhatsApp</a>
          <span className="rounded-full border border-rosewood/20 px-6 py-3 text-sm font-semibold text-rosewood">
            {product.availableToday ? 'Available today' : 'Pre-order required'}
          </span>
        </div>
      </div>
    </section>
  );
}
