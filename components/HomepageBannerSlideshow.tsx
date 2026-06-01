'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
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
    <section aria-label="Homepage banner slideshow" className="relative overflow-hidden bg-[#fff8f1]">
      <div className="relative h-[520px] w-full md:h-[680px]">
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
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,248,241,0.96)_0%,rgba(255,248,241,0.82)_34%,rgba(255,248,241,0.2)_68%,rgba(255,248,241,0.08)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#fff8f1] to-transparent" />
        <div className="absolute inset-y-0 left-0 flex w-full items-center px-6 pb-12 pt-20 md:px-20">
          <div className="max-w-2xl text-stone-800">
            <p className="text-sm font-semibold uppercase tracking-[0.32em] text-olive">{activeSlide.eyebrow}</p>
            <h1 className="mt-5 font-display text-5xl leading-[0.95] text-rosewood md:text-7xl">{activeSlide.title}</h1>
            <p className="mt-6 max-w-xl text-base leading-8 text-stone-700 md:text-lg">{activeSlide.body}</p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link href="/products" className="inline-flex rounded-full bg-rosewood px-6 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(111,36,56,0.18)] transition hover:-translate-y-0.5 hover:bg-stone-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-olive/30">
                Shop products
              </Link>
              <Link href="/#best-sellers" className="inline-flex rounded-full border border-rosewood/20 bg-white/85 px-6 py-3 text-sm font-semibold text-rosewood shadow-sm transition hover:-translate-y-0.5 hover:border-rosewood focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-olive/30">
                Best sellers
              </Link>
            </div>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => goTo(activeIndex - 1)}
        aria-label="Previous banner"
        className="absolute left-5 top-1/2 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-rosewood/15 bg-white/85 text-rosewood shadow-sm transition hover:bg-rosewood hover:text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-olive/30 md:inline-flex"
      >
        <ChevronLeft aria-hidden="true" className="h-5 w-5" />
      </button>
      <button
        type="button"
        onClick={() => goTo(activeIndex + 1)}
        aria-label="Next banner"
        className="absolute right-5 top-1/2 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-rosewood/15 bg-white/85 text-rosewood shadow-sm transition hover:bg-rosewood hover:text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-olive/30 md:inline-flex"
      >
        <ChevronRight aria-hidden="true" className="h-5 w-5" />
      </button>

      <div className="absolute inset-x-0 bottom-7 flex justify-center gap-2">
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
