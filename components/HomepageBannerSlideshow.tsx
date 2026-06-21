import Link from 'next/link';
import { MessageCircle, Sparkles, Truck } from 'lucide-react';
import { ProgressiveStorefrontImage } from '@/components/ProgressiveStorefrontImage';
import type { HomepageContent } from '@/lib/catalog';
import type { SupportedLocale } from '@/lib/i18n/locales';
import type { HomepageBannerSlide } from '@/lib/homepage-assets';
import { getStorefrontCopy, getStorefrontCopyDirection } from '@/lib/localization/storefront-copy';
import { getStorefrontCloudinaryImage } from '@/lib/media/cloudinary-image';

interface HomepageBannerSlideshowProps {
  slides: HomepageBannerSlide[];
  homepage?: HomepageContent;
  locale?: SupportedLocale;
}

function firstNonEmpty(...values: Array<string | undefined>) {
  return values.find((value) => value?.trim()) ?? '';
}

function heroCtaClass(variant: string) {
  if (variant === 'primary') {
    return 'inline-flex rounded-full bg-rosewood px-8 py-4 text-sm font-semibold text-white shadow-[0_16px_34px_rgba(111,36,56,0.22)] transition hover:-translate-y-0.5 hover:bg-stone-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-olive/30';
  }
  if (variant === 'secondary') {
    return 'inline-flex rounded-full border border-rosewood/20 bg-white/72 px-6 py-3 text-sm font-semibold text-rosewood transition hover:border-rosewood hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-olive/30';
  }
  return 'inline-flex px-2 py-2 text-sm font-semibold text-rosewood underline-offset-4 transition hover:text-stone-900 hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-olive/30';
}

export function HomepageBannerSlideshow({ slides, homepage, locale }: HomepageBannerSlideshowProps) {
  const fallbackSlide = slides[0];
  const copy = (key: Parameters<typeof getStorefrontCopy>[0]) => getStorefrontCopy(key, locale);
  const direction = getStorefrontCopyDirection(locale);
  const textAlignmentClass = direction === 'rtl' ? 'text-right' : 'text-left';

  if (!fallbackSlide && !homepage) {
    return null;
  }

  const heroSlide = {
    image: firstNonEmpty(homepage?.heroImage, fallbackSlide?.image),
    alt: firstNonEmpty(homepage?.heroImageAlt, fallbackSlide?.alt, homepage?.title),
    eyebrow: firstNonEmpty(homepage?.eyebrow, fallbackSlide?.eyebrow),
    title: firstNonEmpty(homepage?.title, fallbackSlide?.title),
    body: firstNonEmpty(homepage?.body, fallbackSlide?.body)
  };
  const ctas = [
    { label: firstNonEmpty(homepage?.primaryCtaLabel, copy('home.heroPrimaryCtaFallback')), href: firstNonEmpty(homepage?.primaryCtaHref, '/categories/available-today'), variant: 'primary' },
    { label: firstNonEmpty(homepage?.secondaryCtaLabel, copy('home.heroSecondaryCtaFallback')), href: firstNonEmpty(homepage?.secondaryCtaHref, '/products'), variant: 'secondary' },
    { label: firstNonEmpty(homepage?.tertiaryCtaLabel, copy('home.heroTertiaryCtaFallback')), href: firstNonEmpty(homepage?.tertiaryCtaHref, '/#best-sellers'), variant: 'soft' }
  ].filter((cta) => cta.label && cta.href);
  const trustItems = [
    { label: firstNonEmpty(homepage?.trustItemOne, copy('home.heroTrustOneFallback')), icon: Truck },
    { label: firstNonEmpty(homepage?.trustItemTwo, copy('home.heroTrustTwoFallback')), icon: Sparkles },
    { label: firstNonEmpty(homepage?.trustItemThree, copy('home.heroTrustThreeFallback')), icon: MessageCircle }
  ].filter((item) => item.label);
  const heroImage = getStorefrontCloudinaryImage(heroSlide.image, 'homepageHero');

  return (
    <section
      id="home-hero"
      data-section="home-hero"
      aria-labelledby="home-hero-heading"
      className="relative overflow-hidden bg-[#fff7f1] px-4 pb-10 pt-5 md:px-8 md:pb-14 md:pt-7"
    >
      <div dir={direction} className="relative mx-auto min-h-[460px] max-w-[1520px] overflow-hidden rounded-[1.75rem] border border-rosewood/10 bg-[#fff7f1] shadow-[0_22px_56px_rgba(111,36,56,0.12)] md:min-h-[520px] xl:min-h-[560px]">
        <ProgressiveStorefrontImage
          src={heroImage}
          alt={heroSlide.alt}
          fill
          priority
          imageClassName="object-cover"
          placeholderClassName="bg-[linear-gradient(135deg,#fff7f1_0%,#f4ded2_42%,#fffaf5_100%)]"
          sizes="(min-width: 1520px) 1520px, 100vw"
        />

        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,248,241,0.97)_0%,rgba(255,248,241,0.9)_32%,rgba(255,248,241,0.44)_56%,rgba(43,29,32,0.12)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_14%_28%,rgba(255,255,255,0.82)_0%,rgba(255,255,255,0.16)_34%,rgba(255,255,255,0)_62%)]" />

        <div className="relative z-10 flex min-h-[460px] items-center justify-start px-6 py-10 md:min-h-[520px] md:px-12 md:py-12 lg:px-16 xl:min-h-[560px]">
          <div className={`max-w-xl ${textAlignmentClass} text-stone-800 lg:max-w-2xl`}>
            {heroSlide.eyebrow ? <p className="inline-flex rounded-full border border-rosewood/10 bg-white/72 px-5 py-2 text-xs font-semibold uppercase tracking-[0.32em] text-olive shadow-sm">
              {heroSlide.eyebrow}
            </p> : null}

            <h1 id="home-hero-heading" className="mt-6 max-w-2xl font-display text-4xl leading-[0.98] text-rosewood md:text-6xl lg:text-7xl">
              {heroSlide.title}
            </h1>

            {heroSlide.body ? <p className="mt-5 max-w-xl text-base leading-7 text-stone-700 md:text-lg md:leading-8">
              {heroSlide.body}
            </p> : null}

            {ctas.length ? <div className="mt-8 flex flex-wrap items-center justify-start gap-3">
              {ctas.map((cta) => (
                <Link key={`${cta.label}-${cta.href}`} href={cta.href} className={heroCtaClass(cta.variant)}>
                  {cta.label}
                </Link>
              ))}
            </div> : null}

            {trustItems.length ? <div className="mt-7 flex flex-wrap justify-start gap-x-5 gap-y-2 text-sm font-semibold text-stone-700">
              {trustItems.map((item) => {
                const Icon = item.icon;
                return <div key={item.label} className="inline-flex items-center gap-2"><Icon aria-hidden="true" className="h-4 w-4 text-rosewood" />{item.label}</div>;
              })}
            </div> : null}
          </div>
        </div>
      </div>
    </section>
  );
}
