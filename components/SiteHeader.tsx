import Link from 'next/link';
import { Search, ShoppingBag, UserRound } from 'lucide-react';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { getCartTokenCookie } from '@/lib/cart/cart-cookie';
import { getCartByToken } from '@/lib/cart/cart-repository';
import { listCategories } from '@/lib/cms/catalog-repository';
import { resolveStorefrontLocale } from '@/lib/i18n/resolve-locale';
import { getStorefrontCopy } from '@/lib/localization/storefront-copy';
import { hasDatabase } from '@/lib/prisma';

const headerLinkClass = 'rounded-full px-3 py-2 outline-none transition hover:text-rosewood focus-visible:ring-4 focus-visible:ring-olive/20';
const iconLinkClass = 'relative rounded-full p-2 outline-none transition hover:bg-white/70 focus-visible:ring-4 focus-visible:ring-olive/20';

async function cartItemCount() {
  if (!hasDatabase()) return 0;
  const token = await getCartTokenCookie();
  const cart = await getCartByToken(token);
  return cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
}

export async function SiteHeader({ returnTo = '/' }: { returnTo?: string } = {}) {
  const locale = await resolveStorefrontLocale();
  const [categories, itemCount] = await Promise.all([listCategories({ locale }), cartItemCount()]);

  return (
    <header className="sticky top-0 z-20 border-b border-rosewood/10 bg-cream/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4">
        <Link href="/" className="rounded-full font-display text-3xl tracking-tight text-rosewood outline-none focus-visible:ring-4 focus-visible:ring-olive/20">Golara</Link>
        <nav className="hidden items-center gap-2 text-sm font-medium text-rosewood/80 md:flex">
          {categories.map((category) => (
            <Link key={category.slug} href={`/categories/${category.slug}`} className={headerLinkClass}>{category.title}</Link>
          ))}
          <Link href="/products" className={headerLinkClass}>{getStorefrontCopy('nav.catalog', locale)}</Link>
          <Link href="/admin" className={headerLinkClass}>Admin</Link>
        </nav>
        <div className="flex items-center gap-1 text-rosewood">
          <LanguageSwitcher locale={locale} returnTo={returnTo} />
          <span className="rounded-full p-2 text-rosewood/70" aria-hidden="true"><Search className="h-5 w-5" /></span>
          <span className="rounded-full p-2 text-rosewood/70" aria-hidden="true"><UserRound className="h-5 w-5" /></span>
          <Link href="/cart" className={iconLinkClass} aria-label={`Cart${itemCount > 0 ? ` with ${itemCount} item${itemCount === 1 ? '' : 's'}` : ''}`}>
            <ShoppingBag className="h-5 w-5" aria-hidden="true" />
            {itemCount > 0 ? (
              <span className="absolute -right-1 -top-1 grid min-h-5 min-w-5 place-items-center rounded-full bg-rosewood px-1 text-[0.65rem] font-bold leading-none text-white">
                {itemCount > 99 ? '99+' : itemCount}
              </span>
            ) : null}
          </Link>
        </div>
      </div>
    </header>
  );
}
