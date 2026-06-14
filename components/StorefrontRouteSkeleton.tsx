type ProductGridSkeletonProps = {
  count?: number;
};

function SkeletonBar({ className = '' }: { className?: string }) {
  return <div className={`rounded-full bg-rosewood/10 ${className}`} />;
}

export function StorefrontHeaderSkeleton() {
  return (
    <header className="sticky top-0 z-20 border-b border-rosewood/10 bg-cream/90 backdrop-blur-xl" aria-hidden="true">
      <div className="border-b border-rosewood/10 bg-rosewood px-4 py-2">
        <div className="mx-auto h-3 w-72 max-w-full rounded-full bg-white/25" />
      </div>
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4">
        <div className="hidden items-center gap-2 md:flex">
          <SkeletonBar className="h-8 w-20" />
          <SkeletonBar className="h-8 w-24" />
          <SkeletonBar className="h-8 w-20" />
        </div>
        <div className="h-9 w-28 rounded-full bg-rosewood/10" />
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-full bg-rosewood/10" />
          <div className="h-9 w-9 rounded-full bg-rosewood/10" />
          <div className="h-9 w-9 rounded-full bg-rosewood/10" />
        </div>
      </div>
    </header>
  );
}

export function StorefrontPageHeroSkeleton({ withSearch = false }: { withSearch?: boolean }) {
  return (
    <section className="mx-auto max-w-7xl px-5 py-14" aria-hidden="true">
      <SkeletonBar className="h-4 w-44" />
      <div className="mt-4 h-16 w-full max-w-xl rounded-[2rem] bg-rosewood/10" />
      <div className="mt-5 grid max-w-2xl gap-3">
        <SkeletonBar className="h-4 w-full" />
        <SkeletonBar className="h-4 w-4/5" />
      </div>
      {withSearch ? (
        <div className="mt-8 grid gap-3 rounded-2xl border border-rosewood/10 bg-white p-3 shadow-[0_16px_40px_rgba(111,36,56,0.06)] md:grid-cols-[1fr_auto]">
          <div className="h-12 rounded-full bg-blush" />
          <div className="h-12 rounded-full bg-rosewood/10 md:w-32" />
        </div>
      ) : null}
    </section>
  );
}

export function ProductGridSkeleton({ count = 6 }: ProductGridSkeletonProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <article key={index} className="overflow-hidden rounded-3xl border border-rosewood/10 bg-white shadow-sm">
          <div className="aspect-[4/5] bg-blush" />
          <div className="grid gap-3 p-5">
            <SkeletonBar className="h-3 w-20" />
            <div className="h-8 w-3/4 rounded-full bg-rosewood/10" />
            <SkeletonBar className="h-4 w-full" />
            <SkeletonBar className="h-4 w-2/3" />
            <SkeletonBar className="mt-2 h-5 w-28" />
          </div>
          <div className="px-5 pb-5">
            <div className="h-9 rounded-full bg-rosewood/10" />
          </div>
        </article>
      ))}
    </div>
  );
}

export function StorefrontCatalogLoadingSkeleton({ withSearch = false, productCount = 6 }: { withSearch?: boolean; productCount?: number }) {
  return (
    <main>
      <StorefrontHeaderSkeleton />
      <StorefrontPageHeroSkeleton withSearch={withSearch} />
      <section className="mx-auto max-w-7xl px-5 pb-14">
        <ProductGridSkeleton count={productCount} />
      </section>
    </main>
  );
}

export function ProductDetailLoadingSkeleton() {
  return (
    <main>
      <StorefrontHeaderSkeleton />
      <section className="mx-auto grid max-w-7xl gap-10 px-5 py-14 lg:grid-cols-[1.05fr_0.95fr]" aria-hidden="true">
        <div className="aspect-[4/5] rounded-[2rem] bg-blush" />
        <div className="space-y-5">
          <SkeletonBar className="h-4 w-40" />
          <div className="h-16 w-full max-w-lg rounded-[2rem] bg-rosewood/10" />
          <div className="grid gap-3">
            <SkeletonBar className="h-4 w-full" />
            <SkeletonBar className="h-4 w-5/6" />
            <SkeletonBar className="h-4 w-2/3" />
          </div>
          <div className="h-10 w-32 rounded-full bg-rosewood/10" />
          <div className="grid gap-3 rounded-[2rem] border border-rosewood/10 bg-white p-5">
            <SkeletonBar className="h-4 w-28" />
            <div className="h-12 rounded-full bg-blush" />
            <div className="h-12 rounded-full bg-rosewood/10" />
          </div>
        </div>
      </section>
    </main>
  );
}

export function CartLoadingSkeleton() {
  return (
    <main>
      <StorefrontHeaderSkeleton />
      <section className="mx-auto max-w-7xl px-5 py-14" aria-hidden="true">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="w-full max-w-3xl">
            <SkeletonBar className="h-4 w-36" />
            <div className="mt-4 h-16 w-64 rounded-[2rem] bg-rosewood/10" />
            <div className="mt-5 grid gap-3">
              <SkeletonBar className="h-4 w-full" />
              <SkeletonBar className="h-4 w-4/5" />
            </div>
          </div>
          <div className="h-12 w-40 rounded-full bg-white" />
        </div>
        <div className="mt-8 grid gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="grid gap-4">
            {Array.from({ length: 2 }, (_, index) => (
              <article key={index} className="grid gap-4 rounded-[2rem] border border-rosewood/10 bg-white p-5 shadow-sm md:grid-cols-[140px_1fr]">
                <div className="aspect-square rounded-3xl bg-blush" />
                <div className="grid gap-4">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="grid flex-1 gap-3">
                      <div className="h-9 w-56 rounded-full bg-rosewood/10" />
                      <SkeletonBar className="h-3 w-24" />
                      <SkeletonBar className="h-4 w-36" />
                    </div>
                    <div className="h-9 w-24 rounded-full bg-rosewood/10" />
                  </div>
                  <div className="flex gap-3">
                    <div className="h-12 w-44 rounded-full bg-blush" />
                    <div className="h-12 w-24 rounded-full bg-white" />
                  </div>
                </div>
              </article>
            ))}
          </div>
          <aside className="rounded-[2rem] border border-rosewood/10 bg-white p-6 shadow-sm">
            <SkeletonBar className="h-4 w-28" />
            <div className="mt-3 h-10 w-32 rounded-full bg-rosewood/10" />
            <div className="mt-6 grid gap-4">
              <SkeletonBar className="h-4 w-full" />
              <SkeletonBar className="h-4 w-full" />
              <div className="h-12 rounded-full bg-rosewood/10" />
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
