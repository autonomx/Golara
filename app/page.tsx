import Link from 'next/link';
import { CategoryCard } from '@/components/CategoryCard';
import { ProductCard } from '@/components/ProductCard';
import { SiteHeader } from '@/components/SiteHeader';
import { getHomepageContent, listCategories, listProducts } from '@/lib/cms/catalog-repository';

export default async function HomePage() {
  const [homepage, categories, products] = await Promise.all([
    getHomepageContent(),
    listCategories(),
    listProducts()
  ]);

  const bestSellers = products.filter((product) => product.bestSeller);

  return (
    <main>
      <SiteHeader />
      <section className="mx-auto grid max-w-7xl gap-10 px-5 py-14 md:grid-cols-[1.1fr_0.9fr] md:py-24">
        <div className="flex flex-col justify-center">
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-olive">{homepage.eyebrow}</p>
          <h1 className="mt-5 font-display text-6xl leading-[0.95] text-rosewood md:text-8xl">{homepage.title}</h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-stone-700">{homepage.body}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={homepage.primaryCtaHref} className="rounded-full bg-rosewood px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-rosewood/20">{homepage.primaryCtaLabel}</Link>
            <Link href={homepage.secondaryCtaHref} className="rounded-full border border-rosewood/20 px-6 py-3 text-sm font-semibold text-rosewood">{homepage.secondaryCtaLabel}</Link>
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
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-olive">Collections</p>
            <h2 className="mt-2 font-display text-4xl text-rosewood">Shop by occasion</h2>
          </div>
        </div>
        <div className="grid gap-5 md:grid-cols-4">
          {categories.map((category) => <CategoryCard key={category.slug} category={category} />)}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-12">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-olive">Favorites</p>
          <h2 className="mt-2 font-display text-4xl text-rosewood">Best sellers</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {bestSellers.map((product, index) => <ProductCard key={product.slug} product={product} priority={index < 3} />)}
        </div>
      </section>
    </main>
  );
}