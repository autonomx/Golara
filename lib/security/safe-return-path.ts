const SAFE_RETURN_BASE_URL = 'https://golara.local';

function safeFallbackPath(fallback: string) {
  const trimmed = fallback.trim();
  if (!trimmed.startsWith('/') || trimmed.startsWith('//') || /[\\\r\n]/.test(trimmed)) return '/';
  return trimmed;
}

export function safeReturnPath(value: string | null | undefined, fallback = '/') {
  const safeFallback = safeFallbackPath(fallback);
  const normalized = typeof value === 'string' ? value.trim() : '';

  if (!normalized) return safeFallback;
  if (!normalized.startsWith('/') || normalized.startsWith('//')) return safeFallback;
  if (/[\\\r\n]/.test(normalized)) return safeFallback;

  try {
    const parsed = new URL(normalized, SAFE_RETURN_BASE_URL);
    if (parsed.origin !== SAFE_RETURN_BASE_URL) return safeFallback;
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return safeFallback;
  }
}
