import { ProductCard } from '@/components/ProductCard';
import { SiteHeader } from '@/components/SiteHeader';
import { listProducts } from '@/lib/cms/catalog-repository';

export default async function ProductsPage() {
  const products = await listProducts();

  return (
    <main>
      <SiteHeader />
      <section className="mx-auto max-w-7xl px-5 py-14">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-olive">Catalog</p>
        <h1 className="mt-3 font-display text-6xl text-rosewood">All products</h1>
        <p className="mt-4 max-w-2xl text-stone-700">The catalog is now wired through the CMS data layer. With DATABASE_URL configured, products are loaded from Prisma; otherwise seeded content is used for previews.</p>
        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => <ProductCard key={product.slug} product={product} />)}
        </div>
      </section>
    </main>
  );
}
