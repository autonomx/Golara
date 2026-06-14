import { StorefrontHeaderSkeleton } from '@/components/StorefrontRouteSkeleton';

function AccountPanelSkeleton() {
  return (
    <article className="rounded-[2rem] border border-rosewood/10 bg-white p-6 shadow-sm" aria-hidden="true">
      <div className="h-4 w-28 rounded-full bg-rosewood/10" />
      <div className="mt-4 h-10 w-56 rounded-full bg-rosewood/10" />
      <div className="mt-5 grid gap-3">
        <div className="h-4 w-full rounded-full bg-rosewood/10" />
        <div className="h-4 w-4/5 rounded-full bg-rosewood/10" />
        <div className="h-4 w-2/3 rounded-full bg-rosewood/10" />
      </div>
      <div className="mt-6 h-11 w-36 rounded-full bg-blush" />
    </article>
  );
}

export default function AccountLoading() {
  return (
    <main>
      <StorefrontHeaderSkeleton />
      <section className="mx-auto max-w-7xl px-5 py-14">
        <div aria-hidden="true">
          <div className="h-4 w-36 rounded-full bg-rosewood/10" />
          <div className="mt-4 h-16 w-72 max-w-full rounded-[2rem] bg-rosewood/10" />
          <div className="mt-5 grid max-w-2xl gap-3">
            <div className="h-4 w-full rounded-full bg-rosewood/10" />
            <div className="h-4 w-4/5 rounded-full bg-rosewood/10" />
          </div>
        </div>
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <AccountPanelSkeleton />
          <AccountPanelSkeleton />
          <AccountPanelSkeleton />
        </div>
      </section>
    </main>
  );
}
