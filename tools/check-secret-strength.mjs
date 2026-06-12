#!/usr/bin/env node

/**
 * Simple preflight script to enforce strong secret configuration in production.
 *
 * This script checks that critical admin and customer auth secrets have been set
 * to non-default values and have sufficient length to resist guessing attacks.
 * It is intended to run during CI or as part of a build pipeline so
 * misconfigured deployments fail fast. In non-production environments the
 * script is a no‑op, allowing local development with placeholder secrets.
 */

const MIN_PASSWORD_LENGTH = 12;
const MIN_SECRET_LENGTH = 32;
const WEAK_SECRET_MARKERS = ['replace', 'changeme', 'change-me', 'placeholder', 'example', 'demo', 'test-secret'];
const EXACT_WEAK_SECRETS = new Set(['admin', 'password', 'secret', 'changeme', 'replace-me', 'example-secret']);

/**
 * Normalize a secret for checking by trimming and lowering case.
 * @param {string|undefined} value
 */
function normalize(value) {
  return (value || '').trim().toLowerCase();
}

function fail(message) {
  console.error(`Secret strength check failed: ${message}`);
  process.exit(1);
}

function isWeakSecretValue(value) {
  const normalized = normalize(value);
  if (!normalized) return false;
  if (EXACT_WEAK_SECRETS.has(normalized)) return true;
  return WEAK_SECRET_MARKERS.some((marker) => normalized.includes(marker));
}

function requireStrongSecret(name, minimumLength) {
  const value = process.env[name];
  const normalized = normalize(value);

  if (!value || normalized.length < minimumLength) {
    fail(`${name} must be at least ${minimumLength} characters long in production.`);
  }
  if (isWeakSecretValue(value)) {
    fail(`${name} must not use default placeholder values.`);
  }
}

// Only enforce checks in production. Local development can use defaults.
if (process.env.NODE_ENV === 'production') {
  requireStrongSecret('ADMIN_PASSWORD', MIN_PASSWORD_LENGTH);
  requireStrongSecret('ADMIN_SESSION_SECRET', MIN_SECRET_LENGTH);
  requireStrongSecret('CUSTOMER_OTP_SECRET', MIN_SECRET_LENGTH);

  console.log('Secret strength checks passed.');
} else {
  console.log('Secret strength checks skipped for non-production environment.');
}
