import type { PrismaClient } from '@prisma/client';

export type ServiceModules = {
  cart: typeof import('@/lib/cart/cart-repository');
  customers: typeof import('@/lib/customers/customer-repository');
  customerAccounts: typeof import('@/lib/customers/customer-account-repository');
  customerOtp: typeof import('@/lib/customers/customer-otp-repository');
  orderDrafts: typeof import('@/lib/checkout/order-draft-repository');
  paymentProvider: typeof import('@/lib/checkout/payment-provider');
  manualPayments: typeof import('@/lib/checkout/manual-payment-repository');
  fulfillmentCapacity: typeof import('@/lib/checkout/fulfillment-capacity-service');
  checkoutStatus: typeof import('@/lib/checkout/checkout-status-service');
  fulfillmentShipments: typeof import('@/lib/checkout/admin-fulfillment-shipment-repository');
  orderAssignments: typeof import('@/lib/checkout/admin-order-assignment-repository');
  orderLines: typeof import('@/lib/checkout/admin-order-line-repository');
  adminOrders: typeof import('@/lib/checkout/admin-order-repository');
  webhookRoute: typeof import('@/lib/checkout/payment-webhook-route-core');
  webhookService: typeof import('@/lib/checkout/payment-webhook-service');
  appPrisma: (typeof import('@/lib/prisma'))['prisma'];
};

export type ServiceLifecycleState = {
  prisma: PrismaClient;
  databaseUrl: string;
  modules: ServiceModules;
  product?: any;
  variant?: any;
  secondProduct?: any;
  secondVariant?: any;
  multiLineCart?: any;
  customer?: any;
  address?: any;
  order?: any;
  paymentAttempt?: any;
};

export async function loadServiceModules(): Promise<ServiceModules> {
  const [
    cart,
    customers,
    customerAccounts,
    customerOtp,
    orderDrafts,
    paymentProvider,
    manualPayments,
    fulfillmentCapacity,
    checkoutStatus,
    fulfillmentShipments,
    orderAssignments,
    orderLines,
    adminOrders,
    webhookRoute,
    webhookService,
    prismaModule
  ] = await Promise.all([
    import('@/lib/cart/cart-repository'),
    import('@/lib/customers/customer-repository'),
    import('@/lib/customers/customer-account-repository'),
    import('@/lib/customers/customer-otp-repository'),
    import('@/lib/checkout/order-draft-repository'),
    import('@/lib/checkout/payment-provider'),
    import('@/lib/checkout/manual-payment-repository'),
    import('@/lib/checkout/fulfillment-capacity-service'),
    import('@/lib/checkout/checkout-status-service'),
    import('@/lib/checkout/admin-fulfillment-shipment-repository'),
    import('@/lib/checkout/admin-order-assignment-repository'),
    import('@/lib/checkout/admin-order-line-repository'),
    import('@/lib/checkout/admin-order-repository'),
    import('@/lib/checkout/payment-webhook-route-core'),
    import('@/lib/checkout/payment-webhook-service'),
    import('@/lib/prisma')
  ]);

  return {
    cart,
    customers,
    customerAccounts,
    customerOtp,
    orderDrafts,
    paymentProvider,
    manualPayments,
    fulfillmentCapacity,
    checkoutStatus,
    fulfillmentShipments,
    orderAssignments,
    orderLines,
    adminOrders,
    webhookRoute,
    webhookService,
    appPrisma: prismaModule.prisma
  };
}

export async function withServiceLifecycleEnvironment<T>(
  databaseUrl: string,
  run: (modules: ServiceModules) => Promise<T>
) {
  const previousDatabaseUrl = process.env.DATABASE_URL;
  const previousCheckoutMode = process.env.CHECKOUT_MODE;
  const previousCurrency = process.env.CHECKOUT_DOMESTIC_CURRENCY;
  const previousSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  process.env.DATABASE_URL = databaseUrl;
  process.env.CHECKOUT_MODE = 'cart';
  process.env.CHECKOUT_DOMESTIC_CURRENCY = 'TOMAN';
  process.env.NEXT_PUBLIC_SITE_URL = 'http://localhost:3000';

  const modules = await loadServiceModules();
  try {
    return await run(modules);
  } finally {
    await modules.appPrisma.$disconnect();
    restoreEnv('DATABASE_URL', previousDatabaseUrl);
    restoreEnv('CHECKOUT_MODE', previousCheckoutMode);
    restoreEnv('CHECKOUT_DOMESTIC_CURRENCY', previousCurrency);
    restoreEnv('NEXT_PUBLIC_SITE_URL', previousSiteUrl);
  }
}

function restoreEnv(name: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[name];
  } else {
    process.env[name] = value;
  }
}
