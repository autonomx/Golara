import Image from 'next/image';
import Link from 'next/link';
import type { Category } from '@/lib/catalog';
import { resolveCategoryImagePath } from '@/lib/seed-category-images';

function productCountLabel(count?: number) {
  if (typeof count !== 'number') return null;
  return `${count} ${count === 1 ? 'product' : 'products'}`;
}

export function HomepageCategoryTileCard({ category, priority = false }: { category: Category; priority?: boolean }) {
  const countLabel = productCountLabel(category.productCount);

  return (
    <Link
      href={`/categories/${category.slug}`}
      aria-label={`View ${category.title}`}
      className="group overflow-hidden rounded-[2rem] border border-rosewood/10 bg-white shadow-sm outline-none transition hover:-translate-y-1 hover:shadow-xl focus-visible:ring-4 focus-visible:ring-olive/30"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-blush">
        <Image
          src={resolveCategoryImagePath(category)}
          alt={category.title}
          fill
          priority={priority}
          className="object-cover transition duration-500 group-hover:scale-105"
          sizes="(min-width: 1280px) 20vw, (min-width: 768px) 33vw, 50vw"
        />
        {countLabel ? <span className="absolute bottom-3 left-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-rosewood shadow-sm backdrop-blur">{countLabel}</span> : null}
      </div>
      <div className="p-5 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-olive">{category.eyebrow}</p>
        <h3 className="mt-2 font-display text-2xl text-rosewood">{category.title}</h3>
        {category.parentTitle ? <p className="mt-2 text-xs text-stone-500">Under {category.parentTitle}</p> : null}
      </div>
    </Link>
  );
}
