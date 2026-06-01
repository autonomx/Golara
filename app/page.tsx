import Image from 'next/image';
import Link from 'next/link';
import { HomepageCategoryTileCard } from '@/components/HomepageCategoryTileCard';
import { ProductCard } from '@/components/ProductCard';
import { SiteHeader } from '@/components/SiteHeader';
import { withCategoryProductCounts } from '@/lib/category-tree';
import { getHomepageContent, listCategories, listHomepageCategories, listProducts } from '@/lib/cms/catalog-repository';
import { resolveStorefrontLocale } from '@/lib/i18n/resolve-locale';
import { getStorefrontCopy, getStorefrontCopyDirection } from '@/lib/localization/storefront-copy';

const primaryCtaClass = 'rounded-full bg-rosewood px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-rosewood/20 outline-none transition focus-visible:ring-4 focus-visible:ring-olive/30';
const secondaryCtaClass = 'rounded-full border border-rosewood/20 bg-white/80 px-6 py-3 text-sm font-semibold text-rosewood outline-none transition focus-visible:ring-4 focus-visible:ring-olive/20';
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

  const bestSellers = products.filter((product) => product.bestSeller).slice(0, 6);
  const heroProducts = bestSellers.length >= 2 ? bestSellers.slice(0, 2) : products.slice(0, 2);
  const categoriesWithCounts = withCategoryProductCounts(categories, products);
  const productCountBySlug = new Map(categoriesWithCounts.map((category) => [category.slug, category.productCount]));
  const homepageCategoriesWithCounts = homepageCategories.map((category) => ({
    ...category,
    productCount: productCountBySlug.get(category.slug) ?? 0
  })).slice(0, 6);

  return (
    <main id="main-content" tabIndex={-1} dir={getStorefrontCopyDirection(locale)}>
      <SiteHeader returnTo="/" />

      <section className="border-b border-rosewood/10 bg-[linear-gradient(120deg,#fff8f1_0%,#fff4f7_52%,#efd6de_100%)]">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 md:grid-cols-[0.95fr_1.05fr] md:items-center md:py-20">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-olive">Luxury floral studio</p>
            <h1 className="mt-5 max-w-3xl font-display text-6xl leading-[0.92] text-rosewood md:text-8xl">Flowers for moments worth keeping.</h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-stone-700">Shop curated bouquets, premium boxes, and event-ready floral gifts with real catalog photography.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/products" className={primaryCtaClass}>Shop products</Link>
              <Link href="/#collections" className={secondaryCtaClass}>Browse collections</Link>
            </div>
          </div>
          <div className="grid min-h-[520px] grid-cols-[0.9fr_1.1fr] gap-4">
            {heroProducts[0] ? (
              <div className="relative overflow-hidden rounded-[2rem] bg-blush shadow-2xl shadow-rosewood/10">
                <Image src={heroProducts[0].image} alt={heroProducts[0].title} fill priority className="object-cover" sizes="(min-width: 768px) 34vw, 50vw" />
              </div>
            ) : null}
            <div className="grid gap-4">
              <div className="rounded-[2rem] bg-white/75 p-7 shadow-xl shadow-rosewood/10 backdrop-blur">
                <p className="text-sm uppercase tracking-[0.25em] text-olive">{homepage.eyebrow}</p>
                <h2 className="mt-3 font-display text-4xl text-rosewood">{homepage.panelTitle}</h2>
                <p className="mt-4 text-sm leading-7 text-stone-700">{homepage.panelBody}</p>
              </div>
              {heroProducts[1] ? (
                <div className="relative overflow-hidden rounded-[2rem] bg-blush shadow-xl shadow-rosewood/10">
                  <Image src={heroProducts[1].image} alt={heroProducts[1].title} fill priority className="object-cover" sizes="(min-width: 768px) 32vw, 50vw" />
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section id="collections" className="mx-auto max-w-7xl px-5 py-14">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-olive">{copy('home.collectionsEyebrow')}</p>
            <h2 className="mt-2 font-display text-4xl text-rosewood md:text-5xl">{copy('home.collectionsTitle')}</h2>
          </div>
          <Link href="/categories" className="hidden rounded-full border border-rosewood/20 px-5 py-2 text-sm font-semibold text-rosewood md:inline-flex">See all</Link>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {homepageCategoriesWithCounts.map((category, index) => <HomepageCategoryTileCard key={category.slug} category={category} priority={index < 6} />)}
        </div>
      </section>

      <section id="best-sellers" className="bg-white/50 py-14">
        <div className="mx-auto max-w-7xl px-5">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-olive">{copy('home.favoritesEyebrow')}</p>
              <h2 className="mt-2 font-display text-4xl text-rosewood md:text-5xl">{copy('home.favoritesTitle')}</h2>
            </div>
            <Link href="/products" className="hidden rounded-full border border-rosewood/20 px-5 py-2 text-sm font-semibold text-rosewood md:inline-flex">View all</Link>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {bestSellers.map((product, index) => <ProductCard key={product.slug} product={product} priority={index < 3} locale={locale} />)}
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
              <Link href="/categories" className={footerLinkClass}>Collections</Link>
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
