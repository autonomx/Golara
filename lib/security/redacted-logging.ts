const EMAIL_PATTERN = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const PHONE_PATTERN = /(?<![\w+])(?:\+?\d[\d\s().-]{7,}\d)(?!\w)/g;
const POSTAL_ADDRESS_HINT_PATTERN = /\b(?:line1|line2|address|street|recipient|phone|email|postalCode|zip|city|notes)\s*[:=]\s*[^,}\]\n\r]+/gi;
const TOKEN_LIKE_PATTERN = /\b(?:token|secret|password|authorization|cookie|otp|code)\s*[:=]\s*[^,}\]\n\r]+/gi;

function stringifyLogValue(value: unknown) {
  if (value instanceof Error) return `${value.name}: ${value.message}`;
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

export function redactLogValue(value: unknown) {
  return stringifyLogValue(value)
    .replace(EMAIL_PATTERN, '[redacted-email]')
    .replace(PHONE_PATTERN, '[redacted-phone]')
    .replace(POSTAL_ADDRESS_HINT_PATTERN, (match) => `${match.split(/[:=]/, 1)[0]}=[redacted]`)
    .replace(TOKEN_LIKE_PATTERN, (match) => `${match.split(/[:=]/, 1)[0]}=[redacted]`);
}

export function warnWithRedactedError(scope: string, message: string, error: unknown) {
  console.warn(`[${scope}] ${message}`, redactLogValue(error));
}
