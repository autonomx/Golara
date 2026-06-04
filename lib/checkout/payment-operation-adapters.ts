export type PaymentOperationAdapterProvider = 'stripe' | 'zarinpal' | 'manual' | 'unknown';
export type PaymentOperationAdapterKind = 'refund' | 'void';
export type PaymentOperationAdapterStatus = 'succeeded' | 'failed' | 'manual_review' | 'unavailable';

export type PaymentOperationAdapterInput = {
  operationKind: PaymentOperationAdapterKind;
  paymentOperationRecordId: string;
  orderId: string;
  paymentAttemptId: string;
  amountCents: number;
  currency: string;
  providerReference?: string | null;
  idempotencyKey: string;
  reason?: string | null;
  metadata?: Record<string, string | number | boolean | null>;
};

export type PaymentOperationAdapterResult = {
  provider: PaymentOperationAdapterProvider;
  operationKind: PaymentOperationAdapterKind;
  status: PaymentOperationAdapterStatus;
  providerOperationReference?: string;
  providerStatus?: string;
  errorCategory?: string;
  retryable: boolean;
  message: string;
  metadata: Record<string, string | number | boolean | null>;
};

export type PaymentOperationAdapter = {
  provider: PaymentOperationAdapterProvider;
  supports: ReadonlyArray<PaymentOperationAdapterKind>;
  execute(input: PaymentOperationAdapterInput): Promise<PaymentOperationAdapterResult>;
};

function cleanProvider(provider: string): PaymentOperationAdapterProvider {
  const normalized = provider.trim().toLowerCase();
  if (normalized === 'stripe') return 'stripe';
  if (normalized === 'zarinpal' || normalized === 'zarin-pal') return 'zarinpal';
  if (normalized === 'manual' || normalized === 'inquiry' || normalized === 'assisted') return 'manual';
  return 'unknown';
}

function hasRequiredReference(input: PaymentOperationAdapterInput) {
  return typeof input.providerReference === 'string' && input.providerReference.trim().length > 0;
}

function operationReference(provider: PaymentOperationAdapterProvider, input: PaymentOperationAdapterInput) {
  return `${provider}:${input.operationKind}:${input.paymentOperationRecordId}`;
}

function baseMetadata(input: PaymentOperationAdapterInput): Record<string, string | number | boolean | null> {
  return {
    paymentOperationRecordId: input.paymentOperationRecordId,
    orderId: input.orderId,
    paymentAttemptId: input.paymentAttemptId,
    amountCents: input.amountCents,
    currency: input.currency.trim().toUpperCase(),
    providerReference: input.providerReference?.trim() || null,
    reason: input.reason?.trim() || null,
    idempotencyKey: input.idempotencyKey.trim(),
    ...(input.metadata ?? {})
  };
}

export function normalizePaymentOperationAdapterProvider(provider: string): PaymentOperationAdapterProvider {
  return cleanProvider(provider);
}

export function createUnavailablePaymentOperationAdapter(provider: string, message?: string): PaymentOperationAdapter {
  const normalized = cleanProvider(provider);
  return {
    provider: normalized,
    supports: ['refund', 'void'],
    async execute(input) {
      return {
        provider: normalized,
        operationKind: input.operationKind,
        status: 'unavailable',
        errorCategory: 'provider_operation_not_configured',
        retryable: false,
        message: message ?? 'Payment operation provider execution is not configured for this environment.',
        metadata: baseMetadata(input)
      };
    }
  };
}

export function createManualReviewPaymentOperationAdapter(): PaymentOperationAdapter {
  return {
    provider: 'manual',
    supports: ['refund', 'void'],
    async execute(input) {
      return {
        provider: 'manual',
        operationKind: input.operationKind,
        status: 'manual_review',
        providerOperationReference: operationReference('manual', input),
        providerStatus: 'manual_review_required',
        retryable: false,
        message: 'Manual payment operations require operator review outside live provider execution.',
        metadata: baseMetadata(input)
      };
    }
  };
}

export function createMockPaymentOperationAdapter(provider: Exclude<PaymentOperationAdapterProvider, 'unknown'>): PaymentOperationAdapter {
  return {
    provider,
    supports: ['refund', 'void'],
    async execute(input) {
      if (provider !== 'manual' && !hasRequiredReference(input)) {
        return {
          provider,
          operationKind: input.operationKind,
          status: 'failed',
          providerStatus: 'missing_provider_reference',
          errorCategory: 'provider_reference_required',
          retryable: false,
          message: 'Provider reference is required before this payment operation can be submitted.',
          metadata: baseMetadata(input)
        };
      }

      if (provider === 'manual') {
        return createManualReviewPaymentOperationAdapter().execute(input);
      }

      return {
        provider,
        operationKind: input.operationKind,
        status: 'succeeded',
        providerOperationReference: operationReference(provider, input),
        providerStatus: `${input.operationKind}_succeeded`,
        retryable: false,
        message: `${provider} ${input.operationKind} mock operation succeeded.`,
        metadata: baseMetadata(input)
      };
    }
  };
}

export function createMockPaymentOperationAdapters(): Record<PaymentOperationAdapterProvider, PaymentOperationAdapter> {
  return {
    stripe: createMockPaymentOperationAdapter('stripe'),
    zarinpal: createMockPaymentOperationAdapter('zarinpal'),
    manual: createManualReviewPaymentOperationAdapter(),
    unknown: createUnavailablePaymentOperationAdapter('unknown')
  };
}

export async function executePaymentOperationAdapter(input: {
  provider: string;
  operation: PaymentOperationAdapterInput;
  adapters?: Record<PaymentOperationAdapterProvider, PaymentOperationAdapter>;
}) {
  const provider = cleanProvider(input.provider);
  const adapters = input.adapters ?? createMockPaymentOperationAdapters();
  return (adapters[provider] ?? adapters.unknown).execute(input.operation);
}
