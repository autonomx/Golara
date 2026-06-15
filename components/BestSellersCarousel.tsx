import Link from 'next/link';
import { MessageCircle, ShoppingBag } from 'lucide-react';
import { ProgressiveStorefrontImage } from '@/components/ProgressiveStorefrontImage';
import type { Product } from '@/lib/catalog';
import { formatPrice, productRequiresQuote } from '@/lib/catalog-pricing';
import type { SupportedLocale } from '@/lib/i18n/locales';
import { formatStorefrontCopy, getStorefrontCopy } from '@/lib/localization/storefront-copy';
import { homepageBestSellerImage } from '@/lib/homepage-assets';
import { getStorefrontCloudinaryImage } from '@/lib/media/cloudinary-image';

interface BestSellersCarouselProps {
  products: Product[];
  locale: SupportedLocale;
}

const carouselCopy = {
  en: {
    eyebrow: 'Best seller',
    title: 'Featured picks',
    body: 'A curated run of customer favorites, styled with real Golara homepage photography.',
    contactToOrder: 'Contact to order',
    messageSales: 'Message sales',
    viewAndOrder: 'View and order'
  },
  fa: {
    eyebrow: 'پرفروش',
    title: 'انتخاب‌های ویژه',
    body: 'مجموعه‌ای از محبوب‌ترین انتخاب‌های مشتریان با تصویرسازی اختصاصی گلارا.',
    contactToOrder: 'تماس برای سفارش',
    messageSales: 'پیام به فروش',
    viewAndOrder: 'مشاهده و سفارش'
  }
};

function localeKey(locale?: SupportedLocale) {
  return locale?.toLowerCase().startsWith('fa') ? 'fa' : 'en';
}

function whatsappHref(product: Product, locale: SupportedLocale) {
  return `https://wa.me/?text=${encodeURIComponent(formatStorefrontCopy('product.interestedMessage', locale, { title: `${product.title} (${product.code})` }))}`;
}

export function BestSellersCarousel({ products, locale }: BestSellersCarouselProps) {
  const activeLocale = localeKey(locale);
  const labels = carouselCopy[activeLocale];
  const copy = (key: Parameters<typeof getStorefrontCopy>[0]) => getStorefrontCopy(key, locale);

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
          <Link
            href="/products"
            className="inline-flex w-fit rounded-full border border-rosewood/15 bg-white px-5 py-2.5 text-sm font-semibold text-rosewood shadow-sm transition hover:border-rosewood hover:bg-rosewood hover:text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-olive/25"
          >
            {copy('home.footerAllProducts')}
          </Link>
        </div>

        <div className="-mx-5 overflow-x-auto px-5 pb-3 [scrollbar-width:thin]" aria-label={labels.title}>
          <div className="grid auto-cols-[minmax(17rem,1fr)] grid-flow-col gap-6 md:auto-cols-[minmax(18rem,1fr)] lg:grid-flow-row lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product, index) => {
              const shouldPrefetchProduct = index === 0;

              return (
                <article key={product.slug} className="min-w-0 scroll-mx-5 snap-start">
                  <div className="group h-full overflow-hidden rounded-lg border border-rosewood/10 bg-white shadow-[0_12px_32px_rgba(111,36,56,0.07)]">
                    <Link href={`/products/${product.slug}`} prefetch={shouldPrefetchProduct} className="block outline-none focus-visible:ring-4 focus-visible:ring-olive/30">
                      <div className="relative aspect-[4/5] overflow-hidden bg-stone-100">
                        <ProgressiveStorefrontImage
                          src={getStorefrontCloudinaryImage(product.image || homepageBestSellerImage(product.slug), 'productCard')}
                          alt={product.title}
                          fill
                          priority={index === 0}
                          imageClassName="object-cover"
                          sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 768px) 50vw, 85vw"
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
                        <a href={whatsappHref(product, locale)} className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-rosewood px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-stone-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-olive/30">
                          <MessageCircle aria-hidden="true" className="h-4 w-4" />
                          {labels.messageSales}
                        </a>
                      ) : (
                        <Link href={`/products/${product.slug}`} prefetch={shouldPrefetchProduct} className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-rosewood px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-stone-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-olive/30">
                          <ShoppingBag aria-hidden="true" className="h-4 w-4" />
                          {labels.viewAndOrder}
                        </Link>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
