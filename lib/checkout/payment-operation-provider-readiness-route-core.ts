import 'server-only';

import {
  buildPaymentOperationProviderReadinessSummary,
  type PaymentOperationProviderReadinessInput
} from './payment-operation-provider-readiness';

export type PaymentOperationProviderReadinessRouteInput = {
  env?: Record<string, string | undefined>;
  endpointMappingConfirmed?: boolean;
  liveValidationConfirmed?: boolean;
  providers?: string[];
};

const DEFAULT_OPERATION_PROVIDERS = ['stripe', 'zarinpal', 'manual'];

function providerInputs(input: PaymentOperationProviderReadinessRouteInput): PaymentOperationProviderReadinessInput[] {
  const env = input.env ?? process.env;
  const endpointMappingConfirmed = input.endpointMappingConfirmed === true;
  const liveValidationConfirmed = input.liveValidationConfirmed === true;
  const providers = input.providers?.length ? input.providers : DEFAULT_OPERATION_PROVIDERS;

  return providers.map((provider) => ({
    provider,
    env,
    endpointMappingConfirmed,
    liveValidationConfirmed
  }));
}

export function buildPaymentOperationProviderReadinessRouteResult(input: PaymentOperationProviderReadinessRouteInput = {}) {
  return {
    status: 200 as const,
    body: {
      ok: true as const,
      executionEnabled: false as const,
      summary: buildPaymentOperationProviderReadinessSummary(providerInputs(input))
    }
  };
}
