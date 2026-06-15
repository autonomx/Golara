import Image from 'next/image';
import Link from 'next/link';
import { MessageCircle, Sparkles, Truck } from 'lucide-react';
import type { HomepageBannerSlide } from '@/lib/homepage-assets';

interface HomepageBannerSlideshowProps {
  slides: HomepageBannerSlide[];
}

export function HomepageBannerSlideshow({ slides }: HomepageBannerSlideshowProps) {
  const heroSlide = slides[0];

  if (!heroSlide) {
    return null;
  }

  return (
    <section
      id="home-hero"
      data-section="home-hero"
      aria-labelledby="home-hero-heading"
      className="relative overflow-hidden bg-[#fff7f1] px-4 pb-10 pt-5 md:px-8 md:pb-14 md:pt-7"
    >
      <div className="relative mx-auto min-h-[460px] max-w-[1520px] overflow-hidden rounded-[1.75rem] border border-rosewood/10 bg-stone-900 shadow-[0_22px_56px_rgba(111,36,56,0.12)] md:min-h-[520px] xl:min-h-[560px]">
        <Image
          src={heroSlide.image}
          alt={heroSlide.alt}
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />

        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,248,241,0.98)_0%,rgba(255,248,241,0.94)_28%,rgba(255,248,241,0.68)_45%,rgba(255,248,241,0.16)_72%,rgba(43,29,32,0.18)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_34%,rgba(255,255,255,0.9)_0%,rgba(255,255,255,0.34)_36%,rgba(255,255,255,0)_68%)]" />

        <div dir="ltr" className="relative z-10 flex min-h-[460px] items-center justify-start px-6 py-10 md:min-h-[520px] md:px-12 md:py-12 lg:px-16 xl:min-h-[560px]">
          <div dir="auto" className="max-w-xl text-stone-800 lg:max-w-2xl">
            <p className="inline-flex rounded-full border border-rosewood/10 bg-white/82 px-5 py-2 text-xs font-semibold uppercase tracking-[0.32em] text-olive shadow-sm">
              {heroSlide.eyebrow}
            </p>

            <h1 id="home-hero-heading" className="mt-6 max-w-2xl font-display text-4xl leading-[0.98] text-rosewood drop-shadow-[0_1px_0_rgba(255,255,255,0.45)] md:text-6xl lg:text-7xl">
              {heroSlide.title}
            </h1>

            <p className="mt-5 max-w-xl text-base leading-7 text-stone-700 md:text-lg md:leading-8">
              {heroSlide.body}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/categories/available-today" className="inline-flex rounded-full bg-rosewood px-7 py-3.5 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(111,36,56,0.18)] transition hover:-translate-y-0.5 hover:bg-stone-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-olive/30">
                Shop available today
              </Link>
              <Link href="/products" className="inline-flex rounded-full border border-rosewood/20 bg-white/88 px-7 py-3.5 text-sm font-semibold text-rosewood shadow-sm transition hover:-translate-y-0.5 hover:border-rosewood focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-olive/30">
                All products
              </Link>
              <Link href="/#best-sellers" className="inline-flex rounded-full border border-rosewood/15 bg-white/78 px-7 py-3.5 text-sm font-semibold text-rosewood shadow-sm transition hover:-translate-y-0.5 hover:border-rosewood focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-olive/30">
                Best sellers
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap gap-3 text-sm font-semibold text-stone-700">
              <div className="inline-flex items-center gap-2 rounded-full border border-rosewood/10 bg-white/82 px-4 py-2 shadow-sm">
                <Truck aria-hidden="true" className="h-4 w-4 text-rosewood" />
                Same-day options
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-rosewood/10 bg-white/82 px-4 py-2 shadow-sm">
                <Sparkles aria-hidden="true" className="h-4 w-4 text-rosewood" />
                Premium finish
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-rosewood/10 bg-white/82 px-4 py-2 shadow-sm">
                <MessageCircle aria-hidden="true" className="h-4 w-4 text-rosewood" />
                Sales guidance
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-6 right-6 hidden rounded-full border border-white/35 bg-white/72 px-5 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-rosewood shadow-sm md:block">
          Golara studio selection
        </div>
      </div>
    </section>
  );
}
