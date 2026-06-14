import { StorefrontHeaderSkeleton } from '@/components/StorefrontRouteSkeleton';

function LoginCardSkeleton() {
  return (
    <div className="rounded-[2rem] border border-rosewood/10 bg-white p-6 shadow-sm" aria-hidden="true">
      <div className="h-4 w-28 rounded-full bg-rosewood/10" />
      <div className="mt-4 h-10 w-2/3 rounded-full bg-rosewood/10" />
      <div className="mt-4 grid gap-3">
        <div className="h-4 w-full rounded-full bg-rosewood/10" />
        <div className="h-4 w-5/6 rounded-full bg-rosewood/10" />
      </div>
      <div className="mt-8 grid gap-4">
        <div className="h-4 w-32 rounded-full bg-rosewood/10" />
        <div className="h-12 rounded-full bg-blush" />
        <div className="h-12 rounded-full bg-rosewood/10" />
      </div>
    </div>
  );
}

export default function AccountLoginLoading() {
  return (
    <main>
      <StorefrontHeaderSkeleton />
      <section className="mx-auto grid max-w-7xl gap-8 px-5 py-14 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-5" aria-hidden="true">
          <div className="h-4 w-36 rounded-full bg-rosewood/10" />
          <div className="h-16 w-full max-w-lg rounded-[2rem] bg-rosewood/10" />
          <div className="grid gap-3">
            <div className="h-4 w-full max-w-xl rounded-full bg-rosewood/10" />
            <div className="h-4 w-4/5 max-w-lg rounded-full bg-rosewood/10" />
          </div>
          <div className="h-12 w-44 rounded-full bg-white" />
        </div>
        <LoginCardSkeleton />
      </section>
    </main>
  );
}
