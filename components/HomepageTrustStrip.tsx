import { Gift, HeartHandshake, MessageCircle, Truck } from 'lucide-react';

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
  },
  {
    icon: MessageCircle,
    title: 'VIP sales assist',
    body: 'For VVIP pieces, the studio helps choose the right composition.'
  }
];

export function HomepageTrustStrip() {
  return (
    <section className="bg-cream px-5 py-10">
      <div className="mx-auto grid max-w-7xl gap-3 md:grid-cols-4">
        {serviceHighlights.map((item) => {
          const Icon = item.icon;

          return (
            <div key={item.title} className="rounded-2xl border border-rosewood/10 bg-white/70 p-5 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blush text-rosewood">
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
