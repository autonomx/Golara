import Link from 'next/link';
import { ProgressiveStorefrontImage } from '@/components/ProgressiveStorefrontImage';
import type { Category } from '@/lib/catalog';
import type { SupportedLocale } from '@/lib/i18n/locales';
import { homepageCategoryImage } from '@/lib/homepage-assets';
import { getStorefrontCloudinaryImage } from '@/lib/media/cloudinary-image';

const PERSIAN_SCRIPT_PATTERN = /[\u0600-\u06FF]/;
const LATIN_SCRIPT_PATTERN = /[A-Za-z]/;

function localeKey(locale?: SupportedLocale) {
  return locale?.toLowerCase().startsWith('fa') ? 'fa' : 'en';
}

function normalizeLegacyBilingualTitle(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}

export function categoryTileDisplayTitle(title: string, locale?: SupportedLocale) {
  const normalizedTitle = normalizeLegacyBilingualTitle(title);
  if (!PERSIAN_SCRIPT_PATTERN.test(normalizedTitle) || !LATIN_SCRIPT_PATTERN.test(normalizedTitle)) return normalizedTitle;

  if (localeKey(locale) === 'fa') {
    const persianOnly = normalizeLegacyBilingualTitle(normalizedTitle.replace(/[A-Za-z0-9&|()\-–—/]+/g, ' '));
    return persianOnly || normalizedTitle;
  }

  const englishOnly = normalizeLegacyBilingualTitle(normalizedTitle.replace(/[\u0600-\u06FF]+/g, ' ').replace(/[|()]+/g, ' '));
  return englishOnly || normalizedTitle;
}

function viewLabel(title: string, locale?: SupportedLocale) {
  return localeKey(locale) === 'fa' ? `مشاهده ${title}` : `View ${title}`;
}

function productCountLabel(count: number | undefined, locale?: SupportedLocale) {
  if (!count) return localeKey(locale) === 'fa' ? 'کاوش' : 'Explore';
  return localeKey(locale) === 'fa' ? `${count} محصول` : `${count} products`;
}

export function HomepageCategoryTileCard({ category, priority = false, locale }: { category: Category; priority?: boolean; locale?: SupportedLocale }) {
  const isFa = localeKey(locale) === 'fa';
  const displayTitle = categoryTileDisplayTitle(category.title, locale);
  const imageSrc = getStorefrontCloudinaryImage(category.image || homepageCategoryImage(category.slug), 'productCard');

  return (
    <Link
      href={`/categories/${category.slug}`}
      prefetch={priority}
      aria-label={viewLabel(displayTitle, locale)}
      className="group relative block min-h-[270px] overflow-hidden rounded-lg bg-stone-100 shadow-[0_14px_36px_rgba(111,36,56,0.07)] outline-none transition focus-visible:ring-4 focus-visible:ring-olive/30 md:min-h-[340px]"
    >
      <ProgressiveStorefrontImage
        src={imageSrc}
        alt={displayTitle}
        fill
        priority={priority}
        imageClassName="object-cover object-[68%_center] transition duration-500 group-hover:scale-[1.02] md:object-[72%_center]"
        sizes="(min-width: 1280px) 40vw, (min-width: 768px) 50vw, 100vw"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-stone-100/95 via-stone-100/72 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-rosewood/25 to-transparent" />
      <div
        className={`absolute inset-y-0 flex w-full items-center px-5 py-6 sm:px-7 md:w-[52%] md:max-w-[24rem] ${
          isFa ? 'right-0 md:pl-0 md:pr-8' : 'left-0 md:pl-8 md:pr-0'
        }`}
      >
        <div
          className="rounded-3xl border border-white/70 bg-stone-50/92 p-5 text-stone-700 shadow-[0_20px_50px_rgba(54,35,26,0.16)] backdrop-blur-sm transition group-hover:bg-white/95 sm:p-6"
          dir={isFa ? 'rtl' : 'ltr'}
        >
          <p className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-olive shadow-sm">
            {category.eyebrow || (isFa ? 'مناسبت' : 'Occasion')}
          </p>
          <h3 className="mt-4 line-clamp-2 font-display text-3xl leading-tight text-rosewood sm:text-4xl">{displayTitle}</h3>
          <p className="mt-3 line-clamp-3 text-sm leading-6 text-stone-600">{category.description}</p>
          <div className="mt-5 inline-flex rounded-full border border-rosewood/15 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-rosewood shadow-sm">
            {productCountLabel(category.productCount, locale)}
          </div>
        </div>
      </div>
    </Link>
  );
}
