'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useId, useState } from 'react';
import { ShoppingBag, X } from 'lucide-react';
import { clearCartAction, removeCartItemAction, updateCartItemAction } from '@/app/cart/actions';
import { ProgressiveStorefrontImage } from '@/components/ProgressiveStorefrontImage';
import { StorefrontSubmitButton } from '@/components/StorefrontSubmitButton';
import { getCustomerCopy, getCustomerCopyDirection } from '@/lib/localization/customer-copy';

type CartDrawerItem = {
  id: string;
  lineKey: string;
  productTitle: string;
  productCode: string;
  productSlug: string;
  imageUrl: string;
  variantLabel?: string;
  quantity: number;
  unitPriceLabel: string;
  lineTotalLabel: string;
};

export type CartDrawerCart = {
  items: CartDrawerItem[];
  itemCount: number;
  subtotalLabel: string;
};

function pendingLabel(label: string) {
  return `${label}…`;
}

function quantityOptions(current: number) {
  const values = new Set([1, 2, 3, 4, 5, current]);
  return [...values].filter((value) => value > 0 && value <= 99).sort((a, b) => a - b);
}

function cartReturnTo(pathname: string | null) {
  const path = pathname || '/';
  return path.startsWith('/') ? path : '/';
}

function cartReassuranceItems(locale?: string | null) {
  return locale?.toLowerCase().startsWith('fa')
    ? ['ارسال و جمع نهایی هنگام پرداخت تایید می‌شود.', 'پرداخت امن و ثبت سفارش روی سرور انجام می‌شود.', 'برای سفارش‌های ویژه می‌توانید با پشتیبانی هماهنگ کنید.']
    : ['Delivery and final totals are confirmed at checkout.', 'Secure payment and order creation happen server-side.', 'Special requests can be coordinated with support.'];
}

export function CartDrawer({
  cart,
  cartLabel,
  locale,
  triggerClassName
}: {
  cart: CartDrawerCart;
  cartLabel: string;
  locale: string;
  triggerClassName: string;
}) {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [cartStatus, setCartStatus] = useState<string | null>(null);
  const [continueShoppingHref, setContinueShoppingHref] = useState('/');
  const titleId = useId();
  const pathname = usePathname();
  const returnTo = cartReturnTo(pathname);
  const direction = getCustomerCopyDirection(locale);
  const copy = (key: Parameters<typeof getCustomerCopy>[0]) => getCustomerCopy(key, locale);
  const hasItems = cart.items.length > 0;
  const showAddConfirmation = cartStatus === 'added';
  const reassuranceItems = cartReassuranceItems(locale);

  const openDrawer = () => {
    setMounted(true);
    window.requestAnimationFrame(() => setOpen(true));
  };
  const closeDrawer = () => setOpen(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setCartStatus(params.get('cart'));
    params.delete('cart');
    const query = params.toString();
    setContinueShoppingHref(`${cartReturnTo(window.location.pathname || pathname)}${query ? `?${query}` : ''}`);
  }, [pathname]);

  useEffect(() => {
    if (!mounted || open) return;
    const timeout = window.setTimeout(() => setMounted(false), 420);
    return () => window.clearTimeout(timeout);
  }, [mounted, open]);

  useEffect(() => {
    if (!mounted) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mounted]);

  const sideClass = direction === 'rtl' ? 'left-0 border-r border-rosewood/10' : 'right-0 border-l border-rosewood/10';
  const closedTransformClass = direction === 'rtl' ? '-translate-x-full' : 'translate-x-full';
  const confirmationSideClass = direction === 'rtl' ? 'left-4 md:left-6' : 'right-4 md:right-6';

  return (
    <>
      <button type="button" className={triggerClassName} aria-label={cartLabel} aria-haspopup="dialog" aria-expanded={open} onClick={openDrawer}>
        <ShoppingBag className="h-5 w-5" aria-hidden="true" />
        {cart.itemCount > 0 ? (
          <span className="absolute -right-1 -top-1 grid min-h-5 min-w-5 place-items-center rounded-full bg-rosewood px-1 text-[0.65rem] font-bold leading-none text-white">
            {cart.itemCount > 99 ? '99+' : cart.itemCount}
          </span>
        ) : null}
      </button>

      {showAddConfirmation ? (
        <div className={`fixed bottom-5 ${confirmationSideClass} z-[80] w-[calc(100vw-2rem)] max-w-sm rounded-[1.5rem] border border-olive/20 bg-white p-4 text-stone-800 shadow-[0_18px_60px_rgba(88,24,43,0.2)]`} role="status" aria-live="polite" dir={direction}>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-olive">{copy('cart.eyebrow')}</p>
          <p className="mt-1 font-display text-2xl text-rosewood">{copy('cart.status.added')}</p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Link href="/cart/checkout" className="rounded-full bg-rosewood px-4 py-2 text-center text-xs font-semibold text-white shadow-lg shadow-rosewood/15 outline-none transition focus-visible:ring-4 focus-visible:ring-olive/30">
              {copy('cart.checkout')}
            </Link>
            <Link href={continueShoppingHref} className="rounded-full border border-rosewood/20 px-4 py-2 text-center text-xs font-semibold text-rosewood outline-none transition focus-visible:ring-4 focus-visible:ring-olive/20">
              {copy('common.continueShopping')}
            </Link>
          </div>
        </div>
      ) : null}

      {mounted ? (
        <div className={`fixed inset-0 z-[90] ${open ? 'pointer-events-auto' : 'pointer-events-none'}`} role="dialog" aria-modal="true" aria-labelledby={titleId} dir={direction}>
          <button type="button" className={`absolute inset-0 cursor-default bg-rosewood/35 backdrop-blur-sm transition-opacity duration-300 ease-out ${open ? 'opacity-100' : 'opacity-0'}`} aria-label={copy('cart.title')} onClick={closeDrawer} />
          <aside className={`fixed inset-y-0 ${sideClass} flex h-dvh w-full max-w-md transform flex-col overflow-hidden bg-[#fff8f1] text-stone-800 shadow-[0_24px_80px_rgba(88,24,43,0.28)] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${open ? 'translate-x-0' : closedTransformClass}`}>
            <div className="shrink-0 border-b border-rosewood/10 bg-[#fff8f1] px-6 py-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-olive">{copy('cart.eyebrow')}</p>
                  <h2 id={titleId} className="mt-1 font-display text-4xl text-rosewood">{copy('cart.title')}</h2>
                </div>
                <button type="button" className="rounded-full p-2 text-rosewood outline-none transition hover:bg-white focus-visible:ring-4 focus-visible:ring-olive/20" aria-label={copy('cart.title')} onClick={closeDrawer}>
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto bg-[#fff8f1] px-6 py-5">
              {!hasItems ? (
                <div className="rounded-[2rem] border border-rosewood/10 bg-white p-6 shadow-sm">
                  <h3 className="font-display text-3xl text-rosewood">{copy('cart.emptyTitle')}</h3>
                  <p className="mt-3 text-sm leading-6 text-stone-700">{copy('cart.emptyBody')}</p>
                  <Link href="/products" className="mt-6 inline-flex rounded-full bg-rosewood px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-rosewood/20 outline-none transition focus-visible:ring-4 focus-visible:ring-olive/30" onClick={closeDrawer}>
                    {copy('cart.shopProducts')}
                  </Link>
                </div>
              ) : (
                <div className="grid gap-4">
                  {cart.items.map((item) => {
                    const updateLabel = copy('cart.update');
                    const removeLabel = copy('cart.remove');
                    return (
                      <article key={item.id} className="grid grid-cols-[88px_1fr] gap-4 rounded-[1.5rem] border border-rosewood/10 bg-white p-3 shadow-sm">
                        <Link href={`/products/${item.productSlug}`} className="relative aspect-square overflow-hidden rounded-2xl bg-blush outline-none focus-visible:ring-4 focus-visible:ring-olive/20" onClick={closeDrawer}>
                          <ProgressiveStorefrontImage src={item.imageUrl} alt={item.productTitle} fill imageClassName="object-cover" sizes="88px" />
                        </Link>
                        <div className="min-w-0">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <Link href={`/products/${item.productSlug}`} className="font-display text-2xl leading-7 text-rosewood underline-offset-4 outline-none hover:underline focus-visible:ring-4 focus-visible:ring-olive/20" onClick={closeDrawer}>
                                {item.productTitle}
                              </Link>
                              <p className="mt-1 text-[0.65rem] uppercase tracking-[0.18em] text-rosewood/50">{item.productCode}</p>
                              {item.variantLabel ? <p className="mt-1 text-xs font-semibold text-rosewood">{item.variantLabel}</p> : null}
                              <p className="mt-1 text-xs text-stone-600">{item.unitPriceLabel} {copy('cart.each')}</p>
                            </div>
                            <p className="shrink-0 font-display text-xl text-rosewood">{item.lineTotalLabel}</p>
                          </div>

                          <div className="mt-3 flex flex-wrap items-end gap-2">
                            <form action={updateCartItemAction} className="flex items-end gap-2 rounded-2xl border border-rosewood/10 bg-cream p-2">
                              <input type="hidden" name="lineKey" value={item.lineKey} />
                              <input type="hidden" name="returnTo" value={returnTo} />
                              <label className="grid gap-1 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-rosewood/60">
                                {copy('cart.quantity')}
                                <select name="quantity" defaultValue={item.quantity} className="rounded-xl border border-rosewood/15 bg-white px-2 py-1.5 text-xs text-stone-800 outline-none transition focus:border-rosewood focus-visible:ring-4 focus-visible:ring-olive/20">
                                  {quantityOptions(item.quantity).map((quantity) => <option key={quantity} value={quantity}>{quantity}</option>)}
                                </select>
                              </label>
                              <StorefrontSubmitButton label={updateLabel} pendingLabel={pendingLabel(updateLabel)} className="rounded-full bg-rosewood px-3 py-1.5 text-xs font-semibold text-white outline-none transition focus-visible:ring-4 focus-visible:ring-olive/30 disabled:cursor-wait disabled:bg-rosewood/60" />
                            </form>
                            <form action={removeCartItemAction}>
                              <input type="hidden" name="lineKey" value={item.lineKey} />
                              <input type="hidden" name="returnTo" value={returnTo} />
                              <StorefrontSubmitButton label={removeLabel} pendingLabel={pendingLabel(removeLabel)} className="rounded-full border border-rosewood/20 bg-white px-3 py-1.5 text-xs font-semibold text-rosewood outline-none transition focus-visible:ring-4 focus-visible:ring-olive/20 disabled:cursor-wait disabled:text-rosewood/50" />
                            </form>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="shrink-0 border-t border-rosewood/10 bg-white px-6 py-5 shadow-[0_-18px_40px_rgba(88,24,43,0.08)]">
              <div className="flex items-center justify-between gap-4 text-sm text-stone-700"><span>{copy('cart.items')}</span><strong className="text-rosewood">{cart.itemCount}</strong></div>
              <div className="mt-3 flex items-center justify-between gap-4 text-lg text-rosewood"><span>{copy('cart.subtotal')}</span><strong>{cart.subtotalLabel}</strong></div>
              <div className="mt-4 grid gap-2 rounded-2xl bg-cream p-3 text-xs font-medium leading-5 text-stone-600">
                {reassuranceItems.map((item) => (
                  <div key={item} className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-olive" aria-hidden="true" /><span>{item}</span></div>
                ))}
              </div>
              <p className="mt-3 text-xs leading-5 text-stone-500">{copy('cart.finalTotalsNote')}</p>
              <div className="mt-5 grid gap-3">
                <Link href="/cart/checkout" className={`rounded-full px-6 py-3 text-center text-sm font-semibold shadow-lg shadow-rosewood/20 outline-none transition focus-visible:ring-4 focus-visible:ring-olive/30 ${hasItems ? 'bg-rosewood text-white' : 'pointer-events-none bg-rosewood/40 text-white/80'}`} aria-disabled={!hasItems} onClick={closeDrawer}>{copy('cart.checkout')}</Link>
                <Link href="/cart" className="rounded-full border border-rosewood/20 bg-white px-6 py-3 text-center text-sm font-semibold text-rosewood outline-none transition focus-visible:ring-4 focus-visible:ring-olive/20" onClick={closeDrawer}>{copy('cart.title')}</Link>
                {hasItems ? (
                  <form action={clearCartAction}>
                    <input type="hidden" name="returnTo" value={returnTo} />
                    <StorefrontSubmitButton label={copy('cart.clear')} pendingLabel={pendingLabel(copy('cart.clear'))} className="w-full rounded-full border border-rosewood/20 px-6 py-3 text-sm font-semibold text-rosewood outline-none transition focus-visible:ring-4 focus-visible:ring-olive/20 disabled:cursor-wait disabled:text-rosewood/50" />
                  </form>
                ) : null}
              </div>
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}
