import type { PaymentMethodSetting, PaymentMethodType } from '@/lib/settings/payment-method-settings';
import {
  evaluatePaymentMethodReadinessGate,
  type PaymentMethodReadinessEvidence,
  type PaymentMethodReadinessGate
} from '@/lib/settings/payment-method-readiness-gate';

export const PAYMENT_METHOD_SMOKE_CHECKLIST_VERSION = 'p9.method-smoke-checklist.v1';

export const PAYMENT_METHOD_SMOKE_EVIDENCE_KEYS = [
  'checkoutMethodVisible',
  'checkoutAttemptPersistsMethodKey',
  'customerConfirmationCopy',
  'adminOrderVisibility',
  'settlementDashboardVisibility',
  'reconciliationCsvExport',
  'gatewayReturnSmoke',
  'gatewayWebhookSmoke',
  'gatewayProviderReferenceSmoke',
  'walletDebitReceiptSmoke',
  'walletRefundReceiptSmoke',
  'manualTransferInstructionSmoke',
  'manualTransferReviewSmoke',
  'installmentReviewSmoke',
  'installmentScheduleSmoke',
  'codCollectionSmoke',
  'codFulfillmentGuardSmoke'
] as const;

export type PaymentMethodSmokeEvidenceKey = typeof PAYMENT_METHOD_SMOKE_EVIDENCE_KEYS[number];
export type PaymentMethodSmokeEvidence = Partial<Record<PaymentMethodSmokeEvidenceKey, boolean | string | number | null | undefined>>;
export type PaymentMethodSmokeStatus = 'disabled' | 'missing-evidence' | 'complete';

export type PaymentMethodSmokeChecklistItem = {
  key: PaymentMethodSmokeEvidenceKey;
  label: string;
  completed: boolean;
  evidence?: string | number | boolean;
};

export type PaymentMethodSmokeChecklist = {
  version: typeof PAYMENT_METHOD_SMOKE_CHECKLIST_VERSION;
  methodKey: string;
  label: string;
  methodType: PaymentMethodType;
  providerKey: string;
  currency: string;
  isActive: boolean;
  status: PaymentMethodSmokeStatus;
  readinessStatus: PaymentMethodReadinessGate['status'];
  items: PaymentMethodSmokeChecklistItem[];
  completedEvidence: PaymentMethodSmokeEvidenceKey[];
  missingEvidence: PaymentMethodSmokeEvidenceKey[];
  blocksCheckout: false;
};

export type PaymentMethodSmokeChecklistSummary = {
  version: typeof PAYMENT_METHOD_SMOKE_CHECKLIST_VERSION;
  methods: PaymentMethodSmokeChecklist[];
  enabledMethodCount: number;
  completeCount: number;
  missingEvidenceCount: number;
  disabledCount: number;
  checkoutBlockingCount: 0;
  missingEvidence: PaymentMethodSmokeEvidenceKey[];
};

const COMMON_SMOKE_STEPS: PaymentMethodSmokeChecklistItem[] = [
  { key: 'checkoutMethodVisible', label: 'Checkout method appears for eligible customers.', completed: false },
  { key: 'checkoutAttemptPersistsMethodKey', label: 'Checkout payment attempt persists the selected method key.', completed: false },
  { key: 'customerConfirmationCopy', label: 'Customer order status copy renders for this method.', completed: false },
  { key: 'adminOrderVisibility', label: 'Admin order detail shows method/provider evidence.', completed: false },
  { key: 'settlementDashboardVisibility', label: 'Settlement dashboard includes this method.', completed: false },
  { key: 'reconciliationCsvExport', label: 'Reconciliation CSV exports this method.', completed: false }
];

const METHOD_SMOKE_STEPS: Record<PaymentMethodType, PaymentMethodSmokeChecklistItem[]> = {
  gateway: [
    { key: 'gatewayReturnSmoke', label: 'Gateway return flow maps back to the selected method.', completed: false },
    { key: 'gatewayWebhookSmoke', label: 'Gateway trusted event flow maps back to the selected method.', completed: false },
    { key: 'gatewayProviderReferenceSmoke', label: 'Gateway provider reference persists on the payment attempt.', completed: false }
  ],
  wallet: [
    { key: 'walletDebitReceiptSmoke', label: 'Wallet debit receipt renders in customer wallet history.', completed: false },
    { key: 'walletRefundReceiptSmoke', label: 'Wallet refund receipt renders in customer wallet history.', completed: false }
  ],
  manual_transfer: [
    { key: 'manualTransferInstructionSmoke', label: 'Manual-transfer instructions render on customer order detail.', completed: false },
    { key: 'manualTransferReviewSmoke', label: 'Manual-transfer review status appears in admin settlement views.', completed: false }
  ],
  installment: [
    { key: 'installmentReviewSmoke', label: 'Installment approval/rejection messages render for customers.', completed: false },
    { key: 'installmentScheduleSmoke', label: 'Installment schedule/receivable status appears in admin settlement views.', completed: false }
  ],
  cod: [
    { key: 'codCollectionSmoke', label: 'COD collection status appears on customer/admin views.', completed: false },
    { key: 'codFulfillmentGuardSmoke', label: 'COD fulfillment guard behavior is smoke-tested before launch.', completed: false }
  ]
};

function evidenceIsPresent(value: boolean | string | number | null | undefined) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value.trim().length > 0;
  if (typeof value === 'number') return Number.isFinite(value) && value > 0;
  return false;
}

function evidenceValue(value: boolean | string | number | null | undefined) {
  if (!evidenceIsPresent(value)) return undefined;
  return value as string | number | boolean;
}

function checklistItemsFor(methodType: PaymentMethodType, evidence: PaymentMethodSmokeEvidence) {
  return [...COMMON_SMOKE_STEPS, ...(METHOD_SMOKE_STEPS[methodType] ?? [])].map((item) => ({
    ...item,
    completed: evidenceIsPresent(evidence[item.key]),
    evidence: evidenceValue(evidence[item.key])
  }));
}

export function buildPaymentMethodSmokeChecklist(
  method: PaymentMethodSetting,
  options: {
    smokeEvidence?: PaymentMethodSmokeEvidence;
    readinessEvidence?: PaymentMethodReadinessEvidence;
    env?: Record<string, string | undefined>;
  } = {}
): PaymentMethodSmokeChecklist {
  const readiness = evaluatePaymentMethodReadinessGate(method, {
    evidence: options.readinessEvidence,
    env: options.env
  });
  const items = checklistItemsFor(method.methodType, options.smokeEvidence ?? {});
  const missingEvidence = method.isActive ? items.filter((item) => !item.completed).map((item) => item.key) : [];
  const completedEvidence = items.filter((item) => item.completed).map((item) => item.key);

  return {
    version: PAYMENT_METHOD_SMOKE_CHECKLIST_VERSION,
    methodKey: method.key,
    label: method.label,
    methodType: method.methodType,
    providerKey: method.providerKey,
    currency: method.currency,
    isActive: method.isActive,
    status: method.isActive ? (missingEvidence.length ? 'missing-evidence' : 'complete') : 'disabled',
    readinessStatus: readiness.status,
    items,
    completedEvidence,
    missingEvidence,
    blocksCheckout: false
  };
}

export function summarizePaymentMethodSmokeChecklists(
  methods: PaymentMethodSetting[],
  options: {
    smokeEvidenceByMethodKey?: Record<string, PaymentMethodSmokeEvidence>;
    readinessEvidenceByMethodKey?: Record<string, PaymentMethodReadinessEvidence>;
    env?: Record<string, string | undefined>;
  } = {}
): PaymentMethodSmokeChecklistSummary {
  const checklists = [...methods]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((method) => buildPaymentMethodSmokeChecklist(method, {
      smokeEvidence: options.smokeEvidenceByMethodKey?.[method.key],
      readinessEvidence: options.readinessEvidenceByMethodKey?.[method.key],
      env: options.env
    }));
  const missingEvidence = Array.from(new Set(checklists.flatMap((checklist) => checklist.missingEvidence))).sort();

  return {
    version: PAYMENT_METHOD_SMOKE_CHECKLIST_VERSION,
    methods: checklists,
    enabledMethodCount: checklists.filter((checklist) => checklist.isActive).length,
    completeCount: checklists.filter((checklist) => checklist.status === 'complete').length,
    missingEvidenceCount: checklists.filter((checklist) => checklist.status === 'missing-evidence').length,
    disabledCount: checklists.filter((checklist) => checklist.status === 'disabled').length,
    checkoutBlockingCount: 0,
    missingEvidence
  };
}
