import Image from 'next/image';
import Link from 'next/link';
import type { Category } from '@/lib/catalog';
import { homepageCategoryImage } from '@/lib/homepage-assets';

export function HomepageCategoryTileCard({ category, priority = false }: { category: Category; priority?: boolean }) {
  return (
    <Link
      href={`/categories/${category.slug}`}
      aria-label={`View ${category.title}`}
      className="group relative block min-h-[245px] overflow-hidden bg-stone-100 outline-none focus-visible:ring-4 focus-visible:ring-olive/30 md:min-h-[305px]"
    >
      <Image
        src={homepageCategoryImage(category.slug)}
        alt={category.title}
        fill
        priority={priority}
        className="object-cover transition duration-700 group-hover:scale-105"
        sizes="(min-width: 1280px) 40vw, (min-width: 768px) 50vw, 100vw"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-stone-200/80 via-stone-100/35 to-transparent" />
      <div className="absolute left-8 top-1/2 max-w-[13rem] -translate-y-1/2 text-stone-700">
        <p className="font-display text-2xl uppercase tracking-[0.08em] text-stone-600">{category.eyebrow || category.title}</p>
        <div className="mt-3 h-px w-16 bg-stone-600/60" />
        <h3 className="mt-4 font-display text-3xl leading-tight text-stone-700">{category.title}</h3>
        {category.productCount ? <p className="mt-3 text-xs uppercase tracking-[0.2em] text-stone-500">{category.productCount} products</p> : null}
      </div>
    </Link>
  );
}
