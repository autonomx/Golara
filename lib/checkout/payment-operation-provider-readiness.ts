import { normalizePaymentOperationAdapterProvider, type PaymentOperationAdapterKind, type PaymentOperationAdapterProvider } from './payment-operation-adapters';

export type PaymentOperationProviderReadinessStatus = 'ready' | 'needs_operator_evidence' | 'manual_review' | 'unavailable';

export type PaymentOperationProviderReadinessInput = {
  provider: string;
  env?: Record<string, string | undefined>;
  endpointMappingConfirmed?: boolean;
  liveValidationConfirmed?: boolean;
};

export type PaymentOperationProviderReadinessCheck = {
  key: string;
  label: string;
  status: 'ready' | 'missing' | 'pending' | 'not_required';
  detail: string;
};

export type PaymentOperationProviderReadiness = {
  provider: PaymentOperationAdapterProvider;
  status: PaymentOperationProviderReadinessStatus;
  supportedOperations: PaymentOperationAdapterKind[];
  credentialEnvironmentVariables: string[];
  executionEnabled: false;
  blockers: string[];
  warnings: string[];
  checks: PaymentOperationProviderReadinessCheck[];
};

export type PaymentOperationProviderReadinessSummary = {
  ready: boolean;
  total: number;
  readyCount: number;
  needsOperatorEvidence: number;
  manualReview: number;
  unavailable: number;
  providers: PaymentOperationProviderReadiness[];
};

const PROVIDER_OPERATION_CREDENTIALS: Partial<Record<PaymentOperationAdapterProvider, string[]>> = {
  stripe: ['STRIPE_SECRET_KEY'],
  zarinpal: ['ZARINPAL_MERCHANT_ID']
};

const SUPPORTED_OPERATION_PROVIDERS = new Set<PaymentOperationAdapterProvider>(['stripe', 'zarinpal', 'manual']);

function hasEnv(env: Record<string, string | undefined>, key: string) {
  return Boolean(env[key]?.trim());
}

function credentialChecks(provider: PaymentOperationAdapterProvider, env: Record<string, string | undefined>): PaymentOperationProviderReadinessCheck[] {
  const required = PROVIDER_OPERATION_CREDENTIALS[provider] ?? [];
  if (required.length === 0) {
    return [{
      key: 'credentials_not_required',
      label: 'Credentials',
      status: 'not_required',
      detail: 'Manual payment operations do not require provider credentials in source control.'
    }];
  }

  return required.map((key) => ({
    key,
    label: key,
    status: hasEnv(env, key) ? 'ready' : 'missing',
    detail: hasEnv(env, key)
      ? `${key} is configured in the environment; secret values are not exposed.`
      : `${key} must be configured outside source control before provider execution is enabled.`
  }));
}

function evidenceChecks(input: Required<Pick<PaymentOperationProviderReadinessInput, 'endpointMappingConfirmed' | 'liveValidationConfirmed'>>): PaymentOperationProviderReadinessCheck[] {
  return [
    {
      key: 'endpoint_mapping_evidence',
      label: 'Endpoint mapping evidence',
      status: input.endpointMappingConfirmed ? 'ready' : 'pending',
      detail: input.endpointMappingConfirmed
        ? 'Operator endpoint mapping evidence is marked confirmed for diagnostics.'
        : 'Concrete provider endpoint mapping remains pending operator confirmation.'
    },
    {
      key: 'live_provider_validation',
      label: 'Live/staging validation',
      status: input.liveValidationConfirmed ? 'ready' : 'pending',
      detail: input.liveValidationConfirmed
        ? 'Provider validation evidence is marked confirmed for diagnostics.'
        : 'Provider refund/void behavior still requires target-environment validation evidence.'
    }
  ];
}

export function buildPaymentOperationProviderReadiness(input: PaymentOperationProviderReadinessInput): PaymentOperationProviderReadiness {
  const provider = normalizePaymentOperationAdapterProvider(input.provider);
  const env = input.env ?? {};
  const endpointMappingConfirmed = input.endpointMappingConfirmed === true;
  const liveValidationConfirmed = input.liveValidationConfirmed === true;
  const credentialEnvironmentVariables = PROVIDER_OPERATION_CREDENTIALS[provider] ?? [];
  const checks: PaymentOperationProviderReadinessCheck[] = [];
  const blockers: string[] = [];
  const warnings: string[] = [];

  if (!SUPPORTED_OPERATION_PROVIDERS.has(provider)) {
    return {
      provider,
      status: 'unavailable',
      supportedOperations: [],
      credentialEnvironmentVariables: [],
      executionEnabled: false,
      blockers: ['provider_operation_adapter_unavailable'],
      warnings: [],
      checks: [{
        key: 'provider_supported',
        label: 'Provider support',
        status: 'missing',
        detail: 'No refund/void operation readiness diagnostics are available for this provider.'
      }]
    };
  }

  checks.push(...credentialChecks(provider, env));

  if (provider === 'manual') {
    return {
      provider,
      status: 'manual_review',
      supportedOperations: ['refund', 'void'],
      credentialEnvironmentVariables,
      executionEnabled: false,
      blockers: [],
      warnings: ['manual_provider_requires_operator_review'],
      checks: [
        ...checks,
        {
          key: 'manual_review_required',
          label: 'Manual review',
          status: 'pending',
          detail: 'Manual payment operations stay outside live provider execution and require operator review.'
        }
      ]
    };
  }

  const missingCredentials = checks.filter((check) => check.status === 'missing').map((check) => check.key);
  if (missingCredentials.length > 0) blockers.push('provider_credentials_missing');
  if (!endpointMappingConfirmed) blockers.push('provider_endpoint_mapping_unconfirmed');
  if (!liveValidationConfirmed) warnings.push('provider_validation_evidence_pending');
  checks.push(...evidenceChecks({ endpointMappingConfirmed, liveValidationConfirmed }));

  return {
    provider,
    status: blockers.length === 0 && warnings.length === 0 ? 'ready' : 'needs_operator_evidence',
    supportedOperations: ['refund', 'void'],
    credentialEnvironmentVariables,
    executionEnabled: false,
    blockers,
    warnings,
    checks
  };
}

export function buildPaymentOperationProviderReadinessSummary(inputs: PaymentOperationProviderReadinessInput[]): PaymentOperationProviderReadinessSummary {
  const providers = inputs.map(buildPaymentOperationProviderReadiness);
  const readyCount = providers.filter((provider) => provider.status === 'ready').length;
  const needsOperatorEvidence = providers.filter((provider) => provider.status === 'needs_operator_evidence').length;
  const manualReview = providers.filter((provider) => provider.status === 'manual_review').length;
  const unavailable = providers.filter((provider) => provider.status === 'unavailable').length;

  return {
    ready: providers.length > 0 && readyCount === providers.length,
    total: providers.length,
    readyCount,
    needsOperatorEvidence,
    manualReview,
    unavailable,
    providers
  };
}
