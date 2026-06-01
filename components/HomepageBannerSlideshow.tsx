'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, MessageCircle, Sparkles, Truck } from 'lucide-react';
import type { HomepageBannerSlide } from '@/lib/homepage-assets';

interface HomepageBannerSlideshowProps {
  slides: HomepageBannerSlide[];
}

export function HomepageBannerSlideshow({ slides }: HomepageBannerSlideshowProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const slideCount = slides.length;

  useEffect(() => {
    if (slideCount <= 1) {
      return;
    }

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % slideCount);
    }, 8000);

    return () => window.clearInterval(timer);
  }, [slideCount]);

  const activeSlide = useMemo(() => slides[activeIndex], [slides, activeIndex]);

  const goTo = (index: number) => {
    setActiveIndex((index + slideCount) % slideCount);
  };

  if (!slideCount) {
    return null;
  }

  return (
    <section
      id="home-hero"
      data-section="home-hero"
      aria-labelledby="home-hero-heading"
      className="relative overflow-hidden bg-[#fffdfb] px-4 pb-12 pt-5 md:px-8 md:pb-16"
    >
      <div className="mx-auto grid max-w-[1480px] gap-6 lg:grid-cols-[0.92fr_1.08fr] lg:items-stretch">
        <div className="relative z-10 flex min-h-[420px] items-center rounded-lg border border-rosewood/10 bg-white/80 px-6 py-10 shadow-[0_24px_70px_rgba(111,36,56,0.10)] backdrop-blur md:min-h-[470px] md:px-10 lg:min-h-[520px]">
          <div className="max-w-xl text-stone-800">
            <p className="inline-flex rounded-full border border-rosewood/10 bg-[#fff8f1] px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-olive shadow-sm">{activeSlide.eyebrow}</p>
            <h1 id="home-hero-heading" className="mt-6 max-w-2xl font-display text-4xl leading-[1.02] text-rosewood md:text-6xl">{activeSlide.title}</h1>
            <p className="mt-5 max-w-lg text-base leading-8 text-stone-700">{activeSlide.body}</p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/categories/available-today" className="inline-flex rounded-full bg-rosewood px-6 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(111,36,56,0.18)] transition hover:-translate-y-0.5 hover:bg-stone-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-olive/30">
                Shop available today
              </Link>
              <Link href="/products" className="inline-flex rounded-full border border-rosewood/20 bg-white px-6 py-3 text-sm font-semibold text-rosewood shadow-sm transition hover:-translate-y-0.5 hover:border-rosewood focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-olive/30">
                All products
              </Link>
              <Link href="/#best-sellers" className="inline-flex rounded-full border border-rosewood/20 bg-white px-6 py-3 text-sm font-semibold text-rosewood shadow-sm transition hover:-translate-y-0.5 hover:border-rosewood focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-olive/30">
                Best sellers
              </Link>
            </div>
            <div className="mt-8 grid max-w-xl gap-3 text-sm font-medium text-stone-700 sm:grid-cols-3">
              <div className="flex items-center gap-2 rounded-lg border border-rosewood/10 bg-white px-4 py-3 shadow-sm">
                <Truck aria-hidden="true" className="h-4 w-4 text-rosewood" />
                Same-day options
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-rosewood/10 bg-white px-4 py-3 shadow-sm">
                <Sparkles aria-hidden="true" className="h-4 w-4 text-rosewood" />
                Premium finish
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-rosewood/10 bg-white px-4 py-3 shadow-sm">
                <MessageCircle aria-hidden="true" className="h-4 w-4 text-rosewood" />
                Sales guidance
              </div>
            </div>
          </div>
        </div>

        <div className="relative min-h-[360px] w-full overflow-hidden rounded-lg border border-rosewood/10 bg-stone-100 shadow-[0_28px_80px_rgba(111,36,56,0.14)] md:min-h-[470px] lg:min-h-[520px]">
          {slides.map((slide, slideIndex) => (
            <Image
              key={slide.image}
              src={slide.image}
              alt={slide.alt}
              fill
              priority={slideIndex === 0}
              className={`object-cover transition-opacity duration-700 ${slideIndex === activeIndex ? 'opacity-100' : 'opacity-0'}`}
              sizes="100vw"
            />
          ))}
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(43,29,32,0.08)_0%,rgba(43,29,32,0)_40%,rgba(43,29,32,0.42)_100%)]" />
          <div className="absolute bottom-5 left-5 rounded-full border border-white/30 bg-white/85 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-rosewood shadow-sm backdrop-blur">
            Golara studio selection
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => goTo(activeIndex - 1)}
        aria-label="Previous banner"
        className="absolute right-24 top-[calc(100%-5.2rem)] hidden h-11 w-11 items-center justify-center rounded-full border border-rosewood/15 bg-white text-rosewood shadow-sm transition hover:bg-rosewood hover:text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-olive/30 md:inline-flex lg:right-[7.5rem]"
      >
        <ChevronLeft aria-hidden="true" className="h-5 w-5" />
      </button>
      <button
        type="button"
        onClick={() => goTo(activeIndex + 1)}
        aria-label="Next banner"
        className="absolute right-10 top-[calc(100%-5.2rem)] hidden h-11 w-11 items-center justify-center rounded-full border border-rosewood/15 bg-white text-rosewood shadow-sm transition hover:bg-rosewood hover:text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-olive/30 md:inline-flex lg:right-14"
      >
        <ChevronRight aria-hidden="true" className="h-5 w-5" />
      </button>

      <div className="absolute inset-x-0 bottom-6 flex justify-center gap-2">
        {slides.map((slide, slideIndex) => (
          <button
            key={slideIndex}
            type="button"
            onClick={() => goTo(slideIndex)}
            aria-label={`Show ${slide.eyebrow}`}
            className={`h-1.5 rounded-full transition-all ${slideIndex === activeIndex ? 'w-10 bg-rosewood' : 'w-3 bg-rosewood/25 hover:bg-rosewood/50'}`}
          />
        ))}
      </div>
    </section>
  );
}
