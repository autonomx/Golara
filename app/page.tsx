import Link from 'next/link';
import { HomepageCategoryTileCard } from '@/components/HomepageCategoryTileCard';
import { ProductCard } from '@/components/ProductCard';
import { SiteHeader } from '@/components/SiteHeader';
import { withCategoryProductCounts } from '@/lib/category-tree';
import { getHomepageContent, listCategories, listHomepageCategories, listProducts } from '@/lib/cms/catalog-repository';
import { resolveStorefrontLocale } from '@/lib/i18n/resolve-locale';
import { getStorefrontCopy, getStorefrontCopyDirection } from '@/lib/localization/storefront-copy';

const primaryCtaClass = 'rounded-full bg-rosewood px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-rosewood/20 outline-none transition focus-visible:ring-4 focus-visible:ring-olive/30';
const secondaryCtaClass = 'rounded-full border border-rosewood/20 px-6 py-3 text-sm font-semibold text-rosewood outline-none transition focus-visible:ring-4 focus-visible:ring-olive/20';

export default async function HomePage() {
  const locale = await resolveStorefrontLocale();
  const copy = (key: Parameters<typeof getStorefrontCopy>[0]) => getStorefrontCopy(key, locale);
  const [homepage, categories, homepageCategories, products] = await Promise.all([
    getHomepageContent({ locale }),
    listCategories({ locale }),
    listHomepageCategories({ locale }),
    listProducts({ locale })
  ]);

  const bestSellers = products.filter((product) => product.bestSeller);
  const categoriesWithCounts = withCategoryProductCounts(categories, products);
  const productCountBySlug = new Map(categoriesWithCounts.map((category) => [category.slug, category.productCount]));
  const homepageCategoriesWithCounts = homepageCategories.map((category) => ({
    ...category,
    productCount: productCountBySlug.get(category.slug) ?? 0
  }));

  return (
    <main id="main-content" tabIndex={-1} dir={getStorefrontCopyDirection(locale)}>
      <SiteHeader returnTo="/" />
      <section className="mx-auto grid max-w-7xl gap-10 px-5 py-14 md:grid-cols-[1.1fr_0.9fr] md:py-24">
        <div className="flex flex-col justify-center">
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-olive">{homepage.eyebrow}</p>
          <h1 className="mt-5 font-display text-6xl leading-[0.95] text-rosewood md:text-8xl">{homepage.title}</h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-stone-700">{homepage.body}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={homepage.primaryCtaHref} className={primaryCtaClass}>{homepage.primaryCtaLabel}</Link>
            <Link href={homepage.secondaryCtaHref} className={secondaryCtaClass}>{homepage.secondaryCtaLabel}</Link>
          </div>
        </div>
        <div className="rounded-[2rem] bg-blush p-4 shadow-2xl shadow-rosewood/10">
          <div className="min-h-[520px] rounded-[1.5rem] bg-[radial-gradient(circle_at_top_left,#fff_0,#f8e8ec_35%,#d9b6be_100%)] p-8">
            <div className="rounded-3xl bg-white/80 p-6 shadow-xl backdrop-blur">
              <p className="text-sm uppercase tracking-[0.25em] text-olive">{homepage.panelEyebrow}</p>
              <h2 className="mt-3 font-display text-4xl text-rosewood">{homepage.panelTitle}</h2>
              <p className="mt-4 text-stone-700">{homepage.panelBody}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-12">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-olive">{copy('home.collectionsEyebrow')}</p>
            <h2 className="mt-2 font-display text-4xl text-rosewood">{copy('home.collectionsTitle')}</h2>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {homepageCategoriesWithCounts.map((category, index) => <HomepageCategoryTileCard key={category.slug} category={category} priority={index < 4} />)}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-12">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-olive">{copy('home.favoritesEyebrow')}</p>
          <h2 className="mt-2 font-display text-4xl text-rosewood">{copy('home.favoritesTitle')}</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {bestSellers.map((product, index) => <ProductCard key={product.slug} product={product} priority={index < 3} locale={locale} />)}
        </div>
      </section>
    </main>
  );
}
