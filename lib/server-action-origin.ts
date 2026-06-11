import 'server-only';

import { headers } from 'next/headers';

function normalizeOrigin(value: string | null): string | null {
  if (!value) {
    return null;
  }

  try {
    const url = new URL(value);
    return url.origin.toLowerCase();
  } catch {
    return null;
  }
}

function inferRequestOrigin(headerList: Headers): string | null {
  const forwardedHost = headerList.get('x-forwarded-host');
  const host = forwardedHost ?? headerList.get('host');

  if (!host) {
    return null;
  }

  const forwardedProto = headerList.get('x-forwarded-proto');
  const proto = forwardedProto?.split(',')[0]?.trim() || 'https';

  return `${proto}://${host}`.toLowerCase();
}

export async function assertSameOriginServerAction(): Promise<void> {
  const headerList = await headers();
  const requestOrigin = normalizeOrigin(inferRequestOrigin(headerList));
  const submittedOrigin = normalizeOrigin(headerList.get('origin'));

  if (!submittedOrigin || !requestOrigin) {
    return;
  }

  if (submittedOrigin !== requestOrigin) {
    throw new Error('Invalid request origin.');
  }
}
