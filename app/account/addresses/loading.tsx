import { StorefrontHeaderSkeleton } from '@/components/StorefrontRouteSkeleton';

export default function Loading() {
  return (
    <main>
      <StorefrontHeaderSkeleton />
      <section className="mx-auto max-w-5xl px-5 py-14" aria-hidden="true">
        <div className="h-4 w-44 rounded-full bg-rosewood/10" />
        <div className="mt-4 h-14 w-80 max-w-full rounded-[2rem] bg-rosewood/10" />
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {Array.from({ length: 2 }, (_, index) => (
            <article key={index} className="rounded-[2rem] border border-rosewood/10 bg-white p-6 shadow-sm">
              <div className="h-4 w-32 rounded-full bg-rosewood/10" />
              <div className="mt-5 grid gap-3">
                <div className="h-4 w-full rounded-full bg-blush" />
                <div className="h-4 w-5/6 rounded-full bg-blush" />
                <div className="h-4 w-2/3 rounded-full bg-blush" />
              </div>
              <div className="mt-6 h-10 w-28 rounded-full bg-rosewood/10" />
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
