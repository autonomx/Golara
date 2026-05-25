import Link from 'next/link';
import type { Category } from '@/lib/catalog';

export function CategoryCard({ category }: { category: Category }) {
  return (
    <Link href={`/categories/${category.slug}`} aria-label={`View ${category.title} collection`} className="rounded-3xl border border-rosewood/10 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
      <div className="text-xs font-semibold uppercase tracking-[0.3em] text-olive">{category.eyebrow}</div>
      <h3 className="mt-3 font-display text-3xl text-rosewood">{category.title}</h3>
      <p className="mt-3 text-sm leading-6 text-stone-600">{category.description}</p>
    </Link>
  );
}
