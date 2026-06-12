const EMAIL_PATTERN = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const PHONE_PATTERN = /(?<![\w+])(?:\+?\d[\d\s().-]{7,}\d)(?!\w)/g;
const SENSITIVE_FIELD_NAMES = '(?:line1|line2|address|street|recipient|phone|email|postalCode|zip|city|notes|token|secret|password|authorization|cookie|otp|code)';
const ADDRESS_FIELD_NAMES = '(?:line1|line2|address|street|recipient|phone|email|postalCode|zip|city|notes)';
const TOKEN_FIELD_NAMES = '(?:token|secret|password|authorization|cookie|otp|code)';
const FIELD_BOUNDARY = `(?=\\s+['\"]?${SENSITIVE_FIELD_NAMES}['\"]?\\s*[:=]|[,}\\]\\n\\r]|$)`;
const POSTAL_ADDRESS_HINT_PATTERN = new RegExp(`['\"]?\\b${ADDRESS_FIELD_NAMES}\\b['\"]?\\s*[:=]\\s*['\"]?.*?${FIELD_BOUNDARY}`, 'gi');
const TOKEN_LIKE_PATTERN = new RegExp(`['\"]?\\b${TOKEN_FIELD_NAMES}\\b['\"]?\\s*[:=]\\s*['\"]?.*?${FIELD_BOUNDARY}`, 'gi');

function redactField(match: string) {
  return `${match.split(/[:=]/, 1)[0]}=[redacted]`;
}

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
    .replace(TOKEN_LIKE_PATTERN, redactField)
    .replace(POSTAL_ADDRESS_HINT_PATTERN, redactField);
}

export function warnWithRedactedError(scope: string, message: string, error: unknown) {
  console.warn(`[${scope}] ${message}`, redactLogValue(error));
}
