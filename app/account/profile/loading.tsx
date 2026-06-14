import { StorefrontHeaderSkeleton } from '@/components/StorefrontRouteSkeleton';

export default function Loading() {
  return (
    <main>
      <StorefrontHeaderSkeleton />
      <section className="mx-auto max-w-5xl px-5 py-14" aria-hidden="true">
        <div className="h-4 w-40 rounded-full bg-rosewood/10" />
        <div className="mt-4 h-14 w-72 max-w-full rounded-[2rem] bg-rosewood/10" />
        <div className="mt-8 rounded-[2rem] border border-rosewood/10 bg-white p-6 shadow-sm">
          <div className="grid gap-5 md:grid-cols-2">
            {Array.from({ length: 4 }, (_, index) => (
              <div key={index} className="grid gap-2">
                <div className="h-3 w-24 rounded-full bg-rosewood/10" />
                <div className="h-11 rounded-full bg-blush" />
              </div>
            ))}
          </div>
          <div className="mt-6 h-12 w-36 rounded-full bg-rosewood/10" />
        </div>
      </section>
    </main>
  );
}
