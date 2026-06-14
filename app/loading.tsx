import { StorefrontHeaderSkeleton } from '@/components/StorefrontRouteSkeleton';

function SkeletonBar({ className = '' }: { className?: string }) {
  return <div className={`rounded-full bg-rosewood/10 ${className}`} />;
}

export default function Loading() {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      data-page="home-loading"
      className="min-h-screen bg-[linear-gradient(180deg,#fff7f1_0%,#fffaf5_30%,#fff8f2_58%,#fbf3ec_100%)]"
      aria-busy="true"
    >
      <StorefrontHeaderSkeleton />

      <section className="relative overflow-hidden px-5 py-16 md:py-24" aria-hidden="true">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(245,170,180,0.28),transparent_42%),radial-gradient(circle_at_bottom_right,rgba(127,142,99,0.18),transparent_38%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="space-y-6">
            <SkeletonBar className="h-4 w-56" />
            <div className="grid gap-4">
              <div className="h-16 max-w-2xl rounded-[2rem] bg-rosewood/10" />
              <div className="h-16 max-w-xl rounded-[2rem] bg-rosewood/10" />
            </div>
            <div className="grid max-w-2xl gap-3">
              <SkeletonBar className="h-4 w-full" />
              <SkeletonBar className="h-4 w-5/6" />
              <SkeletonBar className="h-4 w-2/3" />
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="h-12 w-40 rounded-full bg-rosewood/10" />
              <div className="h-12 w-36 rounded-full bg-white/70" />
            </div>
          </div>
          <div className="min-h-[420px] rounded-[2.5rem] border border-white/70 bg-white/55 p-4 shadow-[0_24px_80px_rgba(111,36,56,0.12)] backdrop-blur">
            <div className="h-full min-h-[388px] rounded-[2rem] bg-blush" />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-16" aria-hidden="true">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-3">
            <SkeletonBar className="h-4 w-44" />
            <div className="h-12 w-72 rounded-[2rem] bg-rosewood/10" />
            <SkeletonBar className="h-4 w-96 max-w-full" />
          </div>
          <div className="h-11 w-36 rounded-full bg-white/70" />
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          {Array.from({ length: 4 }, (_, index) => (
            <article key={index} className="min-h-56 rounded-[2rem] border border-white/70 bg-white/65 p-5 shadow-sm">
              <div className="h-32 rounded-[1.5rem] bg-blush" />
              <div className="mt-5 grid gap-3">
                <SkeletonBar className="h-3 w-24" />
                <div className="h-8 w-2/3 rounded-full bg-rosewood/10" />
                <SkeletonBar className="h-4 w-full" />
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
