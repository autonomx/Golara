import { Suspense } from 'react';
import Link from 'next/link';
import { UserRound } from 'lucide-react';
import { CartDrawer, type CartDrawerCart } from '@/components/CartDrawer';
import { HeaderSearchControl } from '@/components/HeaderSearchControl';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { getCartTokenCookie } from '@/lib/cart/cart-cookie';
import { getCartByToken } from '@/lib/cart/cart-repository';
import { formatMinorUnitAmount } from '@/lib/catalog';
import type { SupportedLocale } from '@/lib/i18n/locales';
import { normalizeLocale } from '@/lib/i18n/locales';
import { resolveStorefrontLocale } from '@/lib/i18n/resolve-locale';
import { formatStorefrontCopy, getStorefrontCopy } from '@/lib/localization/storefront-copy';
import { getStorefrontCloudinaryImage } from '@/lib/media/cloudinary-image';
import { hasDatabase } from '@/lib/prisma';
import { storefrontNavigationMenuService, visibleStorefrontNavigationItems } from '@/lib/settings/storefront-navigation-menu';

const headerLinkClass = 'rounded-full px-3 py-2 outline-none transition hover:bg-white/70 hover:text-rosewood focus-visible:ring-4 focus-visible:ring-olive/20';
const iconLinkClass = 'relative rounded-full p-2 outline-none transition hover:bg-white/70 focus-visible:ring-4 focus-visible:ring-olive/20';

function shouldPrefetchHeaderLink(href: string) {
  return href.startsWith('/') && !href.includes('#');
}

async function headerCart(): Promise<CartDrawerCart> {
  if (!hasDatabase()) return { items: [], itemCount: 0, subtotalLabel: formatMinorUnitAmount(0, process.env.CHECKOUT_DOMESTIC_CURRENCY || 'TOMAN') };
  const token = await getCartTokenCookie();
  if (!token) return { items: [], itemCount: 0, subtotalLabel: formatMinorUnitAmount(0, process.env.CHECKOUT_DOMESTIC_CURRENCY || 'TOMAN') };
  const cart = await getCartByToken(token);
  const items = cart?.items ?? [];
  const currency = cart?.currency || items[0]?.product.currency || process.env.CHECKOUT_DOMESTIC_CURRENCY || 'TOMAN';
  const subtotalCents = items.reduce((sum, item) => sum + (item.variant?.priceCents ?? item.product.priceCents) * item.quantity, 0);

  return {
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    subtotalLabel: formatMinorUnitAmount(subtotalCents, currency),
    items: items.map((item) => {
      const unitPriceCents = item.variant?.priceCents ?? item.product.priceCents;
      const lineTotal = unitPriceCents * item.quantity;
      return {
        id: item.id,
        lineKey: item.lineKey,
        productTitle: item.product.title,
        productCode: item.product.code,
        productSlug: item.product.slug,
        imageUrl: getStorefrontCloudinaryImage(item.product.imageUrl, 'productCard'),
        variantLabel: item.variant ? `${item.variant.name} / ${item.variant.sku}` : undefined,
        quantity: item.quantity,
        unitPriceLabel: formatMinorUnitAmount(unitPriceCents, item.variant?.currency ?? item.product.currency),
        lineTotalLabel: formatMinorUnitAmount(lineTotal, item.product.currency)
      };
    })
  };
}

function CartHeaderFallback({ cartLabel, locale }: { cartLabel: string; locale: SupportedLocale }) {
  return <CartDrawer cart={{ items: [], itemCount: 0, subtotalLabel: formatMinorUnitAmount(0, 'TOMAN') }} cartLabel={cartLabel} locale={locale} triggerClassName={iconLinkClass} />;
}

async function CartHeaderBadge({ locale }: { locale: SupportedLocale }) {
  const cart = await headerCart();
  const cartLabel = cart.itemCount > 0
    ? formatStorefrontCopy('header.cartWithItemsLabel', locale, { count: cart.itemCount })
    : getStorefrontCopy('header.cartLabel', locale);

  return <CartDrawer cart={cart} cartLabel={cartLabel} locale={locale} triggerClassName={iconLinkClass} />;
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
            <Link key={`${item.href}-${item.label}`} href={item.href} className={headerLinkClass} target={item.opensInNewTab ? '_blank' : undefined} rel={item.opensInNewTab ? 'noreferrer' : undefined} prefetch={shouldPrefetchHeaderLink(item.href)}>{item.label}</Link>
          ))}
        </nav>
        <Link href="/" className={`rounded-full font-display tracking-tight text-rosewood outline-none focus-visible:ring-4 focus-visible:ring-olive/20 ${compact ? 'text-2xl' : 'text-3xl'}`}>Golara</Link>
        <div className="flex items-center gap-1 text-rosewood">
          <LanguageSwitcher locale={resolvedLocale} returnTo={returnTo} />
          <HeaderSearchControl label={copy('catalog.searchLabel')} placeholder={copy('catalog.searchPlaceholder')} submitLabel={copy('catalog.searchSubmit')} />
          <Link href="/account" className={iconLinkClass} aria-label={copy('header.accountLabel')} prefetch={false}><UserRound className="h-5 w-5" aria-hidden="true" /></Link>
          <Suspense fallback={<CartHeaderFallback cartLabel={copy('header.cartLabel')} locale={resolvedLocale} />}>
            <CartHeaderBadge locale={resolvedLocale} />
          </Suspense>
        </div>
      </div>
    </header>
  );
}
