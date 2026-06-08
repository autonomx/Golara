import Image from 'next/image';
import Link from 'next/link';
import type { Category } from '@/lib/catalog';
import type { SupportedLocale } from '@/lib/i18n/locales';
import { homepageCategoryImage } from '@/lib/homepage-assets';

function localeKey(locale?: SupportedLocale) {
  return locale?.toLowerCase().startsWith('fa') ? 'fa' : 'en';
}

function viewLabel(title: string, locale?: SupportedLocale) {
  return localeKey(locale) === 'fa' ? `مشاهده ${title}` : `View ${title}`;
}

function productCountLabel(count: number | undefined, locale?: SupportedLocale) {
  if (!count) return localeKey(locale) === 'fa' ? 'کاوش' : 'Explore';
  return localeKey(locale) === 'fa' ? `${count} محصول` : `${count} products`;
}

export function HomepageCategoryTileCard({ category, priority = false, locale }: { category: Category; priority?: boolean; locale?: SupportedLocale }) {
  return (
    <Link
      href={`/categories/${category.slug}`}
      aria-label={viewLabel(category.title, locale)}
      className="group relative block min-h-[270px] overflow-hidden rounded-lg bg-stone-100 shadow-[0_14px_36px_rgba(111,36,56,0.07)] outline-none transition focus-visible:ring-4 focus-visible:ring-olive/30 md:min-h-[340px]"
    >
      <Image
        src={category.image || homepageCategoryImage(category.slug)}
        alt={category.title}
        fill
        priority={priority}
        className="object-cover"
        sizes="(min-width: 1280px) 40vw, (min-width: 768px) 50vw, 100vw"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-white/92 via-white/52 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-rosewood/45 to-transparent" />
      <div className="absolute left-6 top-1/2 max-w-[17rem] -translate-y-1/2 text-stone-700 md:left-8">
        <p className="inline-flex rounded-full bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-olive shadow-sm">{category.eyebrow || (localeKey(locale) === 'fa' ? 'مناسبت' : 'Occasion')}</p>
        <h3 className="mt-4 line-clamp-2 font-display text-4xl leading-tight text-rosewood">{category.title}</h3>
        <p className="mt-3 line-clamp-2 text-sm leading-6 text-stone-600">{category.description}</p>
        <div className="mt-5 inline-flex rounded-full border border-rosewood/15 bg-white/85 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-rosewood">
          {productCountLabel(category.productCount, locale)}
        </div>
      </div>
    </Link>
  );
}
