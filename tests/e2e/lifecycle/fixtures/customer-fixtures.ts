import type { PrismaClient } from '@prisma/client';

export async function createLifecycleCustomer(prisma: PrismaClient) {
  const customer = await prisma.customerProfile.create({
    data: {
      phone: '+16045559001',
      displayName: 'E2E Customer',
      email: 'customer.e2e@golara.test',
      locale: 'fa-IR'
    }
  });

  const account = await prisma.customerAccount.create({
    data: {
      customerId: customer.id,
      provider: 'phone',
      providerAccountId: customer.phone,
      email: customer.email,
      phone: customer.phone,
      phoneVerifiedAt: new Date('2026-06-01T12:00:00.000Z'),
      metadata: { lifecycle: true }
    }
  });

  const address = await prisma.customerAddress.create({
    data: {
      customerId: customer.id,
      label: 'E2E default delivery',
      recipient: customer.displayName,
      phone: customer.phone,
      city: 'Vancouver',
      line1: '100 E2E Lifecycle Street',
      line2: 'Suite 200',
      notes: 'Deterministic address for local lifecycle database tests.',
      isDefault: true
    }
  });

  return { customer, account, address };
}
