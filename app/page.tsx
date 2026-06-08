import Link from 'next/link';
import { HomepageBannerSlideshow } from '@/components/HomepageBannerSlideshow';
import { HomepageCategoryTileCard } from '@/components/HomepageCategoryTileCard';
import { HomepageOccasionRail } from '@/components/HomepageOccasionRail';
import { BestSellersCarousel } from '@/components/BestSellersCarousel';
import { SiteHeader } from '@/components/SiteHeader';
import { withCategoryProductCounts } from '@/lib/category-tree';
import { getHomepageContent, listCategories, listHomepageCategories, listProducts } from '@/lib/cms/catalog-repository';
import { homepageBannerSlides } from '@/lib/homepage-assets';
import { resolveStorefrontLocale } from '@/lib/i18n/resolve-locale';
import { selectHomepageContentForLocale } from '@/lib/localization/homepage-content';
import { getStorefrontCopy, getStorefrontCopyDirection } from '@/lib/localization/storefront-copy';

const footerLinkClass = 'outline-none transition hover:text-rosewood focus-visible:ring-4 focus-visible:ring-olive/20';

function firstNonEmpty(...values: Array<string | undefined>) {
  return values.find((value) => value?.trim()) ?? '';
}

export default async function HomePage() {
  const locale = await resolveStorefrontLocale();
  const copy = (key: Parameters<typeof getStorefrontCopy>[0]) => getStorefrontCopy(key, locale);
  const [homepageSource, categories, homepageCategories, products] = await Promise.all([
    getHomepageContent({ locale }),
    listCategories({ locale }),
    listHomepageCategories({ locale }),
    listProducts({ locale })
  ]);
  const homepage = selectHomepageContentForLocale(homepageSource, locale);

  const bestSellers = products.filter((product) => product.bestSeller).slice(0, 24);
  const categoriesWithCounts = withCategoryProductCounts(categories, products);
  const productCountBySlug = new Map(categoriesWithCounts.map((category) => [category.slug, category.productCount]));
  const homepageOccasionsWithCounts = homepageCategories.map((category) => ({
    ...category,
    productCount: productCountBySlug.get(category.slug) ?? 0
  }));
  const featuredOccasions = homepageOccasionsWithCounts.slice(0, 6);
  const occasionRailItems = homepageOccasionsWithCounts.slice(0, 10);

  return (
    <main
      id="main-content"
      tabIndex={-1}
      dir={getStorefrontCopyDirection(locale)}
      data-page="home"
      className="bg-[linear-gradient(180deg,#fffdfb_0%,#ffffff_42%,#fbf8f5_100%)]"
    >
      <SiteHeader returnTo="/" locale={locale} />

      <HomepageBannerSlideshow slides={homepageBannerSlides} homepage={homepage} />
      <HomepageOccasionRail occasions={occasionRailItems} locale={locale} />

      <BestSellersCarousel products={bestSellers} locale={locale} />

      <section
        id="home-collections"
        data-section="home-collections"
        aria-labelledby="home-collections-heading"
        className="relative overflow-hidden bg-white px-5 py-20"
      >
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-rosewood/20 to-transparent" />
        <div className="mx-auto max-w-[1520px]">
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-olive">{firstNonEmpty(homepage.collectionsEyebrow, copy('home.collectionsEyebrow'))}</p>
              <h2 id="home-collections-heading" className="mt-2 font-display text-4xl text-rosewood md:text-5xl">{firstNonEmpty(homepage.collectionsTitle, copy('home.collectionsTitle'))}</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-600 md:text-base">{firstNonEmpty(homepage.collectionsBody, copy('home.collectionsBody'))}</p>
            </div>
            <Link href={firstNonEmpty(homepage.collectionsCtaHref, '/categories')} className="inline-flex rounded-full border border-rosewood/15 bg-white px-5 py-2.5 text-sm font-semibold text-rosewood shadow-[0_12px_28px_rgba(111,36,56,0.08)] transition hover:-translate-y-0.5 hover:border-rosewood hover:bg-rosewood hover:text-white">{firstNonEmpty(homepage.collectionsCtaLabel, copy('home.collectionsCtaLabel'))}</Link>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            {featuredOccasions.map((category, index) => <HomepageCategoryTileCard key={category.slug} category={category} priority={index < 4} locale={locale} />)}
          </div>
        </div>
      </section>

      <footer id="home-footer" data-section="home-footer" className="border-t border-rosewood/10 bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-10 text-sm text-stone-600 md:grid-cols-[1.2fr_0.8fr_0.8fr]">
          <div>
            <div className="font-display text-3xl text-rosewood">Golara</div>
            <p className="mt-3 max-w-md leading-7">{firstNonEmpty(homepage.footerBody, copy('home.footerBody'))}</p>
          </div>
          <div>
            <h3 className="font-semibold text-rosewood">{copy('home.footerShopTitle')}</h3>
            <div className="mt-3 grid gap-2">
              <Link href="/products" className={footerLinkClass}>{copy('home.footerAllProducts')}</Link>
              <Link href="/categories" className={footerLinkClass}>{copy('home.footerOccasions')}</Link>
              <Link href="/#best-sellers" className={footerLinkClass}>{copy('home.footerBestSellers')}</Link>
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-rosewood">{copy('home.footerServiceTitle')}</h3>
            <p className="mt-3 leading-7">{firstNonEmpty(homepage.footerServiceBody, copy('home.footerServiceBody'))}</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
