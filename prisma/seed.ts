import { PrismaClient } from '@prisma/client';
import { seedCategories, seedHomepageContent, seedProducts } from '../lib/seed-data';
import { localizeSeedProducts } from '../lib/localization/catalog-seed-fallback';

const prisma = new PrismaClient();

const demoNow = new Date('2026-06-03T12:00:00.000Z');
const seedProductLocales = ['en-CA', 'fa-IR'] as const;
const seedProductsByLocale = new Map(seedProductLocales.map((locale) => [locale, localizeSeedProducts(seedProducts, locale, seedCategories)]));

const demoCustomers = [
  {
    phone: '+16045550101',
    displayName: 'Mina Rahimi',
    email: 'mina.demo@golara.test',
    locale: 'en-CA',
    address: {
      label: 'Demo home delivery',
      recipient: 'Mina Rahimi',
      city: 'Vancouver',
      line1: '1288 Robson Street',
      line2: 'Apt 1404',
      notes: 'Call on arrival. Concierge accepts flowers.'
    }
  },
  {
    phone: '+16045550102',
    displayName: 'Arman Darya',
    email: 'arman.demo@golara.test',
    locale: 'en-CA',
    address: {
      label: 'Demo office delivery',
      recipient: 'Arman Darya',
      city: 'Burnaby',
      line1: '4567 Kingsway',
      line2: 'Suite 820',
      notes: 'Reception desk delivery before 3 PM.'
    }
  },
  {
    phone: '+16045550103',
    displayName: 'Sara Niknam',
    email: 'sara.demo@golara.test',
    locale: 'en-CA',
    address: {
      label: 'Demo event delivery',
      recipient: 'Sara Niknam',
      city: 'Richmond',
      line1: '7890 River Road',
      line2: 'Ballroom B',
      notes: 'Wedding coordinator will receive at loading bay.'
    }
  }
];

const demoInquiryRows = [
  {
    name: 'Mina Rahimi',
    email: 'mina.demo@golara.test',
    phone: '+16045550101',
    productSlug: 'vip-box-blue',
    message: 'Demo inquiry: Can this VIP box be delivered today with a blue ribbon and a short note?',
    status: 'new',
    deliveryNotes: 'Same-day delivery requested for downtown Vancouver.',
    assignedAdminLabel: null,
    assignedAdminEmail: null,
    assignedAdminRole: null,
    assignedAt: null,
    followUps: []
  },
  {
    name: 'Arman Darya',
    email: 'arman.demo@golara.test',
    phone: '+16045550102',
    productSlug: 'imperium-vip-red-roses',
    message: 'Demo inquiry: Please confirm availability for two red rose VIP boxes for a corporate gift.',
    status: 'assigned',
    deliveryNotes: 'Office delivery before 3 PM.',
    assignedAdminLabel: 'Demo Admin',
    assignedAdminEmail: 'admin@golara.test',
    assignedAdminRole: 'staff',
    assignedAt: new Date('2026-06-03T09:30:00.000Z'),
    followUps: ['Called customer and confirmed delivery window.', 'Waiting for final greeting-card wording.']
  },
  {
    name: 'Sara Niknam',
    email: 'sara.demo@golara.test',
    phone: '+16045550103',
    productSlug: 'woshe-round-hand-bouquet-white-lily',
    message: 'Demo inquiry: Need a bridal-style white lily bouquet and matching table florals.',
    status: 'follow_up',
    deliveryNotes: 'Wedding venue delivery next weekend.',
    assignedAdminLabel: 'Demo Admin',
    assignedAdminEmail: 'admin@golara.test',
    assignedAdminRole: 'owner',
    assignedAt: new Date('2026-06-02T16:00:00.000Z'),
    followUps: ['Sent initial quote and requested inspiration photos.']
  },
  {
    name: 'Nima Farzan',
    email: 'nima.demo@golara.test',
    phone: '+16045550104',
    productSlug: 'vip-box-red-pink',
    message: 'Demo inquiry: Anniversary arrangement with pink and red tones, delivery tomorrow morning.',
    status: 'closed',
    deliveryNotes: 'Resolved after customer selected a smaller box.',
    assignedAdminLabel: 'Demo Admin',
    assignedAdminEmail: 'admin@golara.test',
    assignedAdminRole: 'staff',
    assignedAt: new Date('2026-06-01T13:30:00.000Z'),
    followUps: ['Customer approved quote.', 'Marked closed after order was created.']
  }
];

const demoOrders = [
  {
    orderNumber: 'DEMO-1001',
    publicLookupToken: 'demo-order-1001-token',
    customerPhone: '+16045550101',
    productSlug: 'vip-box-blue',
    quantity: 1,
    status: 'confirmed',
    checkoutMode: 'assisted',
    fulfillmentStatus: 'scheduled',
    paymentStatus: 'paid',
    deliveryWindow: 'Today, 2 PM - 5 PM',
    deliveryDate: new Date('2026-06-03T21:00:00.000Z'),
    deliveryCents: 1500,
    discountCents: 0,
    customerNote: 'Please write: Congratulations on your opening.',
    staffNotes: 'Demo order: same-day premium delivery.',
    courierName: 'Golara Courier',
    courierPhone: '+16045550900'
  },
  {
    orderNumber: 'DEMO-1002',
    publicLookupToken: 'demo-order-1002-token',
    customerPhone: '+16045550102',
    productSlug: 'imperium-vip-red-roses',
    quantity: 2,
    status: 'processing',
    checkoutMode: 'assisted',
    fulfillmentStatus: 'picking',
    paymentStatus: 'created',
    deliveryWindow: 'Tomorrow, 10 AM - 1 PM',
    deliveryDate: new Date('2026-06-04T17:00:00.000Z'),
    deliveryCents: 2200,
    discountCents: 2500,
    customerNote: 'Corporate gift. Include two separate cards.',
    staffNotes: 'Demo order: awaiting payment confirmation.',
    courierName: null,
    courierPhone: null
  },
  {
    orderNumber: 'DEMO-1003',
    publicLookupToken: 'demo-order-1003-token',
    customerPhone: '+16045550103',
    productSlug: 'woshe-round-hand-bouquet-white-lily',
    quantity: 1,
    status: 'draft',
    checkoutMode: 'inquiry',
    fulfillmentStatus: 'not_scheduled',
    paymentStatus: 'failed',
    deliveryWindow: 'Pending venue confirmation',
    deliveryDate: new Date('2026-06-10T18:00:00.000Z'),
    deliveryCents: 0,
    discountCents: 0,
    customerNote: 'Wedding consultation draft order.',
    staffNotes: 'Demo order: payment failed, customer needs follow-up.',
    courierName: null,
    courierPhone: null
  }
];

function seedProductMediaProvider(url: string) {
  return url.includes('/seed-images/real-photo/') ? 'photo-real' : 'seed';
}

function cents(value: number) {
  return Math.max(0, Math.round(value));
}

async function seedDemoCustomers() {
  const customerByPhone = new Map<string, { id: string; displayName: string | null; phone: string; addressId?: string }>();

  for (const customer of demoCustomers) {
    const savedCustomer = await prisma.customerProfile.upsert({
      where: { phone: customer.phone },
      create: {
        phone: customer.phone,
        displayName: customer.displayName,
        email: customer.email,
        locale: customer.locale
      },
      update: {
        displayName: customer.displayName,
        email: customer.email,
        locale: customer.locale
      },
      select: { id: true, displayName: true, phone: true }
    });

    await prisma.customerAddress.deleteMany({ where: { customerId: savedCustomer.id, label: { startsWith: 'Demo ' } } });
    const address = await prisma.customerAddress.create({
      data: {
        customerId: savedCustomer.id,
        label: customer.address.label,
        recipient: customer.address.recipient,
        phone: customer.phone,
        city: customer.address.city,
        line1: customer.address.line1,
        line2: customer.address.line2,
        notes: customer.address.notes,
        isDefault: true
      },
      select: { id: true }
    });

    await prisma.customerAdminTimelineEvent.create({
      data: {
        customerId: savedCustomer.id,
        type: 'demo_seed',
        title: 'Demo customer seeded',
        note: 'Seeded demo customer for admin preview workflows.',
        actorLabel: 'Seed script',
        metadata: { demo: true }
      }
    });

    customerByPhone.set(customer.phone, { ...savedCustomer, addressId: address.id });
  }

  return customerByPhone;
}

async function seedDemoInquiries(productBySlug: Map<string, { id: string }>) {
  await prisma.customerInquiry.deleteMany({ where: { phone: { in: demoInquiryRows.map((row) => row.phone) } } });

  for (const row of demoInquiryRows) {
    const inquiry = await prisma.customerInquiry.create({
      data: {
        name: row.name,
        email: row.email,
        phone: row.phone,
        message: row.message,
        productId: productBySlug.get(row.productSlug)?.id,
        deliveryDate: new Date(demoNow.getTime() + 2 * 24 * 60 * 60 * 1000),
        deliveryNotes: row.deliveryNotes,
        status: row.status,
        assignedAdminLabel: row.assignedAdminLabel,
        assignedAdminEmail: row.assignedAdminEmail,
        assignedAdminRole: row.assignedAdminRole,
        assignedAt: row.assignedAt
      },
      select: { id: true }
    });

    for (const note of row.followUps) {
      await prisma.customerInquiryFollowUp.create({
        data: {
          inquiryId: inquiry.id,
          note,
          channel: 'internal'
        }
      });
    }
  }
}

async function seedDemoOrders(
  customerByPhone: Map<string, { id: string; displayName: string | null; phone: string; addressId?: string }>,
  productBySlug: Map<string, { id: string; title: string; code: string; priceCents: number; currency: string }>
) {
  for (const row of demoOrders) {
    const customer = customerByPhone.get(row.customerPhone);
    const product = productBySlug.get(row.productSlug);
    if (!customer || !product) continue;

    const subtotalCents = cents(product.priceCents * row.quantity);
    const totalCents = cents(subtotalCents + row.deliveryCents - row.discountCents);
    const order = await prisma.checkoutOrder.upsert({
      where: { orderNumber: row.orderNumber },
      create: {
        orderNumber: row.orderNumber,
        publicLookupToken: row.publicLookupToken,
        customerId: customer.id,
        addressId: customer.addressId,
        status: row.status,
        checkoutMode: row.checkoutMode,
        currency: product.currency,
        subtotalCents,
        deliveryCents: row.deliveryCents,
        discountCents: row.discountCents,
        totalCents,
        deliveryDate: row.deliveryDate,
        deliveryWindow: row.deliveryWindow,
        fulfillmentStatus: row.fulfillmentStatus,
        fulfillmentNote: 'Seeded demo fulfillment note.',
        courierName: row.courierName,
        courierPhone: row.courierPhone,
        recipientName: customer.displayName,
        recipientPhone: customer.phone,
        customerNote: row.customerNote,
        staffNotes: row.staffNotes
      },
      update: {
        customerId: customer.id,
        addressId: customer.addressId,
        status: row.status,
        checkoutMode: row.checkoutMode,
        currency: product.currency,
        subtotalCents,
        deliveryCents: row.deliveryCents,
        discountCents: row.discountCents,
        totalCents,
        deliveryDate: row.deliveryDate,
        deliveryWindow: row.deliveryWindow,
        fulfillmentStatus: row.fulfillmentStatus,
        fulfillmentNote: 'Seeded demo fulfillment note.',
        courierName: row.courierName,
        courierPhone: row.courierPhone,
        recipientName: customer.displayName,
        recipientPhone: customer.phone,
        customerNote: row.customerNote,
        staffNotes: row.staffNotes
      },
      select: { id: true }
    });

    await prisma.checkoutOrderItem.deleteMany({ where: { orderId: order.id } });
    await prisma.checkoutOrderItem.create({
      data: {
        orderId: order.id,
        productId: product.id,
        productTitle: product.title,
        productCode: product.code,
        quantity: row.quantity,
        unitPriceCents: product.priceCents,
        lineTotalCents: subtotalCents
      }
    });

    await prisma.checkoutPaymentAttempt.deleteMany({ where: { orderId: order.id } });
    await prisma.checkoutPaymentAttempt.create({
      data: {
        orderId: order.id,
        provider: 'manual',
        status: row.paymentStatus,
        amountCents: totalCents,
        currency: product.currency,
        providerReference: `${row.orderNumber}-${row.paymentStatus}`,
        metadata: { demo: true }
      }
    });

    await prisma.checkoutOrderTimelineEvent.deleteMany({ where: { orderId: order.id, type: 'demo_seed' } });
    await prisma.checkoutOrderTimelineEvent.create({
      data: {
        orderId: order.id,
        type: 'demo_seed',
        title: 'Demo order seeded',
        note: `Seeded ${row.status} order for admin preview workflows.`,
        actorLabel: 'Seed script',
        actorRole: 'owner',
        metadata: { demo: true }
      }
    });
  }
}

async function seedDemoDiscounts(productBySlug: Map<string, { id: string }>) {
  const vipProduct = productBySlug.get('vip-box-blue');
  const bouquetProduct = productBySlug.get('woshe-round-hand-bouquet-white-lily');

  const welcome = await prisma.promotionDiscount.upsert({
    where: { slug: 'demo-welcome-10' },
    create: {
      slug: 'demo-welcome-10',
      name: 'Demo welcome 10%',
      discountType: 'percentage',
      value: 10,
      status: 'active',
      description: 'Demo percentage discount for first-time customer previews.',
      usageLimit: 100,
      minimumSubtotalCents: 150000,
      startsAt: new Date('2026-06-01T00:00:00.000Z'),
      endsAt: new Date('2026-07-01T00:00:00.000Z'),
      metadata: { demo: true }
    },
    update: {
      name: 'Demo welcome 10%',
      discountType: 'percentage',
      value: 10,
      status: 'active',
      description: 'Demo percentage discount for first-time customer previews.',
      usageLimit: 100,
      minimumSubtotalCents: 150000,
      startsAt: new Date('2026-06-01T00:00:00.000Z'),
      endsAt: new Date('2026-07-01T00:00:00.000Z'),
      metadata: { demo: true }
    },
    select: { id: true }
  });

  const vip = await prisma.promotionDiscount.upsert({
    where: { slug: 'demo-vip-box-credit' },
    create: {
      slug: 'demo-vip-box-credit',
      name: 'Demo VIP box credit',
      discountType: 'fixed_amount',
      value: 25000,
      currency: 'IRR',
      status: 'active',
      description: 'Demo fixed credit for selected VIP box products.',
      usageLimit: 25,
      minimumSubtotalCents: 500000,
      startsAt: new Date('2026-06-01T00:00:00.000Z'),
      endsAt: new Date('2026-08-01T00:00:00.000Z'),
      metadata: { demo: true }
    },
    update: {
      name: 'Demo VIP box credit',
      discountType: 'fixed_amount',
      value: 25000,
      currency: 'IRR',
      status: 'active',
      description: 'Demo fixed credit for selected VIP box products.',
      usageLimit: 25,
      minimumSubtotalCents: 500000,
      startsAt: new Date('2026-06-01T00:00:00.000Z'),
      endsAt: new Date('2026-08-01T00:00:00.000Z'),
      metadata: { demo: true }
    },
    select: { id: true }
  });

  await prisma.promotionVoucher.upsert({
    where: { code: 'DEMO10' },
    create: {
      code: 'DEMO10',
      promotionDiscountId: welcome.id,
      status: 'active',
      usageLimit: 100,
      minimumSubtotalCents: 150000,
      startsAt: new Date('2026-06-01T00:00:00.000Z'),
      endsAt: new Date('2026-07-01T00:00:00.000Z'),
      metadata: { demo: true }
    },
    update: {
      promotionDiscountId: welcome.id,
      status: 'active',
      usageLimit: 100,
      minimumSubtotalCents: 150000,
      startsAt: new Date('2026-06-01T00:00:00.000Z'),
      endsAt: new Date('2026-07-01T00:00:00.000Z'),
      metadata: { demo: true }
    }
  });

  await prisma.promotionVoucher.upsert({
    where: { code: 'VIPBOX25' },
    create: {
      code: 'VIPBOX25',
      promotionDiscountId: vip.id,
      status: 'active',
      usageLimit: 25,
      minimumSubtotalCents: 500000,
      startsAt: new Date('2026-06-01T00:00:00.000Z'),
      endsAt: new Date('2026-08-01T00:00:00.000Z'),
      metadata: { demo: true }
    },
    update: {
      promotionDiscountId: vip.id,
      status: 'active',
      usageLimit: 25,
      minimumSubtotalCents: 500000,
      startsAt: new Date('2026-06-01T00:00:00.000Z'),
      endsAt: new Date('2026-08-01T00:00:00.000Z'),
      metadata: { demo: true }
    }
  });

  await prisma.promotionEligibilityRule.deleteMany({ where: { promotionDiscountId: vip.id } });
  for (const product of [vipProduct, bouquetProduct].filter(Boolean) as { id: string }[]) {
    await prisma.promotionEligibilityRule.create({
      data: {
        promotionDiscountId: vip.id,
        targetType: 'product',
        targetId: product.id,
        effect: 'include',
        metadata: { demo: true }
      }
    });
  }

  await prisma.promotionStoreCredit.upsert({
    where: { code: 'DEMO-CREDIT-50' },
    create: {
      code: 'DEMO-CREDIT-50',
      currency: 'IRR',
      initialBalanceCents: 50000,
      balanceCents: 50000,
      status: 'active',
      expiresAt: new Date('2026-12-31T23:59:59.000Z'),
      metadata: { demo: true, note: 'Demo store credit for admin preview.' }
    },
    update: {
      currency: 'IRR',
      initialBalanceCents: 50000,
      balanceCents: 50000,
      status: 'active',
      expiresAt: new Date('2026-12-31T23:59:59.000Z'),
      metadata: { demo: true, note: 'Demo store credit for admin preview.' }
    }
  });
}

async function main() {
  const categoryBySlug = new Map<string, { id: string }>();

  for (const category of seedCategories) {
    const savedCategory = await prisma.category.upsert({
      where: { slug: category.slug },
      create: {
        slug: category.slug,
        title: category.title,
        eyebrow: category.eyebrow,
        description: category.description,
        imageUrl: category.image,
        showOnHomepage: category.showOnHomepage !== false,
        sortOrder: category.sortOrder ?? 0,
        isActive: category.isActive !== false
      },
      update: {
        title: category.title,
        eyebrow: category.eyebrow,
        description: category.description,
        imageUrl: category.image,
        showOnHomepage: category.showOnHomepage !== false,
        sortOrder: category.sortOrder ?? 0,
        isActive: category.isActive !== false
      },
      select: { id: true }
    });

    categoryBySlug.set(category.slug, savedCategory);
  }

  for (const category of seedCategories) {
    const parentId = category.parentSlug ? categoryBySlug.get(category.parentSlug)?.id : null;
    await prisma.category.update({
      where: { slug: category.slug },
      data: { parentId },
      select: { id: true }
    });
  }

  const productBySlug = new Map<string, { id: string; title: string; code: string; priceCents: number; currency: string }>();

  for (const product of seedProducts) {
    const category = categoryBySlug.get(product.category);
    if (!category) throw new Error(`Missing category for product ${product.slug}`);
    const requiresQuote = Boolean(product.requiresQuote || product.price <= 0);

    const savedProduct = await prisma.product.upsert({
      where: { slug: product.slug },
      create: {
        slug: product.slug,
        code: product.code,
        title: product.title,
        description: product.description,
        priceCents: Math.round(product.price),
        currency: product.currency,
        imageUrl: product.image,
        availableToday: product.availableToday,
        bestSeller: Boolean(product.bestSeller),
        requiresQuote,
        isActive: product.isActive !== false,
        categoryId: category.id
      },
      update: {
        code: product.code,
        title: product.title,
        description: product.description,
        priceCents: Math.round(product.price),
        currency: product.currency,
        imageUrl: product.image,
        availableToday: product.availableToday,
        bestSeller: Boolean(product.bestSeller),
        requiresQuote,
        isActive: product.isActive !== false,
        categoryId: category.id
      },
      select: { id: true, title: true, code: true, priceCents: true, currency: true }
    });

    productBySlug.set(product.slug, savedProduct);

    for (const locale of seedProductLocales) {
      const localizedProduct = seedProductsByLocale.get(locale)?.find((item) => item.slug === product.slug) ?? product;
      await prisma.productTranslation.upsert({
        where: { productId_locale: { productId: savedProduct.id, locale } },
        create: {
          productId: savedProduct.id,
          locale,
          title: localizedProduct.title,
          description: localizedProduct.description,
          imageAlt: localizedProduct.title,
          isPublished: true
        },
        update: {
          title: localizedProduct.title,
          description: localizedProduct.description,
          imageAlt: localizedProduct.title,
          isPublished: true
        }
      });
    }

    await prisma.media.upsert({
      where: { url: product.image },
      create: {
        url: product.image,
        alt: product.title,
        sourceType: 'seed',
        storageProvider: seedProductMediaProvider(product.image),
        metadata: { mediaCategory: 'product', seedProductSlug: product.slug, productCode: product.code },
        productId: savedProduct.id
      },
      update: {
        alt: product.title,
        sourceType: 'seed',
        storageProvider: seedProductMediaProvider(product.image),
        metadata: { mediaCategory: 'product', seedProductSlug: product.slug, productCode: product.code },
        productId: savedProduct.id
      },
      select: { id: true }
    });
  }

  await prisma.homepageSection.upsert({
    where: { key: 'home.hero' },
    create: {
      key: 'home.hero',
      title: seedHomepageContent.title,
      subtitle: seedHomepageContent.eyebrow,
      body: seedHomepageContent.body,
      payload: seedHomepageContent,
      isActive: true,
      sortOrder: 0
    },
    update: {
      title: seedHomepageContent.title,
      subtitle: seedHomepageContent.eyebrow,
      body: seedHomepageContent.body,
      payload: seedHomepageContent,
      isActive: true
    },
    select: { id: true }
  });

  const customerByPhone = await seedDemoCustomers();
  await seedDemoInquiries(productBySlug);
  await seedDemoOrders(customerByPhone, productBySlug);
  await seedDemoDiscounts(productBySlug);
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
