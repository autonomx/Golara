import Link from 'next/link';
import { Search, ShoppingBag, UserRound } from 'lucide-react';
import { listCategories } from '@/lib/cms/catalog-repository';

export async function SiteHeader() {
  const categories = await listCategories();

  return (
    <header className="sticky top-0 z-20 border-b border-rosewood/10 bg-cream/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
        <Link href="/" className="font-display text-3xl tracking-tight text-rosewood">Golara</Link>
        <nav className="hidden items-center gap-6 text-sm font-medium text-rosewood/80 md:flex">
          {categories.map((category) => (
            <Link key={category.slug} href={`/categories/${category.slug}`} className="hover:text-rosewood">{category.title}</Link>
          ))}
          <Link href="/products" className="hover:text-rosewood">Catalog</Link>
          <Link href="/admin" className="hover:text-rosewood">Admin</Link>
        </nav>
        <div className="flex items-center gap-3 text-rosewood">
          <Search className="h-5 w-5" aria-label="Search" />
          <UserRound className="h-5 w-5" aria-label="Account" />
          <ShoppingBag className="h-5 w-5" aria-label="Cart" />
        </div>
      </div>
    </header>
  );
}
