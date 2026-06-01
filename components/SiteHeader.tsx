import Link from 'next/link';
import { Search, ShoppingBag, UserRound } from 'lucide-react';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { getCartTokenCookie } from '@/lib/cart/cart-cookie';
import { getCartByToken } from '@/lib/cart/cart-repository';
import { resolveStorefrontLocale } from '@/lib/i18n/resolve-locale';
import { getStorefrontCopy } from '@/lib/localization/storefront-copy';
import { hasDatabase } from '@/lib/prisma';

const headerLinkClass = 'rounded-full px-3 py-2 outline-none transition hover:bg-white/70 hover:text-rosewood focus-visible:ring-4 focus-visible:ring-olive/20';
const iconLinkClass = 'relative rounded-full p-2 outline-none transition hover:bg-white/70 focus-visible:ring-4 focus-visible:ring-olive/20';

async function cartItemCount() {
  if (!hasDatabase()) return 0;
  const token = await getCartTokenCookie();
  const cart = await getCartByToken(token);
  return cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
}

export async function SiteHeader({ returnTo = '/', compact = false }: { returnTo?: string; compact?: boolean } = {}) {
  const locale = await resolveStorefrontLocale();
  const itemCount = await cartItemCount();
  const copy = (key: Parameters<typeof getStorefrontCopy>[0]) => getStorefrontCopy(key, locale);

  return (
    <header className="sticky top-0 z-20 border-b border-rosewood/10 bg-cream/90 backdrop-blur-xl">
      {!compact ? <div className="border-b border-rosewood/10 bg-rosewood px-4 py-2 text-center text-xs font-semibold uppercase tracking-[0.24em] text-white">
        {copy('header.announcement')}
      </div> : null}
      <div className={`mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 ${compact ? 'py-2' : 'py-4'}`}>
        <nav className="hidden items-center gap-2 text-sm font-medium text-rosewood/80 md:flex" aria-label="Primary navigation">
          <Link href="/products" className={headerLinkClass}>{copy('nav.catalog')}</Link>
          <Link href="/#occasions" className={headerLinkClass}>{copy('nav.occasions')}</Link>
          <Link href="/categories/available-today" className={headerLinkClass}>{copy('nav.availableToday')}</Link>
          <Link href="/#best-sellers" className={headerLinkClass}>{copy('nav.bestSellers')}</Link>
        </nav>
        <Link href="/" className={`rounded-full font-display tracking-tight text-rosewood outline-none focus-visible:ring-4 focus-visible:ring-olive/20 ${compact ? 'text-2xl' : 'text-3xl'}`}>Golara</Link>
        <div className="flex items-center gap-1 text-rosewood">
          <LanguageSwitcher locale={locale} returnTo={returnTo} />
          <span className="rounded-full p-2 text-rosewood/70" aria-hidden="true"><Search className="h-5 w-5" /></span>
          <Link href="/account" className={iconLinkClass} aria-label="Account"><UserRound className="h-5 w-5" aria-hidden="true" /></Link>
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
