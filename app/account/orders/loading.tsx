import { StorefrontHeaderSkeleton } from '@/components/StorefrontRouteSkeleton';

function OrderRowSkeleton({ index }: { index: number }) {
  return (
    <article key={index} className="rounded-[2rem] border border-rosewood/10 bg-white p-5 shadow-sm" aria-hidden="true">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="grid flex-1 gap-3">
          <div className="h-4 w-28 rounded-full bg-rosewood/10" />
          <div className="h-9 w-64 max-w-full rounded-full bg-rosewood/10" />
          <div className="h-4 w-44 rounded-full bg-rosewood/10" />
        </div>
        <div className="h-10 w-28 rounded-full bg-blush" />
      </div>
    </article>
  );
}

export default function AccountOrdersLoading() {
  return (
    <main>
      <StorefrontHeaderSkeleton />
      <section className="mx-auto max-w-5xl px-5 py-14">
        <div aria-hidden="true">
          <div className="h-4 w-32 rounded-full bg-rosewood/10" />
          <div className="mt-4 h-16 w-80 max-w-full rounded-[2rem] bg-rosewood/10" />
          <div className="mt-5 grid max-w-2xl gap-3">
            <div className="h-4 w-full rounded-full bg-rosewood/10" />
            <div className="h-4 w-3/4 rounded-full bg-rosewood/10" />
          </div>
        </div>
        <div className="mt-8 grid gap-4">
          {Array.from({ length: 3 }, (_, index) => (
            <OrderRowSkeleton key={index} index={index} />
          ))}
        </div>
      </section>
    </main>
  );
}
