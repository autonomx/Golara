import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const demoDiscounts = [
  {
    slug: 'demo-same-day-delivery-credit',
    name: 'Demo same-day delivery credit',
    discountType: 'fixed_amount',
    value: 1500,
    currency: 'IRR',
    status: 'active',
    description: 'Demo fixed credit for same-day delivery promotions.',
    usageLimit: 50,
    minimumSubtotalCents: 120000,
    startsAt: new Date('2026-06-01T00:00:00.000Z'),
    endsAt: new Date('2026-07-15T00:00:00.000Z'),
    voucherCode: 'TODAYDELIVERY',
    voucherUsageLimit: 50
  },
  {
    slug: 'demo-bridal-consultation-15',
    name: 'Demo bridal consultation 15%',
    discountType: 'percentage',
    value: 15,
    currency: null,
    status: 'active',
    description: 'Demo percentage promotion for wedding and bridal consultation previews.',
    usageLimit: 20,
    minimumSubtotalCents: 500000,
    startsAt: new Date('2026-06-01T00:00:00.000Z'),
    endsAt: new Date('2026-09-01T00:00:00.000Z'),
    voucherCode: 'BRIDAL15',
    voucherUsageLimit: 20
  },
  {
    slug: 'demo-weekend-bouquet-12',
    name: 'Demo weekend bouquet 12%',
    discountType: 'percentage',
    value: 12,
    currency: null,
    status: 'scheduled',
    description: 'Demo scheduled weekend bouquet promotion for admin previews.',
    usageLimit: 75,
    minimumSubtotalCents: 180000,
    startsAt: new Date('2026-06-15T00:00:00.000Z'),
    endsAt: new Date('2026-07-15T00:00:00.000Z'),
    voucherCode: 'WEEKEND12',
    voucherUsageLimit: 75
  },
  {
    slug: 'demo-expired-spring-box-credit',
    name: 'Demo expired spring box credit',
    discountType: 'fixed_amount',
    value: 20000,
    currency: 'IRR',
    status: 'expired',
    description: 'Demo expired discount to show inactive/expired admin states.',
    usageLimit: 30,
    minimumSubtotalCents: 250000,
    startsAt: new Date('2026-03-01T00:00:00.000Z'),
    endsAt: new Date('2026-04-01T00:00:00.000Z'),
    voucherCode: 'SPRINGBOX20',
    voucherUsageLimit: 30
  }
];

async function upsertDemoDiscount(row: (typeof demoDiscounts)[number]) {
  const currency = row.currency ?? undefined;
  const discount = await prisma.promotionDiscount.upsert({
    where: { slug: row.slug },
    create: {
      slug: row.slug,
      name: row.name,
      discountType: row.discountType,
      value: row.value,
      currency,
      status: row.status,
      description: row.description,
      usageLimit: row.usageLimit,
      minimumSubtotalCents: row.minimumSubtotalCents,
      startsAt: row.startsAt,
      endsAt: row.endsAt,
      metadata: { demo: true, source: 'seed-demo-discounts' }
    },
    update: {
      name: row.name,
      discountType: row.discountType,
      value: row.value,
      currency,
      status: row.status,
      description: row.description,
      usageLimit: row.usageLimit,
      minimumSubtotalCents: row.minimumSubtotalCents,
      startsAt: row.startsAt,
      endsAt: row.endsAt,
      metadata: { demo: true, source: 'seed-demo-discounts' }
    },
    select: { id: true }
  });

  await prisma.promotionVoucher.upsert({
    where: { code: row.voucherCode },
    create: {
      code: row.voucherCode,
      promotionDiscountId: discount.id,
      status: row.status === 'expired' ? 'expired' : row.status,
      usageLimit: row.voucherUsageLimit,
      minimumSubtotalCents: row.minimumSubtotalCents,
      startsAt: row.startsAt,
      endsAt: row.endsAt,
      metadata: { demo: true, source: 'seed-demo-discounts' }
    },
    update: {
      promotionDiscountId: discount.id,
      status: row.status === 'expired' ? 'expired' : row.status,
      usageLimit: row.voucherUsageLimit,
      minimumSubtotalCents: row.minimumSubtotalCents,
      startsAt: row.startsAt,
      endsAt: row.endsAt,
      metadata: { demo: true, source: 'seed-demo-discounts' }
    }
  });

  return discount;
}

async function main() {
  for (const discount of demoDiscounts) {
    await upsertDemoDiscount(discount);
  }

  await prisma.promotionStoreCredit.upsert({
    where: { code: 'DEMO-VIP-CREDIT-100' },
    create: {
      code: 'DEMO-VIP-CREDIT-100',
      currency: 'IRR',
      initialBalanceCents: 100000,
      balanceCents: 100000,
      status: 'active',
      expiresAt: new Date('2026-12-31T23:59:59.000Z'),
      metadata: { demo: true, source: 'seed-demo-discounts', note: 'Large demo credit for VIP customer preview.' }
    },
    update: {
      currency: 'IRR',
      initialBalanceCents: 100000,
      balanceCents: 100000,
      status: 'active',
      expiresAt: new Date('2026-12-31T23:59:59.000Z'),
      metadata: { demo: true, source: 'seed-demo-discounts', note: 'Large demo credit for VIP customer preview.' }
    }
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
