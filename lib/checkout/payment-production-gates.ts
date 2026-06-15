export type PaymentProductionGateCode =
  | 'payment_browser_smoke_tests_unconfirmed'
  | 'payment_operation_records_migration_unconfirmed'
  | 'payment_operation_provider_evidence_unconfirmed'
  | 'payment_refund_void_smoke_tests_unconfirmed'
  | 'payment_operation_state_transitions_unconfirmed'
  | 'notification_provider_evidence_unconfirmed'
  | 'notification_smoke_tests_unconfirmed'
  | 'notification_delivery_persistence_unconfirmed'
  | 'payment_production_monitoring_unconfirmed';

export type PaymentProductionGate = {
  code: PaymentProductionGateCode;
  summary: string;
  detail: string;
};

export type PaymentProductionGateConfig = {
  gatewayCheckoutEnabled?: boolean;
  refundVoidExecutionEnabled?: boolean;
  liveNotificationDeliveryEnabled?: boolean;
  paymentBrowserSmokeTestsConfirmed?: boolean;
  paymentOperationRecordsMigrationConfirmed?: boolean;
  paymentOperationProviderEvidenceConfirmed?: boolean;
  paymentRefundVoidSmokeTestsConfirmed?: boolean;
  paymentOperationStateTransitionsConfirmed?: boolean;
  notificationProviderEvidenceConfirmed?: boolean;
  notificationSmokeTestsConfirmed?: boolean;
  notificationDeliveryPersistenceConfirmed?: boolean;
  paymentProductionMonitoringConfirmed?: boolean;
};

function flag(value: string | undefined) {
  return value?.trim().toLowerCase() === 'true';
}

export function getPaymentProductionGateConfig(env: NodeJS.ProcessEnv = process.env): PaymentProductionGateConfig {
  return {
    gatewayCheckoutEnabled: env.CHECKOUT_MODE?.trim().toLowerCase() === 'gateway',
    refundVoidExecutionEnabled: flag(env.PAYMENT_REFUND_VOID_EXECUTION_ENABLED),
    liveNotificationDeliveryEnabled: flag(env.NOTIFICATION_LIVE_DELIVERY_ENABLED),
    paymentBrowserSmokeTestsConfirmed: flag(env.PAYMENT_BROWSER_SMOKE_TESTS_CONFIRMED),
    paymentOperationRecordsMigrationConfirmed: flag(env.PAYMENT_OPERATION_RECORDS_MIGRATION_CONFIRMED),
    paymentOperationProviderEvidenceConfirmed: flag(env.PAYMENT_OPERATION_PROVIDER_EVIDENCE_CONFIRMED),
    paymentRefundVoidSmokeTestsConfirmed: flag(env.PAYMENT_REFUND_VOID_SMOKE_TESTS_CONFIRMED),
    paymentOperationStateTransitionsConfirmed: flag(env.PAYMENT_OPERATION_STATE_TRANSITIONS_CONFIRMED),
    notificationProviderEvidenceConfirmed: flag(env.NOTIFICATION_PROVIDER_EVIDENCE_CONFIRMED),
    notificationSmokeTestsConfirmed: flag(env.NOTIFICATION_SMOKE_TESTS_CONFIRMED),
    notificationDeliveryPersistenceConfirmed: flag(env.NOTIFICATION_DELIVERY_PERSISTENCE_CONFIRMED),
    paymentProductionMonitoringConfirmed: flag(env.PAYMENT_PRODUCTION_MONITORING_CONFIRMED)
  };
}

function addGate(gates: PaymentProductionGate[], code: PaymentProductionGateCode, summary: string, detail: string) {
  gates.push({ code, summary, detail });
}

export function getPaymentProductionGates(config: PaymentProductionGateConfig): PaymentProductionGate[] {
  const gates: PaymentProductionGate[] = [];

  if (config.gatewayCheckoutEnabled && !config.paymentBrowserSmokeTestsConfirmed) {
    addGate(
      gates,
      'payment_browser_smoke_tests_unconfirmed',
      'Payment browser smoke tests have not been confirmed.',
      'Run cart, checkout, provider handoff, return, public order, RTL, LTR, guest, and signed-in browser smoke tests before production gateway checkout.'
    );
  }

  if (config.refundVoidExecutionEnabled) {
    if (!config.paymentOperationRecordsMigrationConfirmed) {
      addGate(
        gates,
        'payment_operation_records_migration_unconfirmed',
        'Payment operation records migration has not been confirmed.',
        'Apply and verify the payment operation records migration in the target database before enabling refund or void execution.'
      );
    }

    if (!config.paymentOperationProviderEvidenceConfirmed) {
      addGate(
        gates,
        'payment_operation_provider_evidence_unconfirmed',
        'Payment operation provider evidence has not been confirmed.',
        'Complete refund and void endpoint mapping, provider response, idempotency, and operator evidence before enabling live payment operations.'
      );
    }

    if (!config.paymentRefundVoidSmokeTestsConfirmed) {
      addGate(
        gates,
        'payment_refund_void_smoke_tests_unconfirmed',
        'Refund and void smoke tests have not been confirmed.',
        'Run the refund and void target-environment smoke-test checklist before enabling live refund or void execution.'
      );
    }

    if (!config.paymentOperationStateTransitionsConfirmed) {
      addGate(
        gates,
        'payment_operation_state_transitions_unconfirmed',
        'Payment operation state transitions have not been confirmed.',
        'Confirm provider-success order/payment transitions, audit logging, timeline entries, and inventory/capacity release policy before enabling live payment operations.'
      );
    }
  }

  if (config.liveNotificationDeliveryEnabled) {
    if (!config.notificationProviderEvidenceConfirmed) {
      addGate(
        gates,
        'notification_provider_evidence_unconfirmed',
        'Live notification provider evidence has not been confirmed.',
        'Complete provider ownership, credential-source, sender verification, template approval, consent/suppression, and delivery evidence before enabling live notification delivery.'
      );
    }

    if (!config.notificationSmokeTestsConfirmed) {
      addGate(
        gates,
        'notification_smoke_tests_unconfirmed',
        'Live notification smoke tests have not been confirmed.',
        'Run the notification smoke-test checklist for accepted, rejected, rate-limited, unavailable, duplicate, and retry outcomes before enabling live delivery.'
      );
    }

    if (!config.notificationDeliveryPersistenceConfirmed) {
      addGate(
        gates,
        'notification_delivery_persistence_unconfirmed',
        'Notification delivery persistence has not been confirmed.',
        'Confirm durable, idempotent delivery-attempt persistence and admin visibility before enabling live notification delivery.'
      );
    }
  }

  if ((config.gatewayCheckoutEnabled || config.refundVoidExecutionEnabled || config.liveNotificationDeliveryEnabled) && !config.paymentProductionMonitoringConfirmed) {
    addGate(
      gates,
      'payment_production_monitoring_unconfirmed',
      'Payment production monitoring has not been confirmed.',
      'Confirm checkout, payment return, webhook, settlement, notification, operation, incident-response, and rollback monitoring before production payment launch.'
    );
  }

  return gates;
}
