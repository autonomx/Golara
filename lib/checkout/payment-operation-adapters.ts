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

export type ProviderPaymentOperationRequest = {
  method: 'POST';
  endpoint: string;
  headers: Record<string, string>;
  body: string;
};

export type ProviderPaymentOperationResponse = {
  ok: boolean;
  status: number;
  body?: Record<string, unknown> | null;
};

export type ProviderPaymentOperationHttpClient = (request: ProviderPaymentOperationRequest) => Promise<ProviderPaymentOperationResponse>;

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

function cleanOperationReference(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function providerResponseError(body: Record<string, unknown> | null | undefined, fallback: string) {
  const error = body?.error;
  if (error && typeof error === 'object' && !Array.isArray(error)) {
    const message = (error as Record<string, unknown>).message;
    if (typeof message === 'string' && message.trim()) return message.trim();
  }
  const message = body?.message;
  if (typeof message === 'string' && message.trim()) return message.trim();
  return fallback;
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

function unavailableHttpClientResult(provider: PaymentOperationAdapterProvider, input: PaymentOperationAdapterInput): PaymentOperationAdapterResult {
  return {
    provider,
    operationKind: input.operationKind,
    status: 'unavailable',
    errorCategory: 'provider_http_client_missing',
    retryable: false,
    message: `${provider} payment operation execution requires an injected provider HTTP client.`,
    metadata: baseMetadata(input)
  };
}

export function normalizePaymentOperationAdapterProvider(provider: string): PaymentOperationAdapterProvider {
  return cleanProvider(provider);
}

export function buildStripePaymentOperationRequest(input: PaymentOperationAdapterInput, secretKey?: string): ProviderPaymentOperationRequest | PaymentOperationAdapterResult {
  if (!secretKey?.trim()) {
    return {
      provider: 'stripe',
      operationKind: input.operationKind,
      status: 'unavailable',
      errorCategory: 'provider_credentials_missing',
      retryable: false,
      message: 'Stripe payment operation execution requires configured credentials.',
      metadata: baseMetadata(input)
    };
  }
  if (!hasRequiredReference(input)) {
    return {
      provider: 'stripe',
      operationKind: input.operationKind,
      status: 'failed',
      providerStatus: 'missing_provider_reference',
      errorCategory: 'provider_reference_required',
      retryable: false,
      message: 'Stripe payment operation execution requires a provider payment reference.',
      metadata: baseMetadata(input)
    };
  }

  const body = new URLSearchParams();
  if (input.operationKind === 'refund') {
    body.set('payment_intent', input.providerReference!.trim());
    body.set('amount', String(Math.round(input.amountCents)));
  }
  body.set('metadata[golara_payment_operation_record_id]', input.paymentOperationRecordId);
  if (input.reason?.trim()) body.set('metadata[golara_reason]', input.reason.trim());

  return {
    method: 'POST',
    endpoint: input.operationKind === 'refund' ? 'stripe.refunds.create' : 'stripe.payment_intents.cancel',
    headers: {
      Authorization: 'configured-stripe-credential',
      'Content-Type': 'application/x-www-form-urlencoded',
      'Idempotency-Key': input.idempotencyKey.trim()
    },
    body: body.toString()
  };
}

export function normalizeStripePaymentOperationResponse(input: PaymentOperationAdapterInput, response: ProviderPaymentOperationResponse): PaymentOperationAdapterResult {
  const reference = cleanOperationReference(response.body?.id);
  const providerStatus = cleanOperationReference(response.body?.status);
  if (response.ok && reference) {
    return {
      provider: 'stripe',
      operationKind: input.operationKind,
      status: 'succeeded',
      providerOperationReference: reference,
      providerStatus: providerStatus ?? `${input.operationKind}_succeeded`,
      retryable: false,
      message: `Stripe ${input.operationKind} operation succeeded.`,
      metadata: { ...baseMetadata(input), httpStatus: response.status }
    };
  }
  return {
    provider: 'stripe',
    operationKind: input.operationKind,
    status: 'failed',
    providerStatus: providerStatus ?? 'provider_error',
    errorCategory: response.status >= 500 ? 'provider_retryable_error' : 'provider_rejected_operation',
    retryable: response.status >= 500,
    message: providerResponseError(response.body, `Stripe returned HTTP ${response.status}.`),
    metadata: { ...baseMetadata(input), httpStatus: response.status }
  };
}

export function buildZarinPalPaymentOperationRequest(input: PaymentOperationAdapterInput, merchantId?: string): ProviderPaymentOperationRequest | PaymentOperationAdapterResult {
  if (!merchantId?.trim()) {
    return {
      provider: 'zarinpal',
      operationKind: input.operationKind,
      status: 'unavailable',
      errorCategory: 'provider_credentials_missing',
      retryable: false,
      message: 'ZarinPal payment operation execution requires configured credentials.',
      metadata: baseMetadata(input)
    };
  }
  if (!hasRequiredReference(input)) {
    return {
      provider: 'zarinpal',
      operationKind: input.operationKind,
      status: 'failed',
      providerStatus: 'missing_provider_reference',
      errorCategory: 'provider_reference_required',
      retryable: false,
      message: 'ZarinPal payment operation execution requires a provider payment reference.',
      metadata: baseMetadata(input)
    };
  }
  return {
    method: 'POST',
    endpoint: input.operationKind === 'refund' ? 'zarinpal.payment.refund' : 'zarinpal.payment.reverse',
    headers: {
      'Content-Type': 'application/json',
      'Idempotency-Key': input.idempotencyKey.trim()
    },
    body: JSON.stringify({
      merchant_id: merchantId.trim(),
      authority: input.providerReference!.trim(),
      amount: Math.round(input.amountCents),
      operation: input.operationKind,
      description: input.reason?.trim() || `Golara ${input.operationKind} ${input.paymentOperationRecordId}`,
      metadata: {
        payment_operation_record_id: input.paymentOperationRecordId,
        order_id: input.orderId,
        payment_attempt_id: input.paymentAttemptId
      }
    })
  };
}

export function normalizeZarinPalPaymentOperationResponse(input: PaymentOperationAdapterInput, response: ProviderPaymentOperationResponse): PaymentOperationAdapterResult {
  const data = response.body?.data && typeof response.body.data === 'object' && !Array.isArray(response.body.data)
    ? response.body.data as Record<string, unknown>
    : {};
  const reference = cleanOperationReference(data.ref_id) ?? cleanOperationReference(data.refId) ?? cleanOperationReference(data.authority) ?? cleanOperationReference(input.providerReference);
  const code = typeof data.code === 'number' ? data.code : undefined;
  const providerStatus = code !== undefined ? String(code) : cleanOperationReference(data.status);
  if (response.ok && (code === 100 || code === 101 || providerStatus === 'ok')) {
    return {
      provider: 'zarinpal',
      operationKind: input.operationKind,
      status: 'succeeded',
      providerOperationReference: reference,
      providerStatus: providerStatus ?? `${input.operationKind}_succeeded`,
      retryable: false,
      message: `ZarinPal ${input.operationKind} operation succeeded.`,
      metadata: { ...baseMetadata(input), httpStatus: response.status }
    };
  }
  return {
    provider: 'zarinpal',
    operationKind: input.operationKind,
    status: 'failed',
    providerStatus: providerStatus ?? 'provider_error',
    errorCategory: response.status >= 500 ? 'provider_retryable_error' : 'provider_rejected_operation',
    retryable: response.status >= 500,
    message: providerResponseError(response.body, `ZarinPal returned HTTP ${response.status}.`),
    metadata: { ...baseMetadata(input), httpStatus: response.status }
  };
}

export function createStripePaymentOperationHttpAdapter(options: { secretKey?: string; httpClient?: ProviderPaymentOperationHttpClient } = {}): PaymentOperationAdapter {
  return {
    provider: 'stripe',
    supports: ['refund', 'void'],
    async execute(input) {
      if (!options.httpClient) return unavailableHttpClientResult('stripe', input);
      const request = buildStripePaymentOperationRequest(input, options.secretKey);
      if ('status' in request) return request;
      const response = await options.httpClient(request);
      return normalizeStripePaymentOperationResponse(input, response);
    }
  };
}

export function createZarinPalPaymentOperationHttpAdapter(options: { merchantId?: string; httpClient?: ProviderPaymentOperationHttpClient } = {}): PaymentOperationAdapter {
  return {
    provider: 'zarinpal',
    supports: ['refund', 'void'],
    async execute(input) {
      if (!options.httpClient) return unavailableHttpClientResult('zarinpal', input);
      const request = buildZarinPalPaymentOperationRequest(input, options.merchantId);
      if ('status' in request) return request;
      const response = await options.httpClient(request);
      return normalizeZarinPalPaymentOperationResponse(input, response);
    }
  };
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
