#!/usr/bin/env node

/**
 * Simple preflight script to enforce strong secret configuration in production.
 *
 * This script checks that critical admin secrets have been set to non-default
 * values and have sufficient length to resist guessing attacks. It is
 * intended to run during CI or as part of a build pipeline so misconfigured
 * deployments fail fast. In non-production environments the script is a
 * no‑op, allowing local development with placeholder secrets.
 */

const MIN_PASSWORD_LENGTH = 12;
const MIN_SESSION_SECRET_LENGTH = 32;

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

// Only enforce checks in production. Local development can use defaults.
if (process.env.NODE_ENV === 'production') {
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminSessionSecret = process.env.ADMIN_SESSION_SECRET;

  const normalizedPassword = normalize(adminPassword);
  const normalizedSession = normalize(adminSessionSecret);

  // Ensure admin password is configured and strong
  if (!adminPassword || normalizedPassword.length < MIN_PASSWORD_LENGTH) {
    fail(`ADMIN_PASSWORD must be at least ${MIN_PASSWORD_LENGTH} characters long in production.`);
  }
  if (normalizedPassword.includes('replace') || normalizedPassword.includes('changeme') || normalizedPassword === 'admin') {
    fail('ADMIN_PASSWORD must not use default placeholder values.');
  }

  // Ensure admin session secret is configured and strong
  if (!adminSessionSecret || normalizedSession.length < MIN_SESSION_SECRET_LENGTH) {
    fail(`ADMIN_SESSION_SECRET must be at least ${MIN_SESSION_SECRET_LENGTH} characters long in production.`);
  }
  if (normalizedSession.includes('replace') || normalizedSession.includes('changeme') || normalizedSession === 'secret') {
    fail('ADMIN_SESSION_SECRET must not use default placeholder values.');
  }

  console.log('Secret strength checks passed.');
} else {
  console.log('Secret strength checks skipped for non-production environment.');
}
