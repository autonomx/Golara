export const CHECKOUT_MODES = ['inquiry', 'assisted', 'gateway'] as const;
export const PAYMENT_GATEWAY_PROVIDERS = ['manual', 'iranian', 'zarinpal', 'stripe'] as const;
export const CHECKOUT_CURRENCIES = ['TOMAN', 'USD', 'CAD'] as const;
export const OVERSEAS_FALLBACKS = ['whatsapp', 'inquiry', 'stripe'] as const;

export type CheckoutMode = typeof CHECKOUT_MODES[number];
export type PaymentGatewayProvider = typeof PAYMENT_GATEWAY_PROVIDERS[number];
export type CheckoutCurrency = typeof CHECKOUT_CURRENCIES[number];
export type OverseasFallback = typeof OVERSEAS_FALLBACKS[number];

export type PaymentGatewayConfig = {
  checkoutMode: CheckoutMode;
  domesticProvider: PaymentGatewayProvider;
  overseasProvider?: PaymentGatewayProvider;
  domesticCurrency: CheckoutCurrency;
  overseasCurrency: CheckoutCurrency;
  overseasFallback: OverseasFallback;
};

export type PaymentGatewayReadinessIssue = {
  code: string;
  severity: 'blocker' | 'warning';
  summary: string;
  detail: string;
};

export type PaymentGatewayReadiness = {
  ready: boolean;
  mode: CheckoutMode;
  providers: PaymentGatewayProvider[];
  blockers: PaymentGatewayReadinessIssue[];
  warnings: PaymentGatewayReadinessIssue[];
};

function normalizeEnum<T extends string>(value: string | undefined, allowed: readonly T[], fallback: T): T {
  const normalized = value?.trim().toLowerCase();
  return allowed.find((item) => item.toLowerCase() === normalized) ?? fallback;
}

function normalizeCurrency(value: string | undefined, fallback: CheckoutCurrency): CheckoutCurrency {
  const normalized = value?.trim().toUpperCase();
  return CHECKOUT_CURRENCIES.find((currency) => currency === normalized) ?? fallback;
}

function optionalProvider(value: string | undefined): PaymentGatewayProvider | undefined {
  const normalized = value?.trim().toLowerCase();
  return PAYMENT_GATEWAY_PROVIDERS.find((provider) => provider === normalized);
}

function hasEnv(env: Record<string, string | undefined>, name: string) {
  return Boolean(env[name]?.trim());
}

export function getPaymentGatewayConfig(env: Record<string, string | undefined>): PaymentGatewayConfig {
  return {
    checkoutMode: normalizeEnum(env.CHECKOUT_MODE, CHECKOUT_MODES, 'inquiry'),
    domesticProvider: normalizeEnum(env.CHECKOUT_DOMESTIC_GATEWAY_PROVIDER, PAYMENT_GATEWAY_PROVIDERS, 'manual'),
    overseasProvider: optionalProvider(env.CHECKOUT_OVERSEAS_GATEWAY_PROVIDER),
    domesticCurrency: normalizeCurrency(env.CHECKOUT_DOMESTIC_CURRENCY, 'TOMAN'),
    overseasCurrency: normalizeCurrency(env.CHECKOUT_OVERSEAS_CURRENCY, 'USD'),
    overseasFallback: normalizeEnum(env.CHECKOUT_OVERSEAS_FALLBACK, OVERSEAS_FALLBACKS, 'whatsapp')
  };
}

function uniqueProviders(config: PaymentGatewayConfig) {
  return Array.from(new Set([config.domesticProvider, config.overseasProvider].filter(Boolean))) as PaymentGatewayProvider[];
}

export function getPaymentGatewayReadiness(config: PaymentGatewayConfig, env: Record<string, string | undefined>): PaymentGatewayReadiness {
  const blockers: PaymentGatewayReadinessIssue[] = [];
  const warnings: PaymentGatewayReadinessIssue[] = [];
  const providers = uniqueProviders(config);

  if (config.checkoutMode === 'inquiry') {
    warnings.push({
      code: 'checkout_inquiry_mode',
      severity: 'warning',
      summary: 'Checkout remains inquiry-first.',
      detail: 'Products continue to route through inquiry/staff follow-up instead of direct payment.'
    });
  }

  if (config.checkoutMode === 'assisted') {
    warnings.push({
      code: 'checkout_assisted_mode',
      severity: 'warning',
      summary: 'Checkout is assisted by staff.',
      detail: 'Orders can be prepared by staff, but final payment/confirmation may still happen outside automated checkout.'
    });
  }

  if (config.checkoutMode === 'gateway' && config.domesticProvider === 'manual' && config.overseasFallback !== 'stripe') {
    blockers.push({
      code: 'gateway_mode_without_online_provider',
      severity: 'blocker',
      summary: 'Gateway checkout mode has no online provider selected.',
      detail: 'Use ZarinPal, another Iranian provider, or Stripe for gateway mode, or switch CHECKOUT_MODE to assisted/inquiry.'
    });
  }

  if (providers.includes('iranian')) {
    if (!hasEnv(env, 'IRANIAN_GATEWAY_MERCHANT_ID')) {
      blockers.push({
        code: 'iranian_gateway_merchant_missing',
        severity: 'blocker',
        summary: 'Iranian gateway merchant identifier is missing.',
        detail: 'Set IRANIAN_GATEWAY_MERCHANT_ID before enabling the Iranian gateway adapter.'
      });
    }
    if (config.domesticCurrency !== 'TOMAN') {
      blockers.push({
        code: 'iranian_gateway_currency_invalid',
        severity: 'blocker',
        summary: 'Iranian gateway requires Toman domestic currency.',
        detail: 'Set CHECKOUT_DOMESTIC_CURRENCY=TOMAN for Iranian provider checkout.'
      });
    }
  }

  if (providers.includes('zarinpal')) {
    if (!hasEnv(env, 'ZARINPAL_MERCHANT_ID')) {
      blockers.push({
        code: 'zarinpal_merchant_missing',
        severity: 'blocker',
        summary: 'ZarinPal merchant identifier is missing.',
        detail: 'Set ZARINPAL_MERCHANT_ID before enabling ZarinPal checkout.'
      });
    }
    if (config.domesticCurrency !== 'TOMAN') {
      blockers.push({
        code: 'zarinpal_currency_invalid',
        severity: 'blocker',
        summary: 'ZarinPal checkout requires Toman domestic currency.',
        detail: 'Set CHECKOUT_DOMESTIC_CURRENCY=TOMAN for ZarinPal domestic checkout.'
      });
    }
  }

  if (providers.includes('stripe') || config.overseasFallback === 'stripe') {
    if (!hasEnv(env, 'STRIPE_SECRET_KEY')) {
      blockers.push({
        code: 'stripe_secret_missing',
        severity: 'blocker',
        summary: 'Stripe secret key is missing.',
        detail: 'Set STRIPE_SECRET_KEY before enabling Stripe checkout.'
      });
    }
    if (config.overseasCurrency === 'TOMAN') {
      blockers.push({
        code: 'stripe_currency_invalid',
        severity: 'blocker',
        summary: 'Stripe overseas currency cannot be Toman.',
        detail: 'Use USD or CAD for Stripe overseas checkout.'
      });
    }
  }

  if (config.overseasFallback === 'whatsapp') {
    warnings.push({
      code: 'overseas_whatsapp_fallback',
      severity: 'warning',
      summary: 'Overseas checkout falls back to WhatsApp.',
      detail: 'This mirrors the assisted overseas purchase pattern and requires staff follow-up.'
    });
  }

  return {
    ready: blockers.length === 0,
    mode: config.checkoutMode,
    providers,
    blockers,
    warnings
  };
}

export function selectPaymentGatewayForOrder(input: { region: 'domestic' | 'overseas'; config: PaymentGatewayConfig }): PaymentGatewayProvider | OverseasFallback {
  if (input.region === 'domestic') return input.config.domesticProvider;
  return input.config.overseasProvider ?? input.config.overseasFallback;
}
