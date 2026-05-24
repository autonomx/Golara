import { ProductCard } from '@/components/ProductCard';
import { SiteHeader } from '@/components/SiteHeader';
import { products } from '@/lib/catalog';

export default function ProductsPage() {
  return (
    <main>
      <SiteHeader />
      <section className="mx-auto max-w-7xl px-5 py-14">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-olive">Catalog</p>
        <h1 className="mt-3 font-display text-6xl text-rosewood">All products</h1>
        <p className="mt-4 max-w-2xl text-stone-700">This static catalog will become database-backed in the CMS phase, with editable products, prices, images, categories, and availability.</p>
        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => <ProductCard key={product.slug} product={product} />)}
        </div>
      </section>
    </main>
  );
}
