import Link from 'next/link';
import { MessageCircle, Sparkles } from 'lucide-react';

export function HomepageVipAssist() {
  return (
    <section className="bg-cream px-5 py-16">
      <div className="mx-auto grid max-w-7xl overflow-hidden rounded-[2rem] border border-rosewood/10 bg-rosewood text-white shadow-[0_26px_80px_rgba(111,36,56,0.18)] lg:grid-cols-[1.1fr_0.9fr]">
        <div className="p-8 md:p-12">
          <p className="inline-flex rounded-full bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-white/75">VIP and VVIP orders</p>
          <h2 className="mt-6 font-display text-4xl leading-tight md:text-5xl">Need the right arrangement for a special moment?</h2>
          <p className="mt-5 max-w-2xl text-base leading-8 text-white/78">
            For premium boxes, royal arrangements, weddings, and ceremony flowers, Golara can guide the selection so the color, size, and mood match the occasion.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/products" className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-rosewood transition hover:-translate-y-0.5 hover:bg-cream focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/30">
              <Sparkles aria-hidden="true" className="h-4 w-4" />
              Browse premium flowers
            </Link>
            <a href={`https://wa.me/?text=${encodeURIComponent('I would like help choosing a Golara VIP arrangement.')}`} className="inline-flex items-center gap-2 rounded-full border border-white/25 px-6 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/30">
              <MessageCircle aria-hidden="true" className="h-4 w-4" />
              Contact sales
            </a>
          </div>
        </div>
        <div className="grid border-t border-white/10 bg-white/[0.06] p-8 md:grid-cols-3 lg:grid-cols-1 lg:border-l lg:border-t-0 lg:p-10">
          {['Tell us the occasion', 'Choose palette and size', 'We prepare the finish'].map((step, index) => (
            <div key={step} className="border-white/10 py-5 md:border-l md:px-5 md:first:border-l-0 lg:border-l-0 lg:border-t lg:first:border-t-0">
              <div className="text-sm font-semibold uppercase tracking-[0.24em] text-white/45">Step {index + 1}</div>
              <div className="mt-2 font-display text-3xl">{step}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
