'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, MessageCircle, ShoppingBag } from 'lucide-react';
import type { Product } from '@/lib/catalog';
import { formatPrice, productRequiresQuote } from '@/lib/catalog-pricing';
import type { SupportedLocale } from '@/lib/i18n/locales';
import { formatStorefrontCopy, getStorefrontCopy } from '@/lib/localization/storefront-copy';
import { homepageBestSellerImage } from '@/lib/homepage-assets';

interface BestSellersCarouselProps {
  products: Product[];
  locale: SupportedLocale;
}

const carouselCopy = {
  en: {
    eyebrow: 'Best seller',
    title: 'Featured picks',
    body: 'A curated run of customer favorites, styled with real Golara homepage photography.',
    previous: 'Previous best seller',
    next: 'Next best seller',
    contactToOrder: 'Contact to order',
    messageSales: 'Message sales',
    viewAndOrder: 'View and order'
  },
  fa: {
    eyebrow: 'پرفروش',
    title: 'انتخاب‌های ویژه',
    body: 'مجموعه‌ای از محبوب‌ترین انتخاب‌های مشتریان با تصویرسازی اختصاصی گلارا.',
    previous: 'پرفروش قبلی',
    next: 'پرفروش بعدی',
    contactToOrder: 'تماس برای سفارش',
    messageSales: 'پیام به فروش',
    viewAndOrder: 'مشاهده و سفارش'
  }
};

function localeKey(locale?: SupportedLocale) {
  return locale?.toLowerCase().startsWith('fa') ? 'fa' : 'en';
}

function chunkProducts(products: Product[], visibleCount: number) {
  const chunks: Product[][] = [];
  for (let index = 0; index < products.length; index += visibleCount) {
    chunks.push(products.slice(index, index + visibleCount));
  }
  return chunks;
}

export function BestSellersCarousel({ products, locale }: BestSellersCarouselProps) {
  const [activePage, setActivePage] = useState(0);
  const [visibleCount, setVisibleCount] = useState(4);
  const activeLocale = localeKey(locale);
  const labels = carouselCopy[activeLocale];
  const copy = (key: Parameters<typeof getStorefrontCopy>[0]) => getStorefrontCopy(key, locale);
  const pages = useMemo(() => chunkProducts(products, visibleCount), [products, visibleCount]);
  const maxPage = Math.max(0, pages.length - 1);

  useEffect(() => {
    const updateVisibleCount = () => {
      if (window.innerWidth >= 1280) {
        setVisibleCount(4);
      } else if (window.innerWidth >= 1024) {
        setVisibleCount(3);
      } else if (window.innerWidth >= 768) {
        setVisibleCount(2);
      } else {
        setVisibleCount(1);
      }
    };

    updateVisibleCount();
    window.addEventListener('resize', updateVisibleCount);

    return () => window.removeEventListener('resize', updateVisibleCount);
  }, []);

  useEffect(() => {
    setActivePage((current) => Math.min(current, maxPage));
  }, [maxPage]);

  const sliderStyle = useMemo(
    () => ({ transform: `translateX(-${activePage * 100}%)` }),
    [activePage]
  );

  const goPrevious = () => setActivePage((current) => (current <= 0 ? maxPage : current - 1));
  const goNext = () => setActivePage((current) => (current >= maxPage ? 0 : current + 1));
  const whatsappHref = (product: Product) => `https://wa.me/?text=${encodeURIComponent(formatStorefrontCopy('product.interestedMessage', locale, { title: `${product.title} (${product.code})` }))}`;

  if (!products.length) {
    return null;
  }

  return (
    <section
      id="best-sellers"
      data-section="home-best-sellers"
      aria-labelledby="home-best-sellers-heading"
      className="relative overflow-hidden bg-white py-20"
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-rosewood/15 to-transparent" />
      <div dir={activeLocale === 'fa' ? 'rtl' : 'ltr'} className="mx-auto max-w-7xl px-5 text-start">
        <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-olive">{labels.eyebrow}</p>
            <h2 id="home-best-sellers-heading" className="mt-2 font-display text-4xl text-rosewood md:text-5xl">{labels.title}</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-600 md:text-base">{labels.body}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={goPrevious}
              aria-label={labels.previous}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-rosewood/15 bg-white text-rosewood shadow-sm transition hover:border-rosewood hover:bg-rosewood hover:text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-olive/25"
            >
              <ChevronLeft aria-hidden="true" className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={goNext}
              aria-label={labels.next}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-rosewood/15 bg-white text-rosewood shadow-sm transition hover:border-rosewood hover:bg-rosewood hover:text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-olive/25"
            >
              <ChevronRight aria-hidden="true" className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="overflow-hidden">
          <div className="flex transition-transform duration-300 ease-out will-change-transform" style={sliderStyle}>
            {pages.map((page, pageIndex) => (
              <div key={`featured-page-${pageIndex}`} className="grid min-w-full max-w-full shrink-0 grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {page.map((product, index) => (
                  <article key={product.slug} className="min-w-0">
                    <div className="group overflow-hidden rounded-lg border border-rosewood/10 bg-white shadow-[0_12px_32px_rgba(111,36,56,0.07)]">
                      <Link href={`/products/${product.slug}`} className="block outline-none focus-visible:ring-4 focus-visible:ring-olive/30">
                      <div className="relative aspect-[4/5] overflow-hidden bg-stone-100">
                        <Image
                          src={product.image || homepageBestSellerImage(product.slug)}
                          alt={product.title}
                          fill
                          priority={pageIndex === 0 && index === 0}
                          className="object-cover"
                          sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                        />
                        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/35 to-transparent" />
                        <div className="absolute left-4 top-4 flex flex-wrap gap-2 text-xs font-semibold">
                          {product.bestSeller ? <span className="rounded-full bg-rosewood px-3 py-1 text-white">{copy('product.bestSeller')}</span> : null}
                          {product.availableToday ? <span className="rounded-full bg-white/90 px-3 py-1 text-rosewood">{copy('product.availableToday')}</span> : null}
                        </div>
                        <div className="absolute bottom-4 right-4 rounded-full bg-white/90 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-rosewood">
                          {product.categoryTitle}
                        </div>
                      </div>
                      <div className="space-y-2 p-5">
                        <div className="text-xs uppercase tracking-[0.25em] text-rosewood/50">{product.code}</div>
                        <h3 className="line-clamp-1 font-display text-2xl text-rosewood">{product.title}</h3>
                        <p className="line-clamp-2 text-sm text-stone-600">{product.description}</p>
                        <div className="pt-3 text-lg font-semibold text-rosewood">{productRequiresQuote(product) ? labels.contactToOrder : formatPrice(product, locale)}</div>
                      </div>
                      </Link>
                      <div className="flex items-center gap-2 px-5 pb-5">
                        {productRequiresQuote(product) ? (
                          <a href={whatsappHref(product)} className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-rosewood px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-stone-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-olive/30">
                            <MessageCircle aria-hidden="true" className="h-4 w-4" />
                            {labels.messageSales}
                          </a>
                        ) : (
                          <Link href={`/products/${product.slug}`} className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-rosewood px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-stone-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-olive/30">
                            <ShoppingBag aria-hidden="true" className="h-4 w-4" />
                            {labels.viewAndOrder}
                          </Link>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
