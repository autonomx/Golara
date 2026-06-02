export type LocalizedSeoMetadataInput = {
  title?: string | null;
  fallbackTitle?: string | null;
  description?: string | null;
  fallbackDescription?: string | null;
  canonicalPath?: string | null;
  seoIndex?: boolean | null;
};

export type LocalizedSeoMetadata = {
  seoTitle: string | null;
  seoDescription: string | null;
  canonicalPath: string | null;
  seoIndex: boolean;
};

const MAX_SEO_TITLE_LENGTH = 70;
const MAX_SEO_DESCRIPTION_LENGTH = 170;

function optionalText(value?: string | null) {
  const normalized = value?.trim().replace(/\s+/g, ' ');
  return normalized || null;
}

export function normalizeLocalizedSeoTitle(value?: string | null, fallback?: string | null) {
  const title = optionalText(value) ?? optionalText(fallback);
  if (!title) return null;
  return title.slice(0, MAX_SEO_TITLE_LENGTH);
}

export function normalizeLocalizedSeoDescription(value?: string | null, fallback?: string | null) {
  const description = optionalText(value) ?? optionalText(fallback);
  if (!description) return null;
  return description.slice(0, MAX_SEO_DESCRIPTION_LENGTH);
}

export function normalizeLocalizedCanonicalPath(value?: string | null) {
  const path = optionalText(value);
  if (!path) return null;
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return normalized.replace(/\/+/g, '/').replace(/\/$/, '') || '/';
}

export function normalizeLocalizedSeoIndex(value?: boolean | null) {
  return value ?? true;
}

export function buildLocalizedSeoMetadata(input: LocalizedSeoMetadataInput): LocalizedSeoMetadata {
  return {
    seoTitle: normalizeLocalizedSeoTitle(input.title, input.fallbackTitle),
    seoDescription: normalizeLocalizedSeoDescription(input.description, input.fallbackDescription),
    canonicalPath: normalizeLocalizedCanonicalPath(input.canonicalPath),
    seoIndex: normalizeLocalizedSeoIndex(input.seoIndex)
  };
}

export function hasLocalizedSeoMetadata(metadata: LocalizedSeoMetadata) {
  return Boolean(metadata.seoTitle || metadata.seoDescription || metadata.canonicalPath || metadata.seoIndex === false);
}
