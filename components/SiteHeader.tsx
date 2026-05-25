import Link from 'next/link';
import { Search, ShoppingBag, UserRound } from 'lucide-react';
import { listCategories } from '@/lib/cms/catalog-repository';

const headerLinkClass = 'rounded-full px-3 py-2 outline-none transition hover:text-rosewood focus-visible:ring-4 focus-visible:ring-olive/20';

export async function SiteHeader() {
  const categories = await listCategories();

  return (
    <header className="sticky top-0 z-20 border-b border-rosewood/10 bg-cream/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
        <Link href="/" className="rounded-full font-display text-3xl tracking-tight text-rosewood outline-none focus-visible:ring-4 focus-visible:ring-olive/20">Golara</Link>
        <nav className="hidden items-center gap-2 text-sm font-medium text-rosewood/80 md:flex">
          {categories.map((category) => (
            <Link key={category.slug} href={`/categories/${category.slug}`} className={headerLinkClass}>{category.title}</Link>
          ))}
          <Link href="/products" className={headerLinkClass}>Catalog</Link>
          <Link href="/admin" className={headerLinkClass}>Admin</Link>
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
