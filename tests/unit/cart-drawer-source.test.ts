import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const headerSource = readFileSync('components/SiteHeader.tsx', 'utf8');
const drawerSource = readFileSync('components/CartDrawer.tsx', 'utf8');

function includes(source: string, expected: string, label: string) {
  assert.ok(source.includes(expected), label);
}

function excludes(source: string, unexpected: string, label: string) {
  assert.ok(!source.includes(unexpected), label);
}

includes(headerSource, "import { CartDrawer, type CartDrawerCart } from '@/components/CartDrawer';", 'SiteHeader should import the cart drawer');
includes(headerSource, 'async function headerCart(): Promise<CartDrawerCart>', 'SiteHeader should build a serializable header cart payload');
includes(headerSource, '<CartDrawer cart={cart} cartLabel={cartLabel} locale={locale} triggerClassName={iconLinkClass} />', 'SiteHeader should render the drawer with live cart data');
includes(headerSource, "formatStorefrontCopy('header.cartWithItemsLabel', locale, { count: cart.itemCount })", 'SiteHeader should keep localized cart count labels');
excludes(headerSource, '<Link href="/cart" className={iconLinkClass}', 'SiteHeader cart trigger should not regress to a direct cart link');

includes(drawerSource, "'use client';", 'CartDrawer should be a client component');
includes(drawerSource, "import { usePathname } from 'next/navigation';", 'CartDrawer should preserve current page return paths for cart mutations');
includes(drawerSource, "import { ShoppingBag, X } from 'lucide-react';", 'CartDrawer should keep the bag trigger and close icon');
includes(drawerSource, 'aria-haspopup="dialog"', 'CartDrawer trigger should announce dialog behavior');
includes(drawerSource, 'role="dialog"', 'CartDrawer should render an accessible dialog');
includes(drawerSource, 'aria-modal="true"', 'CartDrawer should be modal while open');
includes(drawerSource, "if (event.key === 'Escape') setOpen(false);", 'CartDrawer should close with Escape');
includes(drawerSource, "document.body.style.overflow = 'hidden';", 'CartDrawer should lock body scroll while open');
includes(drawerSource, "direction === 'rtl' ? 'left-0 border-r border-rosewood/10' : 'right-0 border-l border-rosewood/10'", 'CartDrawer should slide from the locale-appropriate side');
includes(drawerSource, 'fixed inset-y-0', 'CartDrawer sidebar should cover the full viewport height');
includes(drawerSource, 'h-dvh', 'CartDrawer should use dynamic viewport height for mobile browser chrome');
includes(drawerSource, 'bg-[#fff8f1]', 'CartDrawer should keep an opaque sidebar surface instead of transparency');
includes(drawerSource, 'transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]', 'CartDrawer should animate smoothly with transform transitions');
includes(drawerSource, "open ? 'translate-x-0' : closedTransformClass", 'CartDrawer should animate between off-canvas and open states');
includes(drawerSource, "open ? 'opacity-100' : 'opacity-0'", 'CartDrawer overlay should fade smoothly');
excludes(drawerSource, 'bg-white/70', 'CartDrawer footer should not be translucent over page imagery');
includes(drawerSource, "action={updateCartItemAction}", 'CartDrawer should allow quantity updates');
includes(drawerSource, "action={removeCartItemAction}", 'CartDrawer should allow item removal');
includes(drawerSource, "action={clearCartAction}", 'CartDrawer should allow clearing the cart');
includes(drawerSource, 'href="/cart/checkout"', 'CartDrawer should include checkout navigation');
includes(drawerSource, 'href="/cart"', 'CartDrawer should preserve full cart page fallback');
includes(drawerSource, "const dismissCartAddConfirmation = () => setCartStatus(null);", 'CartDrawer should dismiss the add confirmation without requiring a route change');
includes(drawerSource, "window.history.replaceState(null, '', nextContinueShoppingHref);", 'CartDrawer should remove the cart status query from the address bar after reading it');
const dismissConfirmationClickCount = (drawerSource.match(/onClick=\{dismissCartAddConfirmation\}/g) || []).length;
assert.equal(dismissConfirmationClickCount, 2, 'CartDrawer add confirmation CTAs should dismiss the toast immediately when clicked');
includes(drawerSource, "copy('cart.emptyTitle')", 'CartDrawer empty state should use localized cart copy');
includes(drawerSource, "copy('cart.checkout')", 'CartDrawer checkout CTA should use localized cart copy');
excludes(drawerSource, 'Close cart drawer', 'CartDrawer should not use hardcoded English aria copy');

console.log('cart-drawer-source.test.ts passed');
