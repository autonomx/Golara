import { Suspense } from 'react';
import Link from 'next/link';
import { ShoppingBag, UserRound } from 'lucide-react';
import { HeaderSearchControl } from '@/components/HeaderSearchControl';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { getCartTokenCookie } from '@/lib/cart/cart-cookie';
import { getCartByToken } from '@/lib/cart/cart-repository';
import type { SupportedLocale } from '@/lib/i18n/locales';
import { normalizeLocale } from '@/lib/i18n/locales';
import { resolveStorefrontLocale } from '@/lib/i18n/resolve-locale';
import { formatStorefrontCopy, getStorefrontCopy } from '@/lib/localization/storefront-copy';
import { hasDatabase } from '@/lib/prisma';
import { storefrontNavigationMenuService, visibleStorefrontNavigationItems } from '@/lib/settings/storefront-navigation-menu';

const headerLinkClass = 'rounded-full px-3 py-2 outline-none transition hover:bg-white/70 hover:text-rosewood focus-visible:ring-4 focus-visible:ring-olive/20';
const iconLinkClass = 'relative rounded-full p-2 outline-none transition hover:bg-white/70 focus-visible:ring-4 focus-visible:ring-olive/20';

async function cartItemCount() {
  if (!hasDatabase()) return 0;
  const token = await getCartTokenCookie();
  if (!token) return 0;
  const cart = await getCartByToken(token);
  return cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
}

function CartHeaderLink({ itemCount = 0, cartLabel }: { itemCount?: number; cartLabel: string }) {
  return (
    <Link href="/cart" className={iconLinkClass} aria-label={cartLabel} prefetch={false}>
      <ShoppingBag className="h-5 w-5" aria-hidden="true" />
      {itemCount > 0 ? (
        <span className="absolute -right-1 -top-1 grid min-h-5 min-w-5 place-items-center rounded-full bg-rosewood px-1 text-[0.65rem] font-bold leading-none text-white">
          {itemCount > 99 ? '99+' : itemCount}
        </span>
      ) : null}
    </Link>
  );
}

async function CartHeaderBadge({ locale }: { locale: SupportedLocale }) {
  const itemCount = await cartItemCount();
  const cartLabel = itemCount > 0
    ? formatStorefrontCopy('header.cartWithItemsLabel', locale, { count: itemCount })
    : getStorefrontCopy('header.cartLabel', locale);

  return <CartHeaderLink itemCount={itemCount} cartLabel={cartLabel} />;
}

export async function SiteHeader({ returnTo = '/', compact = false, locale }: { returnTo?: string; compact?: boolean; locale?: SupportedLocale | string | null } = {}) {
  const resolvedLocale = normalizeLocale(locale ?? await resolveStorefrontLocale());
  const navigationMenu = await storefrontNavigationMenuService.get('primary', resolvedLocale);
  const navigationItems = visibleStorefrontNavigationItems(navigationMenu.items, resolvedLocale);
  const copy = (key: Parameters<typeof getStorefrontCopy>[0]) => getStorefrontCopy(key, resolvedLocale);

  return (
    <header className="sticky top-0 z-20 border-b border-rosewood/10 bg-cream/90 backdrop-blur-xl">
      {!compact ? <div className="border-b border-rosewood/10 bg-rosewood px-4 py-2 text-center text-xs font-semibold uppercase tracking-[0.24em] text-white">
        {copy('header.announcement')}
      </div> : null}
      <div className={`mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 ${compact ? 'py-2' : 'py-4'}`}>
        <nav className="hidden items-center gap-2 text-sm font-medium text-rosewood/80 md:flex" aria-label={navigationMenu.label || copy('header.primaryNavigation')}>
          {navigationItems.map((item) => (
            <Link key={`${item.href}-${item.label}`} href={item.href} className={headerLinkClass} target={item.opensInNewTab ? '_blank' : undefined} rel={item.opensInNewTab ? 'noreferrer' : undefined}>{item.label}</Link>
          ))}
        </nav>
        <Link href="/" className={`rounded-full font-display tracking-tight text-rosewood outline-none focus-visible:ring-4 focus-visible:ring-olive/20 ${compact ? 'text-2xl' : 'text-3xl'}`}>Golara</Link>
        <div className="flex items-center gap-1 text-rosewood">
          <LanguageSwitcher locale={resolvedLocale} returnTo={returnTo} />
          <HeaderSearchControl label={copy('catalog.searchLabel')} placeholder={copy('catalog.searchPlaceholder')} submitLabel={copy('catalog.searchSubmit')} hideLabel={copy('catalog.searchClear')} />
          <Link href="/account" className={iconLinkClass} aria-label={copy('header.accountLabel')} prefetch={false}><UserRound className="h-5 w-5" aria-hidden="true" /></Link>
          <Suspense fallback={<CartHeaderLink cartLabel={copy('header.cartLabel')} />}>
            <CartHeaderBadge locale={resolvedLocale} />
          </Suspense>
        </div>
      </div>
    </header>
  );
}
