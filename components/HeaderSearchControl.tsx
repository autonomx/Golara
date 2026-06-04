'use client';

import { useRef, useState } from 'react';
import { Search, X } from 'lucide-react';

const iconButtonClass = 'relative rounded-full p-2 outline-none transition hover:bg-white/70 focus-visible:ring-4 focus-visible:ring-olive/20';

export function HeaderSearchControl() {
  const [expanded, setExpanded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function showSearch() {
    setExpanded(true);
    window.requestAnimationFrame(() => inputRef.current?.focus());
  }

  function hideSearch() {
    setExpanded(false);
  }

  return (
    <div className="relative">
      <button
        type="button"
        className={iconButtonClass}
        aria-label="Search products"
        aria-expanded={expanded}
        aria-controls="header-product-search"
        onClick={expanded ? hideSearch : showSearch}
      >
        <Search className="h-5 w-5" aria-hidden="true" />
      </button>
      {expanded ? (
        <form
          id="header-product-search"
          action="/products"
          role="search"
          className="absolute right-0 top-[calc(100%+0.75rem)] z-30 flex w-[min(88vw,24rem)] items-center gap-2 rounded-full border border-rosewood/10 bg-white p-2 shadow-[0_18px_44px_rgba(111,36,56,0.18)]"
        >
          <label className="sr-only" htmlFor="header-product-search-input">Search products</label>
          <input
            id="header-product-search-input"
            ref={inputRef}
            name="q"
            type="search"
            placeholder="Search flowers..."
            className="min-w-0 flex-1 rounded-full bg-[#fffaf7] px-4 py-2 text-sm text-stone-800 outline-none placeholder:text-stone-400 focus-visible:ring-4 focus-visible:ring-olive/20"
          />
          <button
            type="submit"
            className="rounded-full bg-rosewood px-4 py-2 text-sm font-semibold text-white transition hover:bg-stone-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-olive/30"
          >
            Search
          </button>
          <button
            type="button"
            className="rounded-full p-2 text-rosewood/70 transition hover:bg-rosewood/10 hover:text-rosewood focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-olive/20"
            aria-label="Hide product search"
            onClick={hideSearch}
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </form>
      ) : null}
    </div>
  );
}
