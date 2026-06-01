import { Gift, HeartHandshake, Truck } from 'lucide-react';

const serviceHighlights = [
  {
    icon: Truck,
    title: 'Same-day options',
    body: 'Quick paths for arrangements available today.'
  },
  {
    icon: Gift,
    title: 'Premium presentation',
    body: 'Boxes, bouquets, and gifts prepared with a polished finish.'
  },
  {
    icon: HeartHandshake,
    title: 'Occasion guidance',
    body: 'Shop by moment instead of guessing the right category.'
  }
];

export function HomepageTrustStrip() {
  return (
    <section
      id="home-service-highlights"
      data-section="home-service-highlights"
      aria-labelledby="home-service-highlights-heading"
      className="bg-white px-5 py-12"
    >
      <h2 id="home-service-highlights-heading" className="sr-only">Service highlights</h2>
      <div className="mx-auto grid max-w-7xl gap-3 md:grid-cols-3">
        {serviceHighlights.map((item) => {
          const Icon = item.icon;

          return (
            <div key={item.title} className="rounded-lg border border-rosewood/10 bg-white/82 p-5 shadow-[0_16px_40px_rgba(111,36,56,0.07)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_48px_rgba(111,36,56,0.11)]">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blush text-rosewood">
                <Icon aria-hidden="true" className="h-5 w-5" />
              </div>
              <h2 className="mt-4 font-display text-2xl text-rosewood">{item.title}</h2>
              <p className="mt-2 text-sm leading-6 text-stone-600">{item.body}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
