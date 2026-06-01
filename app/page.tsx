import Link from 'next/link';
import { HomepageBannerSlideshow } from '@/components/HomepageBannerSlideshow';
import { HomepageCategoryTileCard } from '@/components/HomepageCategoryTileCard';
import { HomepageOccasionRail } from '@/components/HomepageOccasionRail';
import { HomepageTrustStrip } from '@/components/HomepageTrustStrip';
import { HomepageVipAssist } from '@/components/HomepageVipAssist';
import { BestSellersCarousel } from '@/components/BestSellersCarousel';
import { SiteHeader } from '@/components/SiteHeader';
import { withCategoryProductCounts } from '@/lib/category-tree';
import { getHomepageContent, listCategories, listHomepageCategories, listProducts } from '@/lib/cms/catalog-repository';
import { homepageBannerSlides } from '@/lib/homepage-assets';
import { resolveStorefrontLocale } from '@/lib/i18n/resolve-locale';
import { getStorefrontCopy, getStorefrontCopyDirection } from '@/lib/localization/storefront-copy';

const footerLinkClass = 'outline-none transition hover:text-rosewood focus-visible:ring-4 focus-visible:ring-olive/20';

export default async function HomePage() {
  const locale = await resolveStorefrontLocale();
  const copy = (key: Parameters<typeof getStorefrontCopy>[0]) => getStorefrontCopy(key, locale);
  const [homepage, categories, homepageCategories, products] = await Promise.all([
    getHomepageContent({ locale }),
    listCategories({ locale }),
    listHomepageCategories({ locale }),
    listProducts({ locale })
  ]);

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
    <main id="main-content" tabIndex={-1} dir={getStorefrontCopyDirection(locale)}>
      <SiteHeader returnTo="/" />

      <HomepageBannerSlideshow slides={homepageBannerSlides} />
      <HomepageOccasionRail occasions={occasionRailItems} />
      <HomepageTrustStrip />

      <BestSellersCarousel products={bestSellers} locale={locale} />

      <HomepageVipAssist />

      <section id="occasions-gallery" className="bg-white/45 px-5 py-20">
        <div className="mx-auto max-w-[1520px]">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-olive">{copy('home.collectionsEyebrow')}</p>
            <h2 className="mt-2 font-display text-4xl text-rosewood md:text-5xl">{copy('home.collectionsTitle')}</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-600 md:text-base">Browse by the moment you are buying for, from birthdays and weddings to sympathy, baby flowers, and same-day gifts.</p>
          </div>
          <Link href="/categories" className="inline-flex rounded-full border border-rosewood/15 bg-white px-5 py-2.5 text-sm font-semibold text-rosewood shadow-sm transition hover:border-rosewood hover:bg-blush">See all occasions</Link>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {featuredOccasions.map((category, index) => <HomepageCategoryTileCard key={category.slug} category={category} priority={index < 4} />)}
        </div>
        </div>
      </section>

      <footer className="border-t border-rosewood/10 bg-white/70">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-10 text-sm text-stone-600 md:grid-cols-[1.2fr_0.8fr_0.8fr]">
          <div>
            <div className="font-display text-3xl text-rosewood">Golara</div>
            <p className="mt-3 max-w-md leading-7">A luxury floral storefront for bouquets, flower boxes, weddings, events, and premium gifting.</p>
          </div>
          <div>
            <h3 className="font-semibold text-rosewood">Shop</h3>
            <div className="mt-3 grid gap-2">
              <Link href="/products" className={footerLinkClass}>All products</Link>
              <Link href="/categories" className={footerLinkClass}>Occasions</Link>
              <Link href="/#best-sellers" className={footerLinkClass}>Best sellers</Link>
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-rosewood">Service</h3>
            <p className="mt-3 leading-7">Same-day availability, premium boxes, event flowers, and staff-assisted ordering.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
