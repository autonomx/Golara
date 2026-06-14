import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import type { Category } from '@/lib/catalog';
import type { SupportedLocale } from '@/lib/i18n/locales';
import { homepageCategoryImage } from '@/lib/homepage-assets';
import { getStorefrontCloudinaryImage } from '@/lib/media/cloudinary-image';

const railCopy = {
  en: {
    eyebrow: 'Occasion menu',
    title: 'Find the right flowers faster',
    viewAll: 'View all occasions'
  },
  fa: {
    eyebrow: 'منوی مناسبت‌ها',
    title: 'گل مناسب را سریع‌تر پیدا کنید',
    viewAll: 'مشاهده همه مناسبت‌ها'
  }
};

const occasionLabelBySlug: Record<'en' | 'fa', Record<string, string>> = {
  en: {
    'available-today': 'Available today',
    daily: 'Daily flowers',
    'flower-boxes': 'Flower boxes',
    bouquets: 'Bouquets',
    birthday: 'Birthday',
    weddings: 'Wedding',
    'baby-flowers': 'Baby flowers',
    'proposal-ceremony': 'Proposal',
    'ceremony-design': 'Ceremony design',
    'cake-balloon': 'Cake and balloon',
    pots: 'Vases and pots',
    condolences: 'Condolences',
    royal: 'Royal VVIP'
  },
  fa: {
    'available-today': 'آماده امروز',
    daily: 'گل‌های روزانه',
    'flower-boxes': 'باکس گل',
    bouquets: 'دسته‌گل',
    birthday: 'تولد',
    weddings: 'عروسی',
    'baby-flowers': 'گل نوزاد',
    'proposal-ceremony': 'خواستگاری',
    'ceremony-design': 'طراحی مراسم',
    'cake-balloon': 'کیک و بادکنک',
    pots: 'گلدان و سبد',
    condolences: 'تسلیت',
    royal: 'رویال ویژه'
  }
};

function localeKey(locale?: SupportedLocale) {
  return locale?.toLowerCase().startsWith('fa') ? 'fa' : 'en';
}

export function HomepageOccasionRail({ occasions, locale }: { occasions: Category[]; locale?: SupportedLocale }) {
  const featuredOccasions = occasions.slice(0, 10);
  const activeLocale = localeKey(locale);
  const copy = railCopy[activeLocale];

  if (!featuredOccasions.length) {
    return null;
  }

  return (
    <section
      id="occasions"
      data-section="home-occasion-menu"
      aria-labelledby="home-occasion-menu-heading"
      className="relative z-10 bg-[#fffdfb] px-5 pb-14 pt-2"
    >
      <div className="mx-auto max-w-7xl rounded-lg border border-rosewood/10 bg-white p-4 shadow-[0_14px_34px_rgba(111,36,56,0.07)] md:p-5">
        <div className="mb-4 flex flex-col gap-2 px-1 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-olive">{copy.eyebrow}</p>
            <h2 id="home-occasion-menu-heading" className="mt-1 font-display text-3xl text-rosewood">{copy.title}</h2>
          </div>
          <Link href="/categories" className="inline-flex items-center gap-1 text-sm font-semibold text-rosewood outline-none transition hover:text-stone-900 focus-visible:ring-4 focus-visible:ring-olive/20">
            {copy.viewAll}
            <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {featuredOccasions.map((occasion, index) => {
            const imageSrc = getStorefrontCloudinaryImage(occasion.image || homepageCategoryImage(occasion.slug), 'productCard');

            return (
              <Link
                key={occasion.slug}
                href={`/categories/${occasion.slug}`}
                className="group relative min-h-[155px] overflow-hidden rounded-lg bg-stone-100 outline-none shadow-[0_8px_22px_rgba(43,29,32,0.06)] transition focus-visible:ring-4 focus-visible:ring-olive/30"
              >
                <Image
                  src={imageSrc}
                  alt={occasion.title}
                  fill
                  priority={index < 2}
                  className="object-cover"
                  sizes="(min-width: 1024px) 18vw, (min-width: 640px) 30vw, 50vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-rosewood/75 via-rosewood/20 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/75">{occasion.eyebrow}</p>
                  <h3 className="mt-1 font-display text-2xl leading-tight text-white">{occasionLabelBySlug[activeLocale][occasion.slug] ?? occasion.title}</h3>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
