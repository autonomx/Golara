'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useId, useState } from 'react';
import { ShoppingBag, X } from 'lucide-react';
import { clearCartAction, removeCartItemAction, updateCartItemAction } from '@/app/cart/actions';
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
  if (!path.startsWith('/')) return '/';
  return path;
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
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const pathname = usePathname();
  const returnTo = cartReturnTo(pathname);
  const direction = getCustomerCopyDirection(locale);
  const copy = (key: Parameters<typeof getCustomerCopy>[0]) => getCustomerCopy(key, locale);
  const hasItems = cart.items.length > 0;

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  return (
    <>
      <button type="button" className={triggerClassName} aria-label={cartLabel} aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen(true)}>
        <ShoppingBag className="h-5 w-5" aria-hidden="true" />
        {cart.itemCount > 0 ? (
          <span className="absolute -right-1 -top-1 grid min-h-5 min-w-5 place-items-center rounded-full bg-rosewood px-1 text-[0.65rem] font-bold leading-none text-white">
            {cart.itemCount > 99 ? '99+' : cart.itemCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-labelledby={titleId} dir={direction}>
          <button type="button" className="absolute inset-0 cursor-default bg-rosewood/30 backdrop-blur-[2px]" aria-label={copy('cart.title')} onClick={() => setOpen(false)} />
          <aside className={`absolute top-0 flex h-full w-full max-w-md flex-col bg-cream shadow-2xl ${direction === 'rtl' ? 'left-0 border-r border-rosewood/10' : 'right-0 border-l border-rosewood/10'}`}>
            <div className="flex items-start justify-between gap-4 border-b border-rosewood/10 px-6 py-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-olive">{copy('cart.eyebrow')}</p>
                <h2 id={titleId} className="mt-1 font-display text-4xl text-rosewood">{copy('cart.title')}</h2>
              </div>
              <button type="button" className="rounded-full p-2 text-rosewood outline-none transition hover:bg-white focus-visible:ring-4 focus-visible:ring-olive/20" aria-label={copy('cart.title')} onClick={() => setOpen(false)}>
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
              {!hasItems ? (
                <div className="rounded-[2rem] border border-rosewood/10 bg-white p-6 shadow-sm">
                  <h3 className="font-display text-3xl text-rosewood">{copy('cart.emptyTitle')}</h3>
                  <p className="mt-3 text-sm leading-6 text-stone-700">{copy('cart.emptyBody')}</p>
                  <Link href="/products" className="mt-6 inline-flex rounded-full bg-rosewood px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-rosewood/20 outline-none transition focus-visible:ring-4 focus-visible:ring-olive/30" onClick={() => setOpen(false)}>
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
                        <Link href={`/products/${item.productSlug}`} className="relative aspect-square overflow-hidden rounded-2xl bg-blush outline-none focus-visible:ring-4 focus-visible:ring-olive/20" onClick={() => setOpen(false)}>
                          <Image src={item.imageUrl} alt={item.productTitle} fill className="object-cover" sizes="88px" />
                        </Link>
                        <div className="min-w-0">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <Link href={`/products/${item.productSlug}`} className="font-display text-2xl leading-7 text-rosewood underline-offset-4 outline-none hover:underline focus-visible:ring-4 focus-visible:ring-olive/20" onClick={() => setOpen(false)}>
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
                              <StorefrontSubmitButton
                                label={updateLabel}
                                pendingLabel={pendingLabel(updateLabel)}
                                className="rounded-full bg-rosewood px-3 py-1.5 text-xs font-semibold text-white outline-none transition focus-visible:ring-4 focus-visible:ring-olive/30 disabled:cursor-wait disabled:bg-rosewood/60"
                              />
                            </form>
                            <form action={removeCartItemAction}>
                              <input type="hidden" name="lineKey" value={item.lineKey} />
                              <input type="hidden" name="returnTo" value={returnTo} />
                              <StorefrontSubmitButton
                                label={removeLabel}
                                pendingLabel={pendingLabel(removeLabel)}
                                className="rounded-full border border-rosewood/20 bg-white px-3 py-1.5 text-xs font-semibold text-rosewood outline-none transition focus-visible:ring-4 focus-visible:ring-olive/20 disabled:cursor-wait disabled:text-rosewood/50"
                              />
                            </form>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="border-t border-rosewood/10 bg-white/70 px-6 py-5">
              <div className="flex items-center justify-between gap-4 text-sm text-stone-700">
                <span>{copy('cart.items')}</span>
                <strong className="text-rosewood">{cart.itemCount}</strong>
              </div>
              <div className="mt-3 flex items-center justify-between gap-4 text-lg text-rosewood">
                <span>{copy('cart.subtotal')}</span>
                <strong>{cart.subtotalLabel}</strong>
              </div>
              <p className="mt-3 text-xs leading-5 text-stone-500">{copy('cart.finalTotalsNote')}</p>
              <div className="mt-5 grid gap-3">
                <Link href="/cart/checkout" className={`rounded-full px-6 py-3 text-center text-sm font-semibold shadow-lg shadow-rosewood/20 outline-none transition focus-visible:ring-4 focus-visible:ring-olive/30 ${hasItems ? 'bg-rosewood text-white' : 'pointer-events-none bg-rosewood/40 text-white/80'}`} aria-disabled={!hasItems} onClick={() => setOpen(false)}>
                  {copy('cart.checkout')}
                </Link>
                <Link href="/cart" className="rounded-full border border-rosewood/20 bg-white px-6 py-3 text-center text-sm font-semibold text-rosewood outline-none transition focus-visible:ring-4 focus-visible:ring-olive/20" onClick={() => setOpen(false)}>
                  {copy('cart.title')}
                </Link>
                {hasItems ? (
                  <form action={clearCartAction}>
                    <input type="hidden" name="returnTo" value={returnTo} />
                    <StorefrontSubmitButton
                      label={copy('cart.clear')}
                      pendingLabel={pendingLabel(copy('cart.clear'))}
                      className="w-full rounded-full border border-rosewood/20 px-6 py-3 text-sm font-semibold text-rosewood outline-none transition focus-visible:ring-4 focus-visible:ring-olive/20 disabled:cursor-wait disabled:text-rosewood/50"
                    />
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
