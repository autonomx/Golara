const enabled = (name) => String(process.env[name] || '').trim().toLowerCase() === 'true';
const gates = [];

if (String(process.env.CHECKOUT_MODE || '').trim().toLowerCase() === 'gateway') {
  if (!enabled('PAYMENT_BROWSER_SMOKE_TESTS_CONFIRMED')) gates.push('payment_browser_smoke_tests_unconfirmed');
}

if (enabled('PAYMENT_REFUND_VOID_EXECUTION_ENABLED')) {
  for (const name of [
    'PAYMENT_OPERATION_RECORDS_MIGRATION_CONFIRMED',
    'PAYMENT_OPERATION_PROVIDER_EVIDENCE_CONFIRMED',
    'PAYMENT_REFUND_VOID_SMOKE_TESTS_CONFIRMED',
    'PAYMENT_OPERATION_STATE_TRANSITIONS_CONFIRMED'
  ]) {
    if (!enabled(name)) gates.push(name.toLowerCase());
  }
}

if (enabled('NOTIFICATION_LIVE_DELIVERY_ENABLED')) {
  for (const name of [
    'NOTIFICATION_PROVIDER_EVIDENCE_CONFIRMED',
    'NOTIFICATION_SMOKE_TESTS_CONFIRMED',
    'NOTIFICATION_DELIVERY_PERSISTENCE_CONFIRMED'
  ]) {
    if (!enabled(name)) gates.push(name.toLowerCase());
  }
}

if ((String(process.env.CHECKOUT_MODE || '').trim().toLowerCase() === 'gateway' || enabled('PAYMENT_REFUND_VOID_EXECUTION_ENABLED') || enabled('NOTIFICATION_LIVE_DELIVERY_ENABLED')) && !enabled('PAYMENT_PRODUCTION_MONITORING_CONFIRMED')) {
  gates.push('payment_production_monitoring_unconfirmed');
}

if (gates.length === 0) {
  console.log('Payment production gates: ready');
  process.exit(0);
}

console.error('Payment production gates: blocked');
for (const gate of gates) console.error(`- ${gate}`);
process.exit(1);
