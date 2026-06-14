import { Search } from 'lucide-react';

const iconButtonClass = 'relative list-none rounded-full p-2 outline-none transition hover:bg-white/70 focus-visible:ring-4 focus-visible:ring-olive/20 [&::-webkit-details-marker]:hidden';

export function HeaderSearchControl({ label = 'Search products', placeholder = 'Search flowers...', submitLabel = 'Search' }: { label?: string; placeholder?: string; submitLabel?: string } = {}) {
  return (
    <details className="group relative">
      <summary
        className={iconButtonClass}
        aria-label={label}
        aria-controls="header-product-search"
      >
        <Search className="h-5 w-5" aria-hidden="true" />
      </summary>
      <form
        id="header-product-search"
        action="/products"
        role="search"
        className="absolute right-0 top-[calc(100%+0.75rem)] z-30 flex w-[min(88vw,24rem)] items-center gap-2 rounded-full border border-rosewood/10 bg-white p-2 shadow-[0_18px_44px_rgba(111,36,56,0.18)]"
      >
        <label className="sr-only" htmlFor="header-product-search-input">{label}</label>
        <input
          id="header-product-search-input"
          name="q"
          type="search"
          placeholder={placeholder}
          className="min-w-0 flex-1 rounded-full bg-[#fffaf7] px-4 py-2 text-sm text-stone-800 outline-none placeholder:text-stone-400 focus-visible:ring-4 focus-visible:ring-olive/20"
        />
        <button
          type="submit"
          className="rounded-full bg-rosewood px-4 py-2 text-sm font-semibold text-white transition hover:bg-stone-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-olive/30"
        >
          {submitLabel}
        </button>
      </form>
    </details>
  );
}
